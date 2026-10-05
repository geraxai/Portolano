// Portolano — archivio condiviso su Cloudflare Workers + D1.
// Stessa API di /api/archivio su Vercel (versione "leggera" 1.10.5): i dispositivi inviano solo i record cambiati
// e ricevono solo quelli cambiati dopo `since` (orologio del servizio, campo sv su ogni record). Qui ogni scalo/spesa
// è una riga del database: niente riscrittura del documento intero, cronologia per record, copia completa ogni notte.
//
// Endpoint (tutti con intestazione x-chiave o ?chiave=):
//   GET  /api/archivio?since=&cfgAt=     → modo "tutto" (since assente) | "delta" | "invariato"
//   POST /api/archivio                    → fusione dei record ricevuti, risposta come GET (+ scritto)
//   GET  /api/archivio/backup             → archivio completo in JSON (solo admin) — da salvare come copia
//   GET  /api/archivio/storico?coll=&id=  → versioni salvate di un record (solo admin)
//   GET  /api/archivio/stato              → conteggi e ultimo aggiornamento
//   GET  /api/archivio/backups            → elenco delle copie notturne; ?giorno=AAAA-MM-GG restituisce quella copia (solo admin)

const COLL = ["scali", "spese", "cassa"]; // collezioni sincronizzate (1.11: anche la prima nota cassa)
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "content-type,x-chiave", "Cache-Control": "no-store" };
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: Object.assign({ "content-type": "application/json; charset=utf-8" }, CORS) });
const ts = (x) => (x && x.updatedAt ? Date.parse(x.updatedAt) || 0 : 0);
const stripSv = (r) => { const o = Object.assign({}, r); delete o.sv; return o; };

function identifica(env, chiave) {
  if (!chiave) return null;
  let u = {};
  try { u = JSON.parse(env.PORTOLANO_UTENTI || "{}"); } catch (e) { u = {}; }
  if (env.PORTOLANO_CHIAVE && !Object.keys(u).some((k) => u[k] && u[k].chiave === env.PORTOLANO_CHIAVE)) u.emilio = { nome: "Emilio", ruolo: "admin", chiave: env.PORTOLANO_CHIAVE };
  for (const id in u) if (u[id] && u[id].chiave === chiave) return { id, nome: u[id].nome || id, ruolo: u[id].ruolo === "admin" ? "admin" : "operatore" };
  return null;
}

async function meta(db) {
  const rows = (await db.prepare("SELECT k, v FROM meta").all()).results || [];
  const m = { cfg: {}, cfgAt: 0, aggiornato: 0 };
  for (const r of rows) { if (r.k === "cfg") { try { m.cfg = JSON.parse(r.v) || {}; } catch (e) {} } else if (r.k === "cfgAt") m.cfgAt = Number(r.v) || 0; else if (r.k === "aggiornato") m.aggiornato = Number(r.v) || 0; }
  return m;
}
function righeToMap(rows) { const out = { scali: {}, spese: {}, cassa: {} }; for (const r of rows) { try { out[r.coll][r.id] = Object.assign(JSON.parse(r.json), { sv: r.sv }); } catch (e) {} } return out; }

async function tutto(db, m) {
  const rows = (await db.prepare("SELECT coll, id, sv, json FROM record").all()).results || [];
  const tombs = (await db.prepare("SELECT id, t FROM tomb").all()).results || [];
  const rec = righeToMap(rows); const tomb = {}; for (const t of tombs) tomb[t.id] = t.t;
  return { modo: "tutto", scali: rec.scali, spese: rec.spese, cassa: rec.cassa, cfg: m.cfg, cfgAt: m.cfgAt, tomb };
}
async function delta(db, m, since, cfgAt) {
  const rows = (await db.prepare("SELECT coll, id, sv, json FROM record WHERE sv > ?").bind(since).all()).results || [];
  const tombs = (await db.prepare("SELECT id, t FROM tomb WHERE sv > ?").bind(since - 86400000).all()).results || [];
  const rec = righeToMap(rows); const tomb = {}; for (const t of tombs) tomb[t.id] = t.t;
  const out = { modo: "delta", scali: rec.scali, spese: rec.spese, cassa: rec.cassa, tomb };
  if (m.cfgAt > (Number(cfgAt) || 0) && m.cfg && Object.keys(m.cfg).length) { out.cfg = m.cfg; out.cfgAt = m.cfgAt; }
  return out;
}
async function risposta(db, m, since, cfgAt, extra) {
  const s = Number(since) || 0;
  const base = Object.assign({ esiste: true, aggiornato: m.aggiornato }, extra || {});
  if (!s) return json(Object.assign(base, await tutto(db, m)));
  if (m.aggiornato <= s) return json(Object.assign(base, { modo: "invariato" }));
  return json(Object.assign(base, await delta(db, m, s, cfgAt)));
}

