/* ---------- firma dell'agente da file (PDF o immagine) ----------
   Dal file ricava la sola firma: toglie il bianco, ritaglia sull'inchiostro e la salva come maschera a 1 bit
   compressa (PackBits, lo stesso formato RunLengthDecode dei PDF) con il colore dell'inchiostro: pochi KB,
   fondo trasparente, nitida in stampa. Formato: {w,h,rle (base64),ink '#rrggbb'}. */
var FirmaLib=(function(){
  const PDFJS='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
  const MAXW=720,MAXH=320,LATO=2200;
  const err=m=>{const e=new Error(m);e.firma=true;return e;};
  const chiave=n=>String(n||'').trim().toUpperCase().replace(/[^A-Z0-9]+/g,'_').replace(/^_+|_+$/g,'');
  const b64=u=>{let s='';for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return btoa(s);};
  const unb64=s=>{const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u;};
  const rgb=h=>{const m=/^#?([0-9a-f]{6})$/i.exec(h||'')||[0,'14143c'],n=parseInt(m[1],16);return [(n>>16&255),(n>>8&255),(n&255)];};
  function pack(u){ // PackBits con byte finale 128 (EOD)
    const o=[];let i=0;const n=u.length;
    while(i<n){
      let r=1;while(i+r<n&&r<128&&u[i+r]===u[i])r++;
      if(r>=2){o.push(257-r,u[i]);i+=r;continue;}
      const s=i;i++;
      while(i<n&&i-s<128&&!(i+1<n&&u[i]===u[i+1]))i++;
      o.push(i-s-1);for(let j=s;j<i;j++)o.push(u[j]);
    }
    o.push(128);return Uint8Array.from(o);
  }
  function unpack(p,n){
    const o=new Uint8Array(n);let i=0,k=0;
    while(i<p.length&&k<n){const c=p[i++];if(c===128)break;
      if(c<128){for(let j=0;j<=c&&k<n;j++)o[k++]=p[i++];}
      else{const v=p[i++];for(let j=0;j<257-c&&k<n;j++)o[k++]=v;}}
    return o;
  }
  function script(src,ms){return new Promise((ok,no)=>{const s=document.createElement('script');const t=setTimeout(()=>{s.remove();no(new Error('tempo scaduto'));},ms);s.onload=()=>{clearTimeout(t);ok();};s.onerror=()=>{clearTimeout(t);s.remove();no(new Error('non caricato'));};s.src=src;document.head.appendChild(s);});}
  let pdfjsP=null;
  function pdfjs(){
    if(!pdfjsP)pdfjsP=(async()=>{if(!window.pdfjsLib)await script(PDFJS+'pdf.min.js',15000);const L=window.pdfjsLib;if(!L)throw new Error('pdf.js assente');if(!L.GlobalWorkerOptions.workerSrc)L.GlobalWorkerOptions.workerSrc=PDFJS+'pdf.worker.min.js';return L;})().catch(e=>{pdfjsP=null;throw e;});
    return pdfjsP;
  }
  function tela(w,h){const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w));c.height=Math.max(1,Math.round(h));const x=c.getContext('2d',{willReadFrequently:true});x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);return [c,x];}
  async function daPdfJs(u8){
    const L=await pdfjs(),doc=await L.getDocument({data:u8.slice()}).promise,pg=await doc.getPage(1),v0=pg.getViewport({scale:1});
    const vp=pg.getViewport({scale:Math.min(5,LATO/Math.max(v0.width,v0.height))}),[c,x]=tela(vp.width,vp.height);
    await pg.render({canvasContext:x,viewport:vp}).promise;try{doc.destroy();}catch(e){}
    return c;
  }
  function caricaImg(blob){return new Promise((ok,no)=>{const u=URL.createObjectURL(blob),im=new Image();im.onload=()=>{const k=Math.min(1,LATO/Math.max(im.naturalWidth,im.naturalHeight)||1),[c,x]=tela(im.naturalWidth*k,im.naturalHeight*k);x.drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);ok(c);};im.onerror=()=>{URL.revokeObjectURL(u);no(new Error('immagine non leggibile'));};im.src=u;});}
  function jpegNelPdf(u8){ // senza Internet: la scansione dentro al PDF e' quasi sempre un JPEG (DCTDecode), si prende il piu' grande
    const idx=(pat,from,to)=>{o:for(let i=from;i<=to-pat.length;i++){for(let j=0;j<pat.length;j++)if(u8[i+j]!==pat[j])continue o;return i;}return -1;};
    const A=s=>Array.from(s).map(c=>c.charCodeAt(0)),DCT=A('/DCTDecode'),ST=A('stream'),EN=A('endstream');
    let best=null,p=0;
    for(;;){const d=idx(DCT,p,u8.length);if(d<0)break;const s=idx(ST,d,Math.min(u8.length,d+2000));p=d+10;if(s<0)continue;
      let a=s+6;if(u8[a]===13)a++;if(u8[a]===10)a++;const e=idx(EN,a,u8.length);if(e<0)break;
      if(u8[a]===0xFF&&u8[a+1]===0xD8&&(!best||e-a>best.length))best=u8.subarray(a,e);p=e;}
    return best?new Blob([best],{type:'image/jpeg'}):null;
  }
  function estrai(src){
    const W=src.width,H=src.height,d=src.getContext('2d',{willReadFrequently:true}).getImageData(0,0,W,H).data,N=W*H;
    const lum=new Uint8Array(N),hist=new Uint32Array(256);
    for(let i=0,j=0;i<N;i++,j+=4){const a=d[j+3]/255,l=(255+(d[j]-255)*a)*0.299+(255+(d[j+1]-255)*a)*0.587+(255+(d[j+2]-255)*a)*0.114;lum[i]=l;hist[lum[i]]++;}
    let acc=0,bg=255;for(let v=255;v>=0;v--){acc+=hist[v];if(acc>=N/2){bg=v;break;}}
    const inv=bg<110;if(inv){for(let i=0;i<N;i++)lum[i]=255-lum[i];bg=255-bg;}   // firma chiara su fondo scuro
    const thr=bg-Math.max(38,bg*0.22),mx=Math.round(W*0.012),my=Math.round(H*0.012),rows=new Uint32Array(H),cols=new Uint32Array(W);
    let tot=0;for(let y=my;y<H-my;y++){const o=y*W;for(let x=mx;x<W-mx;x++)if(lum[o+x]<thr){rows[y]++;cols[x]++;tot++;}}
    if(tot<60)throw err('In questo file non trovo una firma: serve la sola firma, scura su fondo bianco.');
    if(tot>N*0.35)throw err('Il file è troppo scuro o pieno: serve la sola firma su fondo bianco.');
    const taglia=(v,n)=>{const lim=Math.max(2,tot*0.0015);let a=0,s=0;while(a<n&&s+v[a]<lim)s+=v[a++];let b=n-1;s=0;while(b>a&&s+v[b]<lim)s+=v[b--];return [a,b];};
    let [x0,x1]=taglia(cols,W),[y0,y1]=taglia(rows,H);
    const px=Math.round((x1-x0)*0.03)+3,py=Math.round((y1-y0)*0.05)+3;x0=Math.max(0,x0-px);x1=Math.min(W-1,x1+px);y0=Math.max(0,y0-py);y1=Math.min(H-1,y1+py);
    const cw=x1-x0+1,ch=y1-y0+1,k=Math.min(1,MAXW/cw,MAXH/ch),w=Math.max(8,Math.round(cw*k)),h=Math.max(4,Math.round(ch*k)),[c,x]=tela(w,h);
    x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(src,x0,y0,cw,ch,0,0,w,h);
    const t=x.getImageData(0,0,w,h).data,rb=Math.ceil(w/8),bits=new Uint8Array(rb*h),thr2=bg-Math.max(30,bg*0.16);let r=0,g=0,b=0,n=0;
    for(let y=0;y<h;y++)for(let xx=0;xx<w;xx++){const j=(y*w+xx)*4;let l=t[j]*0.299+t[j+1]*0.587+t[j+2]*0.114;if(inv)l=255-l;if(l<thr2){bits[y*rb+(xx>>3)]|=128>>(xx&7);if(l<thr){r+=t[j];g+=t[j+1];b+=t[j+2];n++;}}}
    if(!n){r=g=b=20;n=1;}r/=n;g/=n;b/=n;if(inv){r=g=b=20;}
    const L=r*0.299+g*0.587+b*0.114,f=L>55?55/L:1,hx=v=>Math.max(0,Math.min(255,Math.round(v*f))).toString(16).padStart(2,'0');
    return {w,h,rle:b64(pack(bits)),ink:'#'+hx(r)+hx(g)+hx(b)};
  }
  async function daFile(file){
    if(!file)throw err('Nessun file scelto.');
    if(file.size>15e6)throw err('File troppo grande (massimo 15 MB).');
    const pdf=/pdf$/i.test(file.type)||/\.pdf$/i.test(file.name||'');
    if(!pdf){let c;try{c=await caricaImg(file);}catch(e){throw err('Formato non riconosciuto: carica un PDF oppure un\'immagine JPG o PNG.');}return estrai(c);}
    const u8=new Uint8Array(await file.arrayBuffer());
    if(String.fromCharCode.apply(null,u8.subarray(0,1024)).indexOf('%PDF')<0)throw err('Il file non è un PDF valido.');
    let c=null;
    try{c=await daPdfJs(u8);}catch(e){c=null;}
    if(!c){const j=jpegNelPdf(u8);if(j){try{c=await caricaImg(j);}catch(e){c=null;}}}
    if(!c)throw err('Per leggere questo PDF serve la connessione a Internet (solo al momento del caricamento). In alternativa carica la firma come immagine JPG o PNG.');
    return estrai(c);
  }
  const cache=new Map();
  function png(f){ // immagine a fondo trasparente per l'anteprima
    if(!f||!f.rle)return '';const key=f.rle+f.ink;if(cache.has(key))return cache.get(key);
    const rb=Math.ceil(f.w/8),bits=unpack(unb64(f.rle),rb*f.h),c=document.createElement('canvas');c.width=f.w;c.height=f.h;
    const x=c.getContext('2d'),im=x.createImageData(f.w,f.h),[r,g,b]=rgb(f.ink);
    for(let y=0;y<f.h;y++)for(let xx=0;xx<f.w;xx++)if(bits[y*rb+(xx>>3)]&(128>>(xx&7))){const j=(y*f.w+xx)*4;im.data[j]=r;im.data[j+1]=g;im.data[j+2]=b;im.data[j+3]=255;}
    x.putImageData(im,0,0);const u=c.toDataURL('image/png');if(cache.size>24)cache.clear();cache.set(key,u);return u;
  }
  const valida=f=>!!(f&&f.rle&&f.w>0&&f.h>0&&f.w<=4000&&f.h<=4000&&/^[A-Za-z0-9+/=]+$/.test(f.rle));
  return {chiave,daFile,estrai,png,rgb,valida,pack,unpack,b64,unb64};
})();

