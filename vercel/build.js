// Portolano - build su Vercel dal repository GitHub (geraxai/Portolano, cartella radice del progetto Vercel = vercel/).
// Ad ogni push su main Vercel esegue questo script: copia i file del sito (../sito) in dist/, aggiunge Portolano.mobileconfig,
// prende logo.js dalla produzione (versione ad alta risoluzione, non presente nel repository) e scrive dist/diag.txt con
// versione, commit e sha256 di ogni file pubblicato. La funzione api/archivio.js viene pubblicata da Vercel insieme a dist/.
//
// Sicurezza: il build si FERMA (e la produzione resta com'era) se la versione nel repository (VER in app1.js) è più vecchia
// di quella in produzione, se manca un file essenziale o se sito/ non è raggiungibile.
// Per pubblicare una nuova versione: modificare i file in sito/, aggiornare VER in app1.js (e, se serve, C in sw.js), git push.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = __dirname, SITO = path.join(ROOT, '..', 'sito'), OUT = path.join(ROOT, 'dist');
const LIVE = 'https://portolano-gerax.vercel.app/';
const LOGO_SHA_NOTO = '1a6d6a6267c286952a8eb6ced812f9266b2137df18b33f48fb1213dcd7e42f80'; // logo.js ad alta risoluzione in produzione dal 2026 (49592 byte)
const ESSENZIALI = ['index.html', 'app1.js', 'app2.js', 'app3.js', 'app4.js', 'app5.js', 'conta.js', 'ec.js', 'fe.js', 'firma.js',
  'logo.js', 'timbro-logo.js', 'mensile.js', 'plus.js', 'stampa.js', 'sync.js', 'sw.js', 'manifest.json', 'icon-180.png', 'icon-192.png', 'icon-512.png'];
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const diag = [];
const ver = t => (String(t).match(/\bVER\s*=\s*"([^"]+)"/) || [])[1] || '';
const cmpVer = (a, b) => { // confronto numerico "1.14.0" vs "1.9.2"
  const A = a.split('.').map(Number), B = b.split('.').map(Number);
  for (let i = 0; i < Math.max(A.length, B.length); i++) { const d = (A[i] || 0) - (B[i] || 0); if (d) return d; }
  return 0;
};
async function scarica(f) {
  const r = await fetch(LIVE + f + '?v=' + Date.now(), { cache: 'no-store' });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const b = Buffer.from(await r.arrayBuffer());
  if (/^\s*<(!doctype|html)/i.test(b.slice(0, 80).toString())) throw new Error('risposta HTML');
  return b;
}
(async () => {
  if (!fs.existsSync(SITO)) throw new Error('cartella sito/ non trovata: nel progetto Vercel deve essere attivo "Include source files outside of the Root Directory"');
  fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT);
  for (const f of fs.readdirSync(SITO).sort()) {
    if (f === 'vercel.json' || f.startsWith('.')) continue;
    const p = path.join(SITO, f); if (!fs.statSync(p).isFile()) continue;
    fs.copyFileSync(p, path.join(OUT, f));
  }
  fs.copyFileSync(path.join(ROOT, 'Portolano.mobileconfig'), path.join(OUT, 'Portolano.mobileconfig'));
  for (const f of ESSENZIALI) if (!fs.existsSync(path.join(OUT, f))) throw new Error('manca il file essenziale sito/' + f);

  const mia = ver(fs.readFileSync(path.join(OUT, 'app1.js'), 'utf8'));
  if (!mia) throw new Error('VER non trovata in app1.js');
  // 1. mai pubblicare una versione meno avanzata di quella online
  let online = '';
  try { online = ver((await scarica('app1.js')).toString('utf8')); diag.push('versione in produzione: ' + (online || 'non leggibile')); }
  catch (e) { diag.push('versione in produzione non verificabile: ' + e.message); }
  if (online && cmpVer(mia, online) < 0) throw new Error('la versione nel repository (' + mia + ') è più vecchia di quella in produzione (' + online + '): build fermato, il sito resta com\'era');

  // 2. logo.js: in produzione c'è la versione ad alta risoluzione (~49 KB, generata da Pratiche di Scalo); nel repository quella ridotta.
  try {
    const b = await scarica('logo.js'), t = b.toString('utf8'), mio = fs.readFileSync(path.join(OUT, 'logo.js'));
    if (b.length < 30000 || !/^\s*\/\*\s*-+\s*Portolano: logo/.test(t) || t.indexOf('var LOGO_BONANNO="data:image/') < 0) throw new Error('contenuto inatteso (' + b.length + ' byte)');
    if (b.length >= mio.length) { fs.writeFileSync(path.join(OUT, 'logo.js'), b); diag.push('logo.js: copiato dalla produzione (' + b.length + ' byte' + (sha(b) === LOGO_SHA_NOTO ? ', versione nota' : ', sha256 ' + sha(b)) + ')'); }
    else diag.push('logo.js: dal repository (' + mio.length + ' byte), quello in produzione è più piccolo (' + b.length + ' byte)');
  } catch (e) { diag.push('logo.js: dal repository, produzione non usabile: ' + e.message); }

  // 3. diagnostica pubblica (https://portolano-gerax.vercel.app/diag.txt)
  const sw = (fs.readFileSync(path.join(OUT, 'sw.js'), 'utf8').match(/const C="([^"]+)"/) || [])[1] || '?';
  const commit = (process.env.VERCEL_GIT_COMMIT_SHA || 'locale').slice(0, 7);
  const msg = (process.env.VERCEL_GIT_COMMIT_MESSAGE || '').split('\n')[0].slice(0, 120);
  const righe = ['APPLICATO Portolano ' + mia + ' da GitHub ' + (process.env.VERCEL_GIT_REPO_OWNER || 'geraxai') + '/' + (process.env.VERCEL_GIT_REPO_SLUG || 'Portolano') +
    ' commit ' + commit + (msg ? ' «' + msg + '»' : '') + ' · ' + new Date().toISOString(), 'cache service worker: ' + sw].concat(diag, ['']);
  for (const f of fs.readdirSync(OUT).sort()) { const b = fs.readFileSync(path.join(OUT, f)); righe.push(f + ' ' + b.length + ' ' + sha(b)); }
  fs.writeFileSync(path.join(OUT, 'diag.txt'), righe.join('\n') + '\n');
  console.log(righe.join('\n'));
})().catch(e => { console.error('BUILD FERMATO: ' + e.message); process.exit(1); });
