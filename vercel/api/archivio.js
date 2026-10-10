// Archivio condiviso di Portolano: un solo documento JSON su Vercel Blob, fusione per record in base a updatedAt.
// Versione "leggera" (1.10.5): i dispositivi inviano solo i record cambiati e ricevono solo quelli cambiati dall'ultima
// sincronizzazione (parametro `since` = orologio del servizio); il documento viene riscritto sul Blob solo se qualcosa è cambiato.
const { put, get } = require("@vercel/blob");
const NOME = "portolano/archivio.json";
const COLL = ["scali", "spese", "cassa"]; // 1.11: anche la prima nota cassa
const CACHE_MS = 15000; // letture di sola consultazione servite dalla copia in memoria per pochi secondi (stessa istanza)
const FERMO_MS = 180000; // 1.10.6: se questa istanza sa che nulla è cambiato da `since`, risponde "invariato" senza leggere il Blob (finestra di 3 minuti)
let cache = null; // { server, quando }

function ts(x) { return x && x.updatedAt ? Date.parse(x.updatedAt) || 0 : 0; }
function fondi(server, client, ora) {
  const out = { scali: Object.assign({}, server.scali || {}), spese: Object.assign({}, server.spese || {}), cassa: Object.assign({}, server.cassa || {}), cfg: server.cfg || {}, tomb: Object.assign({}, server.tomb || {}), cfgAt: server.cfgAt || 0 };
  let cambiato = false;
  for (const coll of COLL) {
    const src = (client && client[coll]) || {};
    for (const id in src) {
      const c = src[id], s = out[coll][id];
      if (!c || typeof c !== "object") continue;
      if (!s || ts(c) > ts(s) || (ts(c) === ts(s) && JSON.stringify(c) !== JSON.stringify(stripSv(s)))) {
        out[coll][id] = Object.assign({}, c, { sv: ora }); cambiato = true;
      }
    }
  }
  const tomb = (client && client.tomb) || {};
  for (const id in tomb) { const t = Date.parse(tomb[id]) || 0; if (!out.tomb[id] || t > (Date.parse(out.tomb[id]) || 0)) { out.tomb[id] = tomb[id]; cambiato = true; } }
  for (const id in out.tomb) { const t = Date.parse(out.tomb[id]) || 0; for (const coll of COLL) { const r = out[coll][id]; if (r && ts(r) <= t) { delete out[coll][id]; cambiato = true; } } }
  if (client && client.cfg && Object.keys(client.cfg).length && (client.cfgAt || 0) >= (out.cfgAt || 0) && JSON.stringify(client.cfg) !== JSON.stringify(out.cfg)) { out.cfg = client.cfg; out.cfgAt = client.cfgAt || ora; cambiato = true; }
  out.cambiato = cambiato;
  return out;
}
function stripSv(r) { const o = Object.assign({}, r); delete o.sv; return o; }
// risposta: tutto (client vecchi o prima sincronizzazione) oppure solo ciò che è cambiato dopo `since`
function risposta(server, since, cfgAt) {
  const s = Number(since) || 0;
  if (!s) return { modo: "tutto", scali: server.scali || {}, spese: server.spese || {}, cassa: server.cassa || {}, cfg: server.cfg || {}, cfgAt: server.cfgAt || 0, tomb: server.tomb || {} };
  const out = { modo: "delta", scali: {}, spese: {}, cassa: {}, tomb: {} };
  for (const coll of COLL) for (const id in server[coll] || {}) { const r = server[coll][id]; if ((r.sv || 0) > s || (!r.sv && ts(r) > s)) out[coll][id] = r; }
  for (const id in server.tomb || {}) { if ((Date.parse(server.tomb[id]) || 0) > s - 86400000) out.tomb[id] = server.tomb[id]; }
  if ((server.cfgAt || 0) > (Number(cfgAt) || 0) && server.cfg && Object.keys(server.cfg).length) { out.cfg = server.cfg; out.cfgAt = server.cfgAt; }
  return out;
}
function identifica(chiave) {
  if (!chiave) return null;
  let u = {};
  try { u = JSON.parse(process.env.PORTOLANO_UTENTI || "{}"); } catch (e) { u = {}; }
  if (process.env.PORTOLANO_CHIAVE && !Object.keys(u).some((k) => u[k].chiave === process.env.PORTOLANO_CHIAVE)) u.emilio = { nome: "Emilio", ruolo: "admin", chiave: process.env.PORTOLANO_CHIAVE };
  for (const id in u) if (u[id] && u[id].chiave === chiave) return { id, nome: u[id].nome || id, ruolo: u[id].ruolo === "admin" ? "admin" : "operatore" };
  return null;
}
async function leggi(token, usaCache) {
  if (usaCache && cache && Date.now() - cache.quando < CACHE_MS) return cache.server;
  let server = { scali: {}, spese: {}, cassa: {}, cfg: {}, tomb: {}, cfgAt: 0, aggiornato: 0 };
  try { const r = await get(NOME, { access: "private", token, useCache: false }); if (r && r.statusCode === 200 && r.stream) { server = JSON.parse(await new Response(r.stream).text()); server.esiste = true; } }
  catch (e) { if (!/not.?found|404/i.test(String(e && e.message || e))) throw e; }
  if (typeof server.aggiornato !== "number") server.aggiornato = Date.parse(server.aggiornato) || 0;
  cache = { server, quando: Date.now() };
  return server;
}
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type,x-chiave");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") return res.status(204).end();
  // controllo di funzionamento pubblico (nessun dato): GET /api/archivio?stato=1 -> {ok:true, ...}; usato per verificare ogni pubblicazione
  if (req.method === "GET" && req.query && req.query.stato) return res.status(200).json({ ok: true, servizio: "portolano/archivio", commit: (process.env.VERCEL_GIT_COMMIT_SHA || "").slice(0, 7), configurato: !!process.env.BLOB_READ_WRITE_TOKEN && !!(process.env.PORTOLANO_UTENTI || process.env.PORTOLANO_CHIAVE) });
  const chiave = req.headers["x-chiave"] || (req.query && req.query.chiave);
  const ut = identifica(chiave);
  if (!ut) return res.status(401).json({ errore: "chiave non valida" });
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const q = req.query || {};
  const chi = { utente: ut.nome, ruolo: ut.ruolo };
  try {
    // 1.10.7: archivio trasferito (es. su Cloudflare): questa funzione fa solo da tramite e indica ai dispositivi il nuovo indirizzo (campo sposta);
    // i dispositivi dalla 1.10.7 in su passano da soli al nuovo indirizzo, quelli precedenti continuano a lavorare attraverso il tramite.
    const sposta = (process.env.PORTOLANO_SPOSTA || "").trim().replace(/\/+$/, "");
    if (/^https:\/\/|^http:\/\/127\.0\.0\.1/.test(sposta)) {
      const i = (req.url || "").indexOf("?");
      const r = await fetch(sposta + (i >= 0 ? req.url.slice(i) : ""), { method: req.method === "POST" ? "POST" : "GET", headers: { "content-type": "application/json", "x-chiave": String(chiave) }, body: req.method === "POST" ? (typeof req.body === "string" ? req.body : JSON.stringify(req.body || {})) : undefined });
      let j; try { j = await r.json(); } catch (e) { j = { errore: "risposta non valida dal nuovo archivio (" + r.status + ")" }; }
      if (j && typeof j === "object") j.sposta = sposta;
      return res.status(r.status).json(j);
    }
    if (req.method === "GET") {
      if (q.since && cache && Date.now() - cache.quando < FERMO_MS && (cache.server.aggiornato || 0) <= (Number(q.since) || 0))
        return res.status(200).json(Object.assign({ esiste: !!cache.server.esiste, modo: "invariato", aggiornato: cache.server.aggiornato || 0, memoria: true }, chi));
      const server = await leggi(token, !!q.since);
      if (q.since && (server.aggiornato || 0) <= (Number(q.since) || 0)) return res.status(200).json(Object.assign({ esiste: !!server.esiste, modo: "invariato", aggiornato: server.aggiornato || 0 }, chi));
      return res.status(200).json(Object.assign({ esiste: !!server.esiste, aggiornato: server.aggiornato || 0 }, risposta(server, q.since, q.cfgAt), chi));
    }
    let body = req.body; if (typeof body === "string") body = JSON.parse(body || "{}"); if (!body || typeof body !== "object") return res.status(400).json({ errore: "corpo non valido" });
    if (ut.ruolo !== "admin") { delete body.cfg; body.cfgAt = 0; }
    const server = await leggi(token, false);
    const ora = Date.now();
    const merged = fondi(server, body, ora);
    const cambiato = merged.cambiato; delete merged.cambiato;
    if (cambiato) {
      merged.aggiornato = ora;
      await put(NOME, JSON.stringify(merged), { access: "private", token, addRandomSuffix: false, allowOverwrite: true, contentType: "application/json" });
      cache = { server: Object.assign({ esiste: true }, merged), quando: Date.now() };
    } else merged.aggiornato = server.aggiornato || 0;
    return res.status(200).json(Object.assign({ esiste: true, aggiornato: merged.aggiornato, scritto: cambiato }, risposta(merged, body.since, body.cfgAt), chi));
  } catch (e) { return res.status(500).json({ errore: String(e && e.message || e) }); }
};
module.exports.fondi = fondi;
module.exports.identifica = identifica;
module.exports.risposta = risposta;