// fusione: vince il record con updatedAt più recente; a parità vince quello diverso ricevuto (come su Vercel)
async function fondi(db, body, ut) {
  const m = await meta(db);
  const ora = Math.max(Date.now(), (m.aggiornato || 0) + 1);
  const stmts = []; let cambiato = false;
  const ids = {}; for (const coll of COLL) ids[coll] = Object.keys((body[coll] && typeof body[coll] === "object") ? body[coll] : {});
  // record attuali lato server per gli id ricevuti (a lotti)
  const attuali = { scali: {}, spese: {}, cassa: {} };
  for (const coll of COLL) {
    for (let i = 0; i < ids[coll].length; i += 90) {
      const lotto = ids[coll].slice(i, i + 90);
      const rows = (await db.prepare(`SELECT id, updatedAt, sv, json FROM record WHERE coll = ? AND id IN (${lotto.map(() => "?").join(",")})`).bind(coll, ...lotto).all()).results || [];
      for (const r of rows) attuali[coll][r.id] = r;
    }
  }
  const tombIn = (body.tomb && typeof body.tomb === "object") ? body.tomb : {};
  const tombRows = (await db.prepare("SELECT id, t FROM tomb").all()).results || [];
  const tombSrv = {}; for (const t of tombRows) tombSrv[t.id] = t.t;
  const tombNuove = [];
  for (const id in tombIn) {
    const t = Date.parse(tombIn[id]) || 0; if (!t) continue;
    if (!tombSrv[id] || t > (Date.parse(tombSrv[id]) || 0)) { tombSrv[id] = tombIn[id]; tombNuove.push(id); stmts.push(db.prepare("INSERT INTO tomb (id, t, sv) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET t = excluded.t, sv = excluded.sv").bind(id, tombIn[id], ora)); cambiato = true; }
  }
  for (const coll of COLL) {
    for (const id of ids[coll]) {
      const c = body[coll][id]; if (!c || typeof c !== "object") continue;
      const tt = tombSrv[id] ? (Date.parse(tombSrv[id]) || 0) : 0; if (tt && ts(c) <= tt) continue; // record cancellato dopo questa versione
      const s = attuali[coll][id]; let sj = null; if (s) { try { sj = JSON.parse(s.json); } catch (e) { sj = null; } }
      const tsS = s ? (Date.parse(s.updatedAt) || 0) : 0;
      if (!s || ts(c) > tsS || (ts(c) === tsS && JSON.stringify(c) !== JSON.stringify(sj))) {
        const j = JSON.stringify(stripSv(c));
        stmts.push(db.prepare("INSERT INTO record (coll, id, updatedAt, sv, json) VALUES (?, ?, ?, ?, ?) ON CONFLICT(coll, id) DO UPDATE SET updatedAt = excluded.updatedAt, sv = excluded.sv, json = excluded.json").bind(coll, id, c.updatedAt || "", ora, j));
        stmts.push(db.prepare("INSERT INTO storico (coll, id, sv, utente, json) VALUES (?, ?, ?, ?, ?)").bind(coll, id, ora, ut.nome, j));
        cambiato = true;
      }
    }
  }
  // le cancellazioni (nuove o aggiornate) tolgono i record non più recenti della cancellazione
  for (const id of tombNuove) {
    const t = Date.parse(tombSrv[id]) || 0;
    const rows = (await db.prepare("SELECT coll, updatedAt FROM record WHERE id = ?").bind(id).all()).results || [];
    for (const r of rows) if ((Date.parse(r.updatedAt) || 0) <= t) { stmts.push(db.prepare("DELETE FROM record WHERE coll = ? AND id = ?").bind(r.coll, id)); cambiato = true; }
  }
  if (ut.ruolo === "admin" && body.cfg && typeof body.cfg === "object" && Object.keys(body.cfg).length && (Number(body.cfgAt) || 0) >= m.cfgAt && JSON.stringify(body.cfg) !== JSON.stringify(m.cfg)) {
    m.cfg = body.cfg; m.cfgAt = Number(body.cfgAt) || ora;
    stmts.push(db.prepare("INSERT INTO meta (k, v) VALUES ('cfg', ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v").bind(JSON.stringify(m.cfg)));
    stmts.push(db.prepare("INSERT INTO meta (k, v) VALUES ('cfgAt', ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v").bind(String(m.cfgAt)));
    cambiato = true;
  }
  if (cambiato) {
    m.aggiornato = ora;
    stmts.push(db.prepare("INSERT INTO meta (k, v) VALUES ('aggiornato', ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v").bind(String(ora)));
    for (let i = 0; i < stmts.length; i += 100) await db.batch(stmts.slice(i, i + 100));
  }
  return { m, cambiato };
}

