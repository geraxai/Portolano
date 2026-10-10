/* ===== Portolano — pratiche di scalo + mastrino dei conti nave (PDA/FDA) ===== */
"use strict";
var VER="1.14.0";
/* ---------- configurazione predefinita (tariffe da APPRODO.xlsx / Pratiche di Scalo, voci da Mastrino Approdi) ---------- */
var CFG_DEFAULT={
 ag:{nome:"Fratelli Bonanno S.r.l.",nomeBreve:"F.lli Bonanno Srl",sottotitolo:"SHIPPING AGENTS",indirizzo:"Via Anzalone 7, 95131 Catania - Italy",tel:"+39 095 326608",fax:"+39 095 310629",email:"fratellibonanno1848@gmail.com",piva:"03431780877",firmatario:"EMILIO GERACI",citta:"Catania"},
 banche:[{id:"fideuram",nome:"FIDEURAM BANK",iban:"IT57A0329601601000067079317",bic:"FIBKITMM"},{id:"unicredit",nome:"UNICREDIT BANK",iban:"IT12D0200816935000104744420",bic:"UNCRITM1L92"}],
 doc:{lingua:"en",layout:"sinistra",colore:"#0e4e5c",logo:"",mostraFax:true,mostraEmail:true,mostraPiva:true,mostraBanca:true,mostraFirma:true,mostraMessrs:true,nascondiZero:true,titoloPda:"PROFORMA DISBURSEMENT ACCOUNT",titoloFda:"FINAL DISBURSEMENT ACCOUNT",piede:"",notaPda:"Estimated figures, subject to final invoices. Bank charges for remitter's account.",notaFda:"Please remit the balance within 15 days from receipt."},
 pil:{step:5000,extra:84.95,bands:[[500,1000,146.83],[1001,2000,164.66],[2001,3500,371.29],[3501,5000,528.59],[5001,7000,679.81],[7001,10000,806.53],[10001,15000,979.58],[15001,20000,1127.46]]},
 orm:{step:1000,extra:21,bands:[[1,500,67],[501,1000,101.5],[1001,2000,155],[2001,3000,219],[3001,5000,286],[5001,7000,325],[7001,10000,373],[10001,15000,447],[15001,20000,559],[20001,25000,671]]},
 tug:{step:4000,extra:102.54,bands:[[1,1500,212.23],[1501,2500,425.54],[2501,4500,811.02],[4501,6500,999.63],[6501,7500,1273.1],[7501,9000,1367.41],[9001,11000,1635.01],[11001,13000,1817.7],[13001,16000,1999.25],[16001,20000,2098.27]]},
 transfer:2500,
 timbro:{attivo:true,documenti:{pda:true,fda:true},firmaAgente:true,immagine:"",colore:"#293a8c",sopra:"FRATELLI BONANNO",sotto:"SHIPPING AGENTS",righe:["- CATANIA -"],diametro:27,rotazione:-7,opacita:0.9,dx:0,dy:0,firme:{}},
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
  porti:["Catania","Augusta","Pozzallo","Siracusa","Messina","Palermo","Malta","Valletta","Gioia Tauro","Napoli","Livorno","Genova","Venezia","Piraeus","Barcelona","Marseille","Valencia","Algeciras","Tunis","Sfax","Alexandria","Istanbul","Constanta"]},
 conta:{giorniScadenza:30,chiusoFino:"",backupAuto:0,ivaDefault:22,formatoNum:"{n}/{anno}",nomeAzienda:"Fratelli Bonanno"}
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
function clone(o){ return o===undefined?undefined:JSON.parse(JSON.stringify(o)); }
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
var S={view:"cruscotto",sel:null,tab:"nave",contoMode:"confronto",scali:{},spese:{},cassa:{},cfg:clone(CFG_DEFAULT),cfgRaw:{},db:null,downloads:null,user:null,online:false,
  q:"",anno:"",filtro:"",editSpesa:null,dupWarn:null,dupOk:null,forn:"",fornStato:"tutte",ecAnno:"",imp:"agenzia",doc:null,hl:null,ready:false,pagTmp:null,qg:""};
var LS="portolano.v1";
function salvaLocale(){ try{ localStorage.setItem(LS,JSON.stringify({scali:S.scali,spese:S.spese,cassa:S.cassa,cfg:S.cfgRaw})); }catch(e){} }
function leggiLocale(){ try{ var j=JSON.parse(localStorage.getItem(LS)||"null"); if(j){ S.scali=j.scali||{}; S.spese=j.spese||{}; S.cassa=j.cassa||{}; S.cfgRaw=j.cfg||{}; S.cfg=merge(CFG_DEFAULT,S.cfgRaw); return true; } }catch(e){} return false; }
function chi(){ return (S.user&&S.user.nome)||""; }
function timbro(o){ o.updatedAt=new Date().toISOString(); if(chi()) o.updatedByName=chi(); return o; }
async function scriviScalo(sc){ timbro(sc); S.scali[sc.id]=sc; salvaLocale(); if(S.db){ try{ await S.db.doc("scali/"+sc.id).set(sc); }catch(e){ avviso("Salvato solo su questo dispositivo: "+(e.message||e)); } } }
async function cancellaScalo(id){ delete S.scali[id]; for(var k in S.spese) if(S.spese[k].scalo===id) delete S.spese[k]; salvaLocale();
  if(S.db){ try{ await S.db.doc("scali/"+id).delete(); var q=await S.db.collection("spese").where("scalo","==",id).get(); q.docs.forEach(function(d){ d.ref.delete().catch(function(){}); }); }catch(e){} } }
