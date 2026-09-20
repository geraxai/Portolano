/* ---------- Portolano: estratti conto mensili (fornitori e clienti) ---------- */
(function(){
  "use strict";
  var MESI_IT=["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"];
  function meseDi(d){ d=String(d||""); return /^\d{4}-\d{2}/.test(d)? d.slice(0,7) : ""; }
  function nomeMese(ym){ if(!ym) return ""; var p=ym.split("-"); var m=parseInt(p[1],10); return (MESI_IT[m-1]||p[1])+" "+p[0]; }
  function periodo(){ if(S.ecMese) return nomeMese(S.ecMese); if(S.ecAnno) return "anno "+S.ecAnno; return "tutti gli anni"; }

  /* ---- estratto conto fornitori: fornitore singolo o tutti, anno, mese, subtotali per mese ---- */
  window.vistaFornitori=function(){
    if(S.ecMese&&S.ecAnno&&S.ecMese.slice(0,4)!==S.ecAnno) S.ecMese="";
    var F=tuttiFornitori(), f=S.forn||F[0]||"", tutti=(f==="*"), anni={}, mesi={}, righe=[];
    for(var k in S.spese){ var s=S.spese[k]; if(!tutti&&upper(s.fornitore)!==f) continue; var sc=S.scali[s.scalo]||{}; var d=s.dataFattura||sc.eta||"";
      anni[anno(d)]=1; if(S.ecAnno&&anno(d)!==S.ecAnno) continue; var ym=meseDi(d); if(ym) mesi[ym]=1; if(S.ecMese&&ym!==S.ecMese) continue;
      if(S.fornStato==="aperte"&&s.dataPagamento) continue; if(S.fornStato==="pagate"&&!s.dataPagamento) continue; righe.push({s:s,sc:sc,d:d}); }
    righe.sort(function(a,b){ return (a.d||"").localeCompare(b.d||"")||String(a.s.fornitore||"").localeCompare(String(b.s.fornitore||"")); });
    var tot=0, ape=0; righe.forEach(function(r){ tot+=num(r.s.totale)||0; if(!r.s.dataPagamento) ape+=num(r.s.totale)||0; });
    var elencoMesi=Object.keys(mesi).sort().reverse().filter(function(m){ return !S.ecAnno||m.slice(0,4)===S.ecAnno; });
    var h='<div class="top"><h1>Fornitori</h1><span class="stato">estratto conto '+esc(tutti?"tutti i fornitori":f)+' · '+esc(periodo())+'</span></div>';
    h+='<div class="panel"><div class="panel-h"><div class="field"><select id="ecForn" aria-label="Fornitore">'+opt("*","tutti i fornitori",f)+F.map(function(x){ return opt(x,x,f); }).join("")+'</select></div>'+
       '<div class="field"><select id="ecStato">'+opt("aperte","da pagare",S.fornStato)+opt("pagate","pagate",S.fornStato)+opt("tutte","tutte",S.fornStato)+'</select></div>'+
       '<div class="field"><select id="ecAnno">'+opt("","tutti gli anni",S.ecAnno)+Object.keys(anni).sort().reverse().map(function(y){ return opt(y,y,S.ecAnno); }).join("")+'</select></div>'+
       '<div class="field"><select id="ecMese" aria-label="Mese">'+opt("","tutti i mesi",S.ecMese)+elencoMesi.map(function(m){ return opt(m,nomeMese(m),S.ecMese); }).join("")+(S.ecMese&&elencoMesi.indexOf(S.ecMese)<0?opt(S.ecMese,nomeMese(S.ecMese),S.ecMese):"")+'</select></div>'+
       '<div class="spacer"></div><span class="sub">'+righe.length+' fatture · totale € '+eur(tot)+(ape?' · aperte € '+eur(ape):"")+'</span></div>';
    if(!F.length) h+='<div class="panel-b sub">Nessuna fattura registrata.</div>';
    else if(!righe.length) h+='<div class="panel-b sub">Nessuna fattura per '+esc(tutti?"i fornitori":f)+' in '+esc(periodo())+'.</div>';
    else{
      h+='<div class="scroll"><table><thead><tr><th>Data fatt.</th>'+(tutti?'<th>Fornitore</th>':'')+'<th>N. fattura</th><th>Prot.</th><th>Nave</th><th>Voce</th><th class="num">Totale €</th><th>Pagata</th><th></th></tr></thead><tbody>';
      var meseCorr=null, subTot=0, nMesi=0, cols=tutti?9:8;
      function chiudiMese(){ if(meseCorr===null) return; nMesi++; h+='<tr class="tot" style="background:var(--paper2)"><td colspan="'+(cols-3)+'"><b>Totale '+esc(nomeMese(meseCorr)||"senza data")+'</b></td><td class="num"><b>'+eur(subTot)+'</b></td><td colspan="2"></td></tr>'; subTot=0; }
      righe.forEach(function(r){ var s=r.s, sc=r.sc, v=voce(s.voce), ym=meseDi(r.d);
        if(!S.ecMese&&ym!==meseCorr){ chiudiMese(); meseCorr=ym; }
        subTot+=num(s.totale)||0;
        h+='<tr><td>'+dIt(s.dataFattura)+'</td>'+(tutti?'<td>'+esc(s.fornitore)+'</td>':'')+'<td>'+esc(s.numFattura)+'</td><td><button class="btn lnk" data-go="'+esc(sc.id||"")+'">'+esc(sc.prot||"?")+'/'+String(sc.annoProt||"").slice(2)+'</button></td><td>'+esc(sc.nave||"")+chipDoppia(s)+(sc.pagDir?' <span class="chip grey">PAG DIR</span>':"")+'</td><td class="sub">'+esc(v?v.label:s.voce)+'</td><td class="num">'+eur(s.totale)+'</td><td>'+(s.dataPagamento?'<span class="chip ok">'+dIt(s.dataPagamento)+(s.modo?" · "+esc(s.modo):"")+'</span>':'<span class="chip warn">aperta</span>')+'</td><td>'+(s.dataPagamento?'<button class="btn small" data-riapri="'+s.id+'">riapri</button>':'<button class="btn small" data-paga="'+s.id+'">segna pagata oggi</button>')+'</td></tr>'; });
      if(!S.ecMese&&nMesi>0) chiudiMese();
      h+='</tbody><tfoot><tr><td colspan="'+(cols-3)+'">Totale '+esc(periodo())+(ape?' <span class="sub">(di cui aperte € '+eur(ape)+')</span>':'')+'</td><td class="num">'+eur(tot)+'</td><td colspan="2"></td></tr></tfoot></table></div>';
    }
    /* riepilogo per mese (solo quando si guardano più mesi) */
    if(righe.length&&!S.ecMese){ var perMese={}; righe.forEach(function(r){ var ym=meseDi(r.d)||"—"; var a=perMese[ym]||(perMese[ym]={n:0,t:0,a:0}); a.n++; a.t+=num(r.s.totale)||0; if(!r.s.dataPagamento) a.a+=num(r.s.totale)||0; });
      var km=Object.keys(perMese).sort(); if(km.length>1){ h+='<div class="panel-b"><h3 style="margin:6px 0">Riepilogo per mese</h3><table><thead><tr><th>Mese</th><th class="num">Fatture</th><th class="num">Totale €</th><th class="num">Aperte €</th></tr></thead><tbody>'+km.map(function(m){ var a=perMese[m]; return '<tr><td>'+(m==="—"?"senza data":'<button class="btn lnk" data-mese="'+m+'">'+esc(nomeMese(m))+'</button>')+'</td><td class="num">'+a.n+'</td><td class="num">'+eur(a.t)+'</td><td class="num">'+(a.a?eur(a.a):"—")+'</td></tr>'; }).join("")+'</tbody></table></div>'; } }
    return h+'</div>';
  };

  /* ---- estratto conto clienti: incassi e conti (FDA) per cliente e mese, nel Riepilogo ---- */
  var _riepilogo=riepilogo;
  window.riepilogo=function(){
    var h=_riepilogo();
    var Y=S.anno||String(new Date().getFullYear()), righe=[], mesi={};
    for(var k in S.scali){ var sc=S.scali[k]; var d=sc.eta||sc.creato||""; if(anno(d)!==Y) continue; var ym=meseDi(d); if(ym) mesi[ym]=1; if(S.ecMeseCli&&ym!==S.ecMeseCli) continue;
      var f=totFda(sc), i=incassato(sc); righe.push({sc:sc,d:d,ym:ym,cli:sc.cliente||sc.intestazione||"—",fda:f,inc:i,res:(sc.pagDir||f<=i)?0:r2(f-i)}); }
    righe.sort(function(a,b){ return (a.d||"").localeCompare(b.d||""); });
    var tf=0,ti=0,tr=0; righe.forEach(function(r){ tf+=r.fda; ti+=r.inc; tr+=r.res; });
    var em=Object.keys(mesi).sort().reverse();
    var p='<div class="panel"><div class="panel-h"><b>Estratto conto clienti '+Y+'</b><div class="field" style="margin-left:10px"><select id="ecMeseCli" aria-label="Mese">'+opt("","tutti i mesi",S.ecMeseCli)+em.map(function(m){ return opt(m,nomeMese(m),S.ecMeseCli); }).join("")+'</select></div><div class="spacer"></div><span class="sub">'+righe.length+' scali · FDA € '+eur(tf)+' · incassato € '+eur(ti)+' · da incassare € '+eur(tr)+'</span></div>';
    if(!righe.length) p+='<div class="panel-b sub">Nessuno scalo nel periodo.</div>';
    else{ p+='<div class="scroll"><table><thead><tr><th>Mese</th><th>Prot.</th><th>Nave</th><th>Cliente</th><th class="num">Conto FDA €</th><th class="num">Incassato €</th><th class="num">Da incassare €</th><th>Stato</th></tr></thead><tbody>';
      var mc=null, sf=0,si=0,sr=0; function chiudi(){ if(mc===null||S.ecMeseCli) return; p+='<tr class="tot" style="background:var(--paper2)"><td colspan="4"><b>Totale '+esc(nomeMese(mc)||"senza data")+'</b></td><td class="num"><b>'+eur(sf)+'</b></td><td class="num"><b>'+eur(si)+'</b></td><td class="num"><b>'+eur(sr)+'</b></td><td></td></tr>'; sf=si=sr=0; }
      righe.forEach(function(r){ if(r.ym!==mc){ chiudi(); mc=r.ym; } sf+=r.fda; si+=r.inc; sr+=r.res; var st=statoScalo(r.sc);
        p+='<tr><td>'+esc(nomeMese(r.ym)||"—")+'</td><td><button class="btn lnk" data-go="'+esc(r.sc.id)+'">'+esc(r.sc.prot||"?")+'/'+String(r.sc.annoProt||"").slice(2)+'</button></td><td>'+esc(r.sc.nave||"")+'</td><td>'+esc(r.cli)+(r.sc.pagDir?' <span class="chip grey">PAG DIR</span>':"")+'</td><td class="num">'+eur(r.fda)+'</td><td class="num">'+eur(r.inc)+'</td><td class="num">'+(r.res>0.005?eur(r.res):"—")+'</td><td><span class="chip '+st.c+'">'+st.t+'</span></td></tr>'; });
      chiudi();
      p+='</tbody><tfoot><tr><td colspan="4">Totale '+esc(S.ecMeseCli?nomeMese(S.ecMeseCli):"anno "+Y)+'</td><td class="num">'+eur(tf)+'</td><td class="num">'+eur(ti)+'</td><td class="num">'+eur(tr)+'</td><td></td></tr></tfoot></table></div>'; }
    return h+p+'</div>';
  };

  var _eventi=eventi;
  window.eventi=function(){ _eventi();
    on("ecMese","change",function(){ S.ecMese=this.value; if(S.ecMese) S.ecAnno=S.ecMese.slice(0,4); render(); });
    on("ecMeseCli","change",function(){ S.ecMeseCli=this.value; render(); });
    document.querySelectorAll("[data-mese]").forEach(function(b){ b.addEventListener("click",function(){ S.ecMese=b.getAttribute("data-mese"); S.ecAnno=S.ecMese.slice(0,4); render(); }); });
  };
  S.ecMese=S.ecMese||""; S.ecMeseCli=S.ecMeseCli||"";
})();
