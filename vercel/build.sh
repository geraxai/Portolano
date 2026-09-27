#!/bin/bash
set -e
base64 -d old.b64 | tar xz
base64 -d old2.b64 | tar xz
cat chunk.0 chunk.1 chunk.2 chunk.3 chunk.4 chunk.5 chunk.6 chunk.7 chunk.8 chunk.9 | tar xz
node -e 'const fs=require("fs");for(const f of ["index.html","app1.js","app2.js","app3.js","app4.js","app5.js","sync.js","stampa.js","mensile.js"]){let s=fs.readFileSync(f+".txt","utf8");s=s.split("@N@").join("\n").split("@Q@").join("\"").split("@B@").join("\\");fs.writeFileSync(f,s);}'
node apply.js
node -e 'const fs=require("fs");let h=fs.readFileSync("index.html","utf8");const a="<script src=\"app5.js\"></script>\n";if(h.indexOf("sync.js")<0)h=h.replace(a,a+"<script src=\"sync.js\"></script>\n");if(h.indexOf("stampa.js")<0)h=h.replace("<script src=\"sync.js\"></script>\n","<script src=\"sync.js\"></script>\n<script src=\"stampa.js\"></script>\n");if(h.indexOf("mensile.js")<0)h=h.replace("<script src=\"stampa.js\"></script>\n","<script src=\"stampa.js\"></script>\n<script src=\"mensile.js\"></script>\n");h=h.replace("<script src=\"archivio.js\"></script>\n","");fs.writeFileSync("index.html",h);'
sha256sum -c <<'SUMS'
f7ea1ee471302a989c9309d611387703228b0eebadcf5716fa1eaac481082b15  index.html
0fcd6aa495a35d0479ecc5c32fd28e1a46e115952219553857c77a65c8334a37  app1.js
406ce80edacfbe36b3ac6711468584b4429370fafafe4e4ba78af274dc0e4e20  app2.js
879f4a3900c13832bd0a63a716f95141383e6c6049b80ed19f3a271854261a88  app3.js
3dbfd9572b5dae2b9fd993188e44839668cb9df78c3852d36f561be76c75902e  app4.js
b64525a72fd421c3850587663982c2728140db20e051068c0074d8624bb0b74d  app5.js
bf5e466fb37c2efcde285a8501d4fa0639efdde9c90067dc8dc428d5619b1026  sync.js
6740fa90bc3ae262f2446a15daa2440f8625283da98a6491d93d5c90a782fead  stampa.js
3be81b17e28da397b34531c13c03d3784f16ef7c04cbee70d2440b5c332c5acb  mensile.js
8694aa1c7d6cf71efd04006dd013772cf21654c32aa1c610e63c2c14099a50ba  conta.js
d171e7ea3dcd1ec91590f001781f1424adfcbf60fe430b75039f8ca0674b1b4f  plus.js
c6466ab460a82417852099568d2b74c6ba8f15b802a85cb8bc682d3752559589  fe.js
674eb01b6cd2da4aee009a32454cd4410498158c93f28a9663fd875608251560  ec.js
73d29952ae488e397c96fac5a01e1518db6d3a04fe1a63d58b5464340b5732e2  Portolano.mobileconfig
68fa00d87a32b7136a43371cc11a5f06c0abcf09a7a4d4154083b1494506095a  api/archivio.js
SUMS
mkdir -p public
cp index.html app1.js app2.js app3.js app4.js app5.js sync.js stampa.js mensile.js conta.js plus.js fe.js ec.js sw.js manifest.json icon-180.png icon-192.png icon-512.png Portolano.mobileconfig public/
ls -la public
