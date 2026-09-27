/* ---------- Portolano: Contabilità — registro fatture, scadenzario fornitori, partite aperte clienti, estratto conto cliente, prima nota (tutto esportabile in CSV) ---------- */
(function(){
  "use strict";
  var TABS=[["registro","Registro fatture"],["scadenzario","Scadenzario fornitori"],["clienti","Partite aperte clienti"],["eccliente","Estratto conto cliente"],["primanota","Prima nota"]];
  S.contaTab=S.contaTab||"registro"; S.ct=S.ct||{anno:"",mese:"",forn:"",stato:"tutte",q:"",cliente:"",solo:"",banca:""};
  var MESI_IT=["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"];
  function ym(d){ d=String(d||""); return /^\d{4}-\d{2}/.test(d)?d.slice(0,7):""; }
  function nomeMese(m){ if(!m) return "senza data"; var p=m.split("-"); return (MESI_IT[parseInt(p[1],10)-1]||p[1])+" "+p[0]; }
  function clienteDi(sc){ return (sc.cliente||(sc.intestazione||"").split("\n")[0]||"—").trim(); }
  function giorniDa(d){ if(!d) return null; var g=Math.floor((new Date(oggi()+"T00:00:00")-new Date(d+"T00:00:00"))/86400000); return isNaN(g)?null:g; }
  function n2(x){ return (Math.round((Number(x)||0)*100)/100).toFixed(2).replace(".",","); }
  function csvCell(v){ v=v===null||v===undefined?"":String(v); return /[;"\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v; }
  function esporta(nome,testata,righe){ var t="﻿"+testata.map(csvCell).join(";")+"\r\n"+righe.map(function(r){ return r.map(csvCell).join(";"); }).join("\r\n")+"\r\n"; scarica(nome+"_"+oggi()+".csv",t); avviso("File CSV pronto: si apre con Excel."); }
  function protDi(sc){ return sc&&sc.id?(sc.prot||"?")+"/"+String(sc.annoProt||anno(sc.eta)||"").slice(2):""; }
  function lnkScalo(sc){ return sc&&sc.id?'<button class="btn lnk" data-go="'+esc(sc.id)+'">'+esc(protDi(sc))+'</button>':'<span class="chip warn">da abbinare</span>'; }
  function selAnni(id,anni,v){ return '<div class="field"><select id="'+id+'" aria-label="Anno">'+opt("","tutti gli anni",v)+Object.keys(anni).sort().reverse().map(function(y){ return opt(y,y,v); }).join("")+'</select></div>'; }
  function selMesi(id,mesi,v){ var l=Object.keys(mesi).sort().reverse().filter(function(m){ return !S.ct.anno||m.slice(0,4)===S.ct.anno; }); return '<div class="field"><select id="'+id+'" aria-label="Mese">'+opt("","tutti i mesi",v)+l.map(function(m){ return opt(m,nomeMese(m),v); }).join("")+'</select></div>'; }
  function testa(tit,sotto,extra){ return '<div class="top"><h1>Contabilità</h1><span class="stato">'+esc(tit)+(sotto?" · "+esc(sotto):"")+'</span><div class="spacer"></div><div class="acts">'+(extra||"")+'<button class="btn" id="ctCsv">Esporta CSV (Excel)</button></div></div>'+
    '<div class="panel" style="margin-bottom:12px"><div class="subtabs" role="tablist">'+TABS.map(function(t){ return '<button role="tab" data-ctab="'+t[0]+'" aria-selected="'+(S.contaTab===t[0])+'">'+t[1]+'</button>'; }).join("")+'</div></div>'; }
  var CSV=null;

  /* ---- 1. registro fatture ricevute ---- */
  function registro(){ var anni={},mesi={},forn={},righe=[],q=upper(S.ct.q);
    for(var k in S.spese){ var s=S.spese[k], sc=S.scali[s.scalo]||{}, d=s.dataFattura||sc.eta||""; anni[anno(d)]=1; forn[upper(s.fornitore||"")]=1;
      if(S.ct.anno&&anno(d)!==S.ct.anno) continue; var m=ym(d); if(m) mesi[m]=1; if(S.ct.mese&&m!==S.ct.mese) continue;
      if(S.ct.forn&&upper(s.fornitore)!==S.ct.forn) continue; if(S.ct.stato==="aperte"&&s.dataPagamento) continue; if(S.ct.stato==="pagate"&&!s.dataPagamento) continue;
      if(q){ var t=upper([s.fornitore,s.numFattura,s.descrizione,s.note,nomeVoce(s),sc.nave,sc.prot,clienteDi(sc)].join(" ")); if(!q.split(/\s+/).every(function(w){ return t.indexOf(w)>=0; })) continue; }
      righe.push({s:s,sc:sc,d:d}); }
    righe.sort(function(a,b){ return (a.d||"").localeCompare(b.d||"")||String(a.s.fornitore).localeCompare(String(b.s.fornitore)); });
    var tot=0,ape=0; righe.forEach(function(r){ tot+=num(r.s.totale)||0; if(!r.s.dataPagamento) ape+=num(r.s.totale)||0; });
    var h=testa("Registro fatture ricevute",righe.length+" fatture · € "+eur(tot)+(ape?" · aperte € "+eur(ape):""));
    h+='<div class="panel"><div class="panel-h"><div class="field" style="flex:1;min-width:160px"><input id="ctQ" placeholder="Cerca fornitore, n. fattura, nave, cliente, voce…" value="'+esc(S.ct.q)+'" aria-label="Cerca"></div>'+selAnni("ctAnno",anni,S.ct.anno)+selMesi("ctMese",mesi,S.ct.mese)+
      '<div class="field"><select id="ctForn" aria-label="Fornitore">'+opt("","tutti i fornitori",S.ct.forn)+tuttiFornitori().map(function(f){ return opt(f,etichettaForn(f),S.ct.forn); }).join("")+'</select></div>'+
      '<div class="field"><select id="ctStato">'+opt("tutte","tutte",S.ct.stato)+opt("aperte","da pagare",S.ct.stato)+opt("pagate","pagate",S.ct.stato)+'</select></div></div>';
    if(!righe.length) h+='<div class="panel-b sub">Nessuna fattura con questi filtri.</div>';
    else{ h+='<div class="scroll"><table><thead><tr><th>Data fatt.</th><th>N.</th><th>Fornitore</th><th>Voce</th><th>Prot.</th><th>Nave</th><th>Cliente</th><th class="num">Totale €</th><th>Scadenza</th><th>Pagata</th><th>Note</th></tr></thead><tbody>';
      righe.forEach(function(r){ var s=r.s, sc=r.sc, sca=scadenzaDi(s), rit=(!s.dataPagamento&&sca)?giorniDa(sca):null;
        h+='<tr><td>'+dIt(s.dataFattura)+'</td><td>'+esc(s.numFattura)+'</td><td><strong>'+esc(s.fornitore)+'</strong>'+chipDoppia(s)+'</td><td class="sub">'+esc(nomeVoce(s))+'</td><td>'+lnkScalo(sc)+'</td><td>'+esc(sc.nave||"")+'</td><td class="sub">'+esc(sc.id?clienteDi(sc):"")+'</td><td class="num">'+eur(s.totale)+'</td><td>'+dIt(sca)+(rit>0?' <span class="chip no">+'+rit+' gg</span>':"")+'</td><td>'+(s.dataPagamento?'<span class="chip ok">'+dIt(s.dataPagamento)+(s.modo?" · "+esc(s.modo):"")+'</span>':'<span class="chip warn">aperta</span>')+'</td><td class="sub">'+esc([s.descrizione,s.note].filter(Boolean).join(" · "))+'</td></tr>'; });
      h+='</tbody><tfoot><tr><td colspan="7">Totale'+(ape?' <span class="sub">(di cui aperte € '+eur(ape)+')</span>':'')+'</td><td class="num">'+eur(tot)+'</td><td colspan="3"></td></tr></tfoot></table></div>'; }
    CSV=function(){ esporta("registro_fatture",["Data fattura","N. fattura","Fornitore","Voce","Prot.","Nave","Cliente","Totale","Scadenza","Pagata il","Modo","Descrizione","Note"],righe.map(function(r){ var s=r.s,sc=r.sc; return [dIt(s.dataFattura),s.numFattura,s.fornitore,nomeVoce(s),protDi(sc),sc.nave||"",sc.id?clienteDi(sc):"",n2(s.totale),dIt(scadenzaDi(s)),dIt(s.dataPagamento),s.modo||"",s.descrizione||"",s.note||""]; })); };
    return h+'</div>'; }

  /* ---- 2. scadenzario fornitori (sospesi passivi) ---- */
  function scadenzario(){ var righe=[], per={}, tot=0, scad=0, sett=0, forn={};
    for(var k in S.spese){ var s=S.spese[k]; if(s.dataPagamento||num(s.totale)===null||upper(s.fornitore)==="NS FATTURA") continue; var sc=S.scali[s.scalo]||{}; if(sc.pagDir) continue; forn[upper(s.fornitore)]=1;
      if(S.ct.forn&&upper(s.fornitore)!==S.ct.forn) continue; var sca=scadenzaDi(s), rit=giorniDa(sca); if(S.ct.solo==="scadute"&&!(rit>0)) continue; if(S.ct.solo==="settimana"&&!(rit!==null&&rit<=0&&rit>=-7)) continue;
      var t=num(s.totale); tot+=t; if(rit>0) scad+=t; else if(rit!==null&&rit>=-7) sett+=t; righe.push({s:s,sc:sc,sca:sca,rit:rit}); var p=per[upper(s.fornitore)]||(per[upper(s.fornitore)]={n:0,t:0,scad:0}); p.n++; p.t+=t; if(rit>0) p.scad+=t; }
    righe.sort(function(a,b){ return String(a.s.fornitore).localeCompare(String(b.s.fornitore))||(a.sca||"").localeCompare(b.sca||""); });
    var h=testa("Scadenzario fornitori",righe.length+" fatture aperte");
    h+='<div class="tiles"><div class="tile warn"><div class="k">Da pagare</div><div class="v">€ '+eur(tot)+'</div><div class="s">'+righe.length+' fatture aperte</div></div><div class="tile '+(scad?"no":"ok")+'"><div class="k">Scadute</div><div class="v">€ '+eur(scad)+'</div><div class="s">oltre la scadenza</div></div><div class="tile"><div class="k">In scadenza (7 gg)</div><div class="v">€ '+eur(sett)+'</div><div class="s">da pagare questa settimana</div></div><div class="tile"><div class="k">Fornitori</div><div class="v">'+Object.keys(per).length+'</div><div class="s">con partite aperte</div></div></div>';
    h+='<div class="panel"><div class="panel-h"><div class="field"><select id="ctForn" aria-label="Fornitore">'+opt("","tutti i fornitori",S.ct.forn)+Object.keys(forn).sort().map(function(f){ return opt(f,etichettaForn(f),S.ct.forn); }).join("")+'</select></div><div class="field"><select id="ctSolo">'+opt("","tutte le aperte",S.ct.solo)+opt("scadute","solo scadute",S.ct.solo)+opt("settimana","in scadenza entro 7 gg",S.ct.solo)+'</select></div><span class="sub">Scadenza = data indicata sulla fattura, altrimenti data fattura (o partenza della nave, se la data manca) + '+(num(S.cfg.giorniScadenza)||30)+' giorni. Escluse le fatture degli scali a pagamento diretto.</span></div>';
    if(!righe.length) h+='<div class="panel-b sub">Nessuna fattura aperta.</div>';
    else{ h+='<div class="scroll"><table><thead><tr><th>Fornitore</th><th>N.</th><th>Data fatt.</th><th>Scadenza</th><th>Ritardo</th><th>Prot.</th><th>Nave</th><th class="num">Importo €</th><th></th></tr></thead><tbody>'; var cur=null;
      function chiudi(){ if(cur===null) return; var p=per[cur]; h+='<tr class="tot" style="background:var(--paper2)"><td colspan="7"><b>Totale '+esc(cur)+'</b> <span class="sub">'+p.n+' fatture'+(p.scad?' · scadute € '+eur(p.scad):'')+'</span></td><td class="num"><b>'+eur(p.t)+'</b></td><td></td></tr>'; }
      righe.forEach(function(r){ var f=upper(r.s.fornitore); if(f!==cur){ chiudi(); cur=f; }
        h+='<tr><td>'+esc(r.s.fornitore)+chipDoppia(r.s)+'</td><td>'+esc(r.s.numFattura)+'</td><td>'+dIt(r.s.dataFattura)+'</td><td>'+dIt(r.sca)+'</td><td>'+(r.rit>0?'<span class="chip no">scaduta da '+r.rit+' gg</span>':r.rit===null?'':r.rit>=-7?'<span class="chip warn">tra '+(-r.rit)+' gg</span>':'<span class="chip grey">tra '+(-r.rit)+' gg</span>')+'</td><td>'+lnkScalo(r.sc)+'</td><td>'+esc(r.sc.nave||"")+'</td><td class="num">'+eur(r.s.totale)+'</td><td><button class="btn small" data-paga="'+r.s.id+'">segna pagata oggi</button></td></tr>'; });
      chiudi(); h+='</tbody><tfoot><tr><td colspan="7">Totale da pagare</td><td class="num">'+eur(tot)+'</td><td></td></tr></tfoot></table></div>'; }
    CSV=function(){ esporta("scadenzario_fornitori",["Fornitore","N. fattura","Data fattura","Scadenza","Giorni di ritardo","Prot.","Nave","Cliente","Importo","Voce","Descrizione"],righe.map(function(r){ return [r.s.fornitore,r.s.numFattura,dIt(r.s.dataFattura),dIt(r.sca),r.rit>0?r.rit:"",protDi(r.sc),r.sc.nave||"",r.sc.id?clienteDi(r.sc):"",n2(r.s.totale),nomeVoce(r.s),r.s.descrizione||""]; })); };
    return h+'</div>'; }

  /* ---- 3. partite aperte clienti (sospesi attivi) ---- */
  function clienti(){ var righe=[], per={}, tot=0, cl={};
    listaScali().forEach(function(sc){ if(sc.pagDir) return; var f=totFda(sc); if(!f) return; var i=incassato(sc), res=r2(f-i); if(res<=0.005) return; var c=clienteDi(sc); cl[c]=1; if(S.ct.cliente&&c!==S.ct.cliente) return;
      var rif=sc.fda&&sc.fda.inviato||sc.etd||sc.eta||"", eta=giorniDa(rif); tot+=res; righe.push({sc:sc,c:c,f:f,i:i,res:res,rif:rif,eta:eta}); var p=per[c]||(per[c]={n:0,t:0}); p.n++; p.t+=res; });
    righe.sort(function(a,b){ return a.c.localeCompare(b.c)||(a.rif||"").localeCompare(b.rif||""); });
    var old=righe.filter(function(r){ return r.eta>60; }).reduce(function(a,r){ return a+r.res; },0);
    var h=testa("Partite aperte clienti",righe.length+" conti da incassare");
    h+='<div class="tiles"><div class="tile no"><div class="k">Da incassare</div><div class="v">€ '+eur(tot)+'</div><div class="s">'+righe.length+' scali</div></div><div class="tile '+(old?"warn":"")+'"><div class="k">Oltre 60 giorni</div><div class="v">€ '+eur(old)+'</div><div class="s">dall\'invio del FDA (o dalla partenza)</div></div><div class="tile"><div class="k">Clienti</div><div class="v">'+Object.keys(per).length+'</div><div class="s">con partite aperte</div></div></div>';
    h+='<div class="panel"><div class="panel-h"><div class="field"><select id="ctCliente" aria-label="Cliente">'+opt("","tutti i clienti",S.ct.cliente)+Object.keys(cl).sort().map(function(c){ return opt(c,c,S.ct.cliente); }).join("")+'</select></div><span class="sub">Residuo = conto FDA − incassi registrati. Gli scali a pagamento diretto (PAG DIR) sono esclusi.</span></div>';
    if(!righe.length) h+='<div class="panel-b sub">Nessuna partita aperta: tutti i conti sono incassati.</div>';
    else{ h+='<div class="scroll"><table><thead><tr><th>Cliente</th><th>Prot.</th><th>Nave</th><th>ETA</th><th>FDA inviato</th><th>Anzianità</th><th class="num">FDA €</th><th class="num">Incassato €</th><th class="num">Residuo €</th></tr></thead><tbody>'; var cur=null;
      function chiudi(){ if(cur===null) return; var p=per[cur]; h+='<tr class="tot" style="background:var(--paper2)"><td colspan="8"><b>Totale '+esc(cur)+'</b> <span class="sub">'+p.n+' scali</span></td><td class="num"><b>'+eur(p.t)+'</b></td></tr>'; }
      righe.forEach(function(r){ if(r.c!==cur){ chiudi(); cur=r.c; } var sc=r.sc;
        h+='<tr><td>'+esc(r.c)+'</td><td>'+lnkScalo(sc)+'</td><td><strong>'+esc(sc.nave||"")+'</strong></td><td>'+dIt(sc.eta)+'</td><td>'+(sc.fda&&sc.fda.inviato?dIt(sc.fda.inviato):'<span class="chip grey">non inviato</span>')+'</td><td>'+(r.eta===null?"":r.eta>60?'<span class="chip no">'+r.eta+' gg</span>':r.eta>30?'<span class="chip warn">'+r.eta+' gg</span>':'<span class="chip grey">'+r.eta+' gg</span>')+'</td><td class="num">'+eur(r.f)+'</td><td class="num">'+(r.i?eur(r.i):"—")+'</td><td class="num"><b>'+eur(r.res)+'</b></td></tr>'; });
      chiudi(); h+='</tbody><tfoot><tr><td colspan="8">Totale da incassare</td><td class="num">'+eur(tot)+'</td></tr></tfoot></table></div>'; }
    CSV=function(){ esporta("partite_aperte_clienti",["Cliente","Prot.","Nave","ETA","ETD","FDA inviato il","Giorni","FDA","Incassato","Residuo"],righe.map(function(r){ var sc=r.sc; return [r.c,protDi(sc),sc.nave||"",dIt(sc.eta),dIt(sc.etd),dIt(sc.fda&&sc.fda.inviato),r.eta===null?"":r.eta,n2(r.f),n2(r.i),n2(r.res)]; })); };
    return h+'</div>'; }

  /* ---- 4. estratto conto cliente: addebiti (FDA) e incassi in ordine di data, saldo progressivo ---- */
  function ecCliente(){ var cl={}, anni={}; listaScali().forEach(function(sc){ cl[clienteDi(sc)]=1; anni[anno(sc.eta||sc.creato)]=1; });
    var nomi=Object.keys(cl).sort(), c=S.ct.cliente&&cl[S.ct.cliente]?S.ct.cliente:(nomi[0]||""), mov=[];
    listaScali().forEach(function(sc){ if(clienteDi(sc)!==c) return; if(S.ct.anno&&anno(sc.eta||sc.creato)!==S.ct.anno) return; var f=totFda(sc), usaPda=!f&&totPda(sc)&&!sc.pagDir;
      if(f||usaPda) mov.push({d:(sc.fda&&sc.fda.inviato)||sc.etd||sc.eta||"",sc:sc,tipo:usaPda?"PDA (preventivo)":"FDA"+(sc.pagDir?" (pag. diretto)":""),dare:sc.pagDir?0:(f||totPda(sc)),avere:0,note:usaPda?"conto non ancora consuntivato":""});
      (sc.incassi||[]).forEach(function(i){ var b=(S.cfg.banche||[]).filter(function(x){ return x.id===i.banca; })[0]; mov.push({d:i.data||"",sc:sc,tipo:"Incasso",dare:0,avere:num(i.importo)||0,note:[(b?b.nome:i.banca),i.note].filter(Boolean).join(" · ")}); }); });
    mov.sort(function(a,b){ return (a.d||"").localeCompare(b.d||"")||(a.tipo==="Incasso"?1:0)-(b.tipo==="Incasso"?1:0); });
    var td=0,ta=0,saldo=0; mov.forEach(function(m){ td+=m.dare; ta+=m.avere; m.saldo=r2(td-ta); }); saldo=r2(td-ta);
    var h=testa("Estratto conto cliente",c?c+" · saldo € "+eur(saldo):"nessun cliente");
    h+='<div class="panel"><div class="panel-h"><div class="field" style="min-width:220px"><select id="ctCliente" aria-label="Cliente">'+nomi.map(function(x){ return opt(x,x,c); }).join("")+'</select></div>'+selAnni("ctAnno",anni,S.ct.anno)+'<div class="spacer"></div><span class="sub">'+mov.length+' movimenti · addebiti € '+eur(td)+' · incassi € '+eur(ta)+'</span></div>';
    if(!mov.length) h+='<div class="panel-b sub">Nessun movimento per questo cliente nel periodo.</div>';
    else{ h+='<div class="scroll"><table><thead><tr><th>Data</th><th>Prot.</th><th>Nave</th><th>Movimento</th><th>Riferimento</th><th class="num">Dare €</th><th class="num">Avere €</th><th class="num">Saldo €</th></tr></thead><tbody>';
      mov.forEach(function(m){ h+='<tr><td>'+dIt(m.d)+'</td><td>'+lnkScalo(m.sc)+'</td><td>'+esc(m.sc.nave||"")+'</td><td>'+esc(m.tipo)+'</td><td class="sub">'+esc(m.note||"")+'</td><td class="num">'+(m.dare?eur(m.dare):"")+'</td><td class="num">'+(m.avere?eur(m.avere):"")+'</td><td class="num '+(m.saldo>0.005?"pos":"")+'">'+eur(m.saldo)+'</td></tr>'; });
      h+='</tbody><tfoot><tr><td colspan="5">Totali · saldo a '+dIt(oggi())+'</td><td class="num">'+eur(td)+'</td><td class="num">'+eur(ta)+'</td><td class="num">'+eur(saldo)+'</td></tr></tfoot></table></div>'; }
    CSV=function(){ esporta("estratto_conto_"+(c||"cliente").replace(/[^A-Za-z0-9]+/g,"_"),["Cliente","Data","Prot.","Nave","Movimento","Riferimento","Dare","Avere","Saldo"],mov.map(function(m){ return [c,dIt(m.d),protDi(m.sc),m.sc.nave||"",m.tipo,m.note||"",m.dare?n2(m.dare):"",m.avere?n2(m.avere):"",n2(m.saldo)]; })); };
    return h+'</div>'; }

  /* ---- 5. prima nota: incassi e pagamenti per mese (e per banca) ---- */
  function primaNota(){ var mov=[], anni={};
    for(var k in S.scali){ var sc=S.scali[k]; (sc.incassi||[]).forEach(function(i){ var b=(S.cfg.banche||[]).filter(function(x){ return x.id===i.banca; })[0]; mov.push({d:i.data||"",tipo:"Incasso",chi:clienteDi(sc),sc:sc,banca:b?b.nome:(i.banca||""),entrata:num(i.importo)||0,uscita:0,note:i.note||""}); }); }
    for(var j in S.spese){ var s=S.spese[j]; if(!s.dataPagamento||num(s.totale)===null||upper(s.fornitore)==="NS FATTURA") continue; var sc2=S.scali[s.scalo]||{}; mov.push({d:s.dataPagamento,tipo:"Pagamento",chi:s.fornitore,sc:sc2,banca:s.modo||"",entrata:0,uscita:num(s.totale),note:(s.numFattura?"fatt. "+s.numFattura+" ":"")+(s.descrizione||"")}); }
    mov.forEach(function(m){ anni[anno(m.d)]=1; }); mov=mov.filter(function(m){ return (!S.ct.anno||anno(m.d)===S.ct.anno)&&(!S.ct.mese||ym(m.d)===S.ct.mese)&&(!S.ct.banca||m.banca===S.ct.banca); });
    mov.sort(function(a,b){ return (a.d||"").localeCompare(b.d||"")||a.tipo.localeCompare(b.tipo); });
    var te=0,tu=0,perMese={},banche={}; mov.forEach(function(m){ te+=m.entrata; tu+=m.uscita; var a=perMese[ym(m.d)||"—"]||(perMese[ym(m.d)||"—"]={e:0,u:0}); a.e+=m.entrata; a.u+=m.uscita; if(m.banca) banche[m.banca]=1; });
    var mesi={}; mov.forEach(function(m){ var y=ym(m.d); if(y) mesi[y]=1; });
    var h=testa("Prima nota",mov.length+" movimenti · entrate € "+eur(te)+" · uscite € "+eur(tu));
    h+='<div class="tiles"><div class="tile ok"><div class="k">Incassi</div><div class="v">€ '+eur(te)+'</div><div class="s">bonifici dai clienti</div></div><div class="tile warn"><div class="k">Pagamenti</div><div class="v">€ '+eur(tu)+'</div><div class="s">fatture fornitori pagate</div></div><div class="tile '+(te-tu>=0?"ok":"no")+'"><div class="k">Saldo del periodo</div><div class="v">'+(te-tu<0?"−":"")+'€ '+eur(Math.abs(te-tu))+'</div><div class="s">incassi − pagamenti</div></div></div>';
    h+='<div class="panel"><div class="panel-h">'+selAnni("ctAnno",anni,S.ct.anno)+selMesi("ctMese",mesi,S.ct.mese)+'<div class="field"><select id="ctBanca" aria-label="Banca / modo">'+opt("","tutte le banche / modi",S.ct.banca)+Object.keys(banche).sort().map(function(b){ return opt(b,b,S.ct.banca); }).join("")+'</select></div><span class="sub">Entrate = incassi registrati sugli scali; uscite = fatture fornitori con data di pagamento.</span></div>';
    if(!mov.length) h+='<div class="panel-b sub">Nessun movimento nel periodo.</div>';
    else{ h+='<div class="scroll"><table><thead><tr><th>Data</th><th>Movimento</th><th>Cliente / fornitore</th><th>Prot.</th><th>Nave</th><th>Banca / modo</th><th>Riferimento</th><th class="num">Entrate €</th><th class="num">Uscite €</th></tr></thead><tbody>'; var cur=null;
      function chiudi(){ if(cur===null||S.ct.mese) return; var a=perMese[cur]; h+='<tr class="tot" style="background:var(--paper2)"><td colspan="7"><b>Totale '+esc(nomeMese(cur==="—"?"":cur))+'</b></td><td class="num"><b>'+eur(a.e)+'</b></td><td class="num"><b>'+eur(a.u)+'</b></td></tr>'; }
      mov.forEach(function(m){ var y=ym(m.d)||"—"; if(y!==cur){ chiudi(); cur=y; }
        h+='<tr><td>'+dIt(m.d)+'</td><td>'+(m.tipo==="Incasso"?'<span class="chip ok">incasso</span>':'<span class="chip warn">pagamento</span>')+'</td><td>'+esc(m.chi)+'</td><td>'+lnkScalo(m.sc)+'</td><td>'+esc(m.sc.nave||"")+'</td><td class="sub">'+esc(m.banca)+'</td><td class="sub">'+esc(m.note)+'</td><td class="num">'+(m.entrata?eur(m.entrata):"")+'</td><td class="num">'+(m.uscita?eur(m.uscita):"")+'</td></tr>'; });
      chiudi(); h+='</tbody><tfoot><tr><td colspan="7">Totale</td><td class="num">'+eur(te)+'</td><td class="num">'+eur(tu)+'</td></tr></tfoot></table></div>'; }
    CSV=function(){ esporta("prima_nota",["Data","Movimento","Cliente / fornitore","Prot.","Nave","Banca / modo","Riferimento","Entrate","Uscite"],mov.map(function(m){ return [dIt(m.d),m.tipo,m.chi,protDi(m.sc),m.sc.nave||"",m.banca,m.note,m.entrata?n2(m.entrata):"",m.uscita?n2(m.uscita):""]; })); };
    return h+'</div>'; }

  window.vistaConta=function(){ CSV=null; try{ return S.contaTab==="scadenzario"?scadenzario():S.contaTab==="clienti"?clienti():S.contaTab==="eccliente"?ecCliente():S.contaTab==="primanota"?primaNota():registro(); }catch(e){ return testa("Errore","")+'<div class="panel"><div class="panel-b">Errore: '+esc(e.message||e)+'</div></div>'; } };

  var _eventi=eventi;
  window.eventi=function(){ _eventi(); if(S.view!=="conta") return;
    document.querySelectorAll("[data-ctab]").forEach(function(b){ b.addEventListener("click",function(){ S.contaTab=b.getAttribute("data-ctab"); render(); }); });
    on("ctCsv","click",function(){ if(CSV) CSV(); });
    on("ctQ","input",function(){ S.ct.q=this.value; var p=this.selectionStart; render(); var e=document.getElementById("ctQ"); if(e){ e.focus(); e.setSelectionRange(p,p); } });
    [["ctAnno","anno"],["ctMese","mese"],["ctForn","forn"],["ctStato","stato"],["ctCliente","cliente"],["ctSolo","solo"],["ctBanca","banca"]].forEach(function(p){ on(p[0],"change",function(){ S.ct[p[1]]=this.value; if(p[1]==="anno"&&S.ct.mese&&S.ct.mese.slice(0,4)!==this.value) S.ct.mese=""; render(); }); });
  };
})();
