/* ---------- Portolano: archivio condiviso via web (API /api/archivio) ---------- */
(function(){
  "use strict";
  var KEY="portolano.sync";
  var Y={url:"",chiave:"",attivo:false,ultimo:"",errore:"",inCorso:false,timer:null,tomb:{},cfgAt:0,utente:"",ruolo:""};
  function urlPredefinito(){ if(location.protocol==="http:"||location.protocol==="https:") return location.origin+"/api/archivio"; return "https://portolano-gerax.vercel.app/api/archivio"; }
  function carica(){ try{ var j=JSON.parse(localStorage.getItem(KEY)||"null"); if(j) Object.assign(Y,{url:j.url||"",chiave:j.chiave||"",attivo:!!j.attivo,ultimo:j.ultimo||"",tomb:j.tomb||{},cfgAt:j.cfgAt||0,utente:j.utente||"",ruolo:j.ruolo||""}); }catch(e){} if(!Y.url) Y.url=urlPredefinito(); }
  function salva(){ try{ localStorage.setItem(KEY,JSON.stringify({url:Y.url,chiave:Y.chiave,attivo:Y.attivo,ultimo:Y.ultimo,tomb:Y.tomb,cfgAt:Y.cfgAt,utente:Y.utente,ruolo:Y.ruolo})); }catch(e){} }
  function pronto(){ return Y.attivo&&Y.url&&Y.chiave; }
  function admin(){ return !pronto()||!Y.ruolo||Y.ruolo==="admin"; }
  function identita(){ if(pronto()&&Y.utente) S.user={nome:Y.utente,ruolo:Y.ruolo}; }
  function firma(){ return JSON.stringify([Object.keys(S.scali).sort(),Object.keys(S.spese).sort()]); }
  async function sincronizza(motivo){
    if(!pronto()||Y.inCorso) return false; Y.inCorso=true; Y.errore=""; aggiornaStato();
    try{
      var cfgLoc=S.cfgRaw&&Object.keys(S.cfgRaw).length; if(admin()&&cfgLoc&&!Y.cfgAt) Y.cfgAt=1;
      var corpo={scali:S.scali,spese:S.spese,cfg:admin()?S.cfgRaw:undefined,cfgAt:admin()?Y.cfgAt:0,tomb:Y.tomb};
      var r=await fetch(Y.url,{method:"POST",headers:{"content-type":"application/json","x-chiave":Y.chiave},body:JSON.stringify(corpo)});
      if(r.status===401){ Y.errore="chiave non valida"; esci(); mostraBlocco("La chiave non è più valida."); return false; }
      if(!r.ok) throw new Error("risposta "+r.status);
      var m=await r.json(); var prima=JSON.stringify([S.scali,S.spese,S.cfgRaw]);
      S.scali=m.scali||{}; S.spese=m.spese||{}; Y.tomb=m.tomb||{}; Y.utente=m.utente||Y.utente; Y.ruolo=m.ruolo||Y.ruolo; identita();
      if(Y.ruolo!=="admin") Y.cfgAt=0;
      if(m.cfg&&Object.keys(m.cfg).length&&(m.cfgAt||0)>=(Y.cfgAt||0)){ S.cfgRaw=m.cfg; Y.cfgAt=m.cfgAt||Y.cfgAt; S.cfg=merge(CFG_DEFAULT,S.cfgRaw); }
      Y.ultimo=new Date().toISOString(); salvaLocale(); salva();
      var ae=document.activeElement, scrive=ae&&/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)&&ae.id!=="cerca"; if(prima!==JSON.stringify([S.scali,S.spese,S.cfgRaw])&&!scrive){ render(); } else aggiornaStato();
      return true;
    }catch(e){ Y.errore=String(e&&e.message||e); aggiornaStato(); return false; }
    finally{ Y.inCorso=false; }
  }
  function programma(){ if(!pronto()) return; clearTimeout(Y.timer); Y.timer=setTimeout(function(){ sincronizza("scrittura"); },1500); }
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
  window.scriviScalo=async function(sc){ var r=await _scriviScalo(sc); programma(); return r; };
  window.scriviSpesa=async function(s){ var r=await _scriviSpesa(s); programma(); return r; };
  window.scriviCfg=async function(){ if(!admin()){ avviso("Solo l'amministratore (Emilio) può modificare le impostazioni."); await sincronizza("ripristino"); return; } Y.cfgAt=Date.now(); salva(); var r=await _scriviCfg(); programma(); return r; };
  window.cancellaScalo=async function(id){ var t=new Date().toISOString(); Y.tomb[id]=t; for(var k in S.spese) if(S.spese[k].scalo===id) Y.tomb[k]=t; salva(); var r=await _cancellaScalo(id); programma(); return r; };
  window.cancellaSpesa=async function(id){ Y.tomb[id]=new Date().toISOString(); salva(); var r=await _cancellaSpesa(id); programma(); return r; };
  /* pannello in Impostazioni → Archivio */
  var _impostazioni=impostazioni;
  window.impostazioni=function(){ if(!admin()) S.imp="archivio"; var h=_impostazioni(); if(!admin()) h=h.replace(/<div class="subtabs"[^>]*>[\s\S]*?<\/div>/,'<p class="sub">Accesso operatore ('+esc(Y.utente)+'): puoi inserire e modificare scali e spese; intestazione, tariffe e voci le modifica solo l\'amministratore (Emilio).</p>'); if(S.imp!=="archivio") return h;
    var p='<h3>Archivio condiviso via web</h3><p class="sub" style="max-width:70ch">Con la propria chiave personale, tutti i dispositivi (iPhone, PC, file locale) leggono e scrivono lo stesso archivio sul sito Portolano: ogni modifica viene inviata pochi secondi dopo il salvataggio e ripresa all\'apertura. Vince la modifica più recente.</p>'+
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
  if(pronto()){ setTimeout(function(){ sincronizza("avvio"); },800); setInterval(function(){ if(document.visibilityState==="visible") sincronizza("periodica"); },90000);
    document.addEventListener("visibilitychange",function(){ if(document.visibilityState==="visible") sincronizza("ritorno"); }); }
  window.PortolanoSync={sincronizza:sincronizza,stato:Y,esci:esci};
})();