async function scriviSpesa(s){ timbro(s); S.spese[s.id]=s; salvaLocale(); if(S.db){ try{ await S.db.doc("spese/"+s.id).set(s); }catch(e){ avviso("Salvato solo su questo dispositivo."); } } }
async function cancellaSpesa(id){ delete S.spese[id]; salvaLocale(); if(S.db){ try{ await S.db.doc("spese/"+id).delete(); }catch(e){} } }
/* prima nota cassa: movimenti di cassa (spese quotidiane in contanti, prelievi dalla banca, versamenti in banca, entrate) — collezione "cassa", sincronizzata come scali e spese */
async function scriviCassa(m){ timbro(m); S.cassa[m.id]=m; salvaLocale(); if(S.db){ try{ await S.db.doc("cassa/"+m.id).set(m); }catch(e){ avviso("Salvato solo su questo dispositivo."); } } }
async function cancellaCassa(id){ delete S.cassa[id]; salvaLocale(); if(S.db){ try{ await S.db.doc("cassa/"+id).delete(); }catch(e){} } }
function cassaDi(id){ var out=[]; for(var k in S.cassa) if(S.cassa[k].scalo===id) out.push(S.cassa[k]); out.sort(function(a,b){ return (a.data||"").localeCompare(b.data||"")||(a.updatedAt||"").localeCompare(b.updatedAt||""); }); return out; }
/* spese di cassa dello scalo da addebitare al cliente (entrano nel FDA sulla voce indicata) */
function cassaFda(id){ return cassaDi(id).filter(function(m){ return m.tipo==="uscita"&&m.fda&&num(m.importo); }); }
function cassaSpeseDi(id){ var t=0,n=0; cassaDi(id).forEach(function(m){ if(m.tipo==="uscita"&&num(m.importo)){ t+=num(m.importo); n++; } }); return {tot:r2(t),n:n}; }
async function scriviCfg(){ S.cfg=merge(CFG_DEFAULT,S.cfgRaw); salvaLocale(); if(S.db){ try{ await S.db.doc("config/main").set(S.cfgRaw); }catch(e){ avviso("Impostazioni salvate solo su questo dispositivo."); } } }

/* ---------- modello scalo ---------- */
function nuovoScalo(){ var y=new Date().getFullYear(), n=0; for(var k in S.scali){ var sc=S.scali[k]; if(anno(sc.eta||sc.creato)===String(y)) n=Math.max(n,parseInt(sc.prot,10)||0); }
  return {id:nuovoId("sc"),prot:String(n+1),annoProt:y,creato:oggi(),agente:S.cfg.liste.agenti[0]||"",nave:"",imo:"",callSign:"",flag:"",tipo:"",gt:null,nt:null,dwt:null,loa:null,pescaggio:null,yob:"",master:"",
    eta:oggi(),etaOra:"",etd:"",provenienza:"",prossimo:"",ormeggio:"",operazione:"",carico:"",quantita:"",ricevitore:"",cliente:"",intestazione:"",banca:(S.cfg.banche[0]||{}).id||"",note:"",
    pda:{nPil:"2",nOrm:"2",nTug:"2",tugs:"1",transfer:false,anc:"",chim:"",items:{},extra:[],stamp:"",inviato:""},fda:{items:{},extra:[],stamp:"",inviato:"",numero:"",data:""},incassi:[],pagDir:false}; }
/* scalo "vuoto" = creato con + Nuovo scalo e mai compilato: si riusa invece di crearne un altro e si elimina appena lo si lascia */
function scaloVuoto(sc){ if(!sc) return false; if(["nave","imo","callSign","cliente","intestazione","attn","carico","quantita","note","operazione","ricevitore","master","provenienza","prossimo","ormeggio","flag","tipo"].some(function(k){ return String(sc[k]||"").trim()!==""; })) return false;
  if(num(sc.gt)!==null||num(sc.nt)!==null||(sc.incassi&&sc.incassi.length)) return false; var p=sc.pda||{}, f=sc.fda||{}; if((p.extra&&p.extra.length)||(f.extra&&f.extra.length)||p.inviato||f.inviato||f.numero||num(p.stamp)||num(f.stamp)) return false;
  var k; for(k in (p.items||{})) if(String(p.items[k])!=="") return false; for(k in (f.items||{})) if(String(f.items[k])!=="") return false; for(k in S.spese) if(S.spese[k].scalo===sc.id) return false; return true; }
function scaloVuotoEsistente(){ var L=listaScali(); for(var i=0;i<L.length;i++) if(scaloVuoto(L[i])) return L[i]; return null; }
async function creaScalo(){ if(S.creando) return null; S.creando=true; try{ var n=scaloVuotoEsistente(); if(!n){ n=nuovoScalo(); await scriviScalo(n); } S.nuovi=S.nuovi||{}; S.nuovi[n.id]=1; return n; } finally{ S.creando=false; } }
function pulisciVuoti(){ var N=S.nuovi||{}, og=oggi(), ids=[]; for(var id in S.scali){ var sc=S.scali[id]; if(S.view==="scali"&&S.sel===id) continue; if(!(N[id]||(sc.creato&&sc.creato<og))) continue; if(scaloVuoto(sc)) ids.push(id); }
  ids.forEach(function(id){ delete N[id]; try{ cancellaScalo(id); }catch(e){} }); return ids.length; }
