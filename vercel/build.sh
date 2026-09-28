#!/bin/bash
set -e
base64 -d old.b64 | tar xz
base64 -d old2.b64 | tar xz
cat chunk.00 chunk.01 chunk.02 chunk.03 chunk.04 chunk.05 chunk.06 chunk.07 chunk.08 chunk.09 chunk.10 chunk.11 chunk.12 | tar xz
node -e 'const fs=require("fs");for(const f of ["index.html","app1.js","app2.js","app3.js","app4.js","app5.js","sync.js","stampa.js","mensile.js"]){let s=fs.readFileSync(f+".txt","utf8");s=s.split("@N@").join("\n").split("@Q@").join("\"").split("@B@").join("\\");fs.writeFileSync(f,s);}'
node apply.js
node -e 'const fs=require("fs");let h=fs.readFileSync("index.html","utf8");const a="<script src=\"app5.js\"></script>\n";if(h.indexOf("sync.js")<0)h=h.replace(a,a+"<script src=\"sync.js\"></script>\n");if(h.indexOf("stampa.js")<0)h=h.replace("<script src=\"sync.js\"></script>\n","<script src=\"sync.js\"></script>\n<script src=\"stampa.js\"></script>\n");if(h.indexOf("mensile.js")<0)h=h.replace("<script src=\"stampa.js\"></script>\n","<script src=\"stampa.js\"></script>\n<script src=\"mensile.js\"></script>\n");h=h.replace("<script src=\"archivio.js\"></script>\n","");fs.writeFileSync("index.html",h);'
sha256sum -c <<'SUMS'
b48ea9f22e3492a279a65899598c5bc81489e60a2f62a699427acd6d82127b28  index.html
661f465881fe4bebb2a666592857df235a9eff05c79e334de8fe654a0c2b3974  app1.js
3315fc17aa4f155d1a169d2a6499537072fec0e883835b059741b0bdfb693fa3  app2.js
09e3d698e69acc3529a7737e3735618211a856a802038b23d6fa745aba650040  app3.js
943dbabc2167332e5b8d603e3fc372a99e17a0f58ad5812ff00afcae09dba8ae  app4.js
9f3ddc6c249a5d6f9be916fc0d97026a66773a57d45935c8d20b57aae7f3399d  app5.js
bf5e466fb37c2efcde285a8501d4fa0639efdde9c90067dc8dc428d5619b1026  sync.js
6740fa90bc3ae262f2446a15daa2440f8625283da98a6491d93d5c90a782fead  stampa.js
3be81b17e28da397b34531c13c03d3784f16ef7c04cbee70d2440b5c332c5acb  mensile.js
e216645d4d63827a1af6836b2c89d05231b361940e5c78de6d779200cd97ab61  conta.js
d1613658472b8c26e4823da8cd027216bbb8ae668b46fd07d798bc2d4bd10661  plus.js
d1f356cc3b7230647be81dc5498be6c01caabf03946488f4d7aef112c6bc9332  fe.js
c2c8e0687b24a6d79f4b2abe0fdd6b6f00e8392bf2dd5142b5d8d17fe5615b75  ec.js
73d29952ae488e397c96fac5a01e1518db6d3a04fe1a63d58b5464340b5732e2  Portolano.mobileconfig
68fa00d87a32b7136a43371cc11a5f06c0abcf09a7a4d4154083b1494506095a  api/archivio.js
SUMS
mkdir -p public
(curl -sSL --max-time 90 -o public/pdf.min.js https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js && curl -sSL --max-time 120 -o public/pdf.worker.min.js https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js && echo "pdf.js scaricato") || rm -f public/pdf.min.js public/pdf.worker.min.js
cp index.html app1.js app2.js app3.js app4.js app5.js sync.js stampa.js mensile.js conta.js plus.js fe.js ec.js sw.js manifest.json icon-180.png icon-192.png icon-512.png Portolano.mobileconfig public/
ls -la public
