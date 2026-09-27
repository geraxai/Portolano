#!/bin/bash
set -e
base64 -d old.b64 | tar xz
base64 -d old2.b64 | tar xz
cat chunk.0 chunk.1 chunk.2 chunk.3 chunk.4a chunk.4b chunk.5 | tar xz
node -e 'const fs=require("fs");for(const f of ["index.html","app1.js","app2.js","app3.js","app4.js","app5.js","sync.js","stampa.js","mensile.js"]){let s=fs.readFileSync(f+".txt","utf8");s=s.split("@N@").join("\n").split("@Q@").join("\"").split("@B@").join("\\");fs.writeFileSync(f,s);}'
node apply.js
node -e 'const fs=require("fs");let h=fs.readFileSync("index.html","utf8");const a="<script src=\"app5.js\"></script>\n";if(h.indexOf("sync.js")<0)h=h.replace(a,a+"<script src=\"sync.js\"></script>\n");if(h.indexOf("stampa.js")<0)h=h.replace("<script src=\"sync.js\"></script>\n","<script src=\"sync.js\"></script>\n<script src=\"stampa.js\"></script>\n");if(h.indexOf("mensile.js")<0)h=h.replace("<script src=\"stampa.js\"></script>\n","<script src=\"stampa.js\"></script>\n<script src=\"mensile.js\"></script>\n");h=h.replace("<script src=\"archivio.js\"></script>\n","");fs.writeFileSync("index.html",h);'
sha256sum -c <<'SUMS'
32c3a90f932a7631f7db7810d4f5f34712f5cb29c741063e68e864aaa7b95cb1  index.html
a7dbd62613aabb725e628a6c5ed1629aa2132c675b30f23423e3696f84ade9dc  app1.js
69fdae06af4729dc1c45fb1f56c3d3cceb9f35fc3a317e0b76fd38bc6e9571f1  app2.js
3a1466ca740279390ac154ed1ad99106298987a737e96d5265ab8bdd1ea6bf4d  app3.js
63cc1890d7507031d8f6f97711cfc51452e675e6505af88ae9d985e8c857ea0a  app4.js
86f59ed04a7601c55dfdd37044f8d0a65adabf22b7e7eca2000bafbc4f0d3277  app5.js
bf5e466fb37c2efcde285a8501d4fa0639efdde9c90067dc8dc428d5619b1026  sync.js
6740fa90bc3ae262f2446a15daa2440f8625283da98a6491d93d5c90a782fead  stampa.js
3be81b17e28da397b34531c13c03d3784f16ef7c04cbee70d2440b5c332c5acb  mensile.js
38536a980dbe2d7f0ebd13433674970e679c510b4820a7ef9efdc5430eec254e  conta.js
c342779241c08cf1927a80f68a134477450ec1c6bb5e9340de63767a607bd4de  plus.js
c6466ab460a82417852099568d2b74c6ba8f15b802a85cb8bc682d3752559589  fe.js
73d29952ae488e397c96fac5a01e1518db6d3a04fe1a63d58b5464340b5732e2  Portolano.mobileconfig
68fa00d87a32b7136a43371cc11a5f06c0abcf09a7a4d4154083b1494506095a  api/archivio.js
SUMS
mkdir -p public
cp index.html app1.js app2.js app3.js app4.js app5.js sync.js stampa.js mensile.js conta.js plus.js fe.js sw.js manifest.json icon-180.png icon-192.png icon-512.png Portolano.mobileconfig public/
ls -la public
