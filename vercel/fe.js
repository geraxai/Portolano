/* ---------- Portolano: importazione fatture elettroniche (XML FatturaPA / .p7m dallo SDI) ---------- */
(function(){
  "use strict";
  S.fe=S.fe||{righe:[]};
  var SUFF=/\b(S\.?R\.?L\.?S?|S\.?P\.?A\.?|S\.?A\.?S\.?|S\.?N\.?C\.?|S\.?C\.?A\.?R\.?L\.?|SOC(IETA'?|\.)?\s*COOP(ERATIVA|\.)?|A\s*R\.?L\.?|SOCIETA'?|UNIPERSONALE|DI\s+NAVIGAZIONE)\b/g;
  function T(el,name){ if(!el) return ""; var l=el.getElementsByTagNameNS("*",name); return l.length?String(l[0].textContent||"").trim():""; }
  function TT(el,name){ var out=[]; if(!el) return out; var l=el.getElementsByTagNameNS("*",name); for(var i=0;i<l.length;i++) out.push(String(l[i].textContent||"").trim()); return out; }
  function n(v){ if(v===""||v===null||v===undefined) return null; var x=Number(String(v).replace(",",".")); return isNaN(x)?null:r2(x); }
  function pulisciNome(d){ return upper(d).replace(SUFF," ").replace(/[^A-Z0-9&' ]+/g," ").replace(/\s+/g," ").trim(); }
  function mappaFornitore(den,piva){ var M=(S.cfg.fe&&S.cfg.fe.piva)||{}; if(piva&&M[piva]) return M[piva];
    var d=upper(den), dp=pulisciNome(den), F=tuttiFornitori();
    for(var i=0;i<F.length;i++){ var f=F[i]; if(f==="NS FATTURA"||f==="ALTRO") continue; if(d.indexOf(f)>=0||dp.indexOf(f)>=0) return f; var w=f.split(/\s+/)[0]; if(w.length>=5&&dp.split(" ").indexOf(w)>=0) return f; }
    var V=S.cfg.voci; for(var j=0;j<V.length;j++){ var v=V[j]; if(!v.forn.length||v.k==="agency"||v.k==="other") continue; if(v.kw.some(function(k){ return k&&d.indexOf(upper(k))>=0; })) return upper(v.forn[0]); }
    return dp||d; }
  function estraiXml(buf){ var u8=new Uint8Array(buf), lat=""; for(var i=0;i<u8.length;i+=8192) lat+=String.fromCharCode.apply(null,u8.subarray(i,i+8192));
    var m=lat.match(/<(\w+:)?FatturaElettronica[\s>]/), a=m?lat.indexOf(m[0]):-1, x=lat.indexOf("<?xml"); if(x>=0&&(a<0||x<a)) a=x; var e=lat.lastIndexOf("FatturaElettronica>");
    if(a>=0&&e>a) return new TextDecoder("utf-8").decode(u8.subarray(a,e+"FatturaElettronica>".length));
    var t=lat.replace(/\s+/g,""); if(/^[A-Za-z0-9+\/=]+$/.test(t)){ try{ var b=atob(t), u=new Uint8Array(b.length); for(var k=0;k<b.length;k++) u[k]=b.charCodeAt(k); return estraiXml(u.buffer); }catch(err){} }
    return ""; }
  function leggiXml(xml,nomeFile){ var out=[], doc; try{ doc=new DOMParser().parseFromString(xml,"text/xml"); }catch(e){ doc=null; }
    if(!doc||doc.getElementsByTagName("parsererror").length) return [{file:nomeFile,err:"XML non leggibile"}];
    var hd=doc.getElementsByTagNameNS("*","FatturaElettronicaHeader")[0], ced=hd?hd.getElementsByTagNameNS("*","CedentePrestatore")[0]:null, an=ced?ced.getElementsByTagNameNS("*","Anagrafica")[0]:null;
    var den=T(an,"Denominazione")||[T(an,"Nome"),T(an,"Cognome")].filter(Boolean).join(" "), piva=T(ced?ced.getElementsByTagNameNS("*","IdFiscaleIVA")[0]:null,"IdCodice")||T(ced,"CodiceFiscale");
    var bodies=doc.getElementsByTagNameNS("*","FatturaElettronicaBody"); if(!bodies.length) return [{file:nomeFile,err:"nessuna fattura nel file"}];
    for(var i=0;i<bodies.length;i++){ var b=bodies[i], dg=b.getElementsByTagNameNS("*","DatiGeneraliDocumento")[0], td=T(dg,"TipoDocumento");
      var imp=0,iva=0,haRiep=false,aliq={}; var R=b.getElementsByTagNameNS("*","DatiRiepilogo"); for(var j=0;j<R.length;j++){ haRiep=true; imp+=n(T(R[j],"ImponibileImporto"))||0; iva+=n(T(R[j],"Imposta"))||0; var al=T(R[j],"AliquotaIVA"); if(al!=="") aliq[String(n(al))]=1; }
      var rit=0, RT=dg?dg.getElementsByTagNameNS("*","DatiRitenuta"):[]; for(var q=0;q<RT.length;q++) rit+=n(T(RT[q],"ImportoRitenuta"))||0;
      var totDoc=n(T(dg,"ImportoTotaleDocumento")), lordo=totDoc!==null?totDoc:r2(imp+iva), tot=r2(lordo-rit), bollo=n(T(dg,"ImportoBollo"));
      var caus=TT(dg,"Causale").join(" ").trim(), linee=TT(b.getElementsByTagNameNS("*","DatiBeniServizi")[0],"Descrizione").filter(Boolean), descr=(caus||linee.slice(0,3).join(" · ")).replace(/\s+/g," ").slice(0,160);
      var scad=T(b.getElementsByTagNameNS("*","DatiPagamento")[0],"DataScadenzaPagamento"), tipo=(td==="TD04")?"nc":"fattura";
      var al2=Object.keys(aliq), forn=mappaFornitore(den,piva), r={file:nomeFile,den:den,piva:piva,forn:forn,voce:vocePerFornitore(forn,descr),num:T(dg,"Numero"),data:T(dg,"Data").slice(0,10),imp:haRiep?r2(imp):null,ivaPerc:al2.length===1?Number(al2[0]):null,iva:haRiep?r2(iva):null,rit:rit?r2(rit):null,tot:tipo==="nc"?-Math.abs(tot):tot,lordo:lordo,scad:scad,descr:descr,tipo:tipo,td:td,bollo:bollo,sel:true,fatto:false,err:""};
      var tmp={id:"",fornitore:forn,numFattura:r.num,dataFattura:r.data,totale:r.tot,descrizione:descr,note:""}; r.dup=doppioniDi(tmp); if(r.dup.length) r.sel=false;
      var cand=candidatiScalo(tmp); r.cand=cand; r.pre=(cand.lista.length===1||(cand.tipo==="nave"&&cand.lista.length))?cand.lista[0].id:""; out.push(r); }
    return out; }
  function pannello(){ var R=S.fe.righe, F=tuttiFornitori();
    var h='<div class="panel"><div class="panel-h"><b>Importa fatture elettroniche (XML)</b><span class="sub">I file XML o .p7m ricevuti dallo SDI: fornitore, numero, data, importi e scadenza si compilano da soli.</span><div class="spacer"></div><label class="btn">Scegli i file XML / P7M <input type="file" id="feFile" accept=".xml,.p7m,.XML,.P7M,text/xml,application/xml,application/pkcs7-mime" multiple hidden></label>'+(R.length?'<button class="btn primary" id="feTutte">Registra le selezionate</button><button class="btn" id="feSvuota">Svuota</button>':'')+'</div>';
    if(!R.length) return h+'<div class="panel-b sub">Puoi scegliere più file insieme. Le fatture già registrate vengono riconosciute e lasciate deselezionate; il fornitore che scegli per una partita IVA viene ricordato.</div></div>';
    h+='<div class="scroll"><table><thead><tr><th></th><th>File / cedente</th><th style="min-width:170px">Fornitore</th><th>Voce</th><th>N.</th><th>Data</th><th class="num">Imponibile</th><th class="num">IVA</th><th class="num">Rit.</th><th class="num">Totale €</th><th>Scadenza</th><th>Descrizione</th><th style="min-width:220px">Approdo</th><th></th></tr></thead><tbody>';
    R.forEach(function(r,i){ if(r.err){ h+='<tr><td></td><td colspan="13"><strong>'+esc(r.file)+'</strong> — <span class="chip no">'+esc(r.err)+'</span></td></tr>'; return; }
      h+='<tr'+(r.fatto?' style="opacity:.55"':'')+'><td>'+(r.fatto?'<span class="chip ok">registrata</span>':'<input type="checkbox" data-fesel="'+i+'"'+(r.sel?' checked':'')+' aria-label="Importa">')+'</td>'+
        '<td><div class="sub" title="'+esc(r.file)+'">'+esc(r.file.length>26?r.file.slice(0,24)+"…":r.file)+'</div><strong>'+esc(r.den)+'</strong>'+(r.piva?'<div class="sub">P.IVA '+esc(r.piva)+'</div>':'')+(r.dup.length?'<div><span class="chip no" title="'+esc(r.dup.map(function(d){ var sc=S.scali[d.s.scalo]||{}; return d.m+" – "+(sc.prot?"prot. "+sc.prot+" "+(sc.nave||""):"da abbinare"); }).join(" | "))+'">già registrata</span></div>':'')+(r.td&&r.td!=="TD01"?'<div class="sub">'+esc(r.td)+(r.tipo==="nc"?" nota di credito":"")+'</div>':'')+'</td>'+
        '<td>'+(r.fatto?esc(r.forn):'<input data-feforn="'+i+'" list="dl_feforn" value="'+esc(r.forn)+'">')+'</td>'+
        '<td>'+(r.fatto?esc(nomeVoce({voce:r.voce})):'<select data-fevoce="'+i+'" style="min-width:170px;max-width:230px">'+S.cfg.voci.map(function(v){ return opt(v.k,v.label,r.voce); }).join("")+'</select>')+'</td>'+
        '<td>'+esc(r.num)+'</td><td>'+dIt(r.data)+'</td><td class="num">'+eur(r.imp)+'</td><td class="num">'+eur(r.iva)+(r.ivaPerc!==null?'<div class="sub">'+r.ivaPerc+'%</div>':'')+'</td><td class="num">'+(r.rit?eur(r.rit):"—")+'</td><td class="num"><strong>'+eur(r.tot)+'</strong>'+(r.rit?'<div class="sub">lordo '+eur(r.lordo)+'</div>':'')+'</td><td>'+dIt(r.scad)+'</td><td class="sub">'+esc(r.descr)+(r.bollo?' · bollo € '+eur(r.bollo):'')+'</td>'+
        '<td>'+(r.fatto?(r.scaloNome||'<span class="chip warn">da abbinare</span>'):'<select data-fesc="'+i+'" aria-label="Approdo">'+optScali(r.pre,r.cand)+'</select>'+(r.pre?'<div class="sub">proposto: '+(r.cand.tipo==="nave"?"nave citata nella fattura":"unico scalo vicino alla data")+'</div>':''))+'</td>'+
        '<td>'+(r.fatto?'':'<button class="btn small primary" data-fereg="'+i+'">Registra</button>')+'</td></tr>'; });
    var sel=R.filter(function(r){ return !r.err&&!r.fatto&&r.sel; }), t=0; sel.forEach(function(r){ t+=r.tot||0; });
    h+='</tbody><tfoot><tr><td colspan="9">'+sel.length+' fatture selezionate</td><td class="num">'+eur(t)+'</td><td colspan="4"></td></tr></tfoot></table></div>'+datalist("dl_feforn",F)+'</div>';
    return h; }
  function leggiRiga(i){ var r=S.fe.righe[i]; var f=document.querySelector('[data-feforn="'+i+'"]'), v=document.querySelector('[data-fevoce="'+i+'"]'), s=document.querySelector('[data-fesc="'+i+'"]'), c=document.querySelector('[data-fesel="'+i+'"]');
    if(f) r.forn=upper(f.value); if(v) r.voce=v.value; if(s) r.scalo=s.value; if(c) r.sel=c.checked; return r; }
  async function registra(i){ var r=leggiRiga(i); if(!r||r.err||r.fatto) return false; if(!r.forn){ avviso("Indica il fornitore."); return false; }
    var e={id:nuovoId("sp"),scalo:(r.scalo&&S.scali[r.scalo])?r.scalo:"",fornitore:r.forn,voce:r.voce||vocePerFornitore(r.forn,r.descr),voceLibera:"",numFattura:r.num,dataFattura:r.data,scadenza:r.scad||"",tipo:r.tipo,imponibile:r.imp,ivaPerc:r.ivaPerc,iva:r.iva,ritenuta:r.rit,totale:r.tot,descrizione:r.descr,dataPagamento:"",modo:"",note:"da XML SDI: "+r.file+(r.den&&upper(r.den)!==r.forn?" ("+r.den+")":""),allegato:"",pagamenti:[]};
    if(r.piva&&r.forn){ S.cfgRaw.fe=S.cfgRaw.fe||{}; S.cfgRaw.fe.piva=S.cfgRaw.fe.piva||{}; if(S.cfgRaw.fe.piva[r.piva]!==r.forn){ S.cfgRaw.fe.piva[r.piva]=r.forn; S.cfg.fe=S.cfg.fe||{}; S.cfg.fe.piva=S.cfgRaw.fe.piva; try{ await scriviCfg(); }catch(err){} } }
    await scriviSpesa(e); r.fatto=true; r.id=e.id; var sc=S.scali[e.scalo]; r.scaloNome=sc?esc((sc.prot||"?")+" "+(sc.nave||"")):""; return true; }
  async function leggiFiles(files){ var righe=[]; for(var i=0;i<files.length;i++){ var f=files[i]; try{ var buf=await f.arrayBuffer(), xml=estraiXml(buf); if(!xml) righe.push({file:f.name,err:"non contiene una fattura elettronica"}); else righe.push.apply(righe,leggiXml(xml,f.name)); }catch(e){ righe.push({file:f.name,err:e.message||"errore di lettura"}); } }
    S.fe.righe=S.fe.righe.filter(function(r){ return !r.fatto; }).concat(righe); render(); var ok=righe.filter(function(r){ return !r.err; }).length; avviso(ok+" fatture lette"+(righe.length-ok?", "+(righe.length-ok)+" file non riconosciuti":"")+"."); }

  var _vf=window.vistaFatture;
  window.vistaFatture=function(){ var h=_vf(); var k='<div class="panel"><div class="panel-h"><b>2. Abbina'; var i=h.indexOf(k); var p=pannello(); return i>=0? h.slice(0,i)+p+h.slice(i) : h+p; };
  var _ev=window.eventi;
  window.eventi=function(){ _ev(); if(S.view!=="fatture") return;
    on("feFile","change",function(){ if(this.files&&this.files.length) leggiFiles(Array.prototype.slice.call(this.files)); });
    on("feSvuota","click",function(){ S.fe.righe=[]; render(); });
    on("feTutte","click",async function(){ var R=S.fe.righe, k=0; for(var i=0;i<R.length;i++){ leggiRiga(i); } for(var j=0;j<R.length;j++){ if(R[j].err||R[j].fatto||!R[j].sel) continue; if(await registra(j)) k++; } render(); avviso(k+" fatture registrate."+(k?" Quelle senza approdo sono al passo 2.":"")); });
    document.querySelectorAll("[data-fereg]").forEach(function(b){ b.addEventListener("click",async function(){ var i=parseInt(b.getAttribute("data-fereg"),10); for(var j=0;j<S.fe.righe.length;j++) leggiRiga(j); if(await registra(i)){ render(); avviso("Fattura registrata."); } }); });
    document.querySelectorAll("[data-fesel]").forEach(function(c){ c.addEventListener("change",function(){ S.fe.righe[parseInt(c.getAttribute("data-fesel"),10)].sel=c.checked; }); });
    document.querySelectorAll("[data-feforn]").forEach(function(f){ f.addEventListener("change",function(){ var i=parseInt(f.getAttribute("data-feforn"),10), r=S.fe.righe[i]; r.forn=upper(f.value); var v=document.querySelector('[data-fevoce="'+i+'"]'); if(v){ var k=vocePerFornitore(r.forn,r.descr); if(k!=="other") v.value=k; r.voce=v.value; } }); });
  };
  window.PortolanoFE={leggiXml:leggiXml,estraiXml:estraiXml,mappaFornitore:mappaFornitore};
})();
