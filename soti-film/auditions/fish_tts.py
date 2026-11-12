import json,sys,urllib.request
def tts(text,ref,out,model='s2.1-pro-free',fmt='wav'):
    body=json.dumps({"text":text,"reference_id":ref,"format":fmt,"sample_rate":44100,"normalize":False,"latency":"normal"}).encode()
    req=urllib.request.Request("https://api.fish.audio/v1/tts",data=body,headers={"Content-Type":"application/json","model":model})
    try:
        with urllib.request.urlopen(req,timeout=180) as r: open(out,'wb').write(r.read()); return 'ok'
    except urllib.error.HTTPError as e: return f'ERR {e.code} {e.read()[:200]}'
if __name__=='__main__':
    NURSE="[exhausted, frustrated] It's three a.m. and every scanner on Ward Four just... [sigh] died. [voice breaking] My nurses can't scan meds. We're back on paper. [urgent, pleading] I can't wait for someone to drive in."
    STELLA="[warm, empathetic] I hear you. [soft] I can already see every device on Ward Four. Stay with your patients... [reassuring, confident] and I've got you."
    V={"sarah":"933563129e564b19a115bedd57b7406a","laura":"e3cd384158934cc9a01029cd7d278634","abby":"f6a19fe5ab494e1fa51bb1476d583a44","paula":"c2623f0c075b4492ac367989aee1576f","calm":"2a9605eeafe84974b5b20628d42c0060"}
    from concurrent.futures import ThreadPoolExecutor
    jobs=[(t,r,f"{n}_{k}.wav") for n,r in V.items() for k,t in (("nurse",NURSE),("stella",STELLA))]
    with ThreadPoolExecutor(5) as ex:
        for j,res in zip(jobs,ex.map(lambda j:tts(*j),jobs)): print(j[2],res)
