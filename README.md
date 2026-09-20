# Portolano — Fratelli Bonanno Srl

App per scali e conti nave (PDA/FDA) dell'agenzia marittima Fratelli Bonanno di Catania: unisce
"Pratiche di Scalo" e "Mastrino Approdi". Archivio condiviso tra i dispositivi tramite un servizio
su Vercel (Blob privato) con chiave personale per utente e ruoli (amministratore / operatore).

- `src/` — sorgente dell'app (file unico) e `build.js` per la versione minificata
- `sito/` — versione pubblicabile (PWA: index.html, app*.js, sync.js, sw.js, manifest, icone)
- `vercel/` — file effettivamente caricati su Vercel (codificati + `build.sh` di verifica), `api/archivio.js`
- `eseguibile/` — avviatore locale in Go (Windows/Mac): incorpora l'app, la serve su 127.0.0.1:8765 e apre il browser
- `Portolano-con-archivio.html` — versione file singolo con archivio storico incorporato
- `Apri-Portolano-iPhone.html`, `vercel/Portolano.mobileconfig` — accesso da iPhone (icona in Home)

Le chiavi degli utenti e i token del servizio NON sono nel repository: stanno nelle variabili
d'ambiente del progetto Vercel (`PORTOLANO_UTENTI`, `PORTOLANO_CHIAVE`, `BLOB_READ_WRITE_TOKEN`).