/* ---------- Portolano: timbro tondo e firma dell'agente su PDA e FDA ---------- */
function timbroCfg(){ var t=S.cfg&&S.cfg.timbro; return t||CFG_DEFAULT.timbro; }
function firmaDiAgente(n){ var f=(timbroCfg().firme||{})[FirmaLib.chiave(n)]; return FirmaLib.valida(f)?f:null; }
function agentiFirme(){ var L=(S.cfg.liste&&S.cfg.liste.agenti||[]).slice(), f=S.cfg.ag.firmatario; if(f&&!L.some(function(x){ return FirmaLib.chiave(x)===FirmaLib.chiave(f); })) L.push(f); return L.filter(Boolean); }
var _timbroN=0;
/* timbro tondo disegnato: proporzioni prese dalla scansione del timbro vero (cerchio esterno spesso r 48, cerchio sottile r 43.5,
   cerchio interno r 29.9, logo con l'Etna largo 51.6 e alto 30 centrato a y 45, «- CATANIA -» sotto il logo, scritte ad arco grandi) */
function timbroSvg(){ var t=timbroCfg(), c=t.colore||"#293a8c", id="tb"+(++_timbroN), righe=Array.isArray(t.righe)?t.righe:["- CATANIA -"], sopra=t.sopra||"FRATELLI BONANNO", sotto=t.sotto||"SHIPPING AGENTS";
  var logo=t.logo===false?"":(typeof LOGO_TIMBRO!=="undefined"&&LOGO_TIMBRO)?LOGO_TIMBRO:(typeof LOGO_BONANNO!=="undefined"?LOGO_BONANNO:"");
  var lenSopra=Math.min(120,Math.round(sopra.length*7.4)), lenSotto=Math.min(92,Math.round(sotto.length*6.2));
  return '<svg class="timbro-svg" viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="'+esc(c)+'"><circle cx="50" cy="50" r="47" stroke-width="2.1"/><circle cx="50" cy="50" r="43.5" stroke-width="0.8"/><circle cx="50" cy="50" r="29.9" stroke-width="1.3"/><path id="'+id+'t" d="M 18.5 61.5 A 33.5 33.5 0 1 1 81.5 61.5"/><path id="'+id+'b" d="M 11.9 63.9 A 40.5 40.5 0 0 0 88.1 63.9"/></g>'+
    (logo?'<image href="'+logo+'" x="24.2" y="30.3" width="51.6" height="30" preserveAspectRatio="xMidYMid meet"/>':"")+
    '<g fill="'+esc(c)+'" font-family="Helvetica,Arial,sans-serif" font-weight="700"><text font-size="9" textLength="'+lenSopra+'" lengthAdjust="spacing"><textPath href="#'+id+'t" startOffset="50%" text-anchor="middle">'+esc(sopra)+'</textPath></text><text font-size="9" textLength="'+lenSotto+'" lengthAdjust="spacing"><textPath href="#'+id+'b" startOffset="50%" text-anchor="middle">'+esc(sotto)+'</textPath></text>'+righe.map(function(r,i){ return '<text x="50" y="'+(68.6+i*6.5)+'" font-size="5.8" letter-spacing=".1" text-anchor="middle">'+esc(r)+'</text>'; }).join("")+'</g></svg>'; }
