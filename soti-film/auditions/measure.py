import sys,re,difflib,numpy as np,librosa
from faster_whisper import WhisperModel
m=WhisperModel("medium.en",device="cpu",compute_type="int8")
REF={"A":"Hello Hello every scanner on Ward Four just died My nurses can't scan meds we've got patients waiting I can't wait for someone to drive in Please",
     "B":"It's three a.m. and every scanner on Ward Four is dead We can't scan meds We're back on paper I can't wait for someone to drive in"}
norm=lambda s:re.sub(r"[^a-z0-9' ]","",s.lower().replace("4","four").replace("3","three").replace("a.m.","am").replace("a .m.","am")).split()
def feats(f):
    y,sr=librosa.load(f,sr=22050)
    f0,v,_=librosa.pyin(y,fmin=80,fmax=600,sr=sr); f0=f0[~np.isnan(f0)]
    return np.median(f0), np.std(12*np.log2(f0/np.median(f0)))
rows=[]
for f in sorted(sys.argv[1:]):
    segs,_=m.transcribe(f,word_timestamps=True,language="en"); W=[w for s in segs for w in s.words]
    hyp=" ".join(w.word.strip() for w in W); k=f.split('_')[-1][0] if f.startswith('panic') else None
    acc=difflib.SequenceMatcher(None,norm(REF[k]),norm(hyp)).ratio() if k else float('nan')
    rate=len(W)/max(.1,W[-1].end-W[0].start); med,sd=feats(f)
    rows.append((f,acc,rate,med,sd,hyp))
for f,acc,rate,med,sd,hyp in rows:
    print(f"{f:20} clear {acc:4.0%}  speed {rate:3.1f} w/s  pitch {med:5.0f}Hz  swings {sd:4.1f} st\n    heard: {hyp}")
