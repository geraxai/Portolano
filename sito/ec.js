/* ---------- Portolano: estratti conto chiari ed esportabili (fornitori e clienti): movimenti con saldo progressivo, PDF, Excel, CSV, e-mail; tabelle a schede sul telefono ---------- */
(function(){
  "use strict";
  var MESI_IT=["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"];
  function ym(d){ d=String(d||""); return /^\d{4}-\d{2}/.test(d)?d.slice(0,7):""; }
  function nomeMese(m){ if(!m) return ""; var p=m.split("-"); return (MESI_IT[parseInt(p[1],10)-1]||p[1])+" "+p[0]; }
  function giorniDa(d){ if(!d) return null; var g=Math.floor((new Date(oggi()+"T00:00:00")-new Date(String(d).slice(0,10)+"T00:00:00"))/86400000); return isNaN(g)?null:g; }
  function clienteDi(sc){ return (sc.cliente||(sc.intestazione||"").split("\n")[0]||"—").trim(); }
  function protDi(sc){ return sc&&sc.id?(sc.prot||"?")+"/"+String(sc.annoProt||anno(sc.eta)||"").slice(2):""; }
  function bancaNome(id){ var b=(S.cfg.banche||[]).filter(function(x){ return x.id===id; })[0]; return b?b.nome:(id||""); }
  function periodoTxt(a,m){ if(m) return nomeMese(m); if(a) return "anno "+a; return "tutti gli anni"; }
  function slug(t){ return String(t||"").replace(/[^A-Za-z0-9]+/g,"_").replace(/^_|_$/g,""); }
  S.ecVista=S.ecVista||"movimenti"; S.ecCliVista=S.ecCliVista||"movimenti";

  /* ---- movimenti fornitore: fatture (dare), note di credito e pagamenti (avere), saldo progressivo ---- */
  function movFornitore(f,o){ o=o||{}; var M=[], tutti=(f==="*");
    for(var k in S.spese){ var s=S.spese[k]; if(!tutti&&upper(s.fornitore)!==f) continue; if(isNs(s)&&tutti) continue; var sc=S.scali[s.scalo]||{}, d=s.dataFattura||sc.eta||"";
      if(o.anno&&anno(d)!==o.anno) continue; if(o.mese&&ym(d)!==o.mese) continue; if(o.q&&!cercaOk(o.q,campiSpesa(s,sc))) continue; var st=statoSpesa(s); if(o.stato==="aperte"&&st==="pagata") continue; if(o.stato==="pagate"&&st!=="pagata") continue;
      var t=num(s.totale)||0, nc=s.tipo==="nc"||t<0, sca=scadenzaDi(s), rit=(st!=="pagata"&&sca)?giorniDa(sca):null;
      var em=isNs(s), cm=isComm(s);
      M.push({d:d,ord:0,tipo:cm?"Ns fattura di commissione":nc?"Nota di credito":(em?"Fattura emessa":"Fattura"),doc:s.numFattura||"",forn:nomeContab(s.fornitore),sc:sc,s:s,descr:cm?(s.descrizione||"provvigione fatturata da "+nomeAzienda()):em?(vociNsTesto(s)||s.descrizione||""):[nomeVoce(s),s.descrizione].filter(Boolean).join(" · "),dare:(nc||cm)?0:t,avere:(nc||cm)?Math.abs(t):0,st:st,sca:sca,rit:cm?null:rit,res:residuoDi(s),comm:cm});
      if(o.stato!=="aperte"||st!=="pagata") pagamentiDi(s).forEach(function(p){ var imp=num(p.importo)||0; if(!imp) return; M.push({d:p.data||d,ord:1,tipo:cm?"Incasso ns commissione":em?"Incasso":"Pagamento",doc:(s.numFattura?"fatt. "+s.numFattura:"")+(p.modo?" · "+p.modo:""),forn:nomeContab(s.fornitore),sc:sc,s:s,descr:p.note||"",dare:cm?(imp>0?imp:0):(imp<0?-imp:0),avere:cm?(imp<0?-imp:0):(imp>0?imp:0),pag:true,comm:cm}); }); }
    M.sort(function(a,b){ return (a.d||"").localeCompare(b.d||"")||a.ord-b.ord||String(a.forn).localeCompare(String(b.forn)); });
    var T={dare:0,avere:0,saldo:0,scad:0,aperte:0,n:0,pagN:0,comm:0,commN:0}; M.forEach(function(m){ T.dare+=m.dare; T.avere+=m.avere; m.saldo=r2(T.dare-T.avere); if(m.pag) T.pagN++; else if(m.comm){ T.commN++; T.comm+=m.avere; } else { T.n++; if(m.st!=="pagata"){ T.aperte+=m.res; if(m.rit>0) T.scad+=m.res; } } }); T.saldo=r2(T.dare-T.avere);
    return {M:M,T:T}; }

  /* ---- movimenti cliente: conti FDA (o PDA a preventivo) e incassi ---- */
  function movCliente(c,o){ o=o||{}; var M=[];
    listaScali().forEach(function(sc){ if(c!=="*"&&clienteDi(sc)!==c) return; var d0=sc.eta||sc.creato||""; if(o.anno&&anno(d0)!==o.anno) return; if(o.mese&&ym(d0)!==o.mese) return;
      var f=totFda(sc), usaPda=!f&&totPda(sc)&&!sc.pagDir, imp=sc.pagDir?0:(f||totPda(sc)), inc=incassato(sc), res=sc.pagDir?0:Math.max(0,r2(imp-inc)), st=statoScalo(sc);
      if(o.stato==="aperte"&&res<=0.005) return; if(o.stato==="pagate"&&res>0.005) return;
      if(f||usaPda||sc.pagDir){ var rif=(sc.fda&&sc.fda.inviato)||sc.etd||sc.eta||"", g=giorniDa(rif); M.push({d:(sc.fda&&sc.fda.data)||rif,ord:0,tipo:usaPda?"PDA (preventivo)":sc.pagDir?"FDA (pag. diretto)":"FDA",doc:(sc.fda&&sc.fda.numero)?"fatt. "+sc.fda.numero:protDi(sc),cli:clienteDi(sc),sc:sc,descr:[sc.nave,sc.operazione,sc.carico].filter(Boolean).join(" · "),dare:imp,avere:0,st:st,res:res,rit:res>0.005?g:null}); }
      if(o.stato!=="aperte"||res>0.005) (sc.incassi||[]).forEach(function(i){ var v=num(i.importo)||0; if(!v) return; M.push({d:i.data||"",ord:1,tipo:"Incasso",doc:[bancaNome(i.banca),protDi(sc)].filter(Boolean).join(" · "),cli:clienteDi(sc),sc:sc,descr:[sc.nave,i.note].filter(Boolean).join(" · "),dare:0,avere:v,pag:true}); }); });
    M.sort(function(a,b){ return (a.d||"").localeCompare(b.d||"")||a.ord-b.ord; });
    var T={dare:0,avere:0,saldo:0,scad:0,aperte:0,n:0,pagN:0}; M.forEach(function(m){ T.dare+=m.dare; T.avere+=m.avere; m.saldo=r2(T.dare-T.avere); if(m.pag) T.pagN++; else { T.n++; if(m.res>0.005){ T.aperte+=m.res; if(m.rit>60) T.scad+=m.res; } } }); T.saldo=r2(T.dare-T.avere);
    return {M:M,T:T}; }

  /* ---- pezzi comuni ---- */
  function tiles(R,tipo){ var T=R.T, forn=tipo==="fornitore";
    if(tipo==="emesse") return '<div class="tiles">'+
      '<div class="tile"><div class="k">Fatturato da '+esc(nomeAzienda())+'</div><div class="v">€ '+eur(T.dare)+'</div><div class="s">'+T.n+' fatture emesse</div></div>'+
      '<div class="tile"><div class="k">Incassato</div><div class="v">€ '+eur(T.avere)+'</div><div class="s">'+T.pagN+' incassi</div></div>'+
      '<div class="tile '+(T.saldo>0.005?"warn":"ok")+'"><div class="k">Da incassare</div><div class="v">€ '+eur(T.saldo)+'</div><div class="s">'+(T.saldo>0.005?"a credito dell\'azienda":"tutto incassato")+'</div></div>'+
      '<div class="tile '+(T.scad?"no":"ok")+'"><div class="k">Scaduto</div><div class="v">€ '+eur(T.scad)+'</div><div class="s">'+(T.aperte?"aperto in totale € "+eur(T.aperte):"niente in sospeso")+'</div></div></div>';
    return '<div class="tiles">'+
      '<div class="tile"><div class="k">'+(forn?"Fatturato dal fornitore":"Addebitato al cliente")+'</div><div class="v">€ '+eur(T.dare)+'</div><div class="s">'+T.n+(forn?" documenti":" conti")+'</div></div>'+
      '<div class="tile"><div class="k">'+(forn?"Pagato":"Incassato")+'</div><div class="v">€ '+eur(T.avere)+'</div><div class="s">'+T.pagN+(forn?" pagamenti":" incassi")+(forn&&T.commN?" · "+T.commN+" ns fatture di commissione € "+eur(T.comm):"")+'</div></div>'+
      '<div class="tile '+(T.saldo>0.005?(forn?"warn":"no"):"ok")+'"><div class="k">Saldo</div><div class="v">€ '+eur(T.saldo)+'</div><div class="s">'+(T.saldo>0.005?(forn?"a nostro debito":"a debito del cliente"):T.saldo<-0.005?(forn?"a nostro credito":"a credito del cliente"):"in pari")+'</div></div>'+
      '<div class="tile '+(T.scad?"no":"ok")+'"><div class="k">'+(forn?"Scaduto":"Oltre 60 giorni")+'</div><div class="v">€ '+eur(T.scad)+'</div><div class="s">'+(T.aperte?"aperto in totale € "+eur(T.aperte):"niente in sospeso")+'</div></div></div>'; }
  function chipStato(m,tipo){ if(m.pag) return ""; if(tipo==="emesse"){ if(m.st==="pagata") return '<span class="chip ok">incassata</span>'; if(m.rit>0) return '<span class="chip no">scaduta da '+m.rit+' gg</span>'; if(m.st==="parziale") return '<span class="chip warn">parziale · resta € '+eur(m.res)+'</span>'; return '<span class="chip warn">'+(m.sca?"scade "+dIt(m.sca):"da incassare")+'</span>'; }
    if(tipo==="fornitore"&&m.comm){ if(m.st==="pagata") return '<span class="chip ok">incassata</span>'; if(m.st==="parziale") return '<span class="chip warn">parziale · resta € '+eur(m.res)+'</span>'; return '<span class="chip warn">da incassare / compensare</span>'; }
    if(tipo==="fornitore"){ if(m.st==="pagata") return '<span class="chip ok">pagata</span>'; if(m.rit>0) return '<span class="chip no">scaduta da '+m.rit+' gg</span>'; if(m.st==="parziale") return '<span class="chip warn">parziale · resta € '+eur(m.res)+'</span>'; return '<span class="chip warn">'+(m.sca?"scade "+dIt(m.sca):"aperta")+'</span>'; }
    var st=m.st||{}; return '<span class="chip '+(st.c||"grey")+'">'+(st.t||"")+(m.res>0.005&&m.rit!==null&&m.rit>30?' · '+m.rit+' gg':'')+'</span>'; }
  function tabella(R,tipo,tutti){ var forn=tipo==="fornitore", em=tipo==="emesse", M=R.M, T=R.T, mese=null, sub={d:0,a:0};
    var h='<div class="scroll"><table class="ec"><thead><tr><th>Data</th>'+(tutti?'<th>'+(forn?"Fornitore":"Cliente")+'</th>':'')+'<th>Movimento</th><th>Riferimento</th><th>Nave / prot.</th><th>Descrizione</th><th class="num">'+(forn||em?"Fattura €":"Addebito €")+'</th><th class="num">'+(forn?"Pagato €":"Incassato €")+'</th><th class="num">Saldo €</th><th>Stato</th></tr></thead><tbody>';
    function chiudi(){ if(mese===null||S.ecMese) return; h+='<tr class="sub-tot"><td colspan="'+(tutti?6:5)+'">Totale '+esc(nomeMese(mese)||"senza data")+'</td><td class="num">'+eur(sub.d)+'</td><td class="num">'+eur(sub.a)+'</td><td colspan="2"></td></tr>'; sub={d:0,a:0}; }
    M.forEach(function(m){ var mm=ym(m.d); if(mm!==mese){ chiudi(); mese=mm; } sub.d+=m.dare; sub.a+=m.avere;
      h+='<tr class="'+(m.pag?"pag":"")+'"><td>'+dIt(m.d)+'</td>'+(tutti?'<td>'+esc(forn?m.forn:m.cli)+'</td>':'')+'<td>'+(m.pag?'<span class="sub">'+esc(m.tipo)+'</span>':'<strong>'+esc(m.tipo)+'</strong>')+'</td><td class="nw">'+esc(m.doc)+'</td><td>'+(m.sc&&m.sc.id?'<button class="btn lnk" data-go="'+esc(m.sc.id)+'">'+esc(m.sc.nave||protDi(m.sc))+'</button><div class="sub">'+esc(protDi(m.sc))+'</div>':(m.s?'<button class="btn lnk" data-abbina="'+m.s.id+'">da abbinare</button>':''))+'</td><td class="sub">'+esc(m.descr||"")+'</td><td class="num">'+(m.dare?eur(m.dare):"")+'</td><td class="num">'+(m.avere?eur(m.avere):"")+'</td><td class="num '+(m.saldo>0.005?"pos":m.saldo<-0.005?"neg":"")+'">'+eur(m.saldo)+'</td><td>'+chipStato(m,tipo)+((forn||em)&&!m.pag&&m.st!=="pagata"?' <button class="btn small" data-paga="'+m.s.id+'">'+(em||m.comm?"incassata oggi":"pagata oggi")+'</button>':'')+'</td></tr>'; });
    chiudi();
    h+='</tbody><tfoot><tr><td colspan="'+(tutti?6:5)+'">Totale '+esc(periodoTxt(S.ecAnno,S.ecMese))+' · saldo al '+dIt(oggi())+'</td><td class="num">'+eur(T.dare)+'</td><td class="num">'+eur(T.avere)+'</td><td class="num">'+eur(T.saldo)+'</td><td></td></tr></tfoot></table></div>'; return h; }
  function testataCsv(tipo,tutti){ return ["Data",tutti?(tipo==="fornitore"?"Fornitore":"Cliente"):null,"Movimento","Riferimento","Nave","Prot.","Descrizione",tipo==="cliente"?"Addebito":"Fattura",tipo==="fornitore"?"Pagato":"Incassato","Saldo","Stato","Scadenza"].filter(function(x){ return x!==null; }); }
  function righeCsv(R,tipo,tutti){ return R.M.map(function(m){ var st=m.pag?"":(tipo==="cliente"?(m.st||{}).t||"":(tipo==="emesse"&&m.st==="pagata")?"incassata":m.st); return [dIt(m.d),tutti?(tipo==="fornitore"?m.forn:m.cli):null,m.tipo,m.doc,m.sc?m.sc.nave||"":"",m.sc?protDi(m.sc):"",m.descr||"",m.dare?m.dare:"",m.avere?m.avere:"",m.saldo,st,m.sca?dIt(m.sca):""].filter(function(x){ return x!==null; }); }); }

  /* ---- documento stampabile (carta intestata) ---- */
  function documento(R,tipo,nome,tutti){ var em=tipo==="emesse"; if(em) tipo="fornitore"; var forn=tipo==="fornitore", T=R.T, en=false;
    var h='<div class="doc rep" style="--docc:'+esc((S.cfg.doc&&S.cfg.doc.colore)||"#0e4e5c")+'">'+lettera();
    h+='<div style="display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;align-items:flex-start"><div><div class="sub" style="font-size:11px;color:#555">'+(em?"Fatture emesse da":forn?"Fornitore":"Cliente")+'</div><div class="messrs">'+esc(tutti?(forn?"Tutti i fornitori":"Tutti i clienti"):nome)+'</div></div><div style="text-align:right;font-size:12px">'+esc(S.cfg.ag.citta||"")+', '+dIt(oggi())+'<br>Periodo: '+esc(periodoTxt(S.ecAnno,S.ecMese))+'</div></div>';
    h+='<div class="titolo">'+(em?"ESTRATTO CONTO FATTURE EMESSE":"ESTRATTO CONTO "+(forn?"FORNITORE":"CLIENTE"))+'</div>';
    h+='<div class="kv"><div><b>'+(em?"Fatture emesse":forn?"Fatture ricevute":"Conti emessi")+'</b> '+T.n+' per € '+eur(T.dare)+'</div><div><b>'+(forn&&!em?"Pagamenti":"Incassi")+'</b> '+T.pagN+' per € '+eur(T.avere)+(forn&&!em&&T.commN?' <span style="font-size:11px">(di cui '+T.commN+' ns fatture di commissione € '+eur(T.comm)+')</span>':'')+'</div><div><b>Saldo</b> € '+eur(T.saldo)+' '+(T.saldo>0.005?(em?"da incassare":forn?"a nostro debito":"a Vs debito"):T.saldo<-0.005?(forn?"a nostro credito":"a Vs credito"):"(in pari)")+'</div><div><b>'+(forn?"Di cui scaduto":"Oltre 60 giorni")+'</b> € '+eur(T.scad)+'</div></div>';
    h+='<table><thead><tr><th>Data</th>'+(tutti?'<th>'+(forn?"Fornitore":"Cliente")+'</th>':'')+'<th>Movimento</th><th>Riferimento</th><th>Nave / prot.</th><th>Descrizione</th><th class="n">'+(forn?"Fattura":"Addebito")+'</th><th class="n">'+(forn&&!em?"Pagato":"Incassato")+'</th><th class="n">Saldo</th></tr></thead><tbody>';
    R.M.forEach(function(m){ h+='<tr'+(m.pag?' style="color:#555"':'')+'><td>'+dIt(m.d)+'</td>'+(tutti?'<td>'+esc(forn?m.forn:m.cli)+'</td>':'')+'<td>'+esc(m.tipo)+(!m.pag&&forn&&m.rit>0?' <span style="color:#a4262c;font-size:10px">(scaduta)</span>':'')+'</td><td>'+esc(m.doc)+'</td><td>'+esc(m.sc&&m.sc.id?(m.sc.nave||"")+" · "+protDi(m.sc):"")+'</td><td style="font-size:11px">'+esc(m.descr||"")+'</td><td class="n">'+(m.dare?eur(m.dare):"")+'</td><td class="n">'+(m.avere?eur(m.avere):"")+'</td><td class="n">'+eur(m.saldo)+'</td></tr>'; });
    h+='<tr class="tot"><td colspan="'+(tutti?6:5)+'">TOTALE</td><td class="n">'+eur(T.dare)+'</td><td class="n">'+eur(T.avere)+'</td><td class="n">'+eur(T.saldo)+'</td></tr></tbody></table>';
    var ap=R.M.filter(function(m){ return !m.pag&&m.res>0.005; });
    if(ap.length){ h+='<div class="titolo" style="font-size:14px;margin-top:18px">'+(em?"Fatture ancora da incassare":forn?"Fatture ancora da pagare":"Conti ancora da incassare")+'</div><table><thead><tr><th>Data</th><th>Riferimento</th><th>Nave / prot.</th><th>'+(forn?"Scadenza":"Da")+'</th><th class="n">Residuo</th></tr></thead><tbody>'+ap.map(function(m){ return '<tr><td>'+dIt(m.d)+'</td><td>'+esc(m.doc)+'</td><td>'+esc(m.sc&&m.sc.id?(m.sc.nave||"")+" · "+protDi(m.sc):"")+'</td><td>'+(forn?dIt(m.sca)+(m.rit>0?" (+"+m.rit+" gg)":""):(m.rit!==null?m.rit+" giorni":""))+'</td><td class="n">'+eur(m.res)+'</td></tr>'; }).join("")+'<tr class="tot"><td colspan="4">TOTALE '+(forn&&!em?"DA PAGARE":"DA INCASSARE")+'</td><td class="n">'+eur(T.aperte)+'</td></tr></tbody></table>'; }
    if(!forn&&S.cfg.doc.mostraBanca){ var b=S.cfg.banche[0]; if(b) h+='<div class="bank"><b>Coordinate bancarie</b><br>'+esc(b.nome)+'<br>IBAN '+esc(b.iban)+(b.bic?' · BIC/SWIFT '+esc(b.bic):"")+'<br>Beneficiario: '+esc(S.cfg.ag.nome)+'</div>'; }
    h+='<div class="piede">Estratto conto generato da Portolano il '+dIt(oggi())+(chi()?' · '+esc(chi()):'')+' · '+esc(S.cfg.ag.nome)+'</div></div>'; return h; }
  function testo(R,tipo,nome){ var em=tipo==="emesse", forn=tipo==="fornitore", T=R.T, L=[]; L.push((em?"ESTRATTO CONTO FATTURE EMESSE":"ESTRATTO CONTO "+(forn?"FORNITORE":"CLIENTE"))+" - "+nome+" - "+periodoTxt(S.ecAnno,S.ecMese)+" - al "+dIt(oggi())); L.push("");
    R.M.forEach(function(m){ L.push([dIt(m.d),m.tipo,m.doc,m.sc&&m.sc.id?(m.sc.nave||"")+" "+protDi(m.sc):"",m.dare?"+"+eur(m.dare):"",m.avere?"-"+eur(m.avere):"","saldo "+eur(m.saldo)].filter(Boolean).join("  ")); });
    L.push(""); L.push("Totale "+(forn?"fatture":"addebiti")+" € "+eur(T.dare)+"  "+(forn?"pagato":"incassato")+" € "+eur(T.avere)+"  SALDO € "+eur(T.saldo)+(T.aperte?"  (aperto € "+eur(T.aperte)+")":"")); L.push(""); L.push(S.cfg.ag.nome+" - "+S.cfg.ag.indirizzo+(S.cfg.ag.tel?" - tel. "+S.cfg.ag.tel:"")); return L.join("\n"); }
  function apriDoc(titolo,corpo,nomeFile){ var w=document.getElementById("docwrap"); if(!w){ w=document.createElement("div"); w.className="docwrap"; w.id="docwrap"; document.body.appendChild(w); }
    w.innerHTML='<div class="docbar"><span class="sub" style="color:#fff;align-self:center;margin-right:auto">'+esc(titolo)+' · nella finestra di stampa scegli "Salva come PDF"</span><button class="btn" id="docStampa">Stampa / salva PDF</button><button class="btn" id="docChiudi">Chiudi</button></div>'+corpo;
    var vecchio=document.title; document.title=nomeFile||titolo; on("docStampa","click",function(){ window.print(); }); on("docChiudi","click",function(){ w.remove(); document.title=vecchio; }); w.scrollTop=0; }
  function bottoniExport(pref){ return '<div class="acts"><button class="btn primary" id="'+pref+'Pdf" title="Estratto conto su carta intestata, da stampare o salvare in PDF">Estratto conto PDF</button><button class="btn" id="'+pref+'Xlsx" title="Foglio Excel con i movimenti">Excel</button><button class="btn" id="'+pref+'Csv">CSV</button><button class="btn" id="'+pref+'Mail" title="Prepara una e-mail con l\'estratto conto (e lo copia negli appunti)">Invia</button></div>'; }
  var ULT=null; /* ultimo estratto costruito: {R,tipo,nome,tutti} */
  function esportaXlsx(){ if(!ULT||typeof scriviXlsx!=="function"){ avviso("Esportazione Excel non disponibile."); return; } var t=testataCsv(ULT.tipo,ULT.tutti), r=righeCsv(ULT.R,ULT.tipo,ULT.tutti); r.push([]); r.push(["TOTALE","","","","","","",ULT.R.T.dare,ULT.R.T.avere,ULT.R.T.saldo].slice(0,t.length)); scriviXlsx("Estratto_conto_"+slug(ULT.nome)+"_"+oggi()+".xlsx",[{nome:"Estratto conto",testata:t,righe:r}]); avviso("File Excel pronto."); }
  function esportaCsv(){ if(!ULT) return; var t=testataCsv(ULT.tipo,ULT.tutti), r=righeCsv(ULT.R,ULT.tipo,ULT.tutti); function c(v){ if(typeof v==="number") return v.toFixed(2).replace(".",","); v=String(v==null?"":v); return /[;"\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v; } scarica("Estratto_conto_"+slug(ULT.nome)+"_"+oggi()+".csv","﻿"+t.map(c).join(";")+"\r\n"+r.map(function(x){ return x.map(c).join(";"); }).join("\r\n")+"\r\n"); avviso("File CSV pronto: si apre con Excel."); }
  function esportaPdf(){ if(!ULT) return; apriDoc("Estratto conto "+ULT.nome,documento(ULT.R,ULT.tipo,ULT.nome,ULT.tutti),"Estratto conto "+ULT.nome); }
  function invia(){ if(!ULT) return; var t=testo(ULT.R,ULT.tipo,ULT.nome); try{ navigator.clipboard&&navigator.clipboard.writeText(t); }catch(e){} var sub="Estratto conto "+ULT.nome+" al "+dIt(oggi())+" - "+S.cfg.ag.nomeBreve; window.location.href="mailto:?subject="+encodeURIComponent(sub)+"&body="+encodeURIComponent(t); avviso("E-mail preparata; il testo è anche negli appunti."); }

  /* ---- striscia fornitori/clienti con saldo aperto: consultazione immediata ---- */
  function striscia(tipo,sel){ var out=[], forn=tipo==="fornitore";
    if(forn){ var per={}; for(var k in S.spese){ var s=S.spese[k]; if(isNs(s)) continue; var f=upper(s.fornitore||""); if(!f) continue; per[f]=per[f]||{a:0,n:0,sc:0}; if(statoSpesa(s)!=="pagata"){ var r=residuoDi(s); if(isComm(s)) per[f].a-=r; else { per[f].a+=r; per[f].n++; var sca=scadenzaDi(s); if(sca&&giorniDa(sca)>0) per[f].sc+=r; } } } for(var x in per) out.push({k:x,a:per[x].a,n:per[x].n,sc:per[x].sc}); }
    else{ var pc={}; listaScali().forEach(function(sc){ if(sc.pagDir) return; var c=clienteDi(sc), f=totFda(sc); if(!f) return; var res=r2(f-incassato(sc)); pc[c]=pc[c]||{a:0,n:0,sc:0}; if(res>0.005){ pc[c].a+=res; pc[c].n++; if(giorniDa((sc.fda&&sc.fda.inviato)||sc.etd||sc.eta)>60) pc[c].sc+=res; } }); for(var y in pc) out.push({k:y,a:pc[y].a,n:pc[y].n,sc:pc[y].sc}); }
    out.sort(function(a,b){ return b.a-a.a||a.k.localeCompare(b.k); }); var ap=out.filter(function(o){ return o.a>0.005; }); if(!ap.length) return '';
    return '<div class="strip"><span class="sub">Con saldo aperto:</span>'+ap.slice(0,14).map(function(o){ return '<button class="chipbtn'+(o.k===sel?" on":"")+(o.sc?" no":"")+'" data-ecsel="'+esc(o.k)+'" title="'+o.n+' '+(forn?"fatture":"conti")+' aperti'+(o.sc?", scaduto € "+eur(o.sc):"")+'">'+esc(o.k)+' <b>€ '+eur(o.a)+'</b></button>'; }).join("")+(ap.length>14?'<span class="sub">+'+(ap.length-14)+' altri</span>':'')+'</div>'; }

  /* ---- vista Fornitori (sostituisce quella base): estratto conto o elenco fatture ---- */
  var _vf=window.vistaFornitori;
  window.vistaFornitori=function(){ if(S.ecMese&&S.ecAnno&&S.ecMese.slice(0,4)!==S.ecAnno) S.ecMese="";
    var F=tuttiFornitori(), f=S.forn||F[0]||"", tutti=(f==="*");
    var toggle='<div class="seg" role="tablist"><button role="tab" data-ecvista="movimenti" aria-selected="'+(S.ecVista==="movimenti")+'">Estratto conto</button><button role="tab" data-ecvista="fatture" aria-selected="'+(S.ecVista==="fatture")+'">Elenco fatture</button></div>';
    if(S.ecVista==="fatture"&&_vf){ var h0=_vf(); h0=h0.replace('<div class="spacer"></div><span class="sub">',toggle+'<div class="spacer"></div><span class="sub">'); var i0=h0.indexOf('<div class="panel">'); return h0.slice(0,i0)+striscia("fornitore",f)+h0.slice(i0); }
    var R=movFornitore(f,{anno:S.ecAnno,mese:S.ecMese,stato:S.fornStato,q:S.ecQ}), anni={}, mesi={}, em=isNsNome(f), tipoEc=em?"emesse":"fornitore";
    for(var k in S.spese){ var s=S.spese[k]; if(!tutti&&upper(s.fornitore)!==f) continue; var d=s.dataFattura||(S.scali[s.scalo]||{}).eta||""; anni[anno(d)]=1; var m=ym(d); if(m&&(!S.ecAnno||m.slice(0,4)===S.ecAnno)) mesi[m]=1; }
    ULT={R:R,tipo:tipoEc,nome:tutti?"tutti i fornitori":nomeContab(f),tutti:tutti};
    var h='<div class="top"><h1>Fornitori</h1><span class="stato">'+(em?"fatture emesse da "+esc(nomeAzienda()):"estratto conto "+esc(tutti?"tutti i fornitori":f))+' · '+esc(periodoTxt(S.ecAnno,S.ecMese))+'</span><div class="spacer"></div>'+bottoniExport("ec")+'</div>';
    h+=striscia("fornitore",f);
    h+='<div class="panel"><div class="panel-h"><div class="field" style="flex:1 1 160px;min-width:150px"><input id="ecQ" type="search" placeholder="Cerca fattura: n., nave, importo…" value="'+esc(S.ecQ||"")+'" aria-label="Cerca nei movimenti"></div><div class="field"><select id="ecForn" aria-label="Fornitore">'+opt("*","tutti i fornitori",f)+F.map(function(x){ return opt(x,isNsNome(x)?nomeAzienda()+" \u00b7 fatture emesse (NS FATTURA)":etichettaForn(x),f); }).join("")+'</select></div>'+
       '<div class="field"><select id="ecStato">'+opt("tutte","tutti i movimenti",S.fornStato||"tutte")+opt("aperte",em?"solo fatture da incassare":"solo fatture da pagare",S.fornStato)+opt("pagate",em?"solo fatture incassate":"solo fatture pagate",S.fornStato)+'</select></div>'+
       '<div class="field"><select id="ecAnno">'+opt("","tutti gli anni",S.ecAnno)+Object.keys(anni).sort().reverse().map(function(y){ return opt(y,y,S.ecAnno); }).join("")+'</select></div>'+
       '<div class="field"><select id="ecMese" aria-label="Mese">'+opt("","tutti i mesi",S.ecMese)+Object.keys(mesi).sort().reverse().map(function(m){ return opt(m,nomeMese(m),S.ecMese); }).join("")+'</select></div>'+toggle+'</div>';
    h+='<div class="panel-b" style="padding-bottom:0">'+tiles(R,tipoEc)+'</div>';
    if(!R.M.length) h+='<div class="panel-b sub">Nessun movimento per '+esc(tutti?"i fornitori":nomeContab(f))+' in '+esc(periodoTxt(S.ecAnno,S.ecMese))+'.</div>';
    else h+=tabella(R,tipoEc,tutti);
    return h+'</div>'; };

  /* ---- estratto conto cliente e fornitore dentro Contabilità (chiamati da conta.js) ---- */
  function vistaCliente(testa,setCsv,esporta){ var cl={}, anni={}, mesi={}; listaScali().forEach(function(sc){ cl[clienteDi(sc)]=1; var d=sc.eta||sc.creato||""; anni[anno(d)]=1; var m=ym(d); if(m&&(!S.ct.anno||m.slice(0,4)===S.ct.anno)) mesi[m]=1; });
    var nomi=Object.keys(cl).sort(), c=S.ct.cliente==="*"?"*":(S.ct.cliente&&cl[S.ct.cliente]?S.ct.cliente:(nomi[0]||"")), tutti=c==="*";
    var sv=S.ecAnno, sm=S.ecMese; S.ecAnno=S.ct.anno; S.ecMese=S.ct.mese||""; var R=movCliente(c,{anno:S.ct.anno,mese:S.ct.mese,stato:S.ct.solo==="aperte"?"aperte":S.ct.solo==="pagate"?"pagate":""});
    ULT={R:R,tipo:"cliente",nome:tutti?"tutti i clienti":c,tutti:tutti};
    var h=testa("Estratto conto cliente",(tutti?"tutti i clienti":c)+" · saldo € "+eur(R.T.saldo),bottoniExport("ec").replace('<div class="acts">','').replace(/<\/div>$/,'').replace('<button class="btn" id="ecCsv">CSV</button>',''));
    h+=striscia("cliente",c);
    h+='<div class="panel"><div class="panel-h"><div class="field" style="min-width:220px"><select id="ctCliente" aria-label="Cliente">'+opt("*","tutti i clienti",c)+nomi.map(function(x){ return opt(x,x,c); }).join("")+'</select></div><div class="field"><select id="ctAnno">'+opt("","tutti gli anni",S.ct.anno)+Object.keys(anni).sort().reverse().map(function(y){ return opt(y,y,S.ct.anno); }).join("")+'</select></div><div class="field"><select id="ctMese">'+opt("","tutti i mesi",S.ct.mese)+Object.keys(mesi).sort().reverse().map(function(m){ return opt(m,nomeMese(m),S.ct.mese); }).join("")+'</select></div><div class="field"><select id="ctSolo">'+opt("","tutti i movimenti",S.ct.solo)+opt("aperte","solo conti da incassare",S.ct.solo)+opt("pagate","solo conti saldati",S.ct.solo)+'</select></div></div>';
    h+='<div class="panel-b" style="padding-bottom:0">'+tiles(R,"cliente")+'</div>';
    if(!R.M.length) h+='<div class="panel-b sub">Nessun movimento per questo cliente nel periodo.</div>'; else h+=tabella(R,"cliente",tutti);
    S.ecAnno=sv; S.ecMese=sm;
    var t=testataCsv("cliente",tutti), r=righeCsv(R,"cliente",tutti); setCsv(function(){ esporta("estratto_conto_"+slug(tutti?"clienti":c),t,r); });
    return h+'</div>'; }

  /* ---- tabelle a schede sul telefono: etichetta ogni cella con l'intestazione della colonna ---- */
  function etichette(){ document.querySelectorAll("#main table").forEach(function(t){ if(t.closest(".doc")) return; var ths=Array.prototype.map.call(t.querySelectorAll("thead th"),function(x){ return x.textContent.replace(/\s+/g," ").trim(); }); if(ths.length<3) return; t.classList.add("cards");
      t.querySelectorAll("tbody tr").forEach(function(tr){ var i=0; Array.prototype.forEach.call(tr.children,function(td){ td.setAttribute("data-l",ths[i]||""); i+=td.colSpan||1; }); }); }); }

  var _render=window.render;
  window.render=function(){ _render(); etichette(); };
  var _ev=window.eventi;
  window.eventi=function(){ _ev();
    on("ecQ","input",function(){ S.ecQ=this.value; var p=this.selectionStart; render(); var x=document.getElementById("ecQ"); if(x){ x.focus(); x.setSelectionRange(p,p); } }); on("ecPdf","click",esportaPdf); on("ecXlsx","click",esportaXlsx); on("ecCsv","click",esportaCsv); on("ecMail","click",invia);
    document.querySelectorAll("[data-ecvista]").forEach(function(b){ b.addEventListener("click",function(){ S.ecVista=b.getAttribute("data-ecvista"); render(); }); });
    document.querySelectorAll("[data-ecsel]").forEach(function(b){ b.addEventListener("click",function(){ var k=b.getAttribute("data-ecsel"); if(S.view==="fornitori"){ S.forn=k; } else { S.ct.cliente=k; } render(); }); });
  };
  window.PortolanoEC={movFornitore:movFornitore,movCliente:movCliente,vistaCliente:vistaCliente,documento:documento,etichette:etichette};
  etichette();
})();