function timbroHtml(){ var t=timbroCfg(); return t.immagine?'<img class="timbro-img" src="'+t.immagine+'" alt="">':timbroSvg(); }
function firmaImgHtml(n){ var f=firmaDiAgente(n); return f?'<img class="firma-img" src="'+FirmaLib.png(f)+'" alt="Firma '+esc(n)+'">':""; }
function agenteFirmatario(sc,mode){ return String((mode==="fda"&&sc.fda&&sc.fda.agente)||sc.agente||S.cfg.ag.firmatario||"").trim(); }
function timbroSulDoc(sc,mode){ var t=timbroCfg(); if(t.attivo===false||sc.firma==="no") return false; var d=t.documenti||{}; return mode==="fda"?d.fda!==false:d.pda!==false; }
function sigboxHtml(nome,conFirma){ var t=timbroCfg(); return '<div class="sigbox" style="--tdia:'+(num(t.diametro)||27)+'mm;--trot:'+(num(t.rotazione)===null?-7:num(t.rotazione))+'deg;--top:'+(num(t.opacita)||0.9)+';--tdx:'+(num(t.dx)||0)+'mm;--tdy:'+(num(t.dy)||0)+'mm">'+timbroHtml()+(conFirma?firmaImgHtml(nome):"")+'</div>'; }
function bloccoFirma(sc,mode,T){ var ag=agenteFirmatario(sc,mode), st=timbroSulDoc(sc,mode), t=timbroCfg();
  return '<div class="firma"><div>'+T.agent+': '+esc(ag)+'</div><div class="sig">'+(st?sigboxHtml(ag,t.firmaAgente!==false):"")+'<div class="l">'+esc(T.sign)+'<br><b>'+esc(ag)+'</b></div></div></div>'; }

