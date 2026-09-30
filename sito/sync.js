/* ---------- Portolano: archivio condiviso via web (API /api/archivio) ---------- */
(function(){
  "use strict";
  var KEY="portolano.sync";
  var Y={url:"",chiave:"",attivo:false,ultimo:"",errore:"",inCorso:false,timer:null,tomb:{},cfgAt:0,utente:"",ruolo:"",aggiornato:0,sporchi:{scali:{},spese:{}},cfgSporca:false,tombNuova:false,ultimoMs:0};
  function urlPredefinito(){ if(location.protocol==="http:"||location.protocol==="https:") return location.origin+"/api/archivio"; return "https://portolano-gerax.vercel.app/api/archivio"; }
  function carica(){ try{ var j=JSON.parse(localStorage.getItem(KEY)||"null"); if(j) Object.assign(Y,{url:j.url||"",chiave:j.chiave||"",attivo:!!j.attivo,ultimo:j.ultimo||"",tomb:j.tomb||{},cfgAt:j.cfgAt||0,utente:j.utente||"",ruolo:j.ruolo||"",aggiornato:j.aggiornato||0,sporchi:(j.sporchi&&j.sporchi.scali&&j.sporchi.spese)?j.sporchi:{scali:{},spese:{}},cfgSporca:!!j.cfgSporca,tombNuova:!!j.tombNuova}); }catch(e){} if(!Y.url) Y.url=urlPredefinito(); }
  function salva(){ try{ localStorage.setItem(KEY,JSON.stringify({url:Y.url,chiave:Y.chiave,attivo:Y.attivo,ultimo:Y.ultimo,tomb:Y.tomb,cfgAt:Y.cfgAt,utente:Y.utente,ruolo:Y.ruolo,aggiornato:Y.aggiornato,sporchi:Y.sporchi,cfgSporca:Y.cfgSporca,tombNuova:Y.tombNuova})); }catch(e){} }
  function pronto(){ return Y.attivo&&Y.url&&Y.chiave; }
  function admin(){ return !pronto()||!Y.ruolo||Y.ruolo==="admin"; }
  function identita(){ if(pronto()&&Y.utente) S.user={nome:Y.utente,ruolo:Y.ruolo}; }
  function firma(){ return JSON.stringify([Object.keys(S.scali).sort(),Object.keys(S.spese).sort()]); }
  function tsDi(x){ return x&&x.updatedAt?(Date.parse(x.updatedAt)||0):0; }
  function segna(coll,id){ if(!id) return; Y.sporchi[coll][id]=1; salva(); }
  /* leggera: invia solo i record cambiati dall'ultima sincronizzazione e riceve solo quelli cambiati sul servizio (since = orologio del servizio);
     la prima volta (o dopo un ripristino) invia tutto l'archivio come prima */
  async function sincronizza(motivo){
    if(!pronto()||Y.inCorso) return false; Y.inCorso=true; Y.errore=""; aggiornaStato();
    try{
      var cfgLoc=S.cfgRaw&&Object.keys(S.cfgRaw).length; if(admin()&&cfgLoc&&!Y.cfgAt) Y.cfgAt=1;
      var prima=JSON.stringify([S.scali,S.spese,S.cfgRaw]), completo=!Y.aggiornato, inviati={scali:{},spese:{}}, corpo=null, r, m;
      if(completo){ corpo={scali:S.scali,spese:S.spese,cfg:admin()?S.cfgRaw:undefined,cfgAt:admin()?Y.cfgAt:0,tomb:Y.tomb,since:0}; }
      else{ var ha=false; corpo={scali:{},spese:{},since:Y.aggiornato,cfgAt:admin()?Y.cfgAt:0};
        ["scali","spese"].forEach(function(coll){ for(var id in Y.sporchi[coll]){ var rec=S[coll][id]; if(rec){ corpo[coll][id]=rec; inviati[coll][id]=rec.updatedAt||""; ha=true; } else delete Y.sporchi[coll][id]; } });
        if(Y.tombNuova){ corpo.tomb=Y.tomb; ha=true; }
        if(admin()&&Y.cfgSporca&&cfgLoc){ corpo.cfg=S.cfgRaw; ha=true; }
        if(!ha) corpo=null; }
      if(corpo) r=await fetch(Y.url,{method:"POST",headers:{"content-type":"application/json","x-chiave":Y.chiave},body:JSON.stringify(corpo)});
      else r=await fetch(Y.url+"?since="+encodeURIComponent(Y.aggiornato)+"&cfgAt="+encodeURIComponent(admin()?Y.cfgAt:0),{method:"GET",headers:{"x-chiave":Y.chiave},cache:"no-store"});
      if(r.status===401){ Y.errore="chiave non valida"; esci(); mostraBlocco("La chiave non è più valida."); return false; }
      if(!r.ok) throw new Error("risposta "+r.status);
      m=await r.json(); if(m.sposta&&/^https:\/\/|^http:\/\/127\.0\.0\.1/.test(m.sposta)&&m.sposta!==Y.url){ Y.url=m.sposta; salva(); } /* archivio trasferito: da ora si parla direttamente col nuovo indirizzo */
      Y.utente=m.utente||Y.utente; Y.ruolo=m.ruolo||Y.ruolo; identita(); if(Y.ruolo!=="admin") Y.cfgAt=0;
      if(m.modo==="tutto"||(!m.modo&&m.scali)){ /* archivio intero: vince il più recente, i record solo locali restano e verranno inviati */
        var srvS=m.scali||{}, srvP=m.spese||{}, tomb=m.tomb||{};
        ["scali","spese"].forEach(function(coll){ var srv=coll==="scali"?srvS:srvP, loc=S[coll], out={};
          for(var id in srv) out[id]=srv[id];
          for(var lid in loc){ var t=tomb[lid]?(Date.parse(tomb[lid])||0):0; if(t&&tsDi(loc[lid])<=t) continue; if(!srv[lid]){ out[lid]=loc[lid]; if(!completo) Y.sporchi[coll][lid]=1; } else if(tsDi(loc[lid])>tsDi(srv[lid])){ out[lid]=loc[lid]; Y.sporchi[coll][lid]=1; } }
          S[coll]=out; });
        Y.tomb=tomb; }
      else if(m.modo==="delta"){
        ["scali","spese"].forEach(function(coll){ var d=m[coll]||{}; for(var id in d){ var loc=S[coll][id]; if(loc&&Y.sporchi[coll][id]&&!inviati[coll][id]&&tsDi(loc)>=tsDi(d[id])) continue; S[coll][id]=d[id]; } });
        for(var tid in (m.tomb||{})){ Y.tomb[tid]=m.tomb[tid]; var tt=Date.parse(m.tomb[tid])||0; ["scali","spese"].forEach(function(coll){ var rec=S[coll][tid]; if(rec&&tsDi(rec)<=tt){ delete S[coll][tid]; delete Y.sporchi[coll][tid]; } }); } }
      if(m.cfg&&Object.keys(m.cfg).length&&(m.cfgAt||0)>=(Y.cfgAt||0)&&!(Y.cfgSporca&&admin()&&!(corpo&&corpo.cfg))){ S.cfgRaw=m.cfg; Y.cfgAt=m.cfgAt||Y.cfgAt; S.cfg=merge(CFG_DEFAULT,S.cfgRaw); }
      if(corpo){ ["scali","spese"].forEach(function(coll){ for(var id in inviati[coll]){ var rec=S[coll][id]; if(!rec||(rec.updatedAt||"")===inviati[coll][id]) delete Y.sporchi[coll][id]; } }); if(corpo.tomb) Y.tombNuova=false; if(corpo.cfg) Y.cfgSporca=false; if(completo){ Y.sporchi={scali:{},spese:{}}; Y.tombNuova=false; Y.cfgSporca=false; } }
      if(m.aggiornato) Y.aggiornato=m.aggiornato;
      Y.ultimo=new Date().toISOString(); Y.ultimoMs=Date.now(); salvaLocale(); salva();
      var ae=document.activeElement, scrive=ae&&/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)&&ae.id!=="cerca"; if(prima!==JSON.stringify([S.scali,S.spese,S.cfgRaw])&&!scrive){ render(); } else aggiornaStato();
      return true;
    }catch(e){ Y.errore=String(e&&e.message||e); aggiornaStato(); return false; }
    finally{ Y.inCorso=false; }
  }
  function programma(){ if(!pronto()) return; clearTimeout(Y.timer); Y.timer=setTimeout(function(){ sincronizza("scrittura"); },3000); }
  function periodica(motivo){ if(document.visibilityState!=="visible") return; if(Date.now()-(Y.ultimoMs||0)<25000) return; sincronizza(motivo); }
  function quando(){ if(!Y.ultimo) return "mai"; var d=new Date(Y.ultimo); return d.toLocaleDateString("it-IT")+" "+d.toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"}); }
  function aggiornaStato(){ var e=document.getElementById("syncStato"); if(!e) return; e.textContent= Y.inCorso?"sincronizzazione in corso…":(Y.errore?"errore: "+Y.errore:(Y.attivo?"attivo · ultima sincronizzazione "+quando():"non attivo")); e.className="sub"+(Y.errore?" pos":""); }
  /* accesso: senza chiave personale l'app resta chiusa */
  function bloccato(){ return !(Y.attivo&&Y.chiave&&Y.utente); }
  function mostraBlocco(msg){
    var e=document.getElementById("blocco");
    if(!e){ e=document.createElement("div"); e.id="blocco"; e.setAttribute("role","dialog"); e.setAttribute("aria-modal","true");
      e.style.cssText="position:fixed;inset:0;z-index:99999;background:var(--brand2,#0a3a45);display:flex;align-items:center;justify-content:center;padding:20px;font-family:inherit";
      e.innerHTML='<form id="bloccoForm" style="background:var(--paper,#fff);color:var(--ink,#15262c);border-radius:12px;padding:26px 24px;max-width:380px;width:100%;box-shadow:0 12px 40px rgba(0,0,0,.35)">'+
        '<div style="font-size:22px;font-weight:700;letter-spacing:.3px">Portolano</div><div class="sub" style="margin:2px 0 16px">Fratelli Bonanno Srl · accesso riservato</div>'+
        '<label for="bloccoChiave" style="display:block;font-size:13px;margin-bottom:6px">Chiave personale</label>'+
        '<input id="bloccoChiave" type="password" autocomplete="current-password" autocapitalize="characters" style="width:100%;box-sizing:border-box;font-size:18px;padding:10px 12px;border:1px solid var(--line,#cfd9dd);border-radius:8px;letter-spacing:1px">'+
        '<div id="bloccoMsg" class="sub" style="min-height:20px;margin:8px 0 12px;color:var(--no,#a4262c)"></div>'+
        '<button type="submit" class="btn primary" id="bloccoEntra" style="width:100%;font-size:16px;padding:11px">Entra</button>'+
        '<p class="sub" style="margin:14px 0 0;font-size:12px">Ogni utente ha la propria chiave. Chi non la conosce non può vedere né modificare l\'archivio. Serve la connessione la prima volta su ogni dispositivo.</p></form>';
      document.body.appendChild(e);
      document.getElementById("bloccoForm").addEventListener("submit",async function(ev){ ev.preventDefault(); var k=(document.getElementById("bloccoChiave").value||"").trim().toUpperCase(); if(!k){ mostraBlocco("Inserisci la chiave."); return; }
        var b=document.getElementById("bloccoEntra"); b.disabled=true; b.textContent="Verifica…"; var r=await verifica(k); b.disabled=false; b.textContent="Entra";
        if(r.ok){ Y.chiave=k; Y.attivo=true; Y.utente=r.utente; Y.ruolo=r.ruolo; Y.url=Y.url||urlPredefinito(); salva(); identita(); nascondiBlocco(); await sincronizza("accesso"); render(); avviso("Benvenuto, "+Y.utente+"."); }
        else mostraBlocco(r.msg); });
    }
    document.getElementById("bloccoMsg").textContent=msg||""; e.hidden=false; e.style.display="flex"; setTimeout(function(){ var i=document.getElementById("bloccoChiave"); if(i) i.focus(); },50);
  }
  function nascondiBlocco(){ var e=document.getElementById("blocco"); if(e){ e.hidden=true; e.style.display="none"; } }
  async function verifica(k){
    try{ var r=await fetch((Y.url||urlPredefinito())+"?chiave="+encodeURIComponent(k),{cache:"no-store"});
      if(r.status===401) return {ok:false,msg:"Chiave non riconosciuta."};
      if(!r.ok) return {ok:false,msg:"Servizio non raggiungibile ("+r.status+")."};
      var j=await r.json(); return {ok:true,utente:j.utente||"",ruolo:j.ruolo||""};
    }catch(e){ return {ok:false,msg:"Nessuna connessione: la prima volta serve Internet per verificare la chiave."}; }
  }
  function esci(){ Y.attivo=false; Y.chiave=""; Y.ruolo=""; Y.utente=""; S.user=null; salva(); mostraBlocco(""); }
  /* intercetta le scritture dell'app */
  var _scriviScalo=scriviScalo, _scriviSpesa=scriviSpesa, _scriviCfg=scriviCfg, _cancellaScalo=cancellaScalo, _cancellaSpesa=cancellaSpesa;
  window.scriviScalo=async function(sc){ var r=await _scriviScalo(sc); segna("scali",sc&&sc.id); programma(); return r; };
  window.scriviSpesa=async function(s){ var r=await _scriviSpesa(s); segna("spese",s&&s.id); programma(); return r; };
  window.scriviCfg=async function(){ if(!admin()){ avviso("Solo l'amministratore (Emilio) può modificare le impostazioni."); await sincronizza("ripristino"); return; } Y.cfgAt=Date.now(); Y.cfgSporca=true; salva(); var r=await _scriviCfg(); programma(); return r; };
  window.cancellaScalo=async function(id){ var t=new Date().toISOString(); Y.tomb[id]=t; for(var k in S.spese) if(S.spese[k].scalo===id) Y.tomb[k]=t; Y.tombNuova=true; delete Y.sporchi.scali[id]; salva(); var r=await _cancellaScalo(id); programma(); return r; };
  window.cancellaSpesa=async function(id){ Y.tomb[id]=new Date().toISOString(); Y.tombNuova=true; delete Y.sporchi.spese[id]; salva(); var r=await _cancellaSpesa(id); programma(); return r; };
  /* pannello in Impostazioni → Archivio */
  var _impostazioni=impostazioni;
  window.impostazioni=function(){ if(!admin()) S.imp="archivio"; var h=_impostazioni(); if(!admin()) h=h.replace(/<div class="subtabs"[^>]*>[\s\S]*?<\/div>/,'<p class="sub">Accesso operatore ('+esc(Y.utente)+'): puoi inserire e modificare scali e spese; intestazione, tariffe e voci le modifica solo l\'amministratore (Emilio).</p>'); if(S.imp!=="archivio") return h;
    var p='<h3>Archivio condiviso via web</h3><p class="sub" style="max-width:70ch">Con la propria chiave personale, tutti i dispositivi (iPhone, PC, file locale) leggono e scrivono lo stesso archivio sul sito Portolano: ogni modifica viene inviata pochi secondi dopo il salvataggio (solo i record cambiati) e le novità degli altri arrivano all\'apertura, al ritorno sulla pagina e ogni dieci minuti (solo mentre la pagina è visibile). Vince la modifica più recente.</p>'+
      '<div class="grid" style="margin:6px 0 10px"><div class="field w2"><label for="syncUrl">Indirizzo del servizio</label><input id="syncUrl" value="'+esc(Y.url)+'"></div><div class="field"><label for="syncChiave">Chiave personale</label><input id="syncChiave" type="password" value="'+esc(Y.chiave)+'" placeholder="la tua chiave personale"></div></div>'+
      '<div class="acts" style="margin-bottom:14px">'+(Y.attivo?'<button class="btn primary" id="syncOra">Sincronizza ora</button><button class="btn" id="syncOff">Esci / cambia utente</button>':'<button class="btn primary" id="syncOn">Attiva e sincronizza</button>')+'<span id="syncStato" class="sub"></span></div>'+(Y.attivo&&Y.utente?'<p class="sub">Collegato come <b>'+esc(Y.utente)+'</b> ('+(Y.ruolo==="admin"?"amministratore: può modificare tutto":"operatore: inserisce scali e spese")+'). Ogni utente ha la propria chiave; le modifiche riportano il nome di chi le ha fatte.</p>':'');
    var i=h.lastIndexOf('<h3>Pulizia</h3>'); return i<0? h.replace(/<\/div><\/div>$/,p+'</div></div>') : h.slice(0,i)+p+h.slice(i); };
  var _eventi=eventi;
  window.eventi=function(){ _eventi(); aggiornaStato();
    on("syncOn","click",async function(){ Y.url=val("syncUrl")||urlPredefinito(); var k=(val("syncChiave")||"").trim().toUpperCase(); if(!k){ avviso("Inserisci la chiave."); return; } var r=await verifica(k); if(!r.ok){ avviso(r.msg); return; } Y.chiave=k; Y.attivo=true; Y.utente=r.utente; Y.ruolo=r.ruolo; salva(); identita(); var ok=await sincronizza("attivazione"); avviso(ok?"Archivio condiviso attivo.":"Sincronizzazione non riuscita: "+(Y.errore||"")); render(); });
    on("syncOra","click",async function(){ Y.url=val("syncUrl")||Y.url; Y.chiave=val("syncChiave")||Y.chiave; salva(); var ok=await sincronizza("manuale"); avviso(ok?"Archivio sincronizzato.":"Sincronizzazione non riuscita: "+(Y.errore||"")); });
    on("syncOff","click",function(){ esci(); }); };
  carica(); identita();
  if(bloccato()) mostraBlocco("");
  if(pronto()){ setTimeout(function(){ sincronizza("avvio"); },800); setInterval(function(){ periodica("periodica"); },600000);
    document.addEventListener("visibilitychange",function(){ periodica("ritorno"); }); window.addEventListener("focus",function(){ periodica("ritorno"); }); window.addEventListener("online",function(){ periodica("rete"); }); }
  window.PortolanoSync={sincronizza:sincronizza,stato:Y,esci:esci};
})();
