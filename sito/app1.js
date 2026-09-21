/* ===== Portolano — pratiche di scalo + mastrino dei conti nave (PDA/FDA) ===== */
"use strict";
var VER="1.4.4";
/* ---------- configurazione predefinita (tariffe da APPRODO.xlsx / Pratiche di Scalo, voci da Mastrino Approdi) ---------- */
var CFG_DEFAULT={
 ag:{nome:"Fratelli Bonanno S.r.l.",nomeBreve:"F.lli Bonanno Srl",sottotitolo:"SHIPPING AGENTS",indirizzo:"Via Anzalone 7, 95131 Catania - Italy",tel:"+39 095 326608",fax:"+39 095 310629",email:"fratellibonanno1848@gmail.com",piva:"03431780877",firmatario:"EMILIO GERACI",citta:"Catania"},
 banche:[{id:"fideuram",nome:"FIDEURAM BANK",iban:"IT57A0329601601000067079317",bic:"FIBKITMM"},{id:"unicredit",nome:"UNICREDIT BANK",iban:"IT12D0200816935000104744420",bic:"UNCRITM1L92"}],
 doc:{lingua:"en",layout:"sinistra",colore:"#0e4e5c",logo:"",mostraFax:true,mostraEmail:true,mostraPiva:true,mostraBanca:true,mostraFirma:true,mostraMessrs:true,nascondiZero:true,titoloPda:"PROFORMA DISBURSEMENT ACCOUNT",titoloFda:"FINAL DISBURSEMENT ACCOUNT",piede:"",notaPda:"Estimated figures, subject to final invoices. Bank charges for remitter's account.",notaFda:"Please remit the balance within 15 days from receipt."},
 pil:{step:5000,extra:84.95,bands:[[500,1000,146.83],[1001,2000,164.66],[2001,3500,371.29],[3501,5000,528.59],[5001,7000,679.81],[7001,10000,806.53],[10001,15000,979.58],[15001,20000,1127.46]]},
 orm:{step:1000,extra:21,bands:[[1,500,67],[501,1000,101.5],[1001,2000,155],[2001,3000,219],[3001,5000,286],[5001,7000,325],[7001,10000,373],[10001,15000,447],[15001,20000,559],[20001,25000,671]]},
 tug:{step:4000,extra:102.54,bands:[[1,1500,212.23],[1501,2500,425.54],[2501,4500,811.02],[4501,6500,999.63],[6501,7500,1273.1],[7501,9000,1367.41],[9001,11000,1635.01],[11001,13000,1817.7],[13001,16000,1999.25],[16001,20000,2098.27]]},
 transfer:2500,
 anc:{ue30:0.23,ex30:1.19,ue1y:0.8233,ex1y:2.6015},
 chim:{defum:1020,soia:350,ciabattato:700},
 voci:[
  {k:"pil",label:"Pilotage in & out",auto:"pil",forn:["PILOTI"],kw:["PILOT"]},
  {k:"orm",label:"Mooring & unmooring",auto:"orm",forn:["ORMEGGIATORI"],kw:["ORMEGG","MOOR"]},
  {k:"tug",label:"Tug in & out (not compulsory - normal time only)",auto:"tug",forn:["RIMORCHIATORI"],kw:["RIMORCH","TUG"]},
  {k:"hm",label:"Harbour Master dues",std:65,forn:["DIRITTI CAPITANERIA"],kw:["CAPITANERIA","HARBOUR","DIRITTI"],int:true},
  {k:"garbage",label:"Garbage expenses (daily food waste only - compulsory)",forn:["LA PORTUALE"],kw:["PORTUALE","GARBAGE","RIFIUT"]},
  {k:"security",label:"Port security expenses as per port security plan",forn:["MG SECURITY"],kw:["SECURITY"]},
  {k:"water",label:"Fresh water supply",forn:["SIDRA","G&G"],kw:["SIDRA","WATER","ACQUA"]},
  {k:"prov",label:"Provisions",forn:["FRATELLI SCIOTTO"],kw:["SCIOTTO","PROVIS"]},
  {k:"anchor",label:"Anchorage dues",auto:"anc",forn:["TASSA ANCORAGGIO"],kw:["ANCORAGG","ANCHOR"]},
  {k:"informer",label:"Port informer",std:80,forn:["PORT INFORMER"],kw:["INFORMER"],int:true},
  {k:"chemist",label:"Port chemist (if cargo fumigated)",auto:"chim",forn:["CHIMICO"],kw:["CHIMIC","CHEMIST"]},
  {k:"fire",label:"Fireguards expenses",forn:["VVFF"],kw:["VVFF","VIGILI","FIRE"]},
  {k:"sogesal",label:"Terminal / Sogesal charges",forn:["SOGESAL"],kw:["SOGESAL"]},
  {k:"medic",label:"Medicines expenses",forn:["CACCAMO"],kw:["CACCAMO","MEDIC","FARMAC"]},
  {k:"customs",label:"Customs clearance",forn:["DOGANA"],kw:["DOGAN","CUSTOM","SPEDIZION"],int:true},
  {k:"sanit",label:"Sanitary & Immigration formalities",std:200,forn:[],kw:["SANIT"],int:true},
  {k:"disch",label:"Discharging authorization",forn:[],kw:[],int:true},
  {k:"shore",label:"Shorepasses release",forn:[],kw:[],int:true},
  {k:"phone",label:"Phone / mail / transportation",forn:["EVO TAXI"],kw:["TRASPORT","TAXI","NCC"],int:true},
  {k:"transfer",label:"Transfer for Authorities",std:80,forn:[],kw:[],int:true},
  {k:"isps",label:"ISPS formalities",std:300,forn:[],kw:["ISPS"],int:true},
  {k:"stamps",label:"Legal stamps",std:60,forn:[],kw:["BOLL","STAMP"],int:true},
  {k:"sludge",label:"Exemption sludge/bilge disposal",std:160,forn:[],kw:["SLUDGE","SENTINA"],int:true},
  {k:"crew",label:"Crew change",forn:[],kw:["CREW"],opz:true},
  {k:"agency",label:"Agency fees",forn:["NS FATTURA"],kw:["AGENCY","AGENZIA"],int:true},
  {k:"other",label:"Other agency expenses",forn:["ALTRO"],kw:[],opz:true}
 ],
 liste:{agenti:["Emilio Geraci","Gabriele Geraci","Giuseppe Palestro"],
  tipi:["GENERAL CARGO","BULK CARRIER","CABLESHIP","TANKER","CHEMICAL TANKER","CONTAINER","RO-RO","YACHT","TUG","PASSENGER","OTHER"],
  bandiere:["ITALY","MALTA","PANAMA","LIBERIA","MARSHALL ISLANDS","CYPRUS","GREECE","TURKEY","PORTUGAL","NETHERLANDS","ANTIGUA AND BARBUDA","BAHAMAS","SINGAPORE","HONG KONG","GIBRALTAR","NORWAY","DENMARK","GERMANY","SPAIN","FRANCE","UNITED KINGDOM","LUXEMBOURG","BELGIUM","TOGO","COMOROS","PALAU","SIERRA LEONE"],
  ormeggi:["Molo Centrale","Molo Crispi","Molo di Levante","Sporgente Centrale","Sporgente Nord","Molo Foraneo","Rada","Boe"],
  operazioni:["Discharging","Loading","Loading/Discharging","Cable operations","Bunkering","Crew change","Lay-by","Repairs","Transit"],
  porti:["Catania","Augusta","Pozzallo","Siracusa","Messina","Palermo","Malta","Valletta","Gioia Tauro","Napoli","Livorno","Genova","Venezia","Piraeus","Barcelona","Marseille","Valencia","Algeciras","Tunis","Sfax","Alexandria","Istanbul","Constanta"]}
};
var MESI=["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"];
var ANC_TIPI=[["","nessuna"],["ue30","UE – sosta fino a 30 gg (€/NT "+CFG_DEFAULT.anc.ue30+")"],["ex30","extra UE – fino a 30 gg (€/NT "+CFG_DEFAULT.anc.ex30+")"],["ue1y","UE – annuale (€/NT "+CFG_DEFAULT.anc.ue1y+")"],["ex1y","extra UE – annuale (€/NT "+CFG_DEFAULT.anc.ex1y+")"]];
var CHIM_TIPI=[["","nessuno"],["defum",""],["soia",""],["ciabattato",""]];

