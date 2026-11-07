import json,sys
sp=float(sys.argv[1]) if len(sys.argv)>1 else 1.1
voice=sys.argv[2] if len(sys.argv)>2 else 'am_puck'
L=[
("n1","ChatGPT gets about two and a half billion questions a day.",None),
("n2","Let's follow just one.",None),
("n3","So, can I eat pizza for breakfast? Send!",None),
("n4","Your words become ones and zeros.",None),
("n5","The phone's brain packs them up,",None),
("n6","and the antenna fires them out!",None),
("n7","Zap! To a tower, down a cable of light, into a building full of computers.",None),
("n8","Computers only understand numbers,",None),
("n9","so your question gets chopped into little LEGO bricks, each with a number.",None),
("n10","Then, it reads all the words together.",None),
("n11","Pizza, plus breakfast... a map to a pizza shop? Nope! A food question.",None),
("n12","Here's the surprise: it doesn't look the answer up.",None),
("n13","It writes one word at a time, always guessing the most likely next word.",None),
("n14","Like: twinkle, twinkle, little...",None),
("n15","Star! It learned that by reading a gigantic pile of text.",None),
("n16","Then, the answer zooms all the way back!",None),
("n17","Technically, yes! Just maybe add some fruit.",None),
("n18","All of that, in about two seconds.",None),
("n19","It just did that for you... and about two and a half billion more times today.",None),
("n20","And it has never once tasted a pizza.",None),
("n21","Follow for more.",None)]
SPD={"n1":1.2,"n7":1.2,"n9":1.2,"n11":1.2,"n13":1.2,"n19":1.2,"n3":1.1,"n17":1.08,"n20":1.05}
out=[]
for i,t,a in L:
    d={"id":i,"text":t,"voice":voice,"speed":SPD.get(i,sp)}
    if a: d["asr"]=a
    out.append(d)
json.dump(out,open(sys.argv[3] if len(sys.argv)>3 else 'lines.json','w'),indent=1)
