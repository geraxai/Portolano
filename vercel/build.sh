#!/bin/bash
set -e
B=https://portolano-gerax.vercel.app
for f in app1.js app2.js app3.js app4.js app5.js ec.js mensile.js conta.js fe.js plus.js sync.js index.html stampa.js sw.js manifest.json icon-180.png icon-192.png icon-512.png Portolano.mobileconfig; do curl -sSL --max-time 60 -o "$f" "$B/$f?v=1110"; done
sha256sum -c <<'BASE'
3e68ef12ea9d2bfdc8608b8954b0f5d8587aab162f7c19fadaad0c2eea10f586  app1.js
312f417103693c99eec7821ede86a40277a85b0547d1849379177ea076c45b5d  app2.js
f018e674c8c00b808bacec6d9bd78aaae86a172a593864bf94f19a6b9efa248f  app3.js
48f710106cf956e7188c82a8042293828fd114bee248bf58be5bacea150f37e4  app4.js
f764465acc851b0ddd4481daf4fdfea4d9772ee114dffba7009c10fc54983cc0  app5.js
d775b0c678522521c79e144f67d79a1cdaf9c922356d8755f52fe1ba0bd3119b  ec.js
0204953b70ce9d64badb9c4b8c0fb132d8dcbe61cf121bebf2acc44e94d9fc65  mensile.js
cacdb081ca7678f2e04a79af76f639a1d5a875998869f34b11fca9bedb56e1fa  conta.js
a8c8004d5e25eccdf83399d13141034e8805c91a9232315b6535339cfcad888b  fe.js
1dbf5c742e5d9f1837adf8061867747ff2d8ad1ce4568414c9de8ba32935b92e  plus.js
8e88b4e276e52339e42ed04af3f775e08942c35cf507727110d4290c72fcf614  sync.js
BASE
cat chunk.* | tar xz
node apply.js
sha256sum -c <<'SUMS'
f9e21c37df36525ce8406e4362cc98c4cd19dac002423f9c33b83dfa99d47446  app1.js
1579af5b822bb75b9526ac73a448543f43b48af37f93052fa0f176ed9f92105f  app2.js
1ae3291cbc1338edc02d37ee2f9c03fae1930a7df39c9e21f4fa3750934f43bd  app3.js
48f710106cf956e7188c82a8042293828fd114bee248bf58be5bacea150f37e4  app4.js
b3a3b01c50cd78b0c6ee8d0881aa9a5ebdb38b04f72b3f14a0559d9c3e571298  app5.js
d775b0c678522521c79e144f67d79a1cdaf9c922356d8755f52fe1ba0bd3119b  ec.js
0204953b70ce9d64badb9c4b8c0fb132d8dcbe61cf121bebf2acc44e94d9fc65  mensile.js
eccdaad6ab124e03cb2ab4702b8ecc74053410482b48a730dcceb6d54d41f5f0  conta.js
a8c8004d5e25eccdf83399d13141034e8805c91a9232315b6535339cfcad888b  fe.js
1dbf5c742e5d9f1837adf8061867747ff2d8ad1ce4568414c9de8ba32935b92e  plus.js
a8315facfe79d6396d206df43b5283780b710d010fb0a5450b344164b1bc792b  sync.js
SUMS
mkdir -p public
(curl -sSL --max-time 90 -o public/pdf.min.js https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js && curl -sSL --max-time 120 -o public/pdf.worker.min.js https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js && echo "pdf.js scaricato") || rm -f public/pdf.min.js public/pdf.worker.min.js
cp app1.js app2.js app3.js app4.js app5.js ec.js mensile.js conta.js fe.js plus.js sync.js index.html stampa.js sw.js manifest.json icon-180.png icon-192.png icon-512.png Portolano.mobileconfig public/
ls -la public
