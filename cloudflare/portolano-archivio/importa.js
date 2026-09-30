// Portolano — copia l'archivio condiviso da Vercel al nuovo archivio su Cloudflare.
//   node importa.js https://portolano-archivio.XXXX.workers.dev/api/archivio [CHIAVE]
// Se la chiave non è passata viene chiesta (non compare a schermo). Si può ripetere senza danni: la fusione tiene la versione più recente.
// Da eseguire mentre nessuno sta lavorando su Portolano; subito dopo va impostata su Vercel la variabile PORTOLANO_SPOSTA.
const readline = require("readline");
const DA = process.env.PORTOLANO_DA || "https://portolano-gerax.vercel.app/api/archivio";
const A = (process.argv[2] || "").replace(/\/+$/, "");
const chiedi = (q) => new Promise((res) => { const rl = readline.createInterface({ input: process.stdin, output: process.stdout }); rl._writeToOutput = () => {}; process.stdout.write(q); rl.question("", (a) => { rl.close(); process.stdout.write("\n"); res(a.trim()); }); });
(async () => {
  if (!/^https:\/\//.test(A)) throw new Error("indicare l'indirizzo del nuovo archivio, es. node importa.js https://portolano-archivio.xxxx.workers.dev/api/archivio");
  const chiave = process.argv[3] || (await chiedi("Chiave dell'amministratore: "));
  const h = { "x-chiave": chiave, "content-type": "application/json" };
  console.log("Leggo l'archivio da", DA, "…");
  const r1 = await fetch(DA + "?v=" + Date.now(), { headers: h }); if (!r1.ok) throw new Error("lettura da Vercel fallita: " + r1.status + " " + (await r1.text()).slice(0, 200));
  const v = await r1.json(); if (v.sposta) console.log("Nota: Vercel indica già il nuovo indirizzo", v.sposta);
  const nS = Object.keys(v.scali || {}).length, nP = Object.keys(v.spese || {}).length; console.log("Letti", nS, "scali,", nP, "spese, cfgAt", v.cfgAt || 0, ", cancellazioni", Object.keys(v.tomb || {}).length);
  if (!nS && !nP) throw new Error("archivio vuoto o risposta senza dati: non procedo");
  const corpo = { scali: {}, spese: {}, tomb: v.tomb || {}, cfg: v.cfg || {}, cfgAt: v.cfgAt || 0, since: 0 };
  for (const coll of ["scali", "spese"]) for (const id in v[coll]) { const o = Object.assign({}, v[coll][id]); delete o.sv; corpo[coll][id] = o; }
  console.log("Scrivo su", A, "…");
  const r2 = await fetch(A, { method: "POST", headers: h, body: JSON.stringify(corpo) }); const t = await r2.text(); if (!r2.ok) throw new Error("scrittura fallita: " + r2.status + " " + t.slice(0, 300));
  const j = JSON.parse(t); console.log("Risposta: scritto =", j.scritto, ", aggiornato =", j.aggiornato, ", utente =", j.utente);
  const st = await (await fetch(A + "/stato", { headers: h })).json(); console.log("Stato del nuovo archivio:", JSON.stringify(st));
  if ((st.scali || 0) < nS || (st.spese || 0) < nP) console.warn("ATTENZIONE: il nuovo archivio ha meno record di quelli letti (alcuni potrebbero essere stati cancellati in seguito: verificare).");
  console.log("\nFatto. Ora su Vercel: PORTOLANO_SPOSTA = " + A + " e ripubblicare; i dispositivi passeranno da soli al nuovo archivio.");
})().catch((e) => { console.error("ERRORE: " + (e && e.message || e)); process.exit(1); });
