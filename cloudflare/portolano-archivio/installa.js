// Portolano — installazione guidata dell'archivio condiviso su Cloudflare (Workers + D1, piano gratuito).
// Da eseguire UNA volta dal computer, dentro questa cartella:   node installa.js
// Fa in ordine: accesso a Cloudflare (apre il browser), creazione del database D1, scrittura dell'id in wrangler.toml,
// creazione delle tabelle, salvataggio delle chiavi come segreti (non finiscono in nessun file), pubblicazione del Worker.
// Richiede Node.js 20+ e connessione a internet. Usa `npx wrangler` (scaricato al primo avvio).
const { execSync, spawnSync } = require("child_process"); const fs = require("fs"); const readline = require("readline");
const W = process.platform === "win32" ? "npx.cmd wrangler" : "npx wrangler";
const run = (c, opt) => { console.log("\n> " + c); return execSync(c, Object.assign({ stdio: "inherit", shell: true }, opt || {})); };
const out = (c) => execSync(c, { shell: true, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
const chiedi = (q, nascosto) => new Promise((res) => { const rl = readline.createInterface({ input: process.stdin, output: process.stdout }); if (nascosto) { rl._writeToOutput = () => {}; process.stdout.write(q); } rl.question(nascosto ? "" : q, (a) => { rl.close(); if (nascosto) process.stdout.write("\n"); res(a.trim()); }); });
(async () => {
  console.log("=== Portolano: archivio condiviso su Cloudflare ===");
  let toml = fs.readFileSync("wrangler.toml", "utf8");
  // 1. accesso
  try { const chi = out(W + " whoami"); console.log(chi.split("\n").filter((l) => /logged in|account/i.test(l)).join("\n") || chi); } catch (e) { run(W + " login"); }
  // 2. database
  if (/INSERIRE-ID/.test(toml)) {
    let id = "";
    try { const lista = out(W + " d1 list --json"); const j = JSON.parse(lista); const d = j.find((x) => x.name === "portolano-archivio"); if (d) { id = d.uuid; console.log("Database D1 già presente:", id); } } catch (e) {}
    if (!id) { const r = out(W + " d1 create portolano-archivio"); console.log(r); const m = r.match(/database_id\s*=\s*"([0-9a-f-]{36})"/) || r.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/); if (!m) throw new Error("id del database non trovato nell'output di wrangler: inseriscilo a mano in wrangler.toml"); id = m[1]; }
    toml = toml.replace("INSERIRE-ID-DA-wrangler-d1-create", id); fs.writeFileSync("wrangler.toml", toml); console.log("wrangler.toml aggiornato con database_id =", id);
  } else console.log("wrangler.toml ha già un database_id.");
  // 3. tabelle
  run(W + " d1 execute portolano-archivio --remote --yes --file=schema.sql");
  // 4. segreti
  console.log("\nChiavi di accesso (le stesse usate su Vercel: PORTOLANO_CHIAVE e, se c'è, PORTOLANO_UTENTI). Non vengono mostrate né salvate in file.");
  const chiave = await chiedi("PORTOLANO_CHIAVE (chiave dell'amministratore Emilio): ", true);
  if (chiave) { const r = spawnSync(W, ["secret", "put", "PORTOLANO_CHIAVE"], { input: chiave + "\n", stdio: ["pipe", "inherit", "inherit"], shell: true }); if (r.status) throw new Error("secret put PORTOLANO_CHIAVE fallito"); }
  const utenti = await chiedi("PORTOLANO_UTENTI (JSON degli altri utenti, INVIO per saltare): ", true);
  if (utenti) { try { JSON.parse(utenti); } catch (e) { throw new Error("PORTOLANO_UTENTI non è un JSON valido"); } const r = spawnSync(W, ["secret", "put", "PORTOLANO_UTENTI"], { input: utenti + "\n", stdio: ["pipe", "inherit", "inherit"], shell: true }); if (r.status) throw new Error("secret put PORTOLANO_UTENTI fallito"); }
  // 5. pubblicazione
  const dep = out(W + " deploy"); console.log(dep);
  const m = dep.match(/https:\/\/[a-z0-9.-]+\.workers\.dev/i);
  const url = m ? m[0] + "/api/archivio" : "(vedi indirizzo sopra)/api/archivio";
  fs.writeFileSync("INDIRIZZO.txt", url + "\n");
  console.log("\n=== FATTO ===\nIndirizzo del nuovo archivio: " + url + "\n(salvato anche in INDIRIZZO.txt)\n\nProssimo passo — copia dell'archivio da Vercel:   node importa.js " + url + "\nPoi su Vercel va impostata la variabile PORTOLANO_SPOSTA = " + url + " (lo fa Claude, oppure dal pannello Vercel → Settings → Environment Variables) e ripubblicato il progetto.");
})().catch((e) => { console.error("\nERRORE: " + (e && e.message || e)); process.exit(1); });
