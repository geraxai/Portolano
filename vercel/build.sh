#!/bin/bash
set -e
B=https://portolano-gerax.vercel.app
for f in app1.js app2.js app3.js app4.js app5.js ec.js mensile.js conta.js fe.js plus.js index.html sync.js stampa.js sw.js manifest.json icon-180.png icon-192.png icon-512.png Portolano.mobileconfig; do curl -sSL --max-time 60 -o "$f" "$B/$f?v=1103"; done
sha256sum -c <<'BASE'
a574a9c885961b342bc3fb59234e0d0a01e5e177e6c33ce5a01689fa2dfcc242  app1.js
c51f22d15558818710f8deef6fb9e2ae55b7aaf6d3475afe026e25325f252264  app2.js
f035c87f9ece4fac9bb25dabc16ef970a91ee4ae8b6055547e3bf5ddad4555ed  app3.js
c3715eb280242a84244e3c3803c8a2da14e56e0df63f56ab554ca00166f84c2f  app4.js
41b6149fb30dee6439d127156d0c63200ec5729909a8641e635ee2d080b9ef3b  app5.js
c2c8e0687b24a6d79f4b2abe0fdd6b6f00e8392bf2dd5142b5d8d17fe5615b75  ec.js
3be81b17e28da397b34531c13c03d3784f16ef7c04cbee70d2440b5c332c5acb  mensile.js
e216645d4d63827a1af6836b2c89d05231b361940e5c78de6d779200cd97ab61  conta.js
d1f356cc3b7230647be81dc5498be6c01caabf03946488f4d7aef112c6bc9332  fe.js
d1613658472b8c26e4823da8cd027216bbb8ae668b46fd07d798bc2d4bd10661  plus.js
BASE
cat chunk.* | tar xz
node apply.js
sha256sum -c <<'SUMS'
e266b257a1ef20a8753b43146e42faa289c205ee0ae14b91d9c62d72aacbaa62  app1.js
cf866735819ed6a131469f36ddf1349d79923622768e17f35a36e1fdb1a0be6d  app2.js
8820353639c17ff576c1580d7ae3ea2e27fb136c9a19f32b2721a09d8b442888  app3.js
0d74a5712c4b1b23b9b9655dc005ed2214cb603994e122c58ffa9834720c96d6  app4.js
b8911378d93f859962d70bd925fc0ee65d59d4c747ba1bc89ced4b012f16a5fd  app5.js
d775b0c678522521c79e144f67d79a1cdaf9c922356d8755f52fe1ba0bd3119b  ec.js
0204953b70ce9d64badb9c4b8c0fb132d8dcbe61cf121bebf2acc44e94d9fc65  mensile.js
f3233f7d6024694f5b215407f2ed50c63aa3d0fc4cf2b2c21da83cadb96a6be7  conta.js
a8c8004d5e25eccdf83399d13141034e8805c91a9232315b6535339cfcad888b  fe.js
1dbf5c742e5d9f1837adf8061867747ff2d8ad1ce4568414c9de8ba32935b92e  plus.js
SUMS
mkdir -p public
(curl -sSL --max-time 90 -o public/pdf.min.js https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js && curl -sSL --max-time 120 -o public/pdf.worker.min.js https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js && echo "pdf.js scaricato") || rm -f public/pdf.min.js public/pdf.worker.min.js
cp app1.js app2.js app3.js app4.js app5.js ec.js mensile.js conta.js fe.js plus.js index.html sync.js stampa.js sw.js manifest.json icon-180.png icon-192.png icon-512.png Portolano.mobileconfig public/
ls -la public
