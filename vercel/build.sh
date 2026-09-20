#!/bin/bash
set -e
node -e 'const fs=require("fs");for(const f of ["index.html","app1.js","app2.js","app3.js","app4.js","app5.js","sync.js"]){let s=fs.readFileSync(f+".txt","utf8");s=s.split("@N@").join("\n").split("@Q@").join("\"").split("@B@").join("\\");fs.writeFileSync(f,s);}'
node -e 'const fs=require("fs");let h=fs.readFileSync("index.html","utf8");const a="<script src=\"app5.js\"></script>\n";if(h.indexOf("sync.js")<0)h=h.replace(a,a+"<script src=\"sync.js\"></script>\n");h=h.replace("<script src=\"archivio.js\"></script>\n","");fs.writeFileSync("index.html",h);'
sha256sum -c <<'SUMS'
4d539449a17a40fa76984ff04935aee9bda9fe82c4ce4e9390638d4ba5c7c776  index.html
15be3bb72a67a907d41ddc4fcd484ff83d08fa9b948452f26d252518aee7d22e  app1.js
3f613a2222347dd720c7cbc7394f686102a0748adbe937fa5bd782bbe3b3e6ab  app2.js
6ebbdd2bbda18441422112314294e734c346d7a50a216a82ee3e3fe8c2a55546  app3.js
11cbe19c87c31c0bf79e62dbb4491b088fcc21e7c5022c2930a947a36d77c509  app4.js
41ac55be1c39a6ff6a36c1727d683bca5ae526fa2dc5ea5c1a4fcbe06e68b1da  app5.js
bf5e466fb37c2efcde285a8501d4fa0639efdde9c90067dc8dc428d5619b1026  sync.js
73d29952ae488e397c96fac5a01e1518db6d3a04fe1a63d58b5464340b5732e2  Portolano.mobileconfig
68fa00d87a32b7136a43371cc11a5f06c0abcf09a7a4d4154083b1494506095a  api/archivio.js
SUMS
mkdir -p public
cp index.html app1.js app2.js app3.js app4.js app5.js sync.js sw.js manifest.json icon-180.png icon-192.png icon-512.png Portolano.mobileconfig public/
ls -la public
