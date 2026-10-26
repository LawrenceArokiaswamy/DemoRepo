from gen import tts
from concurrent.futures import ThreadPoolExecutor
A="[panicked, breathing fast] Hello? Hello— [panicked, voice shaking] every scanner on Ward Four just died! [gasping] My nurses can't scan meds— we've got patients waiting! [desperate, close to tears] I can't wait for someone to drive in. Please!"
B="[out of breath, frantic] It's three a.m. and— [panicked] every scanner on Ward Four is dead! [voice cracking] We can't scan meds. We're back on paper! [shouting over alarms, desperate] I can't wait for someone to drive in!"
V={"sarah":"933563129e564b19a115bedd57b7406a","laura":"e3cd384158934cc9a01029cd7d278634","abby":"f6a19fe5ab494e1fa51bb1476d583a44","calm":"2a9605eeafe84974b5b20628d42c0060"}
jobs=[(t,r,f"panic_{n}_{k}.wav") for n,r in V.items() for k,t in (("A",A),("B",B))]
with ThreadPoolExecutor(4) as ex:
    for j,res in zip(jobs,ex.map(lambda j:tts(*j),jobs)): print(j[2],res)
