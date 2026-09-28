/* ---------- Portolano: importazione fatture (XML FatturaPA / .p7m dallo SDI, PDF, cartelle .zip) con abbinamento automatico ad approdi e fornitori e controllo delle incoerenze ---------- */
(function(){
  "use strict";
  S.fe=S.fe||{righe:[]};
  var SUFF=/\b(S\.?R\.?L\.?S?|S\.?P\.?A\.?|S\.?A\.?S\.?|S\.?N\.?C\.?|S\.?C\.?A\.?R\.?L\.?|SOC(IETA'?|\.)?\s*COOP(ERATIVA|\.)?|A\s*R\.?L\.?|SOCIETA'?|UNIPERSONALE|DI\s+NAVIGAZIONE)\b/g;
  var PIVA_AZIENDA="03431780877";
  function T(el,name){ if(!el) return ""; var l=el.getElementsByTagNameNS("*",name); return l.length?String(l[0].textContent||"").trim():""; }
  function TT(el,name){ var out=[]; if(!el) return out; var l=el.getElementsByTagNameNS("*",name); for(var i=0;i<l.length;i++) out.push(String(l[i].textContent||"").trim()); return out; }
  function n(v){ if(v===""||v===null||v===undefined) return null; var x=Number(String(v).replace(",",".")); return isNaN(x)?null:r2(x); }
  function nIt(v){ if(!v) return null; var t=String(v).trim().replace(/\./g,"").replace(",","."); var x=Number(t); return isNaN(x)?null:r2(x); }
  function pulisciNome(d){ return upper(d).replace(SUFF," ").replace(/[^A-Z0-9&' ]+/g," ").replace(/\s+/g," ").trim(); }
  function fornNoto(f){ return tuttiFornitori().indexOf(upper(f))>=0; }
  function mappaFornitore(den,piva,testo){ var M=(S.cfg.fe&&S.cfg.fe.piva)||{}; if(piva&&M[piva]) return M[piva];
    var d=upper(den), dp=pulisciNome(den), F=tuttiFornitori();
    for(var i=0;i<F.length;i++){ var f=F[i]; if(f==="NS FATTURA"||f==="ALTRO") continue; if(d&&(d.indexOf(f)>=0||dp.indexOf(f)>=0)) return f; var w=f.split(/\s+/)[0]; if(w.length>=5&&dp.split(" ").indexOf(w)>=0) return f; }
    if(testo){ var tu=upper(testo); for(var k=0;k<F.length;k++){ var g=F[k]; if(g==="NS FATTURA"||g==="ALTRO"||g.length<5) continue; if(tu.indexOf(g)>=0) return g; } }
    var V=S.cfg.voci, dd=d+" "+upper(testo||"").slice(0,4000); for(var j=0;j<V.length;j++){ var v=V[j]; if(!v.forn.length||v.k==="agency"||v.k==="other") continue; if(v.kw.some(function(kw){ return kw&&dd.indexOf(upper(kw))>=0; })) return upper(v.forn[0]); }
    return dp||d; }

  /* ---- ZIP: lettura in locale (senza librerie), anche cartelle annidate ---- */
  function u32(dv,o){ return dv.getUint32(o,true); } function u16(dv,o){ return dv.getUint16(o,true); }
  async function gonfia(u8){ if(typeof DecompressionStream==="undefined") throw new Error("browser senza DecompressionStream");
    var ds=new DecompressionStream("deflate-raw"), w=ds.writable.getWriter(); w.write(u8); w.close(); var buf=await new Response(ds.readable).arrayBuffer(); return buf; }
  async function leggiZip(buf,prefisso,liv){ liv=liv||0; var dv=new DataView(buf), u8=new Uint8Array(buf), out=[], e=-1;
    for(var p=buf.byteLength-22;p>=Math.max(0,buf.byteLength-70000);p--){ if(u32(dv,p)===0x06054b50){ e=p; break; } }
    if(e<0) throw new Error("archivio zip non valido");
    var nEnt=u16(dv,e+10), cd=u32(dv,e+16), o=cd;
    for(var i=0;i<nEnt;i++){ if(u32(dv,o)!==0x02014b50) break; var met=u16(dv,o+10), csz=u32(dv,o+20), usz=u32(dv,o+24), nl=u16(dv,o+28), el=u16(dv,o+30), cl=u16(dv,o+32), lho=u32(dv,o+42), flag=u16(dv,o+8);
      var nome=(flag&0x800)?new TextDecoder("utf-8").decode(u8.subarray(o+46,o+46+nl)):String.fromCharCode.apply(null,u8.subarray(o+46,o+46+nl)); o+=46+nl+el+cl;
      var base=nome.split("/").pop(); if(!base||/\/$/.test(nome)||/__MACOSX|^\./.test(nome)||/^\./.test(base)) continue;
      if(!/\.(xml|p7m|pdf|zip)$/i.test(base)) continue;
      var lnl=u16(dv,lho+26), lel=u16(dv,lho+28), ds=lho+30+lnl+lel, dati=u8.subarray(ds,ds+csz), pieno;
      try{ if(met===0) pieno=dati.slice().buffer; else if(met===8) pieno=await gonfia(dati); else { out.push({name:(prefisso||"")+base,err:"compressione zip non supportata"}); continue; } }
      catch(err){ out.push({name:(prefisso||"")+base,err:"zip: "+(err.message||"errore")}); continue; }
      if(/\.zip$/i.test(base)){ if(liv<2){ try{ var sub=await leggiZip(pieno,(prefisso||"")+base+"/",liv+1); out.push.apply(out,sub); }catch(err){ out.push({name:base,err:err.message}); } } continue; }
      out.push({name:(prefisso||"")+base,buf:pieno}); }
    return out; }

  /* ---- PDF: lettore di testo incorporato (senza librerie: stream Flate, font con ToUnicode, XML allegato); pdf.js solo come riserva ---- */
  function lat1(u8,a,b){ var s=""; for(var i=a;i<b;i+=8192) s+=String.fromCharCode.apply(null,u8.subarray(i,Math.min(b,i+8192))); return s; }
  async function inflaZ(u8){ if(typeof DecompressionStream==="undefined") throw new Error("browser senza DecompressionStream"); var ds=new DecompressionStream("deflate"), w=ds.writable.getWriter(); w.write(u8).catch(function(){}); w.close().catch(function(){}); return new Uint8Array(await new Response(ds.readable).arrayBuffer()); }
  function a85(u8){ var s=lat1(u8,0,u8.length).replace(/^<~/,""), e=s.indexOf("~>"); if(e>=0) s=s.slice(0,e); s=s.replace(/\s+/g,""); var out=[], i=0; while(i<s.length){ if(s[i]==="z"){ out.push(0,0,0,0); i++; continue; } var g=s.substr(i,5), pad=5-g.length; g+="uuuu".slice(0,pad); var v=0; for(var k=0;k<5;k++) v=v*85+(g.charCodeAt(k)-33); var by=[(v>>>24)&255,(v>>>16)&255,(v>>>8)&255,v&255]; for(var q=0;q<4-pad;q++) out.push(by[q]); i+=5; } return new Uint8Array(out); }
  function ahx(u8){ var s=lat1(u8,0,u8.length).replace(/>.*$/,"").replace(/[^0-9A-Fa-f]/g,""), out=new Uint8Array(Math.ceil(s.length/2)); for(var i=0;i<s.length;i+=2) out[i/2]=parseInt((s.substr(i,2)+"0").slice(0,2),16); return out; }
  async function applicaFiltri(raw,f){ var L=(f.match(/\/[A-Za-z0-9]+/g)||[]).map(function(x){ return x.slice(1); }), d=raw; for(var i=0;i<L.length;i++){ var n=L[i]; if(n==="FlateDecode"||n==="Fl") d=await inflaTollerante(d); else if(n==="ASCII85Decode"||n==="A85") d=a85(d); else if(n==="ASCIIHexDecode"||n==="AHx") d=ahx(d); else return null; } return d; }
  async function inflaTollerante(u8){ try{ return await inflaZ(u8); }catch(e){ try{ var ds=new DecompressionStream("deflate"), w=ds.writable.getWriter(), rd=ds.readable.getReader(), parts=[]; w.write(u8).catch(function(){}); w.close().catch(function(){}); for(;;){ var x; try{ x=await rd.read(); }catch(er){ break; } if(x.done) break; parts.push(x.value); } var n=0; parts.forEach(function(p){ n+=p.length; }); var out=new Uint8Array(n), o=0; parts.forEach(function(p){ out.set(p,o); o+=p.length; }); return out; }catch(e2){ return new Uint8Array(0); } } }
  function toksPdf(s){ var out=[], i=0, L=s.length; while(i<L){ var c=s[i];
      if(c===" "||c==="\n"||c==="\r"||c==="\t"||c==="\f"||c==="\0"){ i++; continue; }
      if(c==="%"){ while(i<L&&s[i]!=="\n"&&s[i]!=="\r") i++; continue; }
      if(c==="("){ var d=1, j=i+1, str=""; while(j<L&&d>0){ var ch=s[j]; if(ch==="\\"){ var nx=s[j+1]; if(/[0-7]/.test(nx)){ var oc=s.substr(j+1,3).match(/^[0-7]{1,3}/)[0]; str+=String.fromCharCode(parseInt(oc,8)); j+=1+oc.length; continue; } str+=({n:"\n",r:"\r",t:"\t",b:"\b",f:"\f"})[nx]||nx; j+=2; continue; } if(ch==="(") d++; else if(ch===")"){ d--; if(!d){ j++; break; } } str+=ch; j++; } out.push({t:"s",v:str}); i=j; continue; }
      if(c==="<"&&s[i+1]!=="<"){ var k=s.indexOf(">",i), hx=s.slice(i+1,k<0?L:k).replace(/[^0-9A-Fa-f]/g,""), st=""; for(var q=0;q+1<hx.length+1;q+=2) st+=String.fromCharCode(parseInt((hx.substr(q,2)+"0").slice(0,2),16)); out.push({t:"s",v:st}); i=k<0?L:k+1; continue; }
      if(c==="<"&&s[i+1]==="<"){ out.push({t:"o",v:"<<"}); i+=2; continue; } if(c===">"&&s[i+1]===">"){ out.push({t:"o",v:">>"}); i+=2; continue; }
      if(c==="["||c==="]"||c==="{"||c==="}"){ out.push({t:"o",v:c}); i++; continue; }
      if(c==="/"){ var m=s.slice(i+1).match(/^[^\s\/\[\]\(\)<>{}%]*/)[0]; out.push({t:"n",v:m.replace(/#([0-9A-Fa-f]{2})/g,function(_,h){ return String.fromCharCode(parseInt(h,16)); })}); i+=1+m.length; continue; }
      var w=s.slice(i).match(/^[^\s\/\[\]\(\)<>{}%]+/); if(!w){ i++; continue; } var v=w[0]; i+=v.length; if(/^[+-]?(\d+\.?\d*|\.\d+)$/.test(v)) out.push({t:"#",v:parseFloat(v)}); else out.push({t:"o",v:v}); }
    return out; }
  function dictVal(d,chiave){ var re=new RegExp("/"+chiave+"(?=[\\s/\\[<(])\\s*"), m=re.exec(d); if(!m) return ""; var i=m.index+m[0].length, rest=d.slice(i);
    if(rest.slice(0,2)==="<<"){ var dep=0, j=0; while(j<rest.length){ if(rest.substr(j,2)==="<<"){ dep++; j+=2; continue; } if(rest.substr(j,2)===">>"){ dep--; j+=2; if(!dep) return rest.slice(0,j); continue; } j++; } return rest; }
    if(rest[0]==="["){ var k=rest.indexOf("]"); return rest.slice(0,k<0?rest.length:k+1); }
    var r2=rest.match(/^(\d+\s+\d+\s+R|\/[^\s\/\[\]<>]+|[^\s\/\[\]<>]+)/); return r2?r2[1]:""; }
  function refNum(v){ var m=String(v||"").match(/^(\d+)\s+\d+\s+R$/); return m?parseInt(m[1],10):null; }
  function parseCMap(txt){ var map={}, len=2, m, r; var cs=txt.match(/begincodespacerange([\s\S]*?)endcodespacerange/); if(cs){ var h=cs[1].match(/<([0-9A-Fa-f]+)>/); if(h) len=Math.max(1,Math.round(h[1].length/2)); }
    var rc=/beginbfchar([\s\S]*?)endbfchar/g; while((m=rc.exec(txt))){ var rr=/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g; while((r=rr.exec(m[1]))) map[parseInt(r[1],16)]=hexU(r[2]); }
    var rg=/beginbfrange([\s\S]*?)endbfrange/g; while((m=rg.exec(txt))){ var rr2=/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*(<([0-9A-Fa-f]+)>|\[([^\]]*)\])/g; while((r=rr2.exec(m[1]))){ var a=parseInt(r[1],16), b=parseInt(r[2],16); if(b-a>65535) continue; if(r[4]!==undefined){ var base=hexU(r[4]); for(var k=a;k<=b;k++){ map[k]=base.slice(0,-1)+String.fromCharCode(base.charCodeAt(base.length-1)+(k-a)); } } else { var arr=r[5].match(/<([0-9A-Fa-f]+)>/g)||[]; for(var k2=a;k2<=b&&k2-a<arr.length;k2++) map[k2]=hexU(arr[k2-a].replace(/[<>]/g,"")); } } }
    return {map:map,len:len}; }
  function hexU(h){ var s=""; for(var i=0;i+3<h.length+1;i+=4){ var c=parseInt(h.substr(i,4),16); if(!isNaN(c)) s+=String.fromCharCode(c); } return s; }
  function decodiFont(str,font){ if(!font) return str; var out=""; if(font.cmap){ var L=font.cmap.len, M=font.cmap.map; for(var i=0;i<str.length;i+=L){ var code=0; for(var j=0;j<L;j++) code=(code<<8)|(str.charCodeAt(i+j)||0); out+=(M[code]!==undefined?M[code]:(L===1?str[i]:"")); } return out; }
    if(font.identity) return ""; return str; }
  async function pdfTestoLocale(buf){ var u8=new Uint8Array(buf), s=lat1(u8,0,u8.length); if(/\/Encrypt\b/.test(s.slice(-4000))||/\/Encrypt\s+\d+\s+\d+\s+R/.test(s)) throw new Error("PDF protetto da password");
    var objs={}, streams={}, re=/(\d+)\s+(\d+)\s+obj\b/g, m, xmlAll=null;
    while((m=re.exec(s))){ var num=parseInt(m[1],10), st=re.lastIndex, endo=s.indexOf("endobj",st); if(endo<0) endo=s.length; var chunk=s.slice(st,endo), si=chunk.indexOf("stream"); var dict=si>=0?chunk.slice(0,si):chunk; objs[num]=dict.trim();
      if(si>=0){ var ds=st+si+6; if(s[ds]==="\r") ds++; if(s[ds]==="\n") ds++; var ln=dictVal(dict,"Length"), len=null; if(/^\d+$/.test(ln)) len=parseInt(ln,10); var de=len!==null&&s.substr(ds+len,20).match(/^\s*endstream/)?ds+len:s.indexOf("endstream",ds); if(de<0) de=endo; streams[num]={a:ds,b:de,dict:dict}; } }
    async function datiStream(num){ var v=streams[num]; if(!v) return null; if(v.cache) return v.cache; var raw=u8.subarray(v.a,v.b), f=dictVal(v.dict,"Filter"), out; if(!f||/^\s*$/.test(f)) out=raw; else out=await applicaFiltri(raw,f); v.cache=out; return out; }
    /* oggetti dentro ObjStm (PDF 1.5+) */
    for(var k in streams){ if(/\/Type\s*\/ObjStm/.test(streams[k].dict)){ var d=await datiStream(k); if(!d) continue; var txt=lat1(d,0,d.length), nn=parseInt(dictVal(streams[k].dict,"N"),10)||0, first=parseInt(dictVal(streams[k].dict,"First"),10)||0, hdr=txt.slice(0,first).trim().split(/\s+/); for(var i=0;i+1<hdr.length&&i/2<nn;i+=2){ var on=parseInt(hdr[i],10), off=parseInt(hdr[i+1],10), nxt=i+3<hdr.length?parseInt(hdr[i+3],10):txt.length-first; objs[on]=txt.slice(first+off,first+nxt).trim(); } } }
    /* allegato XML */
    for(var k2 in streams){ if(/\/Type\s*\/EmbeddedFile/.test(streams[k2].dict)){ var d2=await datiStream(k2); if(d2&&d2.length){ var x=estraiXml(d2.buffer.slice(d2.byteOffset,d2.byteOffset+d2.byteLength)); if(x){ xmlAll=x; break; } } } }
    /* font */
    var fonts={}; for(var k3 in objs){ var dd=objs[k3]; if(/\/Type\s*\/Font\b/.test(dd)&&!/\/Type\s*\/FontDescriptor/.test(dd)){ var f={identity:/Identity-H|Identity-V/.test(dictVal(dd,"Encoding"))}; var tu=refNum(dictVal(dd,"ToUnicode")); if(tu!==null&&streams[tu]){ var cm=await datiStream(tu); if(cm) f.cmap=parseCMap(lat1(cm,0,cm.length)); } if(/\/Subtype\s*\/Type0/.test(dd)&&!f.cmap) f.identity=true; fonts[k3]=f; } }
    function risorseFont(resTxt){ var mapF={}; var fd=dictVal(resTxt,"Font"); var rn=refNum(fd); if(rn!==null) fd=objs[rn]||""; var rr=/\/([^\s\/\[\]<>]+)\s+(\d+)\s+\d+\s+R/g, mm; while((mm=rr.exec(fd))) mapF[mm[1]]=fonts[mm[2]]||null; return mapF; }
    /* pagine */
    var pagine=[]; for(var k4 in objs){ if(/\/Type\s*\/Page\b/.test(objs[k4])) pagine.push(parseInt(k4,10)); } pagine.sort(function(a,b){ return a-b; });
    var righe=[], np=0;
    for(var pi=0;pi<pagine.length&&pi<8;pi++){ var pd=objs[pagine[pi]], res=dictVal(pd,"Resources"), rn2=refNum(res); if(rn2!==null) res=objs[rn2]||""; var fm=risorseFont(res); var cont=dictVal(pd,"Contents"), refs=[]; var mr=cont.match(/\d+(?=\s+\d+\s+R)/g); if(mr) refs=mr.map(Number);
      var body=""; for(var ci=0;ci<refs.length;ci++){ var cd=await datiStream(refs[ci]); if(cd) body+=lat1(cd,0,cd.length)+"\n"; } if(!body) continue; np++;
      var tk=toksPdf(body), stack=[], font=null, fsz=10, tm=[1,0,0,1,0,0], tlm=[1,0,0,1,0,0], lead=0, byY={}, inArr=null, ctm=[1,0,0,1,0,0], pila=[];
      function mul(m1,m2){ return [m1[0]*m2[0]+m1[1]*m2[2],m1[0]*m2[1]+m1[1]*m2[3],m1[2]*m2[0]+m1[3]*m2[2],m1[2]*m2[1]+m1[3]*m2[3],m1[4]*m2[0]+m1[5]*m2[2]+m2[4],m1[4]*m2[1]+m1[5]*m2[3]+m2[5]]; }
      var cur=null;
      function largh(txt){ var w=0; for(var i=0;i<txt.length;i++){ var ch=txt[i]; w+=/[MW]/.test(ch)?0.85:/[A-Z]/.test(ch)?0.68:/[mw]/.test(ch)?0.83:/[ijl.,:;'|!]/.test(ch)?0.26:/[ftr]/.test(ch)?0.33:/ /.test(ch)?0.28:/[0-9]/.test(ch)?0.556:0.53; } return w*fsz; }
      function emetti(str){ var txt=decodiFont(str,font); if(!txt) return; var dm=mul(tm,ctm), sc=Math.sqrt(Math.abs(dm[0]*dm[3]-dm[1]*dm[2]))||1, y=Math.round(dm[5]/2), x=dm[4], w=largh(txt);
        if(cur&&cur.y===y&&Math.abs(tm[4]-cur.endX)<0.3*fsz){ cur.s+=txt; cur.w+=w*sc; cur.endX=tm[4]+w; } else { cur={x:x,y:y,s:txt,w:w*sc,endX:tm[4]+w}; (byY[y]=byY[y]||[]).push(cur); } tm[4]+=w; }
      for(var ti=0;ti<tk.length;ti++){ var tkn=tk[ti]; if(tkn.t!=="o"){ if(inArr) inArr.push(tkn); else stack.push(tkn); continue; } var op=tkn.v;
        if(op==="["){ inArr=[]; continue; } if(op==="]"){ stack.push({t:"a",v:inArr||[]}); inArr=null; continue; }
        if(op==="Tm"||op==="T*"||op==="BT"||op==="ET"||op==="'"||op==='"') cur=null;
        if(op==="cm"){ var c6=stack.slice(-6).map(function(z){ return z.v; }); if(c6.length===6) ctm=mul(c6,ctm); }
        else if(op==="q"){ pila.push(ctm.slice()); } else if(op==="Q"){ if(pila.length) ctm=pila.pop(); }
        else if(op==="Tf"){ var nm=stack[stack.length-2], sz=stack[stack.length-1]; font=nm&&nm.t==="n"?fm[nm.v]:null; fsz=sz&&sz.t==="#"?sz.v:10; }
        else if(op==="Tm"){ var v6=stack.slice(-6).map(function(z){ return z.v; }); if(v6.length===6){ tm=v6.slice(); tlm=v6.slice(); } }
        else if(op==="Td"||op==="TD"){ var tx=stack[stack.length-2], ty=stack[stack.length-1]; if(tx&&ty){ tlm=[tlm[0],tlm[1],tlm[2],tlm[3],tlm[4]+tx.v*tlm[0]+ty.v*tlm[2],tlm[5]+tx.v*tlm[1]+ty.v*tlm[3]]; tm=tlm.slice(); if(op==="TD") lead=-ty.v; if(Math.abs(ty.v)>0.01) cur=null; } }
        else if(op==="T*"){ tlm=[tlm[0],tlm[1],tlm[2],tlm[3],tlm[4]-lead*tlm[2],tlm[5]-lead*tlm[3]]; tm=tlm.slice(); }
        else if(op==="TL"){ var l=stack[stack.length-1]; if(l) lead=l.v; }
        else if(op==="BT"){ tm=[1,0,0,1,0,0]; tlm=tm.slice(); }
        else if(op==="Tj"){ var sj=stack[stack.length-1]; if(sj&&sj.t==="s") emetti(sj.v); }
        else if(op==="'"||op==='"'){ tlm=[tlm[0],tlm[1],tlm[2],tlm[3],tlm[4]-lead*tlm[2],tlm[5]-lead*tlm[3]]; tm=tlm.slice(); var sq=stack[stack.length-1]; if(sq&&sq.t==="s") emetti(sq.v); }
        else if(op==="TJ"){ var ar=stack[stack.length-1]; if(ar&&ar.t==="a"){ ar.v.forEach(function(el){ if(el.t==="s") emetti(el.v); else if(el.t==="#"){ var adv=-el.v/1000*fsz; tm[4]+=adv; if(cur){ cur.endX+=adv; if(el.v<-180&&!/\s$/.test(cur.s)){ cur.s+=" "; } } } }); } }
        stack=[]; }
      Object.keys(byY).map(Number).sort(function(a,b){ return b-a; }).forEach(function(y){ var it=byY[y].sort(function(a,b){ return a.x-b.x; }), line="", lastX=null; it.forEach(function(i){ if(lastX!==null&&i.x-lastX>2&&line&&!/\s$/.test(line)) line+=" "; line+=i.s; lastX=i.x+i.w; }); line=line.replace(/\s+/g," ").trim(); if(line) righe.push(line); }); }
    return {testo:righe.join("\n"),xml:xmlAll,pagine:np}; }
  var pdfLib=null;
  function caricaPdfJs(){ if(pdfLib) return Promise.resolve(pdfLib); if(window.pdfjsLib){ pdfLib=window.pdfjsLib; return Promise.resolve(pdfLib); }
    var loc=/^https?:/.test(location.protocol)?"pdf.min.js":"", cdn="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/";
    function tenta(src,wsrc){ return new Promise(function(res,rej){ var s=document.createElement("script"); s.src=src; s.onload=function(){ try{ pdfLib=window.pdfjsLib; pdfLib.GlobalWorkerOptions.workerSrc=wsrc; res(pdfLib); }catch(e){ rej(e); } }; s.onerror=function(){ s.remove(); rej(new Error("lettore PDF non disponibile")); }; document.head.appendChild(s); }); }
    var p=loc?tenta(loc,"pdf.worker.min.js"):Promise.reject(new Error("no")); return p.catch(function(){ return tenta(cdn+"pdf.min.js",cdn+"pdf.worker.min.js"); }); }
  async function testoPdfJs(buf){ var lib=await caricaPdfJs(); var pdf=await lib.getDocument({data:new Uint8Array(buf)}).promise, righe=[], xmlAll=null;
    try{ var att=await pdf.getAttachments(); if(att){ for(var k in att){ if(/\.xml$|\.p7m$/i.test(k)&&att[k].content){ var x=estraiXml(att[k].content.buffer||att[k].content); if(x){ xmlAll=x; break; } } } } }catch(e){}
    for(var p=1;p<=Math.min(pdf.numPages,6);p++){ var pg=await pdf.getPage(p), tc=await pg.getTextContent(), byY={}; tc.items.forEach(function(it){ if(!it.str) return; var y=Math.round((it.transform?it.transform[5]:0)/3); (byY[y]=byY[y]||[]).push({x:it.transform?it.transform[4]:0,s:it.str}); });
      Object.keys(byY).map(Number).sort(function(a,b){ return b-a; }).forEach(function(y){ righe.push(byY[y].sort(function(a,b){ return a.x-b.x; }).map(function(i){ return i.s; }).join(" ").replace(/\s+/g," ").trim()); }); }
    return {testo:righe.join("\n"),xml:xmlAll,pagine:pdf.numPages}; }
  async function testoPdf(buf){ var r=null, e1=null; try{ r=await pdfTestoLocale(buf); }catch(e){ e1=e; if(/password/.test(e.message)) throw e; }
    if(r&&(r.xml||r.testo.replace(/\s/g,"").length>=60)) return r;
    try{ var r2=await testoPdfJs(buf); if(r2.xml||r2.testo.replace(/\s/g,"").length>(r?r.testo.replace(/\s/g,"").length:0)) return r2; }catch(e2){ if(!r) throw new Error((e1&&e1.message)||e2.message||"PDF non leggibile"); }
    return r||{testo:"",xml:null,pagine:0}; }
  function primoNum(re,t,tutti){ var m, best=null, g=new RegExp(re.source,re.flags.indexOf("g")>=0?re.flags:re.flags+"g"); while((m=g.exec(t))){ var v=nIt(m[1]); if(v===null) continue; if(!tutti) return v; if(best===null||v>best) best=v; } return best; }
  function dataIso(m){ if(!m) return ""; var d=m[1], mo=m[2], y=m[3]; if(y.length===2) y="20"+y; return y+"-"+("0"+mo).slice(-2)+"-"+("0"+d).slice(-2); }
  function leggiPdfTesto(testo,nomeFile){ var t=testo.replace(/ /g," "), tu=upper(t);
    var pive=[], mp, rp=/(?:P\.?\s*IVA|PARTITA\s+IVA|VAT|C\.?F\.?\s*\/?\s*P\.?\s*IVA|IT)\s*[:.\-]?\s*(?:IT\s*)?(\d{11})/gi; while((mp=rp.exec(t))){ if(mp[1]!==PIVA_AZIENDA&&pive.indexOf(mp[1])<0) pive.push(mp[1]); }
    var piva=pive[0]||"", righe=t.split("\n").map(function(x){ return x.trim(); }).filter(Boolean), den="";
    for(var i=0;i<Math.min(righe.length,12);i++){ var r=righe[i]; if(/FRATELLI\s+BONANNO/i.test(r)) continue; if(SUFF.test(upper(r))||/\b(SRL|SPA|SNC|SAS|COOP|PILOT|ORMEGG|RIMORCH|CAPITANERIA|SOCIET)/i.test(r)){ den=r.replace(/\s{2,}.*/,"").slice(0,60); break; } SUFF.lastIndex=0; }
    if(!den) den=(righe[0]||"").slice(0,60);
    var mnum=t.match(/(?:FATTURA|INVOICE|DOCUMENTO|NOTA\s+DI\s+CREDITO)[^\n]{0,40}?(?:N\.?|NR\.?|NUMERO|NO\.?|#)\s*[:.]?\s*([A-Z0-9][A-Z0-9\/\-\.]{0,14}\d[A-Z0-9\/\-]*)/i)||t.match(/\b(?:N\.|NR\.|NUMERO)\s*[:.]?\s*([0-9][0-9A-Z\/\-\.]{0,14})/i);
    var mdat=t.match(/(?:DEL|DATA|DATE|EMESSA\s+IL)\s*[:.]?\s*(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/i)||t.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
    var tot=primoNum(/TOTALE\s+(?:DOCUMENTO|FATTURA|DA\s+PAGARE|A\s+PAGARE|GENERALE)?\s*(?:EUR|€)?\s*[:.]?\s*(?:€|EUR)?\s*(-?\d{1,3}(?:\.\d{3})*,\d{2}|-?\d+,\d{2})/i,t,true);
    if(tot===null) tot=primoNum(/(?:NETTO\s+A\s+PAGARE|IMPORTO\s+TOTALE|TOTAL)\s*(?:EUR|€)?\s*[:.]?\s*(?:€|EUR)?\s*(-?\d{1,3}(?:\.\d{3})*,\d{2}|-?\d+,\d{2})/i,t,true);
    var imp=primoNum(/(?:TOTALE\s+)?IMPONIBILE\s*(?:EUR|€)?\s*[:.]?\s*(?:€|EUR)?\s*(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2})/i,t,true);
    var iva=primoNum(/(?:TOTALE\s+)?(?:IMPOSTA|IVA)\s*(?:\d{1,2}\s*%)?\s*(?:EUR|€)?\s*[:.]?\s*(?:€|EUR)?\s*(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2})/i,t,true);
    var mperc=t.match(/(?:IVA|ALIQUOTA)\s*(\d{1,2})\s*%/i), ivaPerc=mperc?Number(mperc[1]):null;
    if(tot===null&&imp!==null&&iva!==null) tot=r2(imp+iva); if(imp===null&&tot!==null&&iva!==null) imp=r2(tot-iva);
    var nc=/NOTA\s+DI\s+CREDITO|CREDIT\s+NOTE|TD04/i.test(t), num=mnum?mnum[1].replace(/[.:]+$/,""):"", data=dataIso(mdat);
    var forn=mappaFornitore(den,piva,t), descr=righe.filter(function(x){ return /M\/[VNT]|NAVE|VESSEL|SHIP|PILOT|ORMEGG|RIMORCH|SERVIZ|PRESTAZ|CANONE|DIRITT/i.test(x); }).slice(0,3).join(" · ").slice(0,160)||righe.slice(0,2).join(" · ").slice(0,160);
    var scad=t.match(/SCADENZA[^\n]{0,30}?(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/i);
    var r={file:nomeFile,fonte:"pdf",den:den,piva:piva,forn:forn,voce:vocePerFornitore(forn,descr+" "+t.slice(0,1500)),num:num,data:data,imp:imp,ivaPerc:ivaPerc,iva:iva,rit:null,tot:nc&&tot!==null?-Math.abs(tot):tot,lordo:tot,scad:dataIso(scad),descr:descr,tipo:nc?"nc":"fattura",td:nc?"TD04":"TD01",bollo:null,testo:t.slice(0,6000),sel:true,fatto:false,err:""};
    if(!num&&data===""&&tot===null){ r.err="PDF senza dati riconoscibili"+(t.replace(/\s/g,"").length<40?" (probabile scansione: serve l'XML o la registrazione a mano)":""); return r; }
    return r; }

  /* ---- XML FatturaPA ---- */
  function estraiXml(buf){ var u8=new Uint8Array(buf), lat=""; for(var i=0;i<u8.length;i+=8192) lat+=String.fromCharCode.apply(null,u8.subarray(i,i+8192));
    var m=lat.match(/<(\w+:)?FatturaElettronica[\s>]/), a=m?lat.indexOf(m[0]):-1, x=lat.indexOf("<?xml"); if(x>=0&&(a<0||x<a)) a=x; var e=lat.lastIndexOf("FatturaElettronica>");
    if(a>=0&&e>a) return new TextDecoder("utf-8").decode(u8.subarray(a,e+"FatturaElettronica>".length));
    var t=lat.replace(/\s+/g,""); if(/^[A-Za-z0-9+\/=]+$/.test(t)&&t.length>100){ try{ var b=atob(t), u=new Uint8Array(b.length); for(var k=0;k<b.length;k++) u[k]=b.charCodeAt(k); return estraiXml(u.buffer); }catch(err){} }
    return ""; }
  function leggiXml(xml,nomeFile){ var out=[], doc; try{ doc=new DOMParser().parseFromString(xml,"text/xml"); }catch(e){ doc=null; }
    if(!doc||doc.getElementsByTagName("parsererror").length) return [{file:nomeFile,err:"XML non leggibile"}];
    var hd=doc.getElementsByTagNameNS("*","FatturaElettronicaHeader")[0], ced=hd?hd.getElementsByTagNameNS("*","CedentePrestatore")[0]:null, an=ced?ced.getElementsByTagNameNS("*","Anagrafica")[0]:null;
    var den=T(an,"Denominazione")||[T(an,"Nome"),T(an,"Cognome")].filter(Boolean).join(" "), piva=T(ced?ced.getElementsByTagNameNS("*","IdFiscaleIVA")[0]:null,"IdCodice")||T(ced,"CodiceFiscale");
    var cess=hd?hd.getElementsByTagNameNS("*","CessionarioCommittente")[0]:null, pivaCess=T(cess?cess.getElementsByTagNameNS("*","IdFiscaleIVA")[0]:null,"IdCodice")||T(cess,"CodiceFiscale"), denCess=T(cess?cess.getElementsByTagNameNS("*","Anagrafica")[0]:null,"Denominazione");
    var bodies=doc.getElementsByTagNameNS("*","FatturaElettronicaBody"); if(!bodies.length) return [{file:nomeFile,err:"nessuna fattura nel file"}];
    for(var i=0;i<bodies.length;i++){ var b=bodies[i], dg=b.getElementsByTagNameNS("*","DatiGeneraliDocumento")[0], td=T(dg,"TipoDocumento");
      var imp=0,iva=0,haRiep=false,aliq={}; var R=b.getElementsByTagNameNS("*","DatiRiepilogo"); for(var j=0;j<R.length;j++){ haRiep=true; imp+=n(T(R[j],"ImponibileImporto"))||0; iva+=n(T(R[j],"Imposta"))||0; var al=T(R[j],"AliquotaIVA"); if(al!=="") aliq[String(n(al))]=1; }
      var rit=0, RT=dg?dg.getElementsByTagNameNS("*","DatiRitenuta"):[]; for(var q=0;q<RT.length;q++) rit+=n(T(RT[q],"ImportoRitenuta"))||0;
      var totDoc=n(T(dg,"ImportoTotaleDocumento")), lordo=totDoc!==null?totDoc:r2(imp+iva), tot=r2(lordo-rit), bollo=n(T(dg,"ImportoBollo"));
      var caus=TT(dg,"Causale").join(" ").trim(), lineeTutte=TT(b.getElementsByTagNameNS("*","DatiBeniServizi")[0],"Descrizione").filter(Boolean), linee=lineeTutte, descr=(caus||linee.slice(0,3).join(" · ")).replace(/\s+/g," ").slice(0,160);
      var extra=TT(b,"RiferimentoTesto").concat(TT(b,"NumeroDDT"),TT(hd,"Note")).join(" "), testo=[caus,lineeTutte.join(" | "),extra].join(" | ");
      var scad=T(b.getElementsByTagNameNS("*","DatiPagamento")[0],"DataScadenzaPagamento"), tipo=(td==="TD04")?"nc":"fattura";
      var al2=Object.keys(aliq), forn=mappaFornitore(den,piva,testo);
      var r={file:nomeFile,fonte:"xml",den:den,piva:piva,forn:forn,voce:vocePerFornitore(forn,descr+" "+testo.slice(0,800)),num:T(dg,"Numero"),data:T(dg,"Data").slice(0,10),imp:haRiep?r2(imp):null,ivaPerc:al2.length===1?Number(al2[0]):null,iva:haRiep?r2(iva):null,rit:rit?r2(rit):null,tot:tipo==="nc"?-Math.abs(tot):tot,lordo:lordo,scad:scad,descr:descr,tipo:tipo,td:td,bollo:bollo,testo:testo.slice(0,6000),pivaCess:pivaCess,denCess:denCess,quadra:totDoc===null||!haRiep||Math.abs(totDoc-r2(imp+iva))<=0.02,sel:true,fatto:false,err:""};
      out.push(r); }
    return out; }

  /* ---- abbinamento automatico ad approdo/fornitore e controlli di coerenza ---- */
  function scaloEta(sc){ return sc.eta||sc.etd||""; }
  function cercaNaveNelTesto(t){ var m=t.match(/\bM\s*\/\s*[VNTY]\.?\s*([A-Z0-9][A-Z0-9 \-']{2,28})/i)||t.match(/\b(?:NAVE|MOTONAVE|VESSEL|SHIP|M\/N|MV)\s*[:.]?\s*([A-Z][A-Z0-9 \-']{2,28})/i); if(!m) return ""; return upper(m[1]).replace(/\s*\b(IMO|ETA|ETD|ARRIV\w*|PARTEN\w*|DEL|DAL|IN|OUT|PORTO|PORT|VOY\w*|VIAGGIO)\b.*$/,"").replace(/[^A-Z0-9 ]+/g," ").replace(/\s+/g," ").trim(); }
  function prepara(r,fornPagina){ if(r.err) return r;
    var tmp={id:"",fornitore:r.forn,numFattura:r.num,dataFattura:r.data,totale:r.tot,descrizione:r.descr,note:r.testo||""}; r.dup=doppioniDi(tmp); if(r.dup.length) r.sel=false;
    var L=listaScali(), t=" "+upper(r.testo||"").replace(/[^A-Z0-9\/]+/g," ")+" ", cand=candidatiScalo(tmp), pre="", motivo="";
    var imo=(r.testo||"").match(/IMO\s*[:.]?\s*(\d{7})/i); if(imo){ var byImo=L.filter(function(sc){ return String(sc.imo||"").replace(/\D/g,"")===imo[1]; }); if(byImo.length){ byImo.sort(function(a,b){ return Math.abs(giorni(r.data,scaloEta(a))||999)-Math.abs(giorni(r.data,scaloEta(b))||999); }); cand={lista:byImo.concat(cand.lista.filter(function(x){ return byImo.indexOf(x)<0; })),tipo:"imo",label:"Scali della nave con IMO "+imo[1]}; pre=byImo[0].id; motivo="IMO "+imo[1]+" nel testo"; } }
    if(!pre){ var mp=(r.testo||"").match(/PROT(?:OCOLLO)?\.?\s*(?:N\.?|NR\.?)?\s*[:.]?\s*(\d{1,4})\s*\/\s*(\d{2,4})/i); if(mp){ var yy=mp[2].length===2?"20"+mp[2]:mp[2]; var byProt=L.filter(function(sc){ return String(num(sc.prot))===String(Number(mp[1]))&&String(sc.annoProt||anno(scaloEta(sc)))===yy; }); if(byProt.length===1){ pre=byProt[0].id; motivo="prot. "+mp[1]+"/"+yy+" citato nella fattura"; cand={lista:byProt.concat(cand.lista.filter(function(x){ return x.id!==byProt[0].id; })),tipo:"prot",label:"Scalo con il protocollo citato"}; } } }
    if(!pre&&cand.tipo==="nave"&&cand.lista.length){ pre=cand.lista[0].id; motivo="nave "+esc(cand.lista[0].nave)+" citata nella fattura"; }
    r.naveTesto=cercaNaveNelTesto(r.testo||""); if(r.naveTesto&&!pre){ var byN=L.filter(function(sc){ var nn=upper(sc.nave||"").replace(/[^A-Z0-9 ]+/g," ").trim(); return nn&&(r.naveTesto.indexOf(nn)>=0||nn.indexOf(r.naveTesto)>=0); }); if(byN.length){ byN.sort(function(a,b){ return Math.abs(giorni(r.data,scaloEta(a))||999)-Math.abs(giorni(r.data,scaloEta(b))||999); }); pre=byN[0].id; motivo="nave "+esc(byN[0].nave)+" citata nella fattura"; cand={lista:byN.concat(cand.lista.filter(function(x){ return byN.indexOf(x)<0; })),tipo:"nave",label:"Scali della nave indicata nella fattura"}; } }
    if(!pre&&cand.tipo==="data"&&cand.lista.length){ var vo=S.cfg.voci.filter(function(v){ return v.k===r.voce; })[0], comp=[]; if(vo&&r.tot){ cand.lista.forEach(function(sc){ var p=pdaVoce(sc,vo); if(p&&p.val>0&&Math.abs(p.val-Math.abs(r.tot))/p.val<=0.25){ var gia=speseDi(sc.id).some(function(s){ return upper(s.fornitore)===upper(r.forn)&&s.tipo!=="nc"; }); if(!gia) comp.push(sc); } }); }
      if(comp.length===1){ pre=comp[0].id; motivo="unico approdo vicino alla data con PDA compatibile ("+esc(nomeVoce({voce:r.voce}))+" € "+eur(pdaVoce(comp[0],vo).val)+")"; cand.lista=comp.concat(cand.lista.filter(function(x){ return x.id!==comp[0].id; })); }
      else if(cand.lista.length===1){ pre=cand.lista[0].id; motivo="unico approdo vicino alla data"; } }
    r.cand=cand; r.pre=pre; r.motivo=motivo; if(!r.scalo) r.scalo=pre; r.fornPagina=fornPagina||""; r.controlli=controlla(r); return r; }
  function controlla(r){ var C=[], sc=S.scali[r.scalo||r.pre]; function add(c,t,tt){ C.push({c:c,t:t,tt:tt||""}); }
    if(r.dup&&r.dup.length) add("no","già registrata",r.dup.map(function(d){ var s2=S.scali[d.s.scalo]||{}; return d.m+" – "+(s2.prot?"prot. "+protLoc(s2)+" "+(s2.nave||""):"da abbinare"); }).join(" | "));
    if(r.fonte==="pdf"){ if(!r.num||!r.data||r.tot===null) add("warn","dati PDF incompleti: controlla numero, data e totale"); else add("warn","letta da PDF: verifica i dati"); if(r.pivaCess===undefined&&r.piva) add("ok","P.IVA "+r.piva); }
    if(r.fonte==="xml"){ if(r.pivaCess&&r.pivaCess!==PIVA_AZIENDA&&!/BONANNO/i.test(r.denCess||"")) add("no","intestata a "+(r.denCess||r.pivaCess)+", non a Fratelli Bonanno"); if(r.quadra===false) add("warn","totale documento diverso da imponibile + IVA"); }
    var M=(S.cfg.fe&&S.cfg.fe.piva)||{};
    if(r.fornPagina&&r.fornPagina!=="*"&&upper(r.forn)!==upper(r.fornPagina)) add("no","fattura di "+r.forn+", non di "+r.fornPagina);
    if(!fornNoto(r.forn)) add("warn","fornitore nuovo: "+r.forn+" (non è tra i fornitori delle voci)"); else if(r.piva&&M[r.piva]===r.forn) add("ok","fornitore da P.IVA già vista"); else if(r.piva&&M[r.piva]&&M[r.piva]!==r.forn) add("warn","questa P.IVA era registrata come "+M[r.piva]);
    if(!sc){ if(r.naveTesto) add("no","nave "+r.naveTesto+" citata ma nessuno scalo trovato"); else if(r.cand&&r.cand.lista.length>1) add("warn",r.cand.lista.length+" approdi possibili: scegli"); else add("no","nessun approdo abbinato"); }
    else{ if(r.motivo) add("ok",r.motivo.replace(/<[^>]+>/g,"")); var g=giorni(r.data,scaloEta(sc)); if(g!==null&&g<-10) add("warn","fattura "+Math.abs(g)+" giorni prima dell'arrivo della nave"); else if(g!==null&&g>90) add("warn","fattura "+g+" giorni dopo l'arrivo");
      if(sc.pagDir) add("warn","scalo a pagamento diretto"); var st=statoScalo(sc); if(st.t==="saldato") add("warn","scalo già saldato: il FDA andrà rivisto");
      var stessa=speseDi(sc.id).filter(function(s){ return upper(s.fornitore)===upper(r.forn)&&s.tipo!=="nc"; }); if(stessa.length) add("warn","già "+stessa.length+" fattura/e di "+r.forn+" su questo scalo (n. "+stessa.map(function(s){ return s.numFattura||"?"; }).join(", ")+")");
      var vo=S.cfg.voci.filter(function(v){ return v.k===r.voce; })[0]; if(vo&&r.tot!==null&&r.tipo!=="nc"){ var p=pdaVoce(sc,vo); if(p&&p.val>0){ var sc2=Math.abs(p.val-Math.abs(r.tot))/p.val; if(sc2>0.25) add("warn","PDA "+vo.label+" € "+eur(p.val)+", fattura € "+eur(Math.abs(r.tot))+" ("+(r.tot>p.val?"+":"-")+Math.round(sc2*100)+"%)"); else add("ok","in linea col PDA (€ "+eur(p.val)+")"); } else add("warn","voce "+vo.label+" non prevista nel PDA di questo scalo"); } }
    return C; }
  function protLoc(sc){ return sc&&sc.id?(sc.prot||"?")+"/"+String(sc.annoProt||anno(sc.eta)||"").slice(2):""; }
  function aggiornaChips(el,r){ var tr=el.closest("tr"), nx=tr&&tr.nextElementSibling, d=nx&&nx.querySelector(".fechips"); if(d) d.innerHTML='<span class="sub" style="margin-right:2px">Controlli:</span>'+(r.controlli||[]).map(chipC).join(""); }
  function chipC(c){ return '<span class="chip '+c.c+'" title="'+esc(c.tt||c.t)+'">'+esc(c.t.length>52?c.t.slice(0,50)+"…":c.t)+'</span>'; }

  /* ---- pannello ---- */
  function pannello(fornPagina){ var R=S.fe.righe, F=tuttiFornitori(), daVer=R.filter(function(r){ return !r.err&&!r.fatto&&(r.controlli||[]).some(function(c){ return c.c!=="ok"; }); }).length;
    var titolo=fornPagina&&fornPagina!=="*"?"Importa fatture di "+esc(fornPagina):"Importa fatture (XML / P7M / PDF / ZIP)";
    var h='<div class="panel" id="fePanel"><div class="panel-h"><b>'+titolo+'</b><span class="sub">XML o .p7m dello SDI, PDF della fattura, oppure una cartella .zip con tante fatture: fornitore, numero, importi e approdo si compilano da soli e le incoerenze vengono segnalate.</span><div class="spacer"></div><label class="btn primary">Scegli file o .zip <input type="file" id="feFile" accept=".xml,.p7m,.pdf,.zip,.XML,.P7M,.PDF,.ZIP,text/xml,application/xml,application/pdf,application/zip,application/x-zip-compressed,application/pkcs7-mime" multiple hidden></label>'+(R.length?'<button class="btn primary" id="feTutte">Registra le selezionate</button><button class="btn" id="feSvuota">Svuota</button>':'')+'</div>';
    if(!R.length) return h+'<div class="panel-b sub">Puoi scegliere più file insieme o un intero .zip (anche con cartelle dentro). Le fatture già registrate vengono riconosciute e lasciate deselezionate; il fornitore scelto per una partita IVA viene ricordato. I PDF vengono letti dal testo (le scansioni senza testo non si possono leggere).</div></div>';
    h+='<div class="panel-b sub" style="padding-bottom:4px">'+R.filter(function(r){ return !r.err; }).length+' fatture lette'+(daVer?' · <span class="chip warn">'+daVer+' da verificare</span>':' · <span class="chip ok">nessuna incoerenza</span>')+'</div>';
    h+='<div class="scroll"><table><thead><tr><th></th><th style="min-width:200px">Fattura</th><th style="min-width:160px">Fornitore</th><th>Voce</th><th>N. e data</th><th class="num">Totale €</th><th style="min-width:200px">Approdo</th><th></th></tr></thead><tbody>';
    R.forEach(function(r,i){ if(r.err){ h+='<tr><td></td><td colspan="7"><strong>'+esc(r.file)+'</strong> — <span class="chip no">'+esc(r.err)+'</span></td></tr>'; return; }
      var pdf=r.fonte==="pdf"&&!r.fatto;
      h+='<tr class="femain"'+(r.fatto?' style="opacity:.55"':'')+'><td>'+(r.fatto?'<span class="chip ok">registrata</span>':'<input type="checkbox" data-fesel="'+i+'"'+(r.sel?' checked':'')+' aria-label="Importa">')+'</td>'+
        '<td class="voci-td" style="min-width:190px;max-width:240px"><strong>'+esc(r.den)+'</strong><div class="sub" title="'+esc(r.file)+'">'+(r.fonte==="pdf"?"PDF":"XML SDI")+(r.td&&r.td!=="TD01"?" · "+esc(r.td)+(r.tipo==="nc"?" nota di credito":""):"")+(r.piva?" · P.IVA "+esc(r.piva):"")+' · '+esc(r.file.length>30?"…"+r.file.slice(-28):r.file)+'</div>'+(r.descr?'<div class="sub" style="white-space:normal">'+esc(r.descr)+(r.bollo?' · bollo € '+eur(r.bollo):'')+'</div>':'')+'</td>'+
        '<td>'+(r.fatto?esc(r.forn):'<input data-feforn="'+i+'" list="dl_feforn" value="'+esc(r.forn)+'" style="width:135px">')+'</td>'+
        '<td>'+(r.fatto?esc(nomeVoce({voce:r.voce})):'<select data-fevoce="'+i+'" style="min-width:140px;max-width:170px">'+S.cfg.voci.map(function(v){ return opt(v.k,v.label,r.voce); }).join("")+'</select>')+'</td>'+
        '<td class="nw">'+(pdf?'<input data-fenum="'+i+'" value="'+esc(r.num)+'" style="width:90px" placeholder="n."><br><input type="date" data-fedata="'+i+'" value="'+esc(r.data)+'" style="margin-top:4px">':'<strong>'+esc(r.num||"—")+'</strong><div class="sub">'+dIt(r.data)+'</div>')+(r.scad?'<div class="sub">scad. '+dIt(r.scad)+'</div>':'')+'</td>'+
        '<td class="num">'+(pdf?'<input data-fetot="'+i+'" value="'+(r.tot!==null?eur(r.tot):"")+'" style="width:100px;text-align:right">':'<strong>'+eur(r.tot)+'</strong>')+'<div class="sub" style="font-family:inherit">'+(r.imp!==null?"imp. "+eur(r.imp):"")+(r.iva!==null?" · IVA "+eur(r.iva)+(r.ivaPerc!==null?" ("+r.ivaPerc+"%)":""):"")+(r.rit?" · rit. "+eur(r.rit):"")+'</div></td>'+
        '<td>'+(r.fatto?(r.scaloNome||'<span class="chip warn">da abbinare</span>'):'<select data-fesc="'+i+'" aria-label="Approdo" style="max-width:210px">'+optScali(r.scalo||r.pre,r.cand)+'</select>'+(r.motivo?'<div class="sub" style="white-space:normal">'+r.motivo+'</div>':''))+'</td>'+
        '<td>'+(r.fatto?'':'<button class="btn small primary" data-fereg="'+i+'">Registra</button>')+'</td></tr>'+
        '<tr class="fectrl"><td style="border-top:0"></td><td colspan="7" style="padding-top:0;border-top:0"><div class="fechips" style="display:flex;flex-wrap:wrap;gap:4px;align-items:center"><span class="sub" style="margin-right:2px">Controlli:</span>'+(r.controlli||[]).map(chipC).join("")+'</div></td></tr>'; });
    var sel=R.filter(function(r){ return !r.err&&!r.fatto&&r.sel; }), t=0; sel.forEach(function(r){ t+=r.tot||0; });
    h+='</tbody><tfoot><tr><td colspan="5">'+sel.length+' fatture selezionate</td><td class="num">'+eur(t)+'</td><td colspan="2"></td></tr></tfoot></table></div>'+datalist("dl_feforn",F)+'</div>';
    return h; }
  function leggiRiga(i){ var r=S.fe.righe[i]; if(!r||r.err) return r; var q=function(a){ return document.querySelector('[data-'+a+'="'+i+'"]'); }, f=q("feforn"), v=q("fevoce"), s=q("fesc"), c=q("fesel"), nu=q("fenum"), da=q("fedata"), to=q("fetot");
    if(f) r.forn=upper(f.value); if(v) r.voce=v.value; if(s) r.scalo=s.value; if(c) r.sel=c.checked; if(nu) r.num=nu.value.trim(); if(da) r.data=da.value; if(to){ var x=nIt(to.value); if(x!==null) r.tot=r.tipo==="nc"?-Math.abs(x):x; }
    r.controlli=controlla(r); return r; }
  async function registra(i){ var r=leggiRiga(i); if(!r||r.err||r.fatto) return false; if(!r.forn){ avviso("Indica il fornitore."); return false; } if(r.tot===null){ avviso("Manca il totale della fattura."); return false; }
    var e={id:nuovoId("sp"),scalo:(r.scalo&&S.scali[r.scalo])?r.scalo:"",fornitore:r.forn,voce:r.voce||vocePerFornitore(r.forn,r.descr),voceLibera:"",numFattura:r.num,dataFattura:r.data,scadenza:r.scad||"",tipo:r.tipo,imponibile:r.imp,ivaPerc:r.ivaPerc,iva:r.iva,ritenuta:r.rit,totale:r.tot,descrizione:r.descr,dataPagamento:"",modo:"",note:(r.fonte==="pdf"?"da PDF: ":"da XML SDI: ")+r.file+(r.den&&upper(r.den)!==r.forn?" ("+r.den+")":"")+((r.controlli||[]).filter(function(c){ return c.c!=="ok"; }).length?" · da verificare: "+(r.controlli||[]).filter(function(c){ return c.c!=="ok"; }).map(function(c){ return c.t; }).join("; "):""),allegato:"",pagamenti:[]};
    if(r.piva&&r.forn){ S.cfgRaw.fe=S.cfgRaw.fe||{}; S.cfgRaw.fe.piva=S.cfgRaw.fe.piva||{}; if(S.cfgRaw.fe.piva[r.piva]!==r.forn){ S.cfgRaw.fe.piva[r.piva]=r.forn; S.cfg.fe=S.cfg.fe||{}; S.cfg.fe.piva=S.cfgRaw.fe.piva; try{ await scriviCfg(); }catch(err){} } }
    await scriviSpesa(e); r.fatto=true; r.id=e.id; var sc=S.scali[e.scalo]; r.scaloNome=sc?esc((sc.prot||"?")+" "+(sc.nave||"")):""; return true; }
  async function leggiUno(nome,buf,righe){ try{
      if(/\.zip$/i.test(nome)){ var voci=await leggiZip(buf,nome+"/"); for(var i=0;i<voci.length;i++){ if(voci[i].err) righe.push({file:voci[i].name,err:voci[i].err}); else await leggiUno(voci[i].name,voci[i].buf,righe); } return; }
      if(/\.pdf$/i.test(nome)){ var pd=await testoPdf(buf); if(pd.xml){ var rx=leggiXml(pd.xml,nome); rx.forEach(function(r){ if(!r.err) r.fonte="xml"; }); righe.push.apply(righe,rx); } else righe.push(leggiPdfTesto(pd.testo,nome)); return; }
      var xml=estraiXml(buf); if(!xml) righe.push({file:nome,err:"non contiene una fattura elettronica"}); else righe.push.apply(righe,leggiXml(xml,nome));
    }catch(e){ righe.push({file:nome,err:e.message||"errore di lettura"}); } }
  async function leggiFiles(files){ var righe=[], fornPagina=S.view==="fornitori"?(S.forn||""):""; avviso("Lettura in corso…");
    for(var i=0;i<files.length;i++){ var f=files[i]; try{ await leggiUno(f.name,await f.arrayBuffer(),righe); }catch(e){ righe.push({file:f.name,err:e.message||"errore di lettura"}); } }
    righe.forEach(function(r){ if(r.err) return; if(fornPagina&&fornPagina!=="*"&&!isNsNome(fornPagina)&&!fornNoto(r.forn)){ r.forn=fornPagina; r.voce=vocePerFornitore(r.forn,r.descr); } prepara(r,fornPagina); });
    S.fe.righe=S.fe.righe.filter(function(r){ return !r.fatto; }).concat(righe); render(); var ok=righe.filter(function(r){ return !r.err; }).length, ver=righe.filter(function(r){ return !r.err&&(r.controlli||[]).some(function(c){ return c.c!=="ok"; }); }).length;
    avviso(ok+" fatture lette"+(righe.length-ok?", "+(righe.length-ok)+" file non riconosciuti":"")+(ver?" · "+ver+" da verificare":"")+"."); }

  var _vf=window.vistaFatture;
  window.vistaFatture=function(){ var h=_vf(); var k='<div class="panel"><div class="panel-h"><b>2. Abbina'; var i=h.indexOf(k); var p=pannello(""); return i>=0? h.slice(0,i)+p+h.slice(i) : h+p; };
  var _vforn=window.vistaFornitori;
  window.vistaFornitori=function(){ var h=_vforn(); if(S.forn&&isNsNome(S.forn)) return h; var k='<input id="ecQ"', i=h.indexOf(k); if(i<0) return h; var j=h.lastIndexOf('<div class="panel">',i); if(j<0) return h; return h.slice(0,j)+pannello(S.forn||"")+h.slice(j); };
  var _ev=window.eventi;
  window.eventi=function(){ _ev(); if(S.view!=="fatture"&&S.view!=="fornitori") return; if(!document.getElementById("fePanel")) return;
    on("feFile","change",function(){ if(this.files&&this.files.length) leggiFiles(Array.prototype.slice.call(this.files)); });
    on("feSvuota","click",function(){ S.fe.righe=[]; render(); });
    on("feTutte","click",async function(){ var R=S.fe.righe, k=0; for(var i=0;i<R.length;i++){ leggiRiga(i); } for(var j=0;j<R.length;j++){ if(R[j].err||R[j].fatto||!R[j].sel) continue; if(await registra(j)) k++; } render(); avviso(k+" fatture registrate."+(k?" Quelle senza approdo sono al passo 2 della pagina Fatture.":"")); });
    document.querySelectorAll("[data-fereg]").forEach(function(b){ b.addEventListener("click",async function(){ var i=parseInt(b.getAttribute("data-fereg"),10); for(var j=0;j<S.fe.righe.length;j++) leggiRiga(j); if(await registra(i)){ render(); avviso("Fattura registrata."); } }); });
    document.querySelectorAll("[data-fesel]").forEach(function(c){ c.addEventListener("change",function(){ S.fe.righe[parseInt(c.getAttribute("data-fesel"),10)].sel=c.checked; }); });
    document.querySelectorAll("[data-fesc],[data-fenum],[data-fedata],[data-fetot]").forEach(function(x){ x.addEventListener("change",function(){ var i=parseInt(x.getAttribute("data-fesc")||x.getAttribute("data-fenum")||x.getAttribute("data-fedata")||x.getAttribute("data-fetot"),10); leggiRiga(i); aggiornaChips(x,S.fe.righe[i]); }); });
    document.querySelectorAll("[data-feforn]").forEach(function(f){ f.addEventListener("change",function(){ var i=parseInt(f.getAttribute("data-feforn"),10), r=S.fe.righe[i]; r.forn=upper(f.value); var v=document.querySelector('[data-fevoce="'+i+'"]'); if(v){ var k=vocePerFornitore(r.forn,r.descr); if(k!=="other") v.value=k; r.voce=v.value; } leggiRiga(i); aggiornaChips(f,r); }); });
  };
  window.PortolanoFE={leggiXml:leggiXml,estraiXml:estraiXml,mappaFornitore:mappaFornitore,leggiZip:leggiZip,leggiPdfTesto:leggiPdfTesto,pdfTestoLocale:pdfTestoLocale,testoPdf:testoPdf,prepara:prepara,controlla:controlla};
})();