/* ---- Impostazioni → Timbro e firme ---- */
function impostazioniTimbro(C){ var t=C.timbro||CFG_DEFAULT.timbro, d=t.documenti||{}, h="";
  h+='<h3>Timbro</h3><p class="sub" style="max-width:72ch">Il timbro tondo (FRATELLI BONANNO · SHIPPING AGENTS · CATANIA con il logo) e la firma dell\'agente compaiono in fondo a PDA e FDA, sopra la riga della firma. Scalo per scalo si può togliere da <strong>Intestazione → Timbro e firma sul documento</strong>.</p>';
  h+='<div class="grid" style="margin:8px 0 14px"><div class="field full"><label>Dove</label><div class="acts">'+[["attivo","timbro sui documenti"],["pda","sul PDA"],["fda","sul FDA"],["firmaAgente","firma dell\'agente sopra il timbro"]].map(function(x){ var v=x[0]==="pda"||x[0]==="fda"?d[x[0]]!==false:t[x[0]]!==false; return '<label><input type="checkbox" id="t_'+x[0]+'" style="width:auto"'+(v?" checked":"")+'> '+x[1]+'</label>'; }).join("")+'</div></div>'+
    campo("t_diametro","Diametro (mm)",t.diametro==null?27:t.diametro,"number")+campo("t_rotazione","Inclinazione (gradi)",t.rotazione==null?-7:t.rotazione,"number")+campo("t_opacita","Opacità (0,1 – 1)",t.opacita==null?0.9:t.opacita,"number")+campo("t_colore","Colore del timbro disegnato",t.colore||"#293a8c","color")+
    campo("t_sopra","Testo in alto",t.sopra||"FRATELLI BONANNO")+campo("t_sotto","Testo in basso",t.sotto||"SHIPPING AGENTS")+campo("t_righe","Righe al centro (virgola)",(Array.isArray(t.righe)?t.righe:["- CATANIA -"]).join(", "))+
    '<div class="field w2"><label for="t_img">Immagine del timbro (facoltativa, PNG con fondo trasparente o JPG)</label><input id="t_img" type="file" accept="image/*">'+(t.immagine?'<span class="sub">immagine caricata · <button class="btn lnk" id="t_imgDel" type="button">torna al timbro disegnato</button></span>':'<span class="sub">in uso il timbro disegnato dal programma; carica un file solo per usare la scansione del timbro vero</span>')+'</div></div>';
  h+='<div class="acts"><button class="btn primary" id="salvaTimbro">Salva timbro</button><span class="sub">Anteprima qui sotto, per ogni agente.</span></div>';
  h+='<h3 style="margin-top:18px">Firme degli agenti</h3><p class="sub" style="max-width:72ch">Per ogni agente carica un PDF (o una foto JPG/PNG) con la sola firma, scura su fondo bianco: il programma toglie il bianco, la ritaglia e la usa da sola sui documenti dello scalo di quell\'agente. Gli agenti sono quelli di <strong>Liste → Agenti</strong>.</p>';
  h+='<div class="firme" style="margin-top:8px">'+agentiFirme().map(function(n,i){ var f=firmaDiAgente(n); return '<div class="frow"><div class="fprev"><div class="firma"><div class="sig">'+sigboxHtml(n,true)+'<div class="l">'+esc("For "+S.cfg.ag.nomeBreve)+'<br><b>'+esc(n)+'</b></div></div></div></div><div class="sub"><strong>'+esc(n)+'</strong> · '+(f?"firma caricata":"nessuna firma: solo timbro e nome")+'</div><div class="acts"><button class="btn small" data-firma-up="'+i+'" type="button">'+(f?"Sostituisci firma":"Carica firma (PDF o foto)")+'</button>'+(f?'<button class="btn small danger" data-firma-del="'+i+'" type="button">Togli firma</button>':"")+'</div></div>'; }).join("")+'</div>';
  h+='<input type="file" id="firmaFile" accept=".pdf,application/pdf,image/png,image/jpeg" hidden>';
  h+='<h3 style="margin-top:18px">Da Pratiche di Scalo</h3><div class="acts" style="margin-top:6px"><label class="btn">Importa timbro e firme (TIMBRO_BONANNO_*.json) <input type="file" id="impTimbro" accept=".json" hidden></label><span class="sub">il file si crea in Pratiche di Scalo da Archivio e tariffe → Timbro e firme degli agenti → <em>Esporta timbro e firme per Portolano</em></span></div>';
  return h; }
