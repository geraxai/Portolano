import json,glob,os,re
VOCI=[("pil",["PILOTI"],["PILOT"]),("orm",["ORMEGGIATORI"],["ORMEGG","MOOR"]),("tug",["RIMORCHIATORI"],["RIMORCH","TUG"]),("anchor",["TASSA ANCORAGGIO"],["ANCORAGG","ANCHOR"]),("hm",["DIRITTI CAPITANERIA"],["CAPITANERIA","HARBOUR","DIRITTI"]),("customs",["DOGANA"],["DOGAN","CUSTOM","SPEDIZION"]),("sanit",[],["SANIT"]),("disch",[],[]),("security",["MG SECURITY"],["SECURITY"]),("informer",["PORT INFORMER"],["INFORMER"]),("chemist",["CHIMICO"],["CHIMIC","CHEMIST"]),("fire",["VVFF"],["VVFF","VIGILI","FIRE"]),("phone",["EVO TAXI"],["TRASPORT","TAXI","NCC"]),("shore",[],[]),("transfer",[],[]),("isps",[],["ISPS"]),("garbage",["LA PORTUALE"],["PORTUALE","GARBAGE","RIFIUT"]),("stamps",[],["BOLL","STAMP"]),("sludge",[],["SLUDGE","SENTINA"]),("water",["SIDRA","G&G"],["SIDRA","WATER","ACQUA"]),("prov",["FRATELLI SCIOTTO"],["SCIOTTO","PROVIS"]),("sogesal",["SOGESAL"],["SOGESAL"]),("crew",[],["CREW"]),("medic",["CACCAMO"],["CACCAMO","MEDIC","FARMAC"]),("agency",["NS FATTURA"],["AGENCY","AGENZIA"]),("other",["ALTRO"],[])]
STD={"hm":65,"sanit":200,"informer":80,"transfer":80,"isps":300,"stamps":60,"sludge":160}
def voce(f,d):
    f=(f or "").upper().strip(); t=(d or "").upper()+" "+f
    for k,fs,kw in VOCI:
        if f in fs: return k
    for k,fs,kw in VOCI:
        if any(w in t for w in kw): return k
    return "other"
ap={}; 
for fn in glob.glob("/home/claude/mastrino-repo/seed/approdi/*.json"):
    a=json.load(open(fn)); ap[str(a["prot"])]=a
sp=[json.load(open(fn)) for fn in glob.glob("/home/claude/mastrino-repo/seed/spese/*.json")]
scali={}; spese={}
def banca(b):
    b=(b or "").upper(); return "unicredit" if "UNI" in b else ("fideuram" if "FID" in b else "")
for prot,a in ap.items():
    eta=a.get("dataApprodo") or ""; y=int(eta[:4]) if eta else 2026
    sid="sc%s_%s"%(y,prot.zfill(3))
    sc={"id":sid,"prot":prot,"annoProt":y,"creato":eta,"agente":"Emilio Geraci","nave":(a.get("nave") or "").upper(),"imo":"","callSign":"","flag":"","tipo":(a.get("tipoNave") or "").upper(),"gt":a.get("gt"),"nt":a.get("nt"),"dwt":None,"loa":None,"pescaggio":None,"yob":"","master":"",
        "eta":eta,"etaOra":"","etd":a.get("dataPartenza") or "","provenienza":"","prossimo":"","ormeggio":"","operazione":"","carico":a.get("carico") or "","quantita":"","ricevitore":a.get("ricevitore") or "","cliente":a.get("cliente") or "","intestazione":a.get("intestazione") or "","attn":"","banca":banca(a.get("banca")) or "fideuram","note":a.get("note") or "",
        "pda":{"nPil":"2","nOrm":"2","nTug":"2","tugs":"1","transfer":False,"anc":"","chim":"","items":{},"extra":[],"stamp":"","inviato":""},"fda":{"items":{},"extra":[],"stamp":"","inviato":""},"incassi":[],"pagDir":bool(re.search(r"PAG\s*DIR",a.get("note") or "",re.I)),"updatedAt":"2026-09-19T00:00:00Z","updatedByName":"import Mastrino"}
    if not a.get("importoBonifico") and str(a.get("saldato","")).upper().startswith("S") and a.get("importoPda"): sc["incassi"].append({"importo":a["importoPda"],"data":a.get("dataBonifico") or a.get("dataPartenza") or eta,"banca":banca(a.get("banca")) or "fideuram","note":"saldato (Mastrino)"})
    if a.get("importoBonifico"): sc["incassi"].append({"importo":a["importoBonifico"],"data":a.get("dataBonifico") or "","banca":banca(a.get("banca")) or "fideuram","note":"bonifico (Mastrino)"})
    scali[sid]=sc
for s in sp:
    prot=str(s["prot"]); 
    if prot not in ap: continue
    a=ap[prot]; eta=a.get("dataApprodo") or ""; y=int(eta[:4]) if eta else 2026; sid="sc%s_%s"%(y,prot.zfill(3)); sc=scali[sid]
    forn=(s.get("fornitore") or "").upper(); vk=voce(forn,s.get("descrizione"))
    ip=s.get("importoPda")
    if ip is not None:
        if vk!="other": sc["pda"]["items"][vk]=str(round((float(sc["pda"]["items"].get(vk,"0") or 0))+ip,2))
        else: sc["pda"]["extra"].append({"d":forn+((" – "+s["descrizione"]) if s.get("descrizione") else ""),"v":str(ip)})
    if s.get("totale") is not None or s.get("numFattura") or s.get("dataFattura"):
        spese[s["id"]]={"id":s["id"],"scalo":sid,"fornitore":forn,"voce":vk,"numFattura":s.get("numFattura") or "","dataFattura":s.get("dataFattura") or "","totale":s.get("totale"),"descrizione":s.get("descrizione") or "","dataPagamento":s.get("dataPagamento") or "","modo":s.get("modoPagamento") or "","note":s.get("note") or "","updatedAt":"2026-09-19T00:00:00Z","updatedByName":"import Mastrino"}
    elif s.get("note"):
        spese[s["id"]]={"id":s["id"],"scalo":sid,"fornitore":forn,"voce":vk,"numFattura":"","dataFattura":"","totale":None,"descrizione":s.get("descrizione") or "","dataPagamento":"","modo":"","note":s.get("note") or "","updatedAt":"2026-09-19T00:00:00Z","updatedByName":"import Mastrino"}
# riconcilia importoPda totale
for prot,a in ap.items():
    eta=a.get("dataApprodo") or ""; y=int(eta[:4]) if eta else 2026; sc=scali["sc%s_%s"%(y,prot.zfill(3))]
    tot=a.get("importoPda")
    if tot:
        items=sc["pda"]["items"]; somma=sum(float(v) for v in items.values())+sum(float(e["v"]) for e in sc["pda"]["extra"])
        for k in STD:
            if k not in items: items[k]="0"
        # voci auto senza importo manuale: nel Mastrino non c'era tariffa -> forziamo a 0 se non presenti
        for k in ("pil","orm","tug"):
            if k not in items: items[k]="0"
        diff=round(tot-somma,2)
        if abs(diff)>0.5: sc["pda"]["extra"].append({"d":"Altre voci PDA (Mastrino)","v":str(diff)})
json.dump({"scali":scali,"spese":spese},open("seed_portolano.json","w"),ensure_ascii=False)
print(len(scali),len(spese)); print(json.dumps(scali["sc2026_009"],ensure_ascii=False)[:900])
