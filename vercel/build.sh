#!/bin/bash
set -e
node -e 'const fs=require("fs");for(const f of ["index.html","app1.js","app2.js","app3.js","app4.js","app5.js","sync.js","stampa.js","mensile.js"]){let s=fs.readFileSync(f+".txt","utf8");s=s.split("@N@").join("\n").split("@Q@").join("\"").split("@B@").join("\\");fs.writeFileSync(f,s);}'
node -e 'const fs=require("fs");let h=fs.readFileSync("index.html","utf8");const a="<script src=\"app5.js\"></script>\n";if(h.indexOf("sync.js")<0)h=h.replace(a,a+"<script src=\"sync.js\"></script>\n");if(h.indexOf("stampa.js")<0)h=h.replace("<script src=\"sync.js\"></script>\n","<script src=\"sync.js\"></script>\n<script src=\"stampa.js\"></script>\n");if(h.indexOf("mensile.js")<0)h=h.replace("<script src=\"stampa.js\"></script>\n","<script src=\"stampa.js\"></script>\n<script src=\"mensile.js\"></script>\n");h=h.replace("<script src=\"archivio.js\"></script>\n","");fs.writeFileSync("index.html",h);'
sha256sum -c <<'SUMS'
a306ab55c78ab4ac6c80c6b99473dbec326a4294ef0c2b9d8a168baf00655fec  index.html
15be3bb72a67a907d41ddc4fcd484ff83d08fa9b948452f26d252518aee7d22e  app1.js
3f613a2222347dd720c7cbc7394f686102a0748adbe937fa5bd782bbe3b3e6ab  app2.js
6ebbdd2bbda18441422112314294e734c346d7a50a216a82ee3e3fe8c2a55546  app3.js
11cbe19c87c31c0bf79e62dbb4491b088fcc21e7c5022c2930a947a36d77c509  app4.js
41ac55be1c39a6ff6a36c1727d683bca5ae526fa2dc5ea5c1a4fcbe06e68b1da  app5.js
bf5e466fb37c2efcde285a8501d4fa0639efdde9c90067dc8dc428d5619b1026  sync.js
73d29952ae488e397c96fac5a01e1518db6d3a04fe1a63d58b5464340b5732e2  Portolano.mobileconfig
6740fa90bc3ae262f2446a15daa2440f8625283da98a6491d93d5c90a782fead  stampa.js
757d73e7c3debb27ab5f4db6a38f38b1b1d78c4f17d6c31de53fc1844675eba7  mensile.js
68fa00d87a32b7136a43371cc11a5f06c0abcf09a7a4d4154083b1494506095a  api/archivio.js
SUMS
mkdir -p public
cp index.html app1.js app2.js app3.js app4.js app5.js sync.js stampa.js mensile.js sw.js manifest.json icon-180.png icon-192.png icon-512.png Portolano.mobileconfig public/
ls -la public
