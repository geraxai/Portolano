#!/bin/bash
set -e
base64 -d old.b64 | tar xz
base64 -d patch.b64 | tar xz
node -e 'const fs=require("fs");for(const f of ["index.html","app1.js","app2.js","app3.js","app4.js","app5.js","sync.js","stampa.js","mensile.js"]){let s=fs.readFileSync(f+".txt","utf8");s=s.split("@N@").join("\n").split("@Q@").join("\"").split("@B@").join("\\");fs.writeFileSync(f,s);}'
node apply.js
node -e 'const fs=require("fs");let h=fs.readFileSync("index.html","utf8");const a="<script src=\"app5.js\"></script>\n";if(h.indexOf("sync.js")<0)h=h.replace(a,a+"<script src=\"sync.js\"></script>\n");if(h.indexOf("stampa.js")<0)h=h.replace("<script src=\"sync.js\"></script>\n","<script src=\"sync.js\"></script>\n<script src=\"stampa.js\"></script>\n");if(h.indexOf("mensile.js")<0)h=h.replace("<script src=\"stampa.js\"></script>\n","<script src=\"stampa.js\"></script>\n<script src=\"mensile.js\"></script>\n");h=h.replace("<script src=\"archivio.js\"></script>\n","");fs.writeFileSync("index.html",h);'
sha256sum -c <<'SUMS'
c138a816adb48f9b5c9c78b49832c7c7a5050698860b1b2f3470a1490f0f755f  index.html
27d67c59b84746202dcda0f8d2742b0827283165f3dc924c65b872610685e441  app1.js
fc943550ba0d6eb69dd3289589a35c76f045e94c84417702aa6643401cbcdd95  app2.js
a95e3f6062d44b0339e8d2c54a39d997cc8815efd09a072167a784d2b995245c  app3.js
11cbe19c87c31c0bf79e62dbb4491b088fcc21e7c5022c2930a947a36d77c509  app4.js
3ff9f626903c66f8d18a6e59bae1ed6c7c025d652b817ce5c821302b31e0f519  app5.js
bf5e466fb37c2efcde285a8501d4fa0639efdde9c90067dc8dc428d5619b1026  sync.js
73d29952ae488e397c96fac5a01e1518db6d3a04fe1a63d58b5464340b5732e2  Portolano.mobileconfig
6740fa90bc3ae262f2446a15daa2440f8625283da98a6491d93d5c90a782fead  stampa.js
81ba52e7fac85f6b1543272ac2d1421f3c19fb7fd7a7962cc64a53551959415a  mensile.js
68fa00d87a32b7136a43371cc11a5f06c0abcf09a7a4d4154083b1494506095a  api/archivio.js
SUMS
mkdir -p public
cp index.html app1.js app2.js app3.js app4.js app5.js sync.js stampa.js mensile.js sw.js manifest.json icon-180.png icon-192.png icon-512.png Portolano.mobileconfig public/
ls -la public
