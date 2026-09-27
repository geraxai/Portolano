/* ---------- Portolano: cruscotto, ricerca globale, allegati locali, chiusura periodo e registro modifiche, backup automatico, scrittura XLSX ---------- */
(function(){
  "use strict";
  function giorniDa(d){ if(!d) return null; var g=Math.floor((new Date(oggi()+"T00:00:00")-new Date(String(d).slice(0,10)+"T00:00:00"))/86400000); return isNaN(g)?null:g; }
  function clienteDi(sc){ return (sc.cliente||(sc.intestazione||"").split("\n")[0]||"—").trim(); }
  function protDi(sc){ return sc&&sc.id?(sc.prot||"?")+"/"+String(sc.annoProt||anno(sc.eta)||"").slice(2):""; }
  function lnk(sc,hl){ return sc&&sc.id?'<button class="btn lnk" data-go="'+esc(sc.id)+'"'+(hl?' data-hl="'+esc(hl)+'"':'')+'>'+esc(protDi(sc))+'</button>':''; }

  /* ---- cruscotto ---- */
  window.vistaCruscotto=function(){
    var L=listaScali(), inPorto=[], attesi=[], partiti=[];
    L.forEach(function(sc){ var ge=giorniDa(sc.eta), gd=sc.etd?giorniDa(sc.etd):null; if(ge===null) return;
      if(ge<0&&ge>=-10) attesi.push(sc); else if(ge>=0&&ge<=45&&(gd===null||gd<=0)) inPorto.push(sc); else if(gd!==null&&gd>=0&&gd<=7) partiti.push(sc); });
    attesi.sort(function(a,b){ return (a.eta||"").localeCompare(b.eta||""); });
    var aperte=[], scad=0, sett=0, daPag=0; for(var k in S.spese){ var s=S.spese[k]; if(upper(s.fornitore)==="NS FATTURA"||num(s.totale)===null||statoSpesa(s)==="pagata") continue; var sc=S.scali[s.scalo]||{}; if(sc.pagDir) continue; var sca=scadenzaDi(s), rit=giorniDa(sca), res=residuoDi(s); daPag+=res; if(rit>0) scad+=res; else if(rit!==null&&rit>=-7) sett+=res; aperte.push({s:s,sc:sc,sca:sca,rit:rit,res:res}); }
    aperte.sort(function(a,b){ return (b.rit||-999)-(a.rit||-999); });
    var part=[], daInc=0, old=0; L.forEach(function(sc){ if(sc.pagDir) return; var f=totFda(sc); if(!f) return; var res=r2(f-incassato(sc)); if(res<=0.005) return; daInc+=res; var rif=(sc.fda&&sc.fda.inviato)||sc.etd||sc.eta||"", g=giorniDa(rif); if(g>60) old+=res; part.push({sc:sc,res:res,g:g}); });
    part.sort(function(a,b){ return (b.g||0)-(a.g||0); });
    var daAbb=speseDaAbbinare(), prev=L.filter(function(sc){ return statoScalo(sc).t==="preventivo"&&giorniDa(sc.etd||sc.eta)>7; });
    var h='<div class="top"><h1>Cruscotto</h1><span class="stato">'+dIt(oggi())+' · '+esc(S.cfg.ag.nomeBreve||"")+'</span></div>';
    h+='<div class="tiles">'+
      '<div class="tile '+(daInc?"no":"ok")+'"><div class="k">Da incassare</div><div class="v">€ '+eur(daInc)+'</div><div class="s">'+part.length+' conti'+(old?' · oltre 60 gg € '+eur(old):'')+'</div></div>'+
      '<div class="tile '+(scad?"no":daPag?"warn":"ok")+'"><div class="k">Da pagare ai fornitori</div><div class="v">€ '+eur(daPag)+'</div><div class="s">'+(scad?'scadute € '+eur(scad):'nessuna scaduta')+(sett?' · entro 7 gg € '+eur(sett):'')+'</div></div>'+
      '<div class="tile"><div class="k">Navi in porto</div><div class="v">'+inPorto.length+'</div><div class="s">'+attesi.length+' in arrivo nei prossimi 10 giorni</div></div>'+
      '<div class="tile '+(daAbb.length?"warn":"")+'"><div class="k">Fatture da abbinare</div><div class="v">'+daAbb.length+'</div><div class="s">'+(prev.length?prev.length+' scali partiti ancora a preventivo':'')+'</div></div></div>';
    h+='<div class="panel"><div class="panel-h"><h2>Navi in porto e in arrivo</h2><div class="spacer"></div><button class="btn small" data-view-go="scali">tutti gli scali</button></div>';
    var navi=inPorto.map(function(sc){ return {sc:sc,st:"in porto"}; }).concat(attesi.map(function(sc){ return {sc:sc,st:"attesa"}; }));
    if(!navi.length) h+='<div class="panel-b sub">Nessuna nave in porto o attesa nei prossimi 10 giorni.</div>';
    else{ h+='<div class="scroll"><table><thead><tr><th>Stato</th><th>Prot.</th><th>Nave</th><th>ETA</th><th>ETD</th><th>Ormeggio</th><th>Operazione</th><th>Cliente</th><th class="num">PDA €</th><th>Conto</th></tr></thead><tbody>';
      navi.forEach(function(r){ var sc=r.sc, st=statoScalo(sc); h+='<tr><td><span class="chip '+(r.st==="in porto"?"ok":"grey")+'">'+r.st+'</span></td><td>'+lnk(sc)+'</td><td><strong>'+esc(sc.nave)+'</strong></td><td>'+dIt(sc.eta)+(sc.etaOra?' '+esc(sc.etaOra):'')+'</td><td>'+dIt(sc.etd)+'</td><td>'+esc(sc.ormeggio||"")+'</td><td>'+esc(sc.operazione||"")+(sc.carico?'<div class="sub">'+esc(sc.carico)+'</div>':'')+'</td><td class="sub">'+esc(clienteDi(sc))+'</td><td class="num">'+eur(totPda(sc))+'</td><td><span class="chip '+st.c+'">'+st.t+'</span></td></tr>'; });
      h+='</tbody></table></div>'; }
    h+='</div>';
    h+='<div class="panel"><div class="panel-h"><h2>Fatture fornitori scadute e in scadenza</h2><div class="spacer"></div><button class="btn small" data-ctab-go="scadenzario">scadenzario completo</button></div>';
    var urg=aperte.filter(function(r){ return r.rit!==null&&r.rit>=-7; }).slice(0,12);
    if(!urg.length) h+='<div class="panel-b sub">Nessuna fattura scaduta o in scadenza entro 7 giorni.</div>';
    else{ h+='<div class="scroll"><table><thead><tr><th>Fornitore</th><th>N.</th><th>Scadenza</th><th>Ritardo</th><th>Prot.</th><th>Nave</th><th class="num">Residuo €</th><th></th></tr></thead><tbody>';
      urg.forEach(function(r){ h+='<tr><td><strong>'+esc(r.s.fornitore)+'</strong></td><td>'+esc(r.s.numFattura)+'</td><td>'+dIt(r.sca)+'</td><td>'+(r.rit>0?'<span class="chip no">scaduta da '+r.rit+' gg</span>':'<span class="chip warn">tra '+(-r.rit)+' gg</span>')+'</td><td>'+lnk(r.sc,r.s.id)+'</td><td>'+esc(r.sc.nave||"")+'</td><td class="num">'+eur(r.res)+'</td><td><button class="btn small" data-paga="'+r.s.id+'">segna pagata oggi</button></td></tr>'; });
      h+='</tbody></table></div>'; }
    h+='</div>';
    h+='<div class="panel"><div class="panel-h"><h2>Clienti da sollecitare</h2><div class="spacer"></div><button class="btn small" data-ctab-go="clienti">partite aperte</button></div>';
    var late=part.filter(function(r){ return r.g>30; }).slice(0,10);
    if(!late.length) h+='<div class="panel-b sub">Nessun conto scoperto da più di 30 giorni.</div>';
    else{ h+='<div class="scroll"><table><thead><tr><th>Cliente</th><th>Prot.</th><th>Nave</th><th>FDA inviato</th><th>Anzianità</th><th class="num">Residuo €</th></tr></thead><tbody>';
      late.forEach(function(r){ var sc=r.sc; h+='<tr><td>'+esc(clienteDi(sc))+'</td><td>'+lnk(sc)+'</td><td>'+esc(sc.nave)+'</td><td>'+(sc.fda&&sc.fda.inviato?dIt(sc.fda.inviato):'<span class="chip grey">non inviato</span>')+'</td><td><span class="chip '+(r.g>60?"no":"warn")+'">'+r.g+' gg</span></td><td class="num">'+eur(r.res)+'</td></tr>'; });
      h+='</tbody></table></div>'; }
    h+='</div>';
    if(daAbb.length){ h+='<div class="panel"><div class="panel-h"><h2>Fatture in attesa di approdo</h2><div class="spacer"></div><button class="btn small" data-view-go="fatture">abbina</button></div><div class="scroll"><table><tbody>'+daAbb.slice(0,8).map(function(s){ return '<tr><td><strong>'+esc(s.fornitore)+'</strong></td><td>'+esc(s.numFattura)+'</td><td>'+dIt(s.dataFattura)+'</td><td class="num">'+eur(s.totale)+'</td><td class="sub">'+esc(s.descrizione||"")+'</td></tr>'; }).join("")+'</tbody></table></div></div>'; }
    var log=leggiLog().slice(0,8); if(log.length) h+='<div class="panel"><div class="panel-h"><h2>Ultime modifiche</h2><span class="sub">su questo dispositivo</span></div><div class="scroll"><table><tbody>'+log.map(function(l){ return '<tr><td class="sub" style="white-space:nowrap">'+esc(l.t.replace("T"," ").slice(0,16))+'</td><td>'+esc(l.chi||"")+'</td><td>'+esc(l.cosa)+'</td></tr>'; }).join("")+'</tbody></table></div></div>';
    return h; };

  /* ---- ricerca globale ---- */
  window.vistaCerca=function(){ var q=upper(S.qg||"").trim(), w=q.split(/\s+/).filter(Boolean);
    function ok(t){ t=upper(t); return w.every(function(x){ return t.indexOf(x)>=0; }); }
    var scali=listaScali().filter(function(sc){ return ok([sc.prot,sc.nave,sc.imo,sc.callSign,sc.flag,sc.cliente,sc.intestazione,sc.carico,sc.ricevitore,sc.operazione,sc.ormeggio,sc.provenienza,sc.prossimo,sc.note,sc.master].join(" ")); });
    var fatt=[]; for(var k in S.spese){ var s=S.spese[k], sc=S.scali[s.scalo]||{}; if(ok([s.fornitore,s.numFattura,s.descrizione,s.note,nomeVoce(s),s.totale,sc.nave,sc.prot].join(" "))) fatt.push({s:s,sc:sc}); }
    fatt.sort(function(a,b){ return (b.s.dataFattura||"").localeCompare(a.s.dataFattura||""); });
    var h='<div class="top"><h1>Ricerca</h1><span class="stato">"'+esc(S.qg)+'" · '+scali.length+' scali · '+fatt.length+' fatture</span></div>';
    h+='<div class="panel"><div class="panel-h"><h2>Scali</h2></div>'; if(!scali.length) h+='<div class="panel-b sub">Nessuno scalo.</div>';
    else{ h+='<div class="scroll"><table><thead><tr><th>Prot.</th><th>ETA</th><th>Nave</th><th>IMO</th><th>Cliente</th><th>Operazione / carico</th><th class="num">PDA</th><th class="num">FDA</th><th>Stato</th></tr></thead><tbody>';
      scali.slice(0,100).forEach(function(sc){ var st=statoScalo(sc); h+='<tr class="row" data-sc="'+sc.id+'"><td>'+esc(protDi(sc))+'</td><td>'+dIt(sc.eta)+'</td><td><strong>'+esc(sc.nave)+'</strong></td><td>'+esc(sc.imo||"")+'</td><td>'+esc(clienteDi(sc))+'</td><td>'+esc(sc.operazione||"")+(sc.carico?'<div class="sub">'+esc(sc.carico)+'</div>':'')+'</td><td class="num">'+eur(totPda(sc))+'</td><td class="num">'+(totFda(sc)?eur(totFda(sc)):"—")+'</td><td><span class="chip '+st.c+'">'+st.t+'</span></td></tr>'; });
      h+='</tbody></table></div>'; }
    h+='</div><div class="panel"><div class="panel-h"><h2>Fatture fornitori</h2></div>'; if(!fatt.length) h+='<div class="panel-b sub">Nessuna fattura.</div>';
    else{ h+='<div class="scroll"><table><thead><tr><th>Data</th><th>N.</th><th>Fornitore</th><th>Voce</th><th>Prot.</th><th>Nave</th><th class="num">Totale €</th><th>Pagata</th><th>Descrizione</th></tr></thead><tbody>';
      fatt.slice(0,100).forEach(function(r){ var s=r.s, sc=r.sc; h+='<tr><td>'+dIt(s.dataFattura)+'</td><td>'+esc(s.numFattura)+'</td><td><strong>'+esc(s.fornitore)+'</strong></td><td class="sub">'+esc(nomeVoce(s))+'</td><td>'+(sc.id?lnk(sc,s.id):'<button class="btn lnk" data-abbina="'+s.id+'">da abbinare</button>')+'</td><td>'+esc(sc.nave||"")+'</td><td class="num">'+eur(s.totale)+'</td><td>'+chipPag(s)+'</td><td class="sub">'+esc([s.descrizione,s.note].filter(Boolean).join(" · "))+'</td></tr>'; });
      h+='</tbody></table></div>'; }
    return h+'</div>'; };

  /* ---- allegati locali (IndexedDB di questo browser) ---- */
  var DB=null, ALL={};
  function idb(){ return new Promise(function(res,rej){ if(DB) return res(DB); try{ var r=indexedDB.open("portolano.allegati",1); r.onupgradeneeded=function(){ r.result.createObjectStore("f"); }; r.onsuccess=function(){ DB=r.result; res(DB); }; r.onerror=function(){ rej(r.error); }; }catch(e){ rej(e); } }); }
  function idbGet(id){ return idb().then(function(db){ return new Promise(function(res){ var t=db.transaction("f","readonly").objectStore("f").get(id); t.onsuccess=function(){ res(t.result||null); }; t.onerror=function(){ res(null); }; }); }); }
  function idbPut(id,v){ return idb().then(function(db){ return new Promise(function(res){ var t=db.transaction("f","readwrite"); t.objectStore("f").put(v,id); t.oncomplete=function(){ res(true); }; t.onerror=function(){ res(false); }; }); }); }
  function idbDel(id){ return idb().then(function(db){ return new Promise(function(res){ var t=db.transaction("f","readwrite"); t.objectStore("f").delete(id); t.oncomplete=function(){ res(true); }; t.onerror=function(){ res(false); }; }); }); }
  function idbKeys(){ return idb().then(function(db){ return new Promise(function(res){ var t=db.transaction("f","readonly").objectStore("f").getAllKeys(); t.onsuccess=function(){ res(t.result||[]); }; t.onerror=function(){ res([]); }; }); }).catch(function(){ return []; }); }
  idbKeys().then(function(k){ k.forEach(function(id){ ALL[id]=1; }); });
  function allegatoUI(){ var box=document.getElementById("s_allBox"); if(!box) return; var id=box.getAttribute("data-sp-id"); var e=id&&(S.spese[id]||S.bozza)||{};
    var link=e.allegato&&/^https?:\/\//i.test(e.allegato)?'<a class="btn small" href="'+esc(e.allegato)+'" target="_blank" rel="noopener">apri link</a>':'';
    box.innerHTML='<label>File allegato (solo in questo browser)</label><div class="acts">'+(id&&ALL[id]?'<button class="btn small" id="allApri">apri il file</button><button class="btn small" id="allDel">togli il file</button>':'')+(id?'<label class="btn small">'+(ALL[id]?'sostituisci':'allega PDF / immagine')+' <input type="file" id="allFile" accept=".pdf,image/*" hidden></label>':'<span class="sub">salva prima la fattura, poi potrai allegare il file</span>')+link+'</div>';
    on("allFile","change",function(){ var f=this.files&&this.files[0]; if(!f) return; if(f.size>8*1024*1024){ avviso("File troppo grande (max 8 MB)."); return; } var r=new FileReader(); r.onload=function(){ idbPut(id,{nome:f.name,tipo:f.type,data:r.result}).then(function(ok){ if(ok){ ALL[id]=1; avviso("File allegato: "+f.name); allegatoUI(); } else avviso("Non riesco a salvare il file qui."); }); }; r.readAsArrayBuffer(f); });
    on("allApri","click",function(){ idbGet(id).then(function(v){ if(!v){ avviso("File non trovato."); return; } var u=URL.createObjectURL(new Blob([v.data],{type:v.tipo||"application/pdf"})); window.open(u,"_blank"); }); });
    on("allDel","click",function(){ if(!confirm("Togliere il file allegato?")) return; idbDel(id).then(function(){ delete ALL[id]; allegatoUI(); }); }); }
  window.PortolanoAllegati={esiste:function(id){ return !!ALL[id]; },apri:function(id){ idbGet(id).then(function(v){ if(!v){ avviso("File non trovato."); return; } window.open(URL.createObjectURL(new Blob([v.data],{type:v.tipo||"application/pdf"})),"_blank"); }); }};

  /* ---- chiusura periodo + registro modifiche ---- */
  var OMBRA={}; var LOGKEY="portolano.log";
  function leggiLog(){ try{ return JSON.parse(localStorage.getItem(LOGKEY)||"[]"); }catch(e){ return []; } }
  window.leggiLog=leggiLog;
  function scriviLog(cosa){ try{ var l=leggiLog(); l.unshift({t:new Date().toISOString(),chi:chi()||"",cosa:cosa}); localStorage.setItem(LOGKEY,JSON.stringify(l.slice(0,500))); }catch(e){} }
  function ammin(){ return !S.user||!S.user.ruolo||S.user.ruolo==="admin"; }
  function dataRif(tipo,o){ if(!o) return ""; return tipo==="spesa"?(o.dataFattura||o.dataPagamento||""):(o.eta||o.creato||""); }
  function chiuso(d){ var c=S.cfg.conta&&S.cfg.conta.chiusoFino; return !!(c&&d&&d<=c); }
  function consenti(tipo,o,prev){ var d1=dataRif(tipo,o), d0=dataRif(tipo,prev); if(!chiuso(d1)&&!chiuso(d0)) return true;
    if(!ammin()){ avviso("Periodo contabile chiuso fino al "+dIt(S.cfg.conta.chiusoFino)+": la modifica non è consentita."); return false; }
    return confirm("Il periodo contabile è chiuso fino al "+dIt(S.cfg.conta.chiusoFino)+". Salvare comunque la modifica?"); }
  function diff(a,b){ if(!a) return "nuovo"; var ch=[]; for(var k in b){ if(k==="updatedAt"||k==="updatedByName") continue; if(JSON.stringify(a[k])!==JSON.stringify(b[k])) ch.push(k); } return ch.length?ch.join(", "):"nessuna differenza"; }
  var _ss=window.scriviSpesa, _sc=window.scriviScalo, _cs=window.cancellaSpesa, _cc=window.cancellaScalo;
  window.scriviSpesa=async function(s){ var prev=OMBRA["s"+s.id]; if(!consenti("spesa",s,prev)){ if(prev) S.spese[s.id]=clone(prev); else delete S.spese[s.id]; render(); return; }
    scriviLog("fattura "+(s.fornitore||"")+(s.numFattura?" n. "+s.numFattura:"")+" € "+eur(s.totale)+" — "+diff(prev,s)); var r=await _ss(s); OMBRA["s"+s.id]=clone(s); return r; };
  window.scriviScalo=async function(sc){ var prev=OMBRA["c"+sc.id]; if(!consenti("scalo",sc,prev)){ if(prev) S.scali[sc.id]=clone(prev); else delete S.scali[sc.id]; render(); return; }
    scriviLog("scalo "+(sc.prot||"")+" "+(sc.nave||"")+" — "+diff(prev,sc)); var r=await _sc(sc); OMBRA["c"+sc.id]=clone(sc); return r; };
  window.cancellaSpesa=async function(id){ var s=S.spese[id]; if(s&&!consenti("spesa",s,s)) return; scriviLog("eliminata fattura "+(s?(s.fornitore||"")+(s.numFattura?" n. "+s.numFattura:"")+" € "+eur(s.totale):id)); delete OMBRA["s"+id]; return _cs(id); };
  window.cancellaScalo=async function(id){ var sc=S.scali[id]; if(sc&&!consenti("scalo",sc,sc)) return; scriviLog("eliminato scalo "+(sc?(sc.prot||"")+" "+(sc.nave||""):id)); delete OMBRA["c"+id]; return _cc(id); };
  function ombra(){ for(var k in S.spese) if(!OMBRA["s"+k]) OMBRA["s"+k]=clone(S.spese[k]); for(var j in S.scali) if(!OMBRA["c"+j]) OMBRA["c"+j]=clone(S.scali[j]); }
  function logUI(){ var b=document.getElementById("logBox"); if(!b) return; var l=leggiLog(); b.innerHTML='<h3>Registro modifiche</h3><p class="sub">Le ultime '+l.length+' modifiche fatte da questo browser (chi, quando, che cosa). L\'autore e la data dell\'ultima modifica di ogni scalo e fattura sono salvati anche nell\'archivio condiviso.</p>'+(l.length?'<details><summary>Mostra</summary><div class="scroll"><table><tbody>'+l.slice(0,200).map(function(x){ return '<tr><td class="sub" style="white-space:nowrap">'+esc(x.t.replace("T"," ").slice(0,16))+'</td><td>'+esc(x.chi||"")+'</td><td>'+esc(x.cosa)+'</td></tr>'; }).join("")+'</tbody></table></div></details>':'')+'<div style="height:14px"></div>'; }

  /* ---- backup automatico ---- */
  function backupAuto(){ try{ var g=num(S.cfg.conta&&S.cfg.conta.backupAuto)||0; if(!g||!Object.keys(S.spese).length) return; var last=localStorage.getItem("portolano.lastBackup")||""; var gg=last?giorniDa(last):999; if(gg>=g){ scarica("PORTOLANO_BACKUP_"+oggi()+".json",backupJson()); localStorage.setItem("portolano.lastBackup",oggi()); avviso("Backup automatico dell'archivio scaricato."); } }catch(e){} }
  setTimeout(backupAuto,6000);

  /* ---- XLSX (senza librerie): fogli con stringhe inline e numeri ---- */
  var CRC=(function(){ var t=[]; for(var n=0;n<256;n++){ var c=n; for(var k=0;k<8;k++) c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1); t[n]=c>>>0; } return t; })();
  function crc32(u8){ var c=0xFFFFFFFF; for(var i=0;i<u8.length;i++) c=CRC[(c^u8[i])&0xFF]^(c>>>8); return (c^0xFFFFFFFF)>>>0; }
  function zip(files){ var enc=new TextEncoder(), parts=[], cd=[], off=0; files.forEach(function(f){ var name=enc.encode(f[0]), data=enc.encode(f[1]), crc=crc32(data);
      var h=new Uint8Array(30+name.length), v=new DataView(h.buffer); v.setUint32(0,0x04034b50,true); v.setUint16(4,20,true); v.setUint16(6,0x0800,true); v.setUint16(8,0,true); v.setUint32(10,0,true); v.setUint32(14,crc,true); v.setUint32(18,data.length,true); v.setUint32(22,data.length,true); v.setUint16(26,name.length,true); v.setUint16(28,0,true); h.set(name,30);
      var c=new Uint8Array(46+name.length), w=new DataView(c.buffer); w.setUint32(0,0x02014b50,true); w.setUint16(4,20,true); w.setUint16(6,20,true); w.setUint16(8,0x0800,true); w.setUint16(10,0,true); w.setUint32(12,0,true); w.setUint32(16,crc,true); w.setUint32(20,data.length,true); w.setUint32(24,data.length,true); w.setUint16(28,name.length,true); w.setUint16(30,0,true); w.setUint16(32,0,true); w.setUint16(34,0,true); w.setUint16(36,0,true); w.setUint32(38,0,true); w.setUint32(42,off,true); c.set(name,46);
      parts.push(h,data); cd.push(c); off+=h.length+data.length; });
    var cdLen=0; cd.forEach(function(c){ cdLen+=c.length; }); var e=new Uint8Array(22), ev=new DataView(e.buffer); ev.setUint32(0,0x06054b50,true); ev.setUint16(8,files.length,true); ev.setUint16(10,files.length,true); ev.setUint32(12,cdLen,true); ev.setUint32(16,off,true);
    return new Blob(parts.concat(cd,[e]),{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}); }
  function xml(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,""); }
  function col(n){ var s=""; n++; while(n>0){ var m=(n-1)%26; s=String.fromCharCode(65+m)+s; n=Math.floor((n-1)/26); } return s; }
  function foglio(testata,righe){ var x='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols>'+testata.map(function(t,i){ return '<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+Math.min(40,Math.max(10,String(t).length+4))+'" customWidth="1"/>'; }).join("")+'</cols><sheetData>';
    function riga(r,i,head){ return '<row r="'+(i+1)+'">'+r.map(function(v,j){ var ref=col(j)+(i+1); if(!head&&typeof v==="number") return '<c r="'+ref+'" s="2"><v>'+v+'</v></c>'; if(v===""||v===null||v===undefined) return ""; return '<c r="'+ref+'" t="inlineStr"'+(head?' s="1"':'')+'><is><t xml:space="preserve">'+xml(v)+'</t></is></c>'; }).join("")+'</row>'; }
    x+=riga(testata,0,true); righe.forEach(function(r,i){ x+=riga(r,i+1,false); }); return x+'</sheetData><autoFilter ref="A1:'+col(testata.length-1)+(righe.length+1)+'"/></worksheet>'; }
  window.scriviXlsx=function(nome,fogli){ /* fogli: [{nome, testata, righe}] */
    var files=[["[Content_Types].xml",'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+fogli.map(function(f,i){ return '<Override PartName="/xl/worksheets/sheet'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; }).join("")+'</Types>'],
      ["_rels/.rels",'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
      ["xl/workbook.xml",'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+fogli.map(function(f,i){ return '<sheet name="'+xml(String(f.nome).replace(/[\[\]\*\?\/\\:]/g," ").slice(0,31))+'" sheetId="'+(i+1)+'" r:id="rId'+(i+1)+'"/>'; }).join("")+'</sheets></workbook>'],
      ["xl/_rels/workbook.xml.rels",'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+fogli.map(function(f,i){ return '<Relationship Id="rId'+(i+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'+(i+1)+'.xml"/>'; }).join("")+'<Relationship Id="rId'+(fogli.length+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
      ["xl/styles.xml",'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.00"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs></styleSheet>']];
    fogli.forEach(function(f,i){ files.push(["xl/worksheets/sheet"+(i+1)+".xml",foglio(f.testata,f.righe)]); });
    var blob=zip(files);
    if(S.downloads){ S.downloads.save({filename:nome,data:blob}).catch(function(e){ if(!e||e.code!=="declined") locale(); }); } else locale();
    function locale(){ try{ var a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=nome; document.body.appendChild(a); a.click(); a.remove(); }catch(e){ avviso("Download non disponibile qui."); } } };

  /* ---- eventi aggiuntivi ---- */
  var _eventi=window.eventi;
  window.eventi=function(){ _eventi(); ombra(); allegatoUI(); logUI();
    document.querySelectorAll("[data-view-go]").forEach(function(b){ b.addEventListener("click",function(){ S.view=b.getAttribute("data-view-go"); S.sel=null; render(); }); });
    document.querySelectorAll("[data-ctab-go]").forEach(function(b){ b.addEventListener("click",function(){ S.view="conta"; S.contaTab=b.getAttribute("data-ctab-go"); render(); window.scrollTo(0,0); }); });
    var q=document.getElementById("qg"); if(q&&S.view==="cerca"&&document.activeElement!==q){ /* mantiene il testo cercato dopo il render */ if(q.value!==S.qg) q.value=S.qg; }
  };
  if(S.view==="cruscotto"&&document.getElementById("main")) try{ render(); }catch(e){}
  var _render=window.render; window.render=function(){ _render(); var q=document.getElementById("qg"); if(q&&q.value!==(S.qg||"")&&S.view!=="cerca") q.value=S.qg||""; };
})();
