#!/bin/bash
set -e
base64 -d old.b64 | tar xz
base64 -d old2.b64 | tar xz
cat chunk.0 chunk.1 chunk.2 chunk.3 | tar xz
node -e 'const fs=require("fs");for(const f of ["index.html","app1.js","app2.js","app3.js","app4.js","app5.js","sync.js","stampa.js","mensile.js"]){let s=fs.readFileSync(f+".txt","utf8");s=s.split("@N@").join("\n").split("@Q@").join("\"").split("@B@").join("\\");fs.writeFileSync(f,s);}'
node apply.js
node -e 'const fs=require("fs");let h=fs.readFileSync("index.html","utf8");const a="<script src=\"app5.js\"></script>\n";if(h.indexOf("sync.js")<0)h=h.replace(a,a+"<script src=\"sync.js\"></script>\n");if(h.indexOf("stampa.js")<0)h=h.replace("<script src=\"sync.js\"></script>\n","<script src=\"sync.js\"></script>\n<script src=\"stampa.js\"></script>\n");if(h.indexOf("mensile.js")<0)h=h.replace("<script src=\"stampa.js\"></script>\n","<script src=\"stampa.js\"></script>\n<script src=\"mensile.js\"></script>\n");h=h.replace("<script src=\"archivio.js\"></script>\n","");fs.writeFileSync("index.html",h);'
sha256sum -c <<'SUMS'
1e8235ce10661c3f0abcaaeb72860a3636626ffb65cc51e0878f7432afd3c413  index.html
0334d6b05d0226c0a6b9aea4abe2ffeafb616d4e3e80f3f15a17273c5edb7c4f  app1.js
deb34499de9692bafae9117d4465dfa563b7eeb1e3df6a181df37b004926572c  app2.js
5c98e6efe9f7f718f012f617d5c692c07db1cc80a77151e6ac2280fcccc76a5a  app3.js
f41078d9bf61ba7c8cc618fce292956fd6a7bcc73f1f0929e5bbd337093cbbcd  app4.js
d871b1fdb45b316e33fa25ebb26ed1dba6942a5f5a0156e3b4a04c8223b9106d  app5.js
bf5e466fb37c2efcde285a8501d4fa0639efdde9c90067dc8dc428d5619b1026  sync.js
73d29952ae488e397c96fac5a01e1518db6d3a04fe1a63d58b5464340b5732e2  Portolano.mobileconfig
6740fa90bc3ae262f2446a15daa2440f8625283da98a6491d93d5c90a782fead  stampa.js
3be81b17e28da397b34531c13c03d3784f16ef7c04cbee70d2440b5c332c5acb  mensile.js
68fa00d87a32b7136a43371cc11a5f06c0abcf09a7a4d4154083b1494506095a  api/archivio.js
6391eaf666cf6f9a4bbe8ec6a8b1751a1a14223996db1b745e4faf2edda16695  conta.js
98ba955b63cae109b8a7c5a0676f49875be647b1c663a47ff8a3c9b2429aa56d  plus.js
SUMS
mkdir -p public
cp index.html app1.js app2.js app3.js app4.js app5.js sync.js stampa.js mensile.js conta.js plus.js sw.js manifest.json icon-180.png icon-192.png icon-512.png Portolano.mobileconfig public/
ls -la public