/* ---------- utilità ---------- */
function eur(n){ if(n===null||n===undefined||n===""||isNaN(n)) return "—"; return Number(n).toLocaleString("it-IT",{minimumFractionDigits:2,maximumFractionDigits:2}); }
function eurEn(n){ return Number(n||0).toLocaleString("en-GB",{minimumFractionDigits:2,maximumFractionDigits:2}); }
function num(v){ if(v===null||v===undefined) return null; if(typeof v==="number") return isNaN(v)?null:v; var t=String(v).trim().replace(/€|\s/g,""); if(!t) return null;
  if(/,\d{1,2}$/.test(t)) t=t.replace(/\./g,"").replace(",","."); else t=t.replace(/,/g,""); var n=parseFloat(t); return isNaN(n)?null:n; }
function r2(n){ return Math.round((Number(n)||0)*100)/100; }
function esc(s){ return String(s===null||s===undefined?"":s).replace(/[&<>"']/g,function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
function dIt(s){ if(!s) return ""; var p=String(s).split("-"); return p.length===3? p[2]+"/"+p[1]+"/"+p[0] : s; }
function dEn(s){ if(!s) return ""; var p=String(s).split("-"); if(p.length!==3) return s; var m=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]; return parseInt(p[2],10)+" "+m[parseInt(p[1],10)-1]+" "+p[0]; }
function oggi(){ return new Date().toISOString().slice(0,10); }
function anno(s){ return String(s||"").slice(0,4); }
function nuovoId(p){ return (p||"x")+Date.now().toString(36)+Math.random().toString(36).slice(2,6); }
function opt(v,t,sel){ return '<option value="'+esc(v)+'"'+(String(v)===String(sel==null?"":sel)?" selected":"")+'>'+esc(t)+'</option>'; }
function opts(list,sel,vuoto){ return (vuoto!==false?opt("",vuoto||"—",sel):"")+list.map(function(x){ return opt(x,x,sel); }).join("")+(sel&&list.indexOf(sel)<0?opt(sel,sel,sel):""); }
function val(id){ var e=document.getElementById(id); return e? (e.type==="checkbox"?e.checked:e.value.trim()) : ""; }
function on(id,ev,fn){ var e=document.getElementById(id); if(e) e.addEventListener(ev,fn); }
function upper(s){ return String(s||"").toUpperCase().trim(); }
function clone(o){ return JSON.parse(JSON.stringify(o)); }
function merge(base,extra){ var o=clone(base); if(!extra||typeof extra!=="object") return o; for(var k in extra){ if(extra[k]&&typeof extra[k]==="object"&&!Array.isArray(extra[k])&&o[k]&&typeof o[k]==="object"&&!Array.isArray(o[k])) o[k]=merge(o[k],extra[k]); else o[k]=clone(extra[k]); } return o; }
var toastT; function avviso(t){ var e=document.getElementById("toast"); e.textContent=t; e.classList.add("show"); clearTimeout(toastT); toastT=setTimeout(function(){ e.classList.remove("show"); },2600); }

/* ---------- motore tariffe (scaglioni per GT, come i fogli PILOTI / ORMEGGIATORI / TUG) ---------- */
function rate(tab,gt){ gt=num(gt); if(!gt||!tab||!tab.bands||!tab.bands.length) return 0; var b=tab.bands,last=b[b.length-1];
  if(gt>last[1]) return r2(last[2]+Math.ceil((gt-last[1])/tab.step)*tab.extra);
  var r=b[0][2]; for(var i=0;i<b.length;i++) if(gt>=b[i][0]) r=b[i][2]; return r; }
function calcAuto(tipo,sc){ var C=S.cfg, p=sc.pda||{}, gt=num(sc.gt)||0, nt=num(sc.nt)||0;
  if(tipo==="pil") return r2(rate(C.pil,gt)*(num(p.nPil)||0));
  if(tipo==="orm") return r2(rate(C.orm,gt)*(num(p.nOrm)||0));
  if(tipo==="tug"){ var nT=num(p.nTug)||0, tugs=num(p.tugs)||0; if(!nT||!tugs) return 0; var tr=(tugs>=2&&p.transfer)?(num(C.transfer)||0):0; return r2(rate(C.tug,gt)*nT*tugs+tr); }
  if(tipo==="anc"){ var c=C.anc[p.anc]; return c? r2(nt*c) : 0; }
  if(tipo==="chim"){ return num(C.chim[p.chim])||0; }
  return 0; }
function spiegaAuto(tipo,sc){ var C=S.cfg,p=sc.pda||{},gt=num(sc.gt)||0;
  if(tipo==="pil") return "tariffa GT € "+eur(rate(C.pil,gt))+" × "+(p.nPil||0)+" prestazioni";
  if(tipo==="orm") return "tariffa GT € "+eur(rate(C.orm,gt))+" × "+(p.nOrm||0)+" prestazioni";
  if(tipo==="tug") return "tariffa GT € "+eur(rate(C.tug,gt))+" × "+(p.nTug||0)+" prestazioni × "+(p.tugs||0)+" rimorchiatori"+((num(p.tugs)>=2&&p.transfer)?" + trasferimento € "+eur(C.transfer):"");
  if(tipo==="anc") return p.anc? "NT "+(sc.nt||0)+" × "+C.anc[p.anc] : "nessuna tassa d'ancoraggio";
  if(tipo==="chim") return p.chim? "tariffa chimico: "+p.chim : "nessun intervento chimico";
  return ""; }

/* ---------- stato e archivio ---------- */
var S={view:"scali",sel:null,tab:"nave",contoMode:"confronto",scali:{},spese:{},cfg:clone(CFG_DEFAULT),cfgRaw:{},db:null,downloads:null,user:null,online:false,
  q:"",anno:"",filtro:"",editSpesa:null,dupWarn:null,dupOk:null,forn:"",fornStato:"aperte",ecAnno:"",imp:"agenzia",doc:null,hl:null,ready:false};
var LS="portolano.v1";
function salvaLocale(){ try{ localStorage.setItem(LS,JSON.stringify({scali:S.scali,spese:S.spese,cfg:S.cfgRaw})); }catch(e){} }
function leggiLocale(){ try{ var j=JSON.parse(localStorage.getItem(LS)||"null"); if(j){ S.scali=j.scali||{}; S.spese=j.spese||{}; S.cfgRaw=j.cfg||{}; S.cfg=merge(CFG_DEFAULT,S.cfgRaw); return true; } }catch(e){} return false; }
function chi(){ return (S.user&&S.user.nome)||""; }
function timbro(o){ o.updatedAt=new Date().toISOString(); if(chi()) o.updatedByName=chi(); return o; }
async function scriviScalo(sc){ timbro(sc); S.scali[sc.id]=sc; salvaLocale(); if(S.db){ try{ await S.db.doc("scali/"+sc.id).set(sc); }catch(e){ avviso("Salvato solo su questo dispositivo: "+(e.message||e)); } } }
async function cancellaScalo(id){ delete S.scali[id]; for(var k in S.spese) if(S.spese[k].scalo===id) delete S.spese[k]; salvaLocale();
  if(S.db){ try{ await S.db.doc("scali/"+id).delete(); var q=await S.db.collection("spese").where("scalo","==",id).get(); q.docs.forEach(function(d){ d.ref.delete().catch(function(){}); }); }catch(e){} } }
async function scriviSpesa(s){ timbro(s); S.spese[s.id]=s; salvaLocale(); if(S.db){ try{ await S.db.doc("spese/"+s.id).set(s); }catch(e){ avviso("Salvato solo su questo dispositivo."); } } }
async function cancellaSpesa(id){ delete S.spese[id]; salvaLocale(); if(S.db){ try{ await S.db.doc("spese/"+id).delete(); }catch(e){} } }
async function scriviCfg(){ S.cfg=merge(CFG_DEFAULT,S.cfgRaw); salvaLocale(); if(S.db){ try{ await S.db.doc("config/main").set(S.cfgRaw); }catch(e){ avviso("Impostazioni salvate solo su questo dispositivo."); } } }

/* ---------- modello scalo ---------- */
function nuovoScalo(){ var y=new Date().getFullYear(), n=0; for(var k in S.scali){ var sc=S.scali[k]; if(anno(sc.eta||sc.creato)===String(y)) n=Math.max(n,parseInt(sc.prot,10)||0); }
  return {id:nuovoId("sc"),prot:String(n+1),annoProt:y,creato:oggi(),agente:S.cfg.liste.agenti[0]||"",nave:"",imo:"",callSign:"",flag:"",tipo:"",gt:null,nt:null,dwt:null,loa:null,pescaggio:null,yob:"",master:"",
    eta:oggi(),etaOra:"",etd:"",provenienza:"",prossimo:"",ormeggio:"",operazione:"",carico:"",quantita:"",ricevitore:"",cliente:"",intestazione:"",banca:(S.cfg.banche[0]||{}).id||"",note:"",
    pda:{nPil:"2",nOrm:"2",nTug:"2",tugs:"1",transfer:false,anc:"",chim:"",items:{},extra:[],stamp:"",inviato:""},fda:{items:{},extra:[],stamp:"",inviato:""},incassi:[],pagDir:false}; }
function listaScali(){ var out=[]; for(var k in S.scali) out.push(S.scali[k]); out.sort(function(a,b){ var d=(b.eta||"").localeCompare(a.eta||""); return d||((parseInt(b.prot,10)||0)-(parseInt(a.prot,10)||0)); }); return out; }
function speseDi(id){ var out=[]; for(var k in S.spese) if(S.spese[k].scalo===id) out.push(S.spese[k]); out.sort(function(a,b){ return (a.dataFattura||"").localeCompare(b.dataFattura||"")||(a.fornitore||"").localeCompare(b.fornitore||""); }); return out; }
function voce(k){ for(var i=0;i<S.cfg.voci.length;i++) if(S.cfg.voci[i].k===k) return S.cfg.voci[i]; return null; }
function vocePerFornitore(f,descr){ f=upper(f); var t=upper(descr)+" "+f, V=S.cfg.voci;
  for(var i=0;i<V.length;i++) if(V[i].forn.some(function(x){ return upper(x)===f; })) return V[i].k;
  for(var j=0;j<V.length;j++) if(V[j].kw.some(function(w){ return w&&t.indexOf(upper(w))>=0; })) return V[j].k;
  return "other"; }
/* fornitori nell'ordine delle voci del conto (pilotage, mooring, tug, H.Master, garbage, security, water, provisions, ... poi le voci agenzia); NS FATTURA come gli altri */
function tuttiFornitori(){ var seen={}, out=[]; S.cfg.voci.forEach(function(v){ v.forn.forEach(function(f){ f=upper(f); if(!seen[f]){ seen[f]=1; out.push(f); } }); });
  var extra={}; for(var k in S.spese){ var f=upper(S.spese[k].fornitore||""); if(f&&!seen[f]) extra[f]=vocePerFornitore(f,S.spese[k].descrizione); }
  var ord={}; S.cfg.voci.forEach(function(v,i){ ord[v.k]=i; });
  Object.keys(extra).sort(function(a,b){ return ((ord[extra[a]]!=null?ord[extra[a]]:99)-(ord[extra[b]]!=null?ord[extra[b]]:99))||a.localeCompare(b); }).forEach(function(f){ out.push(f); });
  return out; }
function etichettaForn(f){ f=upper(f); var V=S.cfg.voci; for(var i=0;i<V.length;i++) if(V[i].forn.some(function(x){ return upper(x)===f; })) return f+" \u00b7 "+V[i].label; return f; }
/* valore di una voce nel PDA (preventivo): manuale > automatico da tariffe > standard */
function pdaVoce(sc,v){ var it=(sc.pda&&sc.pda.items)||{}, m=num(it[v.k]); if(m!==null) return {val:m,orig:"manuale"};
  if(v.auto) return {val:calcAuto(v.auto,sc),orig:"tariffa",nota:spiegaAuto(v.auto,sc)};
  if(v.std!=null) return {val:v.std,orig:"standard"}; return {val:0,orig:""}; }
/* valore di una voce nel FDA (consuntivo): manuale > fatture fornitori registrate > tariffa standard voci interne */
function fdaVoce(sc,v,sp){ var it=(sc.fda&&sc.fda.items)||{}, m=num(it[v.k]); if(m!==null) return {val:m,orig:"manuale"};
  var lst=(sp||speseDi(sc.id)).filter(function(s){ return s.voce===v.k&&num(s.totale)!==null; });
  if(lst.length){ var t=0; lst.forEach(function(s){ t+=num(s.totale); }); return {val:r2(t),orig:"fatture",n:lst.length,nota:lst.map(function(s){ return s.fornitore+(s.numFattura?" n. "+s.numFattura:"")+" € "+eur(s.totale); }).join(" · ")}; }
  if(v.int){ var q=pdaVoce(sc,v); if(q.val) return {val:q.val,orig:"standard",nota:"come da PDA"}; } return {val:0,orig:""}; }
function righeConto(sc,mode){ var sp=speseDi(sc.id), out=[]; S.cfg.voci.forEach(function(v){ var p=pdaVoce(sc,v), f=fdaVoce(sc,v,sp); out.push({k:v.k,label:v.label,pda:p,fda:f}); });
  var ex=(mode==="pda"?sc.pda:sc.fda).extra||[]; ex.forEach(function(e,i){ out.push({k:"x"+i,label:e.d||"",extra:true,pda:{val:mode==="pda"?num(e.v)||0:0},fda:{val:mode==="fda"?num(e.v)||0:0}}); });
  /* fatture non riconducibili ad alcuna voce standard finiscono in "other" tramite vocePerFornitore; spese con voce sconosciuta */
  sp.forEach(function(s){ if(!voce(s.voce)&&num(s.totale)!==null) out.push({k:"sp"+s.id,label:s.fornitore+(s.descrizione?" – "+s.descrizione:""),extra:true,pda:{val:0},fda:{val:num(s.totale),orig:"fatture"}}); });
  return out; }
function totali(sc,mode){ var r=righeConto(sc,mode), t=0; r.forEach(function(x){ t+= mode==="pda"? x.pda.val : x.fda.val; }); var st=num((mode==="pda"?sc.pda:sc.fda).stamp)||0; return {sub:r2(t),stamp:st,tot:r2(t+st)}; }
function haFda(sc){ var f=sc.fda||{}; if(f.inviato||(f.extra&&f.extra.length)||num(f.stamp)) return true; for(var k in (f.items||{})) if(f.items[k]!=="") return true; for(var j in S.spese) if(S.spese[j].scalo===sc.id) return true; return false; }
function totPda(sc){ return totali(sc,"pda").tot; } function totFda(sc){ return haFda(sc)? totali(sc,"fda").tot : 0; }
function incassato(sc){ var t=0; (sc.incassi||[]).forEach(function(i){ t+=num(i.importo)||0; }); return r2(t); }
function statoScalo(sc){ if(sc.pagDir) return {c:"grey",t:"pag. diretto"}; var f=totFda(sc), i=incassato(sc); if(!f&&!i) return {c:"grey",t:"preventivo"}; if(i>=f-0.005) return {c:"ok",t:"saldato"}; if(i>0) return {c:"warn",t:"parziale"}; return {c:"no",t:"da incassare"}; }
function daPagare(){ var t=0; for(var k in S.spese){ var s=S.spese[k], sc=S.scali[s.scalo]; if(num(s.totale)!==null&&!s.dataPagamento&&!(sc&&sc.pagDir)&&upper(s.fornitore)!=="NS FATTURA") t+=num(s.totale); } return r2(t); }

/* ---------- fatture doppie (dal Mastrino) ---------- */
function normFatt(n){ var t=upper(n).replace(/[^A-Z0-9]/g,""); var d=t.replace(/[^0-9]/g,""); return (d.length>=2?d:t).replace(/^0+(?=\d)/,""); }
function motivoDoppio(a,b){ if(!a||!b||a.id===b.id) return ""; if(upper(a.fornitore)!==upper(b.fornitore)) return "";
  var na=normFatt(a.numFattura), nb=normFatt(b.numFattura); if(na&&nb&&na===nb) return "stesso n. fattura "+(a.numFattura||"");
  if(na&&nb) return ""; var ta=num(a.totale), tb=num(b.totale); if(ta===null||tb===null||!ta) return "";
  var sa=S.scali[a.scalo]||{}, sb=S.scali[b.scalo]||{};
  if(upper(a.fornitore)==="DIRITTI CAPITANERIA"&&a.scalo!==b.scalo) return "";
  if(Math.abs(ta-tb)<0.005&&a.dataFattura&&a.dataFattura===b.dataFattura&&upper(sa.nave)&&upper(sa.nave)===upper(sb.nave)) return "stessa nave, stesso importo e stessa data fattura"; return ""; }
function doppioniDi(s){ var out=[]; for(var k in S.spese){ var m=motivoDoppio(s,S.spese[k]); if(m) out.push({s:S.spese[k],m:m}); } return out; }
function gruppiDoppioni(){ var visti={},g=[]; for(var k in S.spese){ if(visti[k]) continue; var d=doppioniDi(S.spese[k]); if(d.length){ var lst=[S.spese[k]].concat(d.map(function(x){ return x.s; })); lst.forEach(function(x){ visti[x.id]=1; }); g.push({m:d[0].m,lista:lst}); } } return g; }
function chipDoppia(s){ var d=doppioniDi(s); if(!d.length) return ""; return ' <span class="chip no" title="'+esc(d.map(function(x){ var sc=S.scali[x.s.scalo]||{}; return x.m+" – prot. "+(sc.prot||"?")+" "+(sc.nave||""); }).join(" | "))+'">addebitata 2 volte</span>'; }

/* ---------- render ---------- */
function render(){ var m=document.getElementById("main"), h="";
  document.querySelectorAll("#nav [data-view]").forEach(function(b){ b.setAttribute("aria-selected",String(b.getAttribute("data-view")===S.view)); });
  if(S.view==="scali") h= S.sel&&S.scali[S.sel]? scheda(S.scali[S.sel]) : elencoScali();
  else if(S.view==="fornitori") h=vistaFornitori();
  else if(S.view==="riepilogo") h=riepilogo();
  else if(S.view==="impostazioni") h=impostazioni();
  else h=guida();
  m.innerHTML=h; document.getElementById("foot").innerHTML=esc(S.cfg.ag.nomeBreve||"")+"<br>v"+VER+" · "+(S.db?"archivio condiviso":"solo questo dispositivo")+(chi()?"<br>"+esc(chi()):"");
  eventi(); if(S.doc) apriDoc(S.doc); }
function campo(id,label,v,tipo,extra){ return '<div class="field'+(extra&&extra.cls?" "+extra.cls:"")+'"><label for="'+id+'">'+label+'</label><input id="'+id+'" type="'+(tipo||"text")+'" value="'+esc(v==null?"":v)+'"'+(tipo==="number"?' step="any" class="num"':"")+(extra&&extra.list?' list="'+extra.list+'"':"")+(extra&&extra.ph?' placeholder="'+esc(extra.ph)+'"':"")+'></div>'; }