function leggiTimbroForm(){ var t=Object.assign({},S.cfg.timbro||CFG_DEFAULT.timbro); t.attivo=val("t_attivo"); t.documenti={pda:val("t_pda"),fda:val("t_fda")}; t.firmaAgente=val("t_firmaAgente");
  t.diametro=num(val("t_diametro"))||27; t.rotazione=num(val("t_rotazione"))===null?-7:num(val("t_rotazione")); t.opacita=Math.min(1,Math.max(0.1,num(val("t_opacita"))||0.9)); t.colore=val("t_colore")||"#293a8c"; t.sopra=val("t_sopra"); t.sotto=val("t_sotto"); t.righe=val("t_righe").split(",").map(function(x){ return x.trim(); }).filter(Boolean); return t; }
function eventiTimbro(){
  on("salvaTimbro","click",async function(){ var t=leggiTimbroForm(); var f=document.getElementById("t_img"); if(f&&f.files&&f.files[0]){ t.immagine=await new Promise(function(res){ var r=new FileReader(); r.onload=function(){ res(String(r.result)); }; r.readAsDataURL(f.files[0]); }); if(t.immagine.length>400000){ avviso("Immagine del timbro troppo grande (max ~300 KB)."); t.immagine=S.cfg.timbro.immagine||""; } }
    S.cfgRaw.timbro=t; await scriviCfg(); avviso("Timbro salvato."); render(); });
  on("t_imgDel","click",async function(){ S.cfgRaw.timbro=Object.assign({},S.cfg.timbro,{immagine:""}); await scriviCfg(); render(); });
  document.querySelectorAll("[data-firma-up]").forEach(function(b){ b.addEventListener("click",function(){ S.firmaI=parseInt(b.getAttribute("data-firma-up"),10); var i=document.getElementById("firmaFile"); if(i){ i.value=""; i.click(); } }); });
  document.querySelectorAll("[data-firma-del]").forEach(function(b){ b.addEventListener("click",async function(){ var n=agentiFirme()[parseInt(b.getAttribute("data-firma-del"),10)]; if(!n) return; if(!confirm("Togliere la firma di "+n+"?")) return; var t=clone(S.cfg.timbro); t.firme=t.firme||{}; delete t.firme[FirmaLib.chiave(n)]; S.cfgRaw.timbro=t; await scriviCfg(); render(); avviso("Firma di "+n+" tolta."); }); });
  on("firmaFile","change",async function(){ var file=this.files&&this.files[0], n=agentiFirme()[S.firmaI]; this.value=""; if(!file||!n) return; avviso("Lettura della firma in corso…");
    try{ var r=await FirmaLib.daFile(file); var t=clone(S.cfg.timbro); t.firme=t.firme||{}; t.firme[FirmaLib.chiave(n)]=Object.assign({nome:n},r); S.cfgRaw.timbro=t; await scriviCfg(); render(); avviso("Firma di "+n+" caricata: compare su PDA e FDA dei suoi scali."); }
    catch(err){ avviso(err&&err.firma?err.message:"Non riesco a leggere la firma da questo file."); } });
  on("impTimbro","change",function(){ leggiFile(this,async function(txt){ var j; try{ j=JSON.parse(txt); }catch(e){ avviso("File non valido."); return; } if(!j||j.tipo!=="timbro-bonanno"||!j.timbro){ avviso("Non è un file TIMBRO_BONANNO di Pratiche di Scalo."); return; }
    var t=clone(S.cfg.timbro), q=j.timbro, n=0; t.firme=t.firme||{}; for(var k in (q.firme||{})){ var f=q.firme[k]; if(FirmaLib.valida(f)){ t.firme[FirmaLib.chiave(f.nome||k)]={nome:f.nome||k,w:f.w,h:f.h,rle:f.rle,ink:f.ink||"#14143c"}; n++; } }
    if(q.testoSopra) t.sopra=q.testoSopra; if(q.testoSotto) t.sotto=q.testoSotto; if(Array.isArray(q.righe)&&q.righe.length) t.righe=q.righe; if(q.colore) t.colore=q.colore; if(q.rotazione!=null) t.rotazione=q.rotazione; if(q.opacita!=null) t.opacita=q.opacita; if(q.diametroMm) t.diametro=q.diametroMm;
    S.cfgRaw.timbro=t; await scriviCfg(); render(); avviso(n+" firme importate da Pratiche di Scalo."); }); }); }
