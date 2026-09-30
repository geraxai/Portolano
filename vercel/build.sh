#!/bin/bash
set -e
B=https://portolano-gerax.vercel.app
for f in app1.js app2.js app3.js app4.js app5.js ec.js mensile.js conta.js fe.js plus.js sync.js index.html stampa.js sw.js manifest.json icon-180.png icon-192.png icon-512.png Portolano.mobileconfig; do curl -sSL --max-time 60 -o "$f" "$B/$f?v=1108"; done
sha256sum -c <<'BASE'
47f2eef0fa82fd986e9e58cc0307214f668a05b2ba07fcc82fc330bb29c190d1  app1.js
203fe362d31f3c8a0c6d912aba5a5145ab8c9a6c3921c7903bcaf8542565cafa  app2.js
8820353639c17ff576c1580d7ae3ea2e27fb136c9a19f32b2721a09d8b442888  app3.js
48f710106cf956e7188c82a8042293828fd114bee248bf58be5bacea150f37e4  app4.js
b8911378d93f859962d70bd925fc0ee65d59d4c747ba1bc89ced4b012f16a5fd  app5.js
d775b0c678522521c79e144f67d79a1cdaf9c922356d8755f52fe1ba0bd3119b  ec.js
0204953b70ce9d64badb9c4b8c0fb132d8dcbe61cf121bebf2acc44e94d9fc65  mensile.js
f3233f7d6024694f5b215407f2ed50c63aa3d0fc4cf2b2c21da83cadb96a6be7  conta.js
a8c8004d5e25eccdf83399d13141034e8805c91a9232315b6535339cfcad888b  fe.js
1dbf5c742e5d9f1837adf8061867747ff2d8ad1ce4568414c9de8ba32935b92e  plus.js
8e88b4e276e52339e42ed04af3f775e08942c35cf507727110d4290c72fcf614  sync.js
BASE
cat chunk.* | tar xz
node apply.js
sha256sum -c <<'SUMS'
0239f113cde65d252129633a83905401ae0be371cdfb1e34c0d1376967b3a4b0  app1.js
19695bc04e4e1de1470ff00e791a7f9a156f6cba2c14c22f494bd9039755f34d  app2.js
6e774fc84d9ab4954e685b52fb247a9e8521e39dd3d8b9646199fbb90d0fbf7a  app3.js
48f710106cf956e7188c82a8042293828fd114bee248bf58be5bacea150f37e4  app4.js
b8911378d93f859962d70bd925fc0ee65d59d4c747ba1bc89ced4b012f16a5fd  app5.js
d775b0c678522521c79e144f67d79a1cdaf9c922356d8755f52fe1ba0bd3119b  ec.js
0204953b70ce9d64badb9c4b8c0fb132d8dcbe61cf121bebf2acc44e94d9fc65  mensile.js
cacdb081ca7678f2e04a79af76f639a1d5a875998869f34b11fca9bedb56e1fa  conta.js
a8c8004d5e25eccdf83399d13141034e8805c91a9232315b6535339cfcad888b  fe.js
1dbf5c742e5d9f1837adf8061867747ff2d8ad1ce4568414c9de8ba32935b92e  plus.js
8e88b4e276e52339e42ed04af3f775e08942c35cf507727110d4290c72fcf614  sync.js
SUMS
mkdir -p public
(curl -sSL --max-time 90 -o public/pdf.min.js https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js && curl -sSL --max-time 120 -o public/pdf.worker.min.js https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js && echo "pdf.js scaricato") || rm -f public/pdf.min.js public/pdf.worker.min.js
cp app1.js app2.js app3.js app4.js app5.js ec.js mensile.js conta.js fe.js plus.js sync.js index.html stampa.js sw.js manifest.json icon-180.png icon-192.png icon-512.png Portolano.mobileconfig public/
ls -la public