function listaScali(){ var out=[]; for(var k in S.scali) out.push(S.scali[k]); out.sort(function(a,b){ var d=(b.eta||"").localeCompare(a.eta||""); return d||((parseInt(b.prot,10)||0)-(parseInt(a.prot,10)||0)); }); return out; }
function speseDi(id){ var out=[]; for(var k in S.spese) if(S.spese[k].scalo===id&&!isComm(S.spese[k])) out.push(S.spese[k]); out.sort(function(a,b){ return (a.dataFattura||"").localeCompare(b.dataFattura||"")||(a.fornitore||"").localeCompare(b.fornitore||""); }); return out; }
function voce(k){ for(var i=0;i<S.cfg.voci.length;i++) if(S.cfg.voci[i].k===k) return S.cfg.voci[i]; return null; }
function nomeVoce(s){ if(isComm(s)) return "Ns fattura di commissione"; var v=voce(s.voce); if(v) return v.label; if(s.voce==="libera") return s.voceLibera||"(voce libera)"; return s.voce||""; }
function vociLibere(){ var m={}; for(var k in S.spese){ var x=S.spese[k]; if(x.voce==="libera"&&x.voceLibera) m[x.voceLibera]=1; } return Object.keys(m).sort(); }
function pagamentiDi(s){ if(s.pagamenti&&s.pagamenti.length) return s.pagamenti; if(s.dataPagamento&&num(s.totale)!==null) return [{data:s.dataPagamento,importo:num(s.totale),modo:s.modo||"",note:"",legacy:true}]; return []; }
function pagatoDi(s){ var t=0; pagamentiDi(s).forEach(function(p){ t+=num(p.importo)||0; }); return r2(t); }
function residuoDi(s){ var t=num(s.totale); if(t===null) return 0; return r2(t-pagatoDi(s)); }
function statoSpesa(s){ var t=num(s.totale); if(t===null) return "aperta"; if(t<0) return residuoDi(s)>=-0.005?"pagata":"aperta"; if(residuoDi(s)<=0.005) return "pagata"; return pagatoDi(s)>0.005?"parziale":"aperta"; }
function chipPag(s){ var st=statoSpesa(s); if(st==="pagata"){ var u=pagamentiDi(s).slice(-1)[0]||{}; return '<span class="chip ok">'+dIt(s.dataPagamento||u.data)+(s.modo?" · "+esc(s.modo):"")+'</span>'; } if(st==="parziale") return '<span class="chip warn">parziale · resta € '+eur(residuoDi(s))+'</span>'; return '<span class="chip warn">'+(isComm(s)?"da incassare":"aperta")+'</span>'; }
function normalizzaPagamenti(e){ e.pagamenti=(e.pagamenti||[]).filter(function(p){ return num(p.importo)!==null; }).map(function(p){ return {data:p.data||"",importo:r2(num(p.importo)),modo:p.modo||"",note:p.note||""}; });
  if(e.pagamenti.length){ var res=residuoDi(e); if(res<=0.005){ var u=e.pagamenti[e.pagamenti.length-1]; e.dataPagamento=u.data||e.dataPagamento||oggi(); if(!e.modo&&u.modo) e.modo=u.modo; } else e.dataPagamento=""; } else if(!e.dataPagamento) e.dataPagamento=""; return e; }
function formPagamenti(pref,e){ var P=S.pagTmp||[], t=0, x='<div class="field full"><label>Pagamenti registrati</label>';
  if(P.length){ x+='<div class="scroll"><table><tbody>'; P.forEach(function(p,i){ t+=num(p.importo)||0; x+='<tr><td>'+dIt(p.data)+'</td><td class="num">'+eur(p.importo)+'</td><td class="sub">'+esc(p.modo||"")+(p.note?" · "+esc(p.note):"")+'</td><td><button class="btn small" data-pgdel="'+i+'">togli</button></td></tr>'; }); x+='</tbody></table></div>'; }
  var tot=num(e.totale), res=tot===null?null:r2(tot-t);
  x+='<div class="acts" style="margin-top:6px"><input type="date" id="'+pref+'pg_data" value="'+oggi()+'" style="width:auto"><input class="num" id="'+pref+'pg_imp" placeholder="importo"'+(res!==null&&res>0?' value="'+esc(String(res).replace(".",","))+'"':'')+' style="width:130px"><input id="'+pref+'pg_modo" placeholder="modo (bonifico, RID…)" style="width:170px"><button class="btn small" id="'+pref+'pgAdd">+ pagamento</button><span class="sub">pagato € '+eur(t)+(res!==null?' · residuo € '+eur(res):'')+' — oppure scrivi solo la data in "Pagata il" per saldare tutto</span></div></div>'; return x; }
function leggiPagamentiForm(pref,e){ e.pagamenti=(S.pagTmp||[]).map(function(p){ return {data:p.data||"",importo:num(p.importo),modo:p.modo||"",note:p.note||""}; });
  var pd=val(pref+"pag"); if(pd){ var res=residuoDi(e); if(res>0.005) e.pagamenti.push({data:pd,importo:res,modo:e.modo||"",note:""}); } else if(!pd&&S.pagTmp&&S.pagTmp.length===1&&S.pagTmp[0].legacy) e.pagamenti=[];
  return normalizzaPagamenti(e); }
