/* ---------- Portolano: stampa / PDF di ogni pagina, scheda e voce ---------- */
(function(){
  "use strict";
  var css=".rep .panel,.rep .tile{box-shadow:none;border:1px solid #cfd9dd;margin:8px 0;page-break-inside:avoid;background:#fff}.rep .tiles{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:8px 0}.rep .tile{margin:0}.rep .tile .v{font-size:15px}.rep .panel-h{border-bottom:1px solid #cfd9dd;padding:6px 10px;font-weight:600}.rep .panel-b{padding:8px 10px}.rep table{width:100%;border-collapse:collapse;font-size:11px}.rep th,.rep td{border-bottom:1px solid #dde;padding:3px 6px;vertical-align:top;text-align:left}.rep th.n,.rep td.n{text-align:right}.rep .grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px 14px}.rep .field{min-width:0}.rep .field.w2{grid-column:span 2}.rep .field label{display:block;font-size:10px;color:#666;margin:0;text-transform:uppercase;letter-spacing:.03em}.rep .pvc{display:inline-block;margin-right:4px;font-size:13px}.rep .pv{display:block;font-size:12px;min-height:15px;border-bottom:1px dotted #bbb;padding:1px 0 2px;white-space:pre-wrap;word-break:break-word}.rep h3{font-size:13px;margin:14px 0 4px;color:var(--docc,#0e4e5c)}.rep .sez{margin-top:16px;padding-top:8px;border-top:2px solid var(--docc,#0e4e5c);page-break-inside:auto}.rep .sez>h2{font-size:14px;margin:0 0 6px}.rep .titolo small{font-size:60%;color:#666;font-weight:400}.rep .chip{border:1px solid #999;border-radius:10px;padding:0 6px;font-size:10px}.rep .sub{color:#555}.rep .esl{border-top:1.5px solid var(--docc,#0e4e5c);margin-top:4px}.rep .esr{border-bottom:1px solid #d5dde0;padding:3px 0;page-break-inside:avoid;break-inside:avoid;font-size:11px;line-height:1.3}.rep .esr .l1,.rep .esr .l2{display:flex;gap:10px;white-space:nowrap;min-width:0}.rep .esr .l1>*,.rep .esr .l2>*{flex:none}.rep .esr b{min-width:150px;max-width:220px;overflow:hidden;text-overflow:ellipsis}.rep .esr .l1>span:nth-child(2){min-width:68px}.rep .esr .l1>span:nth-child(3){min-width:70px}.rep .esr .l2>span:nth-child(1),.rep .esr .l2>span:nth-child(2){min-width:90px;color:#444}.rep .esr .cl,.rep .esr .ca{flex:1 1 auto!important;min-width:0;overflow:hidden;text-overflow:ellipsis}.rep .esr .l2{font-size:10.5px}.rep .esr .ca .sub{color:#777}.rep .esh{background:#eef3f5;font-size:9.5px;text-transform:uppercase;letter-spacing:.03em;color:#555}.rep .esh b{font-weight:600}@media (max-width:600px){.rep .esr{font-size:10.5px}.rep .esr b{min-width:0;max-width:none}.rep .esr .l1>span:nth-child(2),.rep .esr .l1>span:nth-child(3){min-width:0}.rep .esr .l2>span:nth-child(1),.rep .esr .l2>span:nth-child(2){min-width:0}.rep .esr .l1,.rep .esr .l2{gap:7px}}@media print{.doc.elenco-scali{padding:0 10mm!important}.doc.elenco-scali .esr{font-size:10px}.doc.elenco-scali .esr .l2{font-size:9.5px}}@media print{.rep{font-size:11px}.rep .tiles{grid-template-columns:repeat(4,1fr)}}";
  var st=document.createElement("style"); st.textContent=css; document.head.appendChild(st);

  function testoCampo(el){
    if(el.tagName==="SELECT"){ var o=el.options[el.selectedIndex]; return o?o.textContent:""; }
    if(el.type==="checkbox"||el.type==="radio") return el.checked?"Sì":"No";
    if(el.type==="password") return el.value?"••••••":"";
    if(el.type==="date") return el.value?dIt(el.value):"";
    if((el.type==="number"||el.classList.contains("num"))&&el.value!==""&&isFinite(Number(el.value))) return Number(el.value).toLocaleString("it-IT",{minimumFractionDigits:2,maximumFractionDigits:2});
    return el.value;
  }
  function pulisci(root){
    root.querySelectorAll("button.lnk").forEach(function(e){ var s=document.createElement("span"); s.textContent=e.textContent; e.parentNode.replaceChild(s,e); });
    root.querySelectorAll("button,.acts,.subtabs,datalist,[data-noprint],.toast,.docwrap,#stampaVista,#stampaScheda").forEach(function(e){ e.remove(); });
    root.querySelectorAll("input,select,textarea").forEach(function(e){ var s=document.createElement("span"); if(e.type==="checkbox"||e.type==="radio"){ s.className="pvc"; s.textContent=e.checked?"\u2611":"\u2610"; } else { s.className="pv"; s.textContent=testoCampo(e)||"\u2014"; } e.parentNode.replaceChild(s,e); });
    root.querySelectorAll(".panel-h .field").forEach(function(f){ var t=f.textContent.replace(/\s+/g," ").trim(); if(!t||t==="\u2014") f.remove(); });
    root.querySelectorAll(".panel-h").forEach(function(ph){ if(!ph.textContent.trim()) ph.remove(); });
    root.querySelectorAll("a").forEach(function(a){ a.removeAttribute("href"); });
    root.querySelectorAll("[id]").forEach(function(e){ e.removeAttribute("id"); });
    root.querySelectorAll("[contenteditable]").forEach(function(e){ e.removeAttribute("contenteditable"); });
    return root;
  }
  function daHtml(html){ var d=document.createElement("div"); d.innerHTML=html; return pulisci(d).innerHTML; }
  function intestazioneDoc(titolo,sotto){
    return lettera()+'<div class="titolo">'+esc(titolo)+(sotto?' <small>'+esc(sotto)+'</small>':"")+'</div><div class="sub" style="margin-bottom:10px">'+dIt(oggi())+(chi()?' · '+esc(chi()):"")+'</div>';
  }
  function mostra(titolo,corpo,nomeFile){
    var w=document.getElementById("docwrap"); if(!w){ w=document.createElement("div"); w.className="docwrap"; w.id="docwrap"; document.body.appendChild(w); }
    w.innerHTML='<div class="docbar"><span class="sub" style="color:#fff;align-self:center;margin-right:auto">'+esc(titolo)+' · nella finestra di stampa scegli "Salva come PDF"</span><button class="btn" id="docStampa">Stampa / salva PDF</button><button class="btn" id="docChiudi">Chiudi</button></div>'+
      '<div class="doc rep" style="--docc:'+esc((S.cfg.doc&&S.cfg.doc.colore)||"#0e4e5c")+'">'+corpo+'</div>';
    var vecchio=document.title; document.title=nomeFile||titolo;
    on("docStampa","click",function(){ window.print(); });
    on("docChiudi","click",function(){ w.remove(); document.title=vecchio; });
    w.scrollTop=0;
  }
  /* pagina corrente (qualsiasi vista, qualsiasi scheda/voce aperta) */
  function stampaVista(){
    var m=document.getElementById("main"); if(!m) return;
    var h1=m.querySelector(".top h1"), titolo=h1?h1.textContent.replace(/\s+/g," ").trim():"Portolano";
    var stato=m.querySelector(".top .stato, .top .chip"), sotto=stato?stato.textContent.trim():"";
    var c=m.cloneNode(true); var top=c.querySelector(".top"); if(top) top.remove(); pulisci(c);
    var tab=m.querySelector('.subtabs [aria-selected="true"]'); var sez=tab?tab.textContent.trim():"";
    mostra(titolo,intestazioneDoc(titolo,sotto)+(sez?'<h3>'+esc(sez)+'</h3>':"")+c.innerHTML,"Portolano - "+titolo);
  }
  /* scheda completa di uno scalo: tutte le sezioni in un unico documento */
  function stampaScheda(){
    var sc=S.sel&&S.scali[S.sel]; if(!sc) return;
    var sezioni=[["Nave & viaggio",function(){ return formNave(sc); }],["Intestazione",function(){ return formIntest(sc); }],["PDA preventivo",function(){ return formPda(sc); }],["Fatture fornitori",function(){ return vistaSpese(sc); }],["Conto PDA / FDA",function(){ return vistaConto(sc); }],["Incassi",function(){ return vistaIncassi(sc); }]];
    var m=document.getElementById("main"), tiles=m&&m.querySelector(".tiles"); var corpo=tiles?daHtml(tiles.outerHTML):"";
    var bozza=S.bozza, edit=S.editSpesa; S.bozza=null; S.editSpesa=null;
    sezioni.forEach(function(s){ var html=""; try{ html=s[1](); }catch(e){ html='<p class="sub">Sezione non disponibile.</p>'; } var d=document.createElement("div"); d.innerHTML=html; pulisci(d); d.querySelectorAll(".grid").forEach(function(g){ var pv=g.querySelectorAll(".pv"); if(pv.length&&Array.prototype.every.call(pv,function(x){ return x.textContent==="\u2014"; })) g.remove(); }); corpo+='<div class="sez"><h2>'+esc(s[0])+'</h2>'+d.innerHTML+'</div>'; });
    S.bozza=bozza; S.editSpesa=edit;
    var titolo="Scheda scalo – "+(sc.nave||"")+" · prot. "+(sc.prot||"")+"/"+(sc.annoProt||anno(sc.eta)||"");
    mostra(titolo,intestazioneDoc(titolo,statoScalo(sc).t)+corpo,"Scheda "+(sc.nave||"scalo")+" "+(sc.prot||""));
  }
  /* 1.18: elenco scali stampabile — nave, prot., arrivo/partenza, GT, cliente, carico imbarcato/sbarcato (unica colonna); stesso filtro e ordine della pagina Scali */
  function carico(s){
    var op=String(s.operazione||""), c=[s.carico,s.quantita].filter(Boolean).join(" ");
    var imb=/\bload|\bimbarc|\bcaric/i.test(op), sb=/disch|\bsbarc|unload|\bscaric/i.test(op);
    if(imb&&sb) return (c?"imbarco/sbarco "+esc(c):"imbarco/sbarco");
    if(imb) return "imbarcato "+(c?esc(c):"\u2014");
    if(sb) return "sbarcato "+(c?esc(c):"\u2014");
    return op||c?'<span class="sub">'+esc([op,c].filter(Boolean).join(" · "))+'</span>':"\u2014";
  }
  function stampaElenco(){
    var lst=window.SCALI_VISTI||[]; if(!lst.length){ avviso("Nessuno scalo da stampare con i filtri attuali."); return; }
    var F={"":"",porto:"in porto",attesi:"in arrivo",aperti:"da incassare",prev:"preventivi",saldati:"saldati"};
    var per=S.anno==="range"?("dal "+(S.scDa?dIt(S.scDa):"…")+" al "+(S.scA?dIt(S.scA):"…")):(S.anno||"tutti gli anni");
    var sotto=[per,F[S.filtro||""]||"",S.q?'ricerca "'+S.q+'"':""].filter(Boolean).join(" · ");
    function dc(d){ var s=dIt(d); return s?s.slice(0,6)+s.slice(8):"\u2014"; } /* gg/mm/aa */
    var h='<div class="esl"><div class="esr esh"><div class="l1"><b>Nave</b><span>prot.</span><span>GT</span><span class="cl">Cliente</span></div><div class="l2"><span>arrivo</span><span>partenza</span><span class="ca">carico imbarcato / sbarcato</span></div></div>';
    lst.forEach(function(s){ h+='<div class="esr"><div class="l1"><b>'+esc(s.nave||"\u2014")+'</b><span>prot. '+esc(s.prot||"")+'/'+esc(String(s.annoProt||anno(s.eta||s.creato)||"").slice(2))+'</span><span>GT '+(s.gt?Number(s.gt).toLocaleString("it-IT"):"\u2014")+'</span><span class="cl">'+esc(s.cliente||"\u2014")+'</span></div>'+
      '<div class="l2"><span>arr. '+dc(s.eta)+'</span><span>part. '+dc(s.etd)+'</span><span class="ca">'+carico(s)+'</span></div></div>'; });
    h+='</div><p class="sub" style="margin-top:8px">'+lst.length+' scal'+(lst.length===1?"o":"i")+'</p>';
    mostra("Elenco scali",intestazioneDoc("Elenco scali",sotto)+h,"Portolano - Elenco scali"+(S.anno&&S.anno!=="range"?" "+S.anno:""));
    var d=document.querySelector("#docwrap .doc"); if(d) d.classList.add("elenco-scali");
  }
  function bottoni(){
    var be=document.getElementById("stampaElenco"); if(be&&!be.dataset.ok){ be.dataset.ok="1"; be.addEventListener("click",stampaElenco); }
    var top=document.querySelector("#main .top"); if(!top||document.getElementById("stampaVista")) return;
    var dove=top.querySelector(".acts")||top;
    var b=document.createElement("button"); b.className="btn"; b.type="button"; b.id="stampaVista"; b.title="Stampa o salva in PDF questa pagina"; b.textContent="Stampa / PDF"; b.addEventListener("click",stampaVista);
    if(S.view==="scali"&&S.sel&&S.scali[S.sel]){ var b2=document.createElement("button"); b2.className="btn"; b2.type="button"; b2.id="stampaScheda"; b2.title="Tutte le sezioni dello scalo in un unico PDF"; b2.textContent="Scheda completa PDF"; b2.addEventListener("click",stampaScheda); dove.appendChild(b2); }
    dove.appendChild(b);
  }
  var _render=render;
  window.render=function(){ _render(); bottoni(); };
  bottoni();
  window.PortolanoStampa={vista:stampaVista,scheda:stampaScheda,elenco:stampaElenco};
})();
