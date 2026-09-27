#!/bin/bash
set -e
base64 -d old.b64 | tar xz
base64 -d patch.b64 | tar xz
node -e 'const fs=require("fs");for(const f of ["index.html","app1.js","app2.js","app3.js","app4.js","app5.js","sync.js","stampa.js","mensile.js"]){let s=fs.readFileSync(f+".txt","utf8");s=s.split("@N@").join("\n").split("@Q@").join("\"").split("@B@").join("\\");fs.writeFileSync(f,s);}'
node apply.js
node -e 'const fs=require("fs");let h=fs.readFileSync("index.html","utf8");const a="<script src=\"app5.js\"></script>\n";if(h.indexOf("sync.js")<0)h=h.replace(a,a+"<script src=\"sync.js\"></script>\n");if(h.indexOf("stampa.js")<0)h=h.replace("<script src=\"sync.js\"></script>\n","<script src=\"sync.js\"></script>\n<script src=\"stampa.js\"></script>\n");if(h.indexOf("mensile.js")<0)h=h.replace("<script src=\"stampa.js\"></script>\n","<script src=\"stampa.js\"></script>\n<script src=\"mensile.js\"></script>\n");h=h.replace("<script src=\"archivio.js\"></script>\n","");fs.writeFileSync("index.html",h);'
sha256sum -c <<'SUMS'
83353de2f1f7836169ba905d3f1f7c1ffb1aa02e29ab247231dad3f74332f0ff  index.html
4385e62882b325b1035581985bc04717aebfc2b8c2f890c58bbff3e0c36e8be3  app1.js
b1e0faf14f411b780a056805e6b4b355ae08ec374dd7a75ac829a9c3d9b35f2b  app2.js
300ead717b3e559c538f0eccba895ae741fd1b0ecfbf7b23aca8c1a551886ca7  app3.js
11cbe19c87c31c0bf79e62dbb4491b088fcc21e7c5022c2930a947a36d77c509  app4.js
7cf1f1ebcf632156a5290ee87309743071294dc64f38c2a88854693cca064ed6  app5.js
bf5e466fb37c2efcde285a8501d4fa0639efdde9c90067dc8dc428d5619b1026  sync.js
73d29952ae488e397c96fac5a01e1518db6d3a04fe1a63d58b5464340b5732e2  Portolano.mobileconfig
6740fa90bc3ae262f2446a15daa2440f8625283da98a6491d93d5c90a782fead  stampa.js
632c3f6ce77278754eecdfce18539e2c1e9f898f09c3237d71fb917741e902fc  mensile.js
68fa00d87a32b7136a43371cc11a5f06c0abcf09a7a4d4154083b1494506095a  api/archivio.js
22a7b1bc1b348e59f52197b2231637808fd16048dab1ce2b25f610ed29b5fa8a  conta.js
SUMS
mkdir -p public
cp index.html app1.js app2.js app3.js app4.js app5.js sync.js stampa.js mensile.js conta.js sw.js manifest.json icon-180.png icon-192.png icon-512.png Portolano.mobileconfig public/
ls -la public