function aggPagamento(pref){ var imp=num(val(pref+"pg_imp")); if(imp===null){ avviso("Indica l'importo del pagamento."); return false; } S.pagTmp=(S.pagTmp||[]).map(function(p){ var q=Object.assign({},p); delete q.legacy; return q; }); S.pagTmp.push({data:val(pref+"pg_data")||oggi(),importo:imp,modo:val(pref+"pg_modo"),note:""}); return true; }
function calcIva(pref){ var imp=num(val(pref+"imp")), p=num(val(pref+"ivap")), iva=num(val(pref+"iva")), rit=num(val(pref+"rit"))||0; if(imp===null) return; if(p!==null){ iva=r2(imp*p/100); var ei=document.getElementById(pref+"iva"); if(ei) ei.value=iva; } var et=document.getElementById(pref+"tot"); if(et) et.value=r2(imp+(iva||0)-rit); }
function scadenzaDi(s){ if(s.scadenza) return s.scadenza; var sc=S.scali[s.scalo]||{}, base=s.dataFattura||sc.etd||sc.eta||""; if(!base) return ""; var d=new Date(base+"T00:00:00"); if(isNaN(d)) return ""; d.setDate(d.getDate()+(num(S.cfg.conta.giorniScadenza)||30)); return d.toISOString().slice(0,10); }
function vocePerFornitore(f,descr){ f=upper(f); var t=upper(descr)+" "+f, V=S.cfg.voci;
  for(var i=0;i<V.length;i++) if(V[i].forn.some(function(x){ return upper(x)===f; })) return V[i].k;
  for(var j=0;j<V.length;j++) if(V[j].kw.some(function(w){ return w&&t.indexOf(upper(w))>=0; })) return V[j].k;
  return "other"; }
/* fornitori nell'ordine delle voci del conto (pilotage, mooring, tug, H.Master, garbage, security, water, provisions, ... poi le voci agenzia); NS FATTURA come gli altri */
/* NS FATTURA = fatture emesse dall'azienda (Fratelli Bonanno): in Contabilità prendono il nome dell'azienda e vanno tra le fatture emesse; nella registrazione e nel PDA/FDA restano "NS FATTURA" (voce Agency fees) */
function isNsNome(f){ f=upper(f).replace(/\./g,"").replace(/\s+/g," "); if(!f) return false; return f==="NS FATTURA"||/^NS FATT/.test(f)||/^NOSTRA FATT/.test(f)||/^N\/S FATT/.test(f)||f===upper(nomeAzienda())||/^F(RATELLI|LLI) BONANNO/.test(f); }
function isNs(s){ return isNsNome(s&&s.fornitore); }
/* ns fattura di commissione = fattura emessa dall'azienda a un fornitore (provvigione): in Contabilità è una fattura emessa; nell'estratto conto del fornitore va in avere e riduce quanto gli dobbiamo; non è un costo dello scalo e non entra nel FDA */
function isComm(s){ return !!(s&&s.tipo==="comm"); }
function commissioniDi(id){ var out=[]; for(var k in S.spese){ var x=S.spese[k]; if(x.scalo===id&&isComm(x)) out.push(x); } out.sort(function(a,b){ return (a.dataFattura||"").localeCompare(b.dataFattura||"")||(a.fornitore||"").localeCompare(b.fornitore||""); }); return out; }
function segnoForn(x){ return isComm(x)?-1:1; }
/* voci della fattura (dettaglio a lato del totale): dalla descrizione "… – Agency fees 500,00 · ISPS 200,00 …" oppure dal campo voci */
function vociNs(s){ if(!s) return []; if(Array.isArray(s.vociFatt)&&s.vociFatt.length) return s.vociFatt.map(function(v){ return {l:String(v.l||v.voce||""),v:num(v.v!==undefined?v.v:v.importo)}; }); var d=String(s.descrizione||"").trim(); if(!d) return []; var parts=d.split(/\s+[\u2013\u2014-]\s+/), seg=parts.filter(function(p){ return p.indexOf("\u00b7")>=0; }), txt=seg.length?seg[seg.length-1]:(parts[parts.length-1]||d), out=[];
  txt.split(/\s+\u00b7\s+/).forEach(function(v){ v=v.trim(); if(!v) return; var m=v.match(/^(.*?)[\s:]+\u20ac?\s*(-?\d[\d.]*(?:,\d{1,2})?)\s*\u20ac?$/); if(m&&m[1]&&num(m[2])!==null) out.push({l:m[1].trim(),v:num(m[2])}); else out.push({l:v,v:null}); }); return out; }
