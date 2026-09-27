#!/bin/bash
set -e
base64 -d old.b64 | tar xz
base64 -d old2.b64 | tar xz
cat chunk.0 chunk.1 chunk.2 chunk.3 chunk.4 chunk.5 chunk.6 chunk.7 chunk.8 chunk.9 | tar xz
node -e 'const fs=require("fs");for(const f of ["index.html","app1.js","app2.js","app3.js","app4.js","app5.js","sync.js","stampa.js","mensile.js"]){let s=fs.readFileSync(f+".txt","utf8");s=s.split("@N@").join("\n").split("@Q@").join("\"").split("@B@").join("\\");fs.writeFileSync(f,s);}'
node apply.js
node -e 'const fs=require("fs");let h=fs.readFileSync("index.html","utf8");const a="<script src=\"app5.js\"></script>\n";if(h.indexOf("sync.js")<0)h=h.replace(a,a+"<script src=\"sync.js\"></script>\n");if(h.indexOf("stampa.js")<0)h=h.replace("<script src=\"sync.js\"></script>\n","<script src=\"sync.js\"></script>\n<script src=\"stampa.js\"></script>\n");if(h.indexOf("mensile.js")<0)h=h.replace("<script src=\"stampa.js\"></script>\n","<script src=\"stampa.js\"></script>\n<script src=\"mensile.js\"></script>\n");h=h.replace("<script src=\"archivio.js\"></script>\n","");fs.writeFileSync("index.html",h);'
sha256sum -c <<'SUMS'
674aac309b6f3858e6e1059890d2ea9fd16094266a867bb4a62fee99fd11ed0b  index.html
039e9aad105f6c2e18efd784d41ccc9ca82371cb1ee682dcde45364acc580fa7  app1.js
406ce80edacfbe36b3ac6711468584b4429370fafafe4e4ba78af274dc0e4e20  app2.js
b5a78c0f215c31f6a91cdfff58f1e214a2bc946886a9adf7b08b67ab118b5df3  app3.js
63cc1890d7507031d8f6f97711cfc51452e675e6505af88ae9d985e8c857ea0a  app4.js
fa0d43444996ddd2c62eee46e7ffecb99cfd5be16cdc8519f6d02f054862e22b  app5.js
bf5e466fb37c2efcde285a8501d4fa0639efdde9c90067dc8dc428d5619b1026  sync.js
6740fa90bc3ae262f2446a15daa2440f8625283da98a6491d93d5c90a782fead  stampa.js
3be81b17e28da397b34531c13c03d3784f16ef7c04cbee70d2440b5c332c5acb  mensile.js
47cf8dbf3d3a62d7b4d8d03957f4fa4e6d3693c7ecf29636e1c8efe89131aa08  conta.js
c342779241c08cf1927a80f68a134477450ec1c6bb5e9340de63767a607bd4de  plus.js
c6466ab460a82417852099568d2b74c6ba8f15b802a85cb8bc682d3752559589  fe.js
49b0f7a2632ed119013b72f004ec76f956bfd894707dd7e3fcf9481977700793  ec.js
73d29952ae488e397c96fac5a01e1518db6d3a04fe1a63d58b5464340b5732e2  Portolano.mobileconfig
68fa00d87a32b7136a43371cc11a5f06c0abcf09a7a4d4154083b1494506095a  api/archivio.js
SUMS
mkdir -p public
cp index.html app1.js app2.js app3.js app4.js app5.js sync.js stampa.js mensile.js conta.js plus.js fe.js ec.js sw.js manifest.json icon-180.png icon-192.png icon-512.png Portolano.mobileconfig public/
ls -la public
