// Archivio condiviso di Portolano: un solo documento JSON su Vercel Blob, fusione per record in base a updatedAt.
const { put, get } = require("@vercel/blob");
const NOME = "portolano/archivio.json";

function ts(x) { return x && x.updatedAt ? Date.parse(x.updatedAt) || 0 : 0; }
function fondi(server, client) {
  const out = { scali: Object.assign({}, server.scali || {}), spese: Object.assign({}, server.spese || {}), cfg: server.cfg || {}, tomb: Object.assign({}, server.tomb || {}), cfgAt: server.cfgAt || 0 };
  for (const coll of ["scali", "spese"]) {
    const src = (client && client[coll]) || {};
    for (const id in src) { const c = src[id], s = out[coll][id]; if (!s || ts(c) >= ts(s)) out[coll][id] = c; }
  }
  const tomb = (client && client.tomb) || {};
  for (const id in tomb) { const t = Date.parse(tomb[id]) || 0; if (!out.tomb[id] || t > (Date.parse(out.tomb[id]) || 0)) out.tomb[id] = tomb[id]; }
  for (const id in out.tomb) { const t = Date.parse(out.tomb[id]) || 0; for (const coll of ["scali", "spese"]) { const r = out[coll][id]; if (r && ts(r) <= t) delete out[coll][id]; } }
  if (client && client.cfg && Object.keys(client.cfg).length && (client.cfgAt || 0) >= (out.cfgAt || 0)) { out.cfg = client.cfg; out.cfgAt = client.cfgAt || Date.now(); }
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
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type,x-chiave");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") return res.status(204).end();
  const chiave = req.headers["x-chiave"] || (req.query && req.query.chiave);
  const ut = identifica(chiave);
  if (!ut) return res.status(401).json({ errore: "chiave non valida" });
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  try {
    let server = { scali: {}, spese: {}, cfg: {}, tomb: {}, cfgAt: 0 };
    let esiste = false;
    try { const r = await get(NOME, { access: "private", token, useCache: false }); if (r && r.statusCode === 200 && r.stream) { server = JSON.parse(await new Response(r.stream).text()); esiste = true; } }
    catch (e) { if (!/not.?found|404/i.test(String(e && e.message || e))) throw e; }
    const chi = { utente: ut.nome, ruolo: ut.ruolo };
    if (req.method === "GET") return res.status(200).json(Object.assign({ esiste }, server, chi));
    let body = req.body; if (typeof body === "string") body = JSON.parse(body || "{}"); if (!body || typeof body !== "object") return res.status(400).json({ errore: "corpo non valido" });
    if (ut.ruolo !== "admin") { delete body.cfg; body.cfgAt = 0; }
    const merged = fondi(server, body); merged.aggiornato = new Date().toISOString();
    await put(NOME, JSON.stringify(merged), { access: "private", token, addRandomSuffix: false, allowOverwrite: true, contentType: "application/json" });
    return res.status(200).json(Object.assign({}, merged, chi));
  } catch (e) { return res.status(500).json({ errore: String(e && e.message || e) }); }
};
module.exports.fondi = fondi;
module.exports.identifica = identifica;