function vociNsTesto(s){ return vociNs(s).map(function(v){ return v.l+(v.v!==null?" "+eur(v.v):""); }).join(" \u00b7 "); }
function vociNsHtml(s,conNote){ var V=vociNs(s); if(!V.length&&!(conNote&&s.note)) return ""; var tot=0,n=0; V.forEach(function(v){ if(v.v!==null){ tot+=v.v; n++; } }); var t=num(s.totale), h='<ul class="voci">'+V.map(function(v){ return '<li><span>'+esc(v.l)+'</span>'+(v.v!==null?'<b>'+eur(v.v)+'</b>':'')+'</li>'; }).join("")+'</ul>'; if(n>1&&t!==null&&Math.abs(tot-t)>0.005) h+='<div class="sub" style="font-size:10.5px">voci \u20ac '+eur(tot)+' \u00b7 differenza \u20ac '+eur(t-tot)+'</div>'; if(conNote&&s.note) h+='<div class="sub nota1" title="'+esc(s.note)+'">'+esc(s.note)+'</div>'; return h; }
/* ricerca: ogni parola deve comparire; i numeri si confrontano anche senza punti/spazi (2994 trova 2.994,00; 74/2026 trova 74/2026) */
function cercaOk(q,campi){ q=upper(q||"").trim(); if(!q) return true; var t=upper(campi.filter(function(x){ return x!==null&&x!==undefined&&x!==""; }).join(" | ")), tn=t.replace(/[.\s]/g,""); return q.split(/\s+/).every(function(w){ var wn=w.replace(/[.\s]/g,""); return t.indexOf(w)>=0||(wn&&tn.indexOf(wn)>=0); }); }
function campiSpesa(s,sc){ sc=sc||S.scali[s.scalo]||{}; return [s.fornitore,nomeContab(s.fornitore),isNs(s)?"fattura emessa "+nomeAzienda():"",s.fuoriFda?"fuori fda non addebitata":"",isComm(s)?"ns fattura di commissione provvigione emessa "+nomeAzienda():"",s.numFattura,s.descrizione,s.note,vociNsTesto(s),nomeVoce(s),s.totale,eur(s.totale),s.imponibile,s.modo,s.dataFattura,dIt(s.dataFattura),s.dataPagamento,dIt(s.dataPagamento),(pagamentiDi(s)||[]).map(function(p){ return [p.importo,eur(p.importo),p.modo,p.note,dIt(p.data)].join(" "); }).join(" "),sc.nave,sc.prot,sc.id?(sc.prot||"?")+"/"+String(sc.annoProt||anno(sc.eta)||"").slice(2):"",sc.cliente,(sc.intestazione||"").split("\n")[0],sc.imo,sc.fda&&sc.fda.numero]; }
function nomeAzienda(){ return (S.cfg.conta&&S.cfg.conta.nomeAzienda)||"Fratelli Bonanno"; }
function nomeContab(f){ return isNsNome(f)?nomeAzienda():f; }
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
/* voce del conto corrispondente a una riga della ns fattura (etichetta libera: "Agency fees", "ISPS formalities", "Legal stamps"…) */
var SIN_NS=[["other","OTHER","ALTRE","ALTRO","VARIE"],["agency","AGENCY","AGENZIA","FEE"],["sanit","SANIT","IMMIGR"],["isps","ISPS"],["sludge","SLUDGE","BILGE","SENTINA"],["stamps","STAMP","BOLL","MARCHE"],["phone","PHONE","MAIL","TRANSPORT","TELEF","TRASPORT","TAXI"],["customs","CUSTOM","DOGAN"],["crew","CREW","EQUIPAGG"],["transfer","TRANSFER","AUTHORIT"],["shore","SHOREPASS","SHORE PASS","SHORE-PASS","PASS"],["disch","DISCHARG","AUTORIZZ"],["hm","HARBOUR","HARBOR","CAPITANERIA","DIRITTI"],["informer","INFORMER"],["pil","PILOT"],["orm","MOOR","ORMEGG"],["tug","TUG","RIMORCH"],["garbage","GARBAGE","RIFIUT"],["security","SECURITY"],["water","WATER","ACQUA"],["prov","PROVISION","PROVVIST"],["anchor","ANCHOR","ANCORAGG"],["chemist","CHEMIST","CHIMIC"],["fire","FIRE","VIGILI"],["medic","MEDIC","FARMAC"]];
function voceDaEtichetta(lab){ var t=upper(lab||"").replace(/[^A-Z0-9&\/ -]/g," ").replace(/\s+/g," ").trim(); if(!t) return null; var V=S.cfg.voci, i;
  for(i=0;i<V.length;i++) if(upper(V[i].label)===t) return V[i].k;
  for(i=0;i<V.length;i++){ var L=upper(V[i].label); if(L.indexOf(t)===0||t.indexOf(L)===0) return V[i].k; }
  for(i=0;i<SIN_NS.length;i++){ var r=SIN_NS[i]; for(var j=1;j<r.length;j++) if(t.indexOf(r[j])>=0) return voce(r[0])?r[0]:null; }
  for(i=0;i<V.length;i++) if((V[i].kw||[]).some(function(w){ return w&&t.indexOf(upper(w))>=0; })) return V[i].k;
  return null; }