async function copiaNotturna(db) {
  const m = await meta(db); const t = await tutto(db, m); delete t.modo;
  const giorno = new Date().toISOString().slice(0, 10);
  await db.prepare("INSERT INTO backup (giorno, json) VALUES (?, ?) ON CONFLICT(giorno) DO UPDATE SET json = excluded.json").bind(giorno, JSON.stringify(Object.assign({ aggiornato: m.aggiornato, giorno }, t))).run();
  await db.prepare("DELETE FROM backup WHERE giorno NOT IN (SELECT giorno FROM backup ORDER BY giorno DESC LIMIT 60)").run();
  return giorno;
}

export default {
  async scheduled(event, env, ctx) { ctx.waitUntil(copiaNotturna(env.DB)); },
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    const url = new URL(req.url); const path = url.pathname.replace(/\/+$/, "");
    if (!/^\/api\/archivio(\/|$)/.test(path)) return json({ errore: "non trovato" }, 404);
    const chiave = req.headers.get("x-chiave") || url.searchParams.get("chiave");
    const ut = identifica(env, chiave);
    if (!ut) return json({ errore: "chiave non valida" }, 401);
    const db = env.DB; const chi = { utente: ut.nome, ruolo: ut.ruolo };
    try {
      const sotto = path.slice("/api/archivio".length).replace(/^\//, "");
      if (sotto === "stato") {
        const m = await meta(db);
        const n = (await db.prepare("SELECT coll, COUNT(*) AS n FROM record GROUP BY coll").all()).results || [];
        const st = (await db.prepare("SELECT COUNT(*) AS n FROM storico").first()) || { n: 0 };
        const bk = (await db.prepare("SELECT COUNT(*) AS n, MAX(giorno) AS ultimo FROM backup").first()) || { n: 0, ultimo: null };
        const out = Object.assign({ aggiornato: m.aggiornato, cfgAt: m.cfgAt, versioniStorico: st.n, copie: bk.n, ultimaCopia: bk.ultimo }, chi);
        for (const r of n) out[r.coll] = r.n;
        return json(out);
      }
      if (sotto === "backup") { if (ut.ruolo !== "admin") return json({ errore: "solo amministratore" }, 403); const m = await meta(db); const t = await tutto(db, m); delete t.modo; return json(Object.assign({ aggiornato: m.aggiornato, esportato: new Date().toISOString() }, t)); }
      if (sotto === "backups") {
        if (ut.ruolo !== "admin") return json({ errore: "solo amministratore" }, 403);
        const g = url.searchParams.get("giorno");
        if (g) { const r = await db.prepare("SELECT json FROM backup WHERE giorno = ?").bind(g).first(); if (!r) return json({ errore: "copia non trovata" }, 404); return new Response(r.json, { headers: Object.assign({ "content-type": "application/json; charset=utf-8" }, CORS) }); }
        const rows = (await db.prepare("SELECT giorno, LENGTH(json) AS byte FROM backup ORDER BY giorno DESC").all()).results || [];
        return json({ copie: rows });
      }
      if (sotto === "storico") {
        if (ut.ruolo !== "admin") return json({ errore: "solo amministratore" }, 403);
        const coll = url.searchParams.get("coll") || "scali", id = url.searchParams.get("id") || "";
        const rows = (await db.prepare("SELECT n, sv, utente, json FROM storico WHERE coll = ? AND id = ? ORDER BY sv DESC LIMIT 200").bind(coll, id).all()).results || [];
        return json({ coll, id, versioni: rows.map((r) => { let j = null; try { j = JSON.parse(r.json); } catch (e) {} return { n: r.n, quando: new Date(r.sv).toISOString(), utente: r.utente, record: j }; }) });
      }
      if (sotto === "copia") { if (ut.ruolo !== "admin") return json({ errore: "solo amministratore" }, 403); return json({ copia: await copiaNotturna(db) }); }
      if (sotto) return json({ errore: "non trovato" }, 404);
      if (req.method === "GET") { const m = await meta(db); return risposta(db, m, url.searchParams.get("since"), url.searchParams.get("cfgAt"), chi); }
      if (req.method !== "POST") return json({ errore: "metodo non ammesso" }, 405);
      let body; try { body = await req.json(); } catch (e) { body = null; }
      if (!body || typeof body !== "object") return json({ errore: "corpo non valido" }, 400);
      const { m, cambiato } = await fondi(db, body, ut);
      return risposta(db, m, body.since, body.cfgAt, Object.assign({ scritto: cambiato }, chi));
    } catch (e) { return json({ errore: String((e && e.message) || e) }, 500); }
  },
};
