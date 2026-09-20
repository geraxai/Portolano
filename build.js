const esbuild=require("/home/claude/.npm-global/lib/node_modules/tsx/node_modules/esbuild"); const fs=require("fs");
const src=fs.readFileSync("/home/claude/portolano/src/portolano.src.html","utf8");
let out=src.replace(/<script>([\s\S]*?)<\/script>/,(m,js)=>"<script>"+esbuild.transformSync(js,{minify:true,target:"es2017",charset:"utf8"}).code+"</script>");
out=out.replace(/<style>([\s\S]*?)<\/style>/,(m,css)=>"<style>"+esbuild.transformSync(css,{loader:"css",minify:true,charset:"utf8"}).code+"</style>");
out=out.split("\n").map(l=>l.trim()).filter(Boolean).join("\n");
fs.writeFileSync("/home/claude/portolano/portolano.html",out);
new Function(out.match(/<script>([\s\S]*?)<\/script>/)[1]);
console.log("src",src.length,"min",out.length);