/* ns fattura (Fratelli Bonanno) assegnata allo scalo, scomposta nelle sue voci: ogni riga va sulla voce del conto corrispondente; le righe senza voce e l'eventuale differenza col totale diventano righe aggiuntive del FDA */
/* fatture che compongono il FDA: quelle registrate allo scalo senza il contrassegno "fuori FDA" (una fattura fuori FDA resta in tutte le altre maschere: registro, scadenzario, estratto conto, prima nota) */
function speseFda(id){ return speseDi(id).filter(function(s){ return !s.fuoriFda; }); }
function nsDiScalo(sc,sp){ return (sp||speseFda(sc.id)).filter(function(s){ return isNs(s)&&num(s.totale)!==null; }); }
function vociNsConto(sc,sp){ var out={}, lib=[], tot=0, n=0, en=S.cfg.doc.lingua!=="it";
  nsDiScalo(sc,sp).forEach(function(s){ n++; var t=num(s.totale), rif=nomeAzienda()+(s.numFattura?" n. "+s.numFattura:"")+(s.dataFattura?" del "+dIt(s.dataFattura):""), V=vociNs(s).filter(function(v){ return v.v!==null; }); tot+=t;
    if(!V.length){ var k0=voce(s.voce)?s.voce:"agency", g0=out[k0]||(out[k0]={val:0,note:[]}); g0.val=r2(g0.val+t); g0.note.push(rif+" € "+eur(t)); return; }
    var somma=0; V.forEach(function(v){ somma=r2(somma+v.v); var k=voceDaEtichetta(v.l); if(k){ var g=out[k]||(out[k]={val:0,note:[]}); g.val=r2(g.val+v.v); g.note.push(rif+" – "+v.l+" € "+eur(v.v)); } else lib.push({label:v.l,val:v.v,nota:rif+" € "+eur(v.v)}); });
    var d=r2(t-somma); if(Math.abs(d)>0.005) lib.push({label:(en?"Other items as per invoice":"Altre voci in fattura")+(s.numFattura?" n. "+s.numFattura:""),val:d,nota:rif+" – differenza fra totale € "+eur(t)+" e voci dettagliate € "+eur(somma)}); });
  return {n:n,tot:r2(tot),voci:out,lib:lib}; }
/* numero e data del FDA: quelli scritti nel conto, altrimenti quelli della ns fattura assegnata allo scalo */
function fdaRif(sc){ var f=sc.fda||{}, L=nsDiScalo(sc), s=L.length?L[L.length-1]:null; return {numero:f.numero||(s&&s.numFattura)||"",data:f.data||(s&&s.dataFattura)||"",ns:s,daNs:!f.numero&&!!(s&&s.numFattura)}; }
/* valore di una voce nel FDA (consuntivo): le fatture registrate (fornitori voce per voce + ns fattura scomposta) prevalgono su tutto; senza fatture vale l'importo manuale; le voci interne senza fattura restano come nel PDA solo se allo scalo non è assegnata una ns fattura */
function fdaVoce(sc,v,sp,ns){ sp=sp||speseFda(sc.id); ns=ns||vociNsConto(sc,sp); var it=(sc.fda&&sc.fda.items)||{}, m=num(it[v.k]), t=0, n=0, note=[];
  sp.forEach(function(s){ if(isNs(s)||s.voce!==v.k||num(s.totale)===null) return; t+=num(s.totale); n++; note.push(s.fornitore+(s.numFattura?" n. "+s.numFattura:"")+" € "+eur(s.totale)); });
  cassaFda(sc.id).forEach(function(m){ if(m.voce!==v.k) return; t+=num(m.importo); n++; note.push("cassa "+dIt(m.data)+(m.descr?" "+m.descr:"")+" € "+eur(m.importo)); });
  var g=ns.voci[v.k]; if(g){ t+=g.val; n+=g.note.length; note=note.concat(g.note); }
  if(n) return {val:r2(t),orig:"fatture",n:n,nota:note.join(" · "),manuale:m};
  if(m!==null) return {val:m,orig:"manuale"};
  if(v.int&&!ns.n){ var q=pdaVoce(sc,v); if(q.val) return {val:q.val,orig:"standard",nota:"come da PDA"}; }
  return {val:0,orig:(ns.n&&(v.int||v.opz))?"non in ns fattura":""}; }
function righeConto(sc,mode){ var sp=speseFda(sc.id), ns=vociNsConto(sc,sp), out=[]; S.cfg.voci.forEach(function(v){ var p=pdaVoce(sc,v), f=fdaVoce(sc,v,sp,ns); out.push({k:v.k,label:v.label,pda:p,fda:f}); });
  var ex=(mode==="pda"?sc.pda:sc.fda).extra||[]; ex.forEach(function(e,i){ out.push({k:"x"+i,label:e.d||"",extra:true,pda:{val:mode==="pda"?num(e.v)||0:0},fda:{val:mode==="fda"?num(e.v)||0:0}}); });
  ns.lib.forEach(function(g,i){ out.push({k:"ns"+i,label:g.label,extra:true,ns:true,pda:{val:0},fda:{val:g.val,orig:"fatture",n:1,nota:g.nota}}); });
  /* fatture non riconducibili ad alcuna voce standard finiscono in "other" tramite vocePerFornitore; spese con voce sconosciuta */
  var lib={}; sp.forEach(function(s){ if(isNs(s)||voce(s.voce)||num(s.totale)===null) return; var lab=(s.voce==="libera"&&s.voceLibera)?s.voceLibera:s.fornitore+(s.descrizione?" – "+s.descrizione:""); var g=lib[upper(lab)]||(lib[upper(lab)]={label:lab,val:0,n:0,note:[]}); g.val=r2(g.val+num(s.totale)); g.n++; g.note.push(s.fornitore+(s.numFattura?" n. "+s.numFattura:"")+" € "+eur(s.totale)); });
  if(mode!=="pda") cassaFda(sc.id).forEach(function(m){ if(voce(m.voce)) return; var lab=m.descr||m.categoria||"Spese di cassa"; var g=lib[upper(lab)]||(lib[upper(lab)]={label:lab,val:0,n:0,note:[]}); g.val=r2(g.val+num(m.importo)); g.n++; g.note.push("cassa "+dIt(m.data)+" € "+eur(m.importo)); });
  var pex=(sc.pda&&sc.pda.extra)||[]; Object.keys(lib).forEach(function(k){ var g=lib[k], pv=0; if(mode!=="pda") pex.forEach(function(e){ if(upper(e.d||"")===k) pv+=num(e.v)||0; }); out.push({k:"lib"+k,label:g.label,extra:true,pda:{val:r2(pv)},fda:{val:g.val,orig:"fatture",n:g.n,nota:g.note.join(" · ")}}); });
  return out; }
