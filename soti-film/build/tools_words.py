# Transcribe each voice clip locally with Whisper -> word timestamps + 60fps loudness envelope
import json,glob,os,numpy as np,soundfile as sf
from faster_whisper import WhisperModel
m=WhisperModel("medium.en",device="cpu",compute_type="int8")
D=os.path.dirname(__file__)+"/assets/vo"; out={}
for f in sorted(glob.glob(D+"/*.wav")):
    k=os.path.basename(f)[:-4]
    segs,_=m.transcribe(f,word_timestamps=True,language="en")
    words=[{"w":w.word.strip(),"s":round(w.start,3),"e":round(w.end,3)} for s in segs for w in s.words]
    y,sr=sf.read(f); y=y if y.ndim==1 else y.mean(1)
    hop=sr//60; env=[float(np.sqrt(np.mean(y[i:i+hop]**2))) for i in range(0,len(y),hop)]
    mx=max(env) or 1; env=[round(min(1,v/mx),3) for v in env]
    out[k]={"dur":round(len(y)/sr,3),"words":words,"env":env}
    print(k,out[k]["dur"]," ".join(f"{w['w']}@{w['s']}" for w in words))
json.dump(out,open(D+"/vo.json","w"))
