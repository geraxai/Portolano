#!/bin/bash
set -e
B=https://portolano-gerax.vercel.app
for f in app1.js app2.js app3.js app4.js app5.js ec.js mensile.js conta.js fe.js plus.js sync.js index.html stampa.js sw.js manifest.json icon-180.png icon-192.png icon-512.png Portolano.mobileconfig; do curl -sSL --max-time 60 -o "$f" "$B/$f?v=1105"; done
sha256sum -c <<'BASE'
9081b3765227ec0af74c97883d0ac27a430c5333ba247426d6046b64e40641cf  app1.js
203fe362d31f3c8a0c6d912aba5a5145ab8c9a6c3921c7903bcaf8542565cafa  app2.js
8820353639c17ff576c1580d7ae3ea2e27fb136c9a19f32b2721a09d8b442888  app3.js
48f710106cf956e7188c82a8042293828fd114bee248bf58be5bacea150f37e4  app4.js
b8911378d93f859962d70bd925fc0ee65d59d4c747ba1bc89ced4b012f16a5fd  app5.js
d775b0c678522521c79e144f67d79a1cdaf9c922356d8755f52fe1ba0bd3119b  ec.js
0204953b70ce9d64badb9c4b8c0fb132d8dcbe61cf121bebf2acc44e94d9fc65  mensile.js
f3233f7d6024694f5b215407f2ed50c63aa3d0fc4cf2b2c21da83cadb96a6be7  conta.js
a8c8004d5e25eccdf83399d13141034e8805c91a9232315b6535339cfcad888b  fe.js
1dbf5c742e5d9f1837adf8061867747ff2d8ad1ce4568414c9de8ba32935b92e  plus.js
bf5e466fb37c2efcde285a8501d4fa0639efdde9c90067dc8dc428d5619b1026  sync.js
BASE
cat chunk.* | tar xz
node apply.js
sha256sum -c <<'SUMS'
9cb7fba402da72a6e40fe5f5644be962dfbd84cd90a319ee1567e37aee7c9d50  app1.js
203fe362d31f3c8a0c6d912aba5a5145ab8c9a6c3921c7903bcaf8542565cafa  app2.js
8820353639c17ff576c1580d7ae3ea2e27fb136c9a19f32b2721a09d8b442888  app3.js
48f710106cf956e7188c82a8042293828fd114bee248bf58be5bacea150f37e4  app4.js
b8911378d93f859962d70bd925fc0ee65d59d4c747ba1bc89ced4b012f16a5fd  app5.js
d775b0c678522521c79e144f67d79a1cdaf9c922356d8755f52fe1ba0bd3119b  ec.js
0204953b70ce9d64badb9c4b8c0fb132d8dcbe61cf121bebf2acc44e94d9fc65  mensile.js
f3233f7d6024694f5b215407f2ed50c63aa3d0fc4cf2b2c21da83cadb96a6be7  conta.js
a8c8004d5e25eccdf83399d13141034e8805c91a9232315b6535339cfcad888b  fe.js
1dbf5c742e5d9f1837adf8061867747ff2d8ad1ce4568414c9de8ba32935b92e  plus.js
7a8fb043558539231ec878cf779e1973bf66e8cf199cae280be9a5afa51f69fb  sync.js
SUMS
mkdir -p public
(curl -sSL --max-time 90 -o public/pdf.min.js https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js && curl -sSL --max-time 120 -o public/pdf.worker.min.js https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js && echo "pdf.js scaricato") || rm -f public/pdf.min.js public/pdf.worker.min.js
cp app1.js app2.js app3.js app4.js app5.js ec.js mensile.js conta.js fe.js plus.js sync.js index.html stampa.js sw.js manifest.json icon-180.png icon-192.png icon-512.png Portolano.mobileconfig public/
ls -la public