function totali(sc,mode){ var r=righeConto(sc,mode), t=0; r.forEach(function(x){ t+= mode==="pda"? x.pda.val : x.fda.val; }); var st=num((mode==="pda"?sc.pda:sc.fda).stamp)||0; return {sub:r2(t),stamp:st,tot:r2(t+st)}; }
function numFdaInt(n){ var m=String(n||"").match(/\d+/); return m?parseInt(m[0],10):0; }
function prossimoNumeroFda(y){ y=String(y||new Date().getFullYear()); var n=0; for(var k in S.scali){ var f=S.scali[k].fda||{}; if(!f.numero) continue; var ay=anno(f.data||f.inviato||S.scali[k].etd||S.scali[k].eta); if(ay===y) n=Math.max(n,numFdaInt(f.numero)); }
  return String(S.cfg.conta.formatoNum||"{n}/{anno}").replace("{n}",String(n+1)).replace("{anno}",y).replace("{aa}",y.slice(2)); }
function haFda(sc){ var f=sc.fda||{}; if(f.inviato||(f.extra&&f.extra.length)||num(f.stamp)) return true; for(var k in (f.items||{})) if(f.items[k]!=="") return true; for(var j in S.spese) if(S.spese[j].scalo===sc.id&&!isComm(S.spese[j])&&!S.spese[j].fuoriFda) return true; if(cassaFda(sc.id).length) return true; return false; }
function totPda(sc){ return totali(sc,"pda").tot; } function totFda(sc){ return haFda(sc)? totali(sc,"fda").tot : 0; }
function incassato(sc){ var t=0; (sc.incassi||[]).forEach(function(i){ t+=num(i.importo)||0; }); return r2(t); }
function statoScalo(sc){ if(sc.pagDir) return {c:"grey",t:"pag. diretto"}; var f=totFda(sc), i=incassato(sc); if(!f&&!i) return {c:"grey",t:"preventivo"}; if(i>=f-0.005) return {c:"ok",t:"saldato"}; if(i>0) return {c:"warn",t:"parziale"}; return {c:"no",t:"da incassare"}; }
function daPagare(){ var t=0; for(var k in S.spese){ var s=S.spese[k], sc=S.scali[s.scalo]; if(num(s.totale)!==null&&statoSpesa(s)!=="pagata"&&!(sc&&sc.pagDir)&&!isNs(s)&&!isComm(s)) t+=residuoDi(s); } return r2(t); }

/* ---------- fatture doppie (dal Mastrino) ---------- */
function normFatt(n){ var t=upper(n).replace(/[^A-Z0-9]/g,""); var d=t.replace(/[^0-9]/g,""); return (d.length>=2?d:t).replace(/^0+(?=\d)/,""); }
function motivoDoppio(a,b){ if(!a||!b||a.id===b.id) return ""; if(upper(a.fornitore)!==upper(b.fornitore)) return ""; if(isComm(a)!==isComm(b)) return "";
  var na=normFatt(a.numFattura), nb=normFatt(b.numFattura); if(na&&nb&&na===nb) return "stesso n. fattura "+(a.numFattura||"");
  if(na&&nb) return ""; var ta=num(a.totale), tb=num(b.totale); if(ta===null||tb===null||!ta) return "";
  var sa=S.scali[a.scalo]||{}, sb=S.scali[b.scalo]||{};
  if(upper(a.fornitore)==="DIRITTI CAPITANERIA"&&a.scalo!==b.scalo) return "";
  if(Math.abs(ta-tb)<0.005&&a.dataFattura&&a.dataFattura===b.dataFattura&&upper(sa.nave)&&upper(sa.nave)===upper(sb.nave)) return "stessa nave, stesso importo e stessa data fattura"; return ""; }
function doppioniDi(s){ var out=[]; for(var k in S.spese){ var m=motivoDoppio(s,S.spese[k]); if(m) out.push({s:S.spese[k],m:m}); } return out; }
function gruppiDoppioni(){ var visti={},g=[]; for(var k in S.spese){ if(visti[k]) continue; var d=doppioniDi(S.spese[k]); if(d.length){ var lst=[S.spese[k]].concat(d.map(function(x){ return x.s; })); lst.forEach(function(x){ visti[x.id]=1; }); g.push({m:d[0].m,lista:lst}); } } return g; }
function chipDoppia(s){ var d=doppioniDi(s); if(!d.length) return ""; return ' <span class="chip no" title="'+esc(d.map(function(x){ var sc=S.scali[x.s.scalo]||{}; return x.m+" – prot. "+(sc.prot||"?")+" "+(sc.nave||""); }).join(" | "))+'">addebitata 2 volte</span>'; }

/* ---------- render ---------- */
function render(){ var m=document.getElementById("main"), h=""; try{ pulisciVuoti(); }catch(e){}
  document.querySelectorAll("#nav [data-view]").forEach(function(b){ b.setAttribute("aria-selected",String(b.getAttribute("data-view")===S.view)); });
  if(S.view==="scali") h= S.sel&&S.scali[S.sel]? scheda(S.scali[S.sel]) : elencoScali();
  else if(S.view==="cruscotto") h=(typeof vistaCruscotto==="function")?vistaCruscotto():elencoScali();
  else if(S.view==="cerca") h=(typeof vistaCerca==="function")?vistaCerca():elencoScali();
  else if(S.view==="fatture") h=vistaFatture();
  else if(S.view==="fornitori") h=vistaFornitori();
  else if(S.view==="conta") h=(typeof vistaConta==="function")?vistaConta():guida();
  else if(S.view==="riepilogo") h=riepilogo();
  else if(S.view==="impostazioni") h=impostazioni();
  else h=guida();
  m.innerHTML=h; document.getElementById("foot").innerHTML=esc(S.cfg.ag.nomeBreve||"")+"<br>v"+VER+" · "+(S.db?"archivio condiviso":"solo questo dispositivo")+(chi()?"<br>"+esc(chi()):"");
  eventi(); if(S.doc) apriDoc(S.doc); }
function campo(id,label,v,tipo,extra){ return '<div class="field'+(extra&&extra.cls?" "+extra.cls:"")+'"><label for="'+id+'">'+label+'</label><input id="'+id+'" type="'+(tipo||"text")+'" value="'+esc(v==null?"":v)+'"'+(tipo==="number"?' step="any" class="num"':"")+(extra&&extra.list?' list="'+extra.list+'"':"")+(extra&&extra.ph?' placeholder="'+esc(extra.ph)+'"':"")+'></div>'; }


/* ---- periodo: mese oppure intervallo di date (valore "range" nel menu dei mesi) ---- */
function perOk(d,mese,da,a){ d=String(d||"").slice(0,10); if(mese==="range"){ if(da&&(!d||d<da)) return false; if(a&&(!d||d>a)) return false; return true; } if(mese) return d.slice(0,7)===mese; return true; }
function annoOk(d,an,mese){ if(mese==="range") return true; return !an||anno(d)===an; }
/* date scritte nel testo di ricerca: "dal 05/02/26 al 01/03/26", "5/2/2026 - 1/3/2026", "dal 5/2/26", "al 1/3/26", "fino al 1/3/26": restituisce {da,a,resto} (ISO) */
function estraiPeriodo(q){ var r={da:"",a:"",resto:String(q||"")}; if(!r.resto) return r;
  var D="(\\d{1,2})[\\/.\\-](\\d{1,2})[\\/.\\-](\\d{2,4})", iso=function(m){ var y=m[3].length===2?"20"+m[3]:m[3], mo=("0"+m[2]).slice(-2), d=("0"+m[1]).slice(-2); if(+mo<1||+mo>12||+d<1||+d>31) return ""; return y+"-"+mo+"-"+d; };
  var re1=new RegExp("(?:\\bdal?\\s+)?"+D+"\\s*(?:-|–|al?|a|fino al|→)\\s*"+D,"i"), m=r.resto.match(re1);
  if(m){ r.da=iso([m[0],m[1],m[2],m[3]]); r.a=iso([m[0],m[4],m[5],m[6]]); r.resto=r.resto.replace(m[0]," "); }
  else{ var m2=r.resto.match(new RegExp("\\bdal?\\s+"+D,"i")); if(m2){ r.da=iso(m2); r.resto=r.resto.replace(m2[0]," "); }
    var m3=r.resto.match(new RegExp("\\b(?:fino al|entro il|entro|al)\\s+"+D,"i")); if(m3){ r.a=iso(m3); r.resto=r.resto.replace(m3[0]," "); } }
  if(r.da&&r.a&&r.da>r.a){ var t=r.da; r.da=r.a; r.a=t; } r.resto=r.resto.replace(/\s+/g," ").trim(); return r; }
function campiDate(id,da,a){ return '<div class="field"><label for="'+id+'Da">Dal</label><input type="date" id="'+id+'Da" value="'+esc(da||"")+'"></div><div class="field"><label for="'+id+'A">Al</label><input type="date" id="'+id+'A" value="'+esc(a||"")+'"></div>'+((da||a)?'<div class="field"><label>&nbsp;</label><button class="btn small" id="'+id+'X" type="button">tutte le date</button></div>':""); }
function campiPeriodo(id,mese,da,a){ if(mese!=="range") return ""; return '<div class="field"><label for="'+id+'Da">Dal</label><input type="date" id="'+id+'Da" value="'+esc(da||"")+'"></div><div class="field"><label for="'+id+'A">Al</label><input type="date" id="'+id+'A" value="'+esc(a||"")+'"></div>'; }
function testoPeriodo(mese,da,a,an,nomeMese){ if(mese==="range") return (da?"dal "+dIt(da):"")+(a?" al "+dIt(a):"")||"tutte le date"; if(mese) return nomeMese(mese); if(an) return "anno "+an; return "tutti gli anni"; }
function optRange(v){ return opt("range","intervallo di date…",v); }
