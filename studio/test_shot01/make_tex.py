import random, math, sys
from PIL import Image, ImageDraw, ImageFilter
out=sys.argv[1]; random.seed(3)
def parchment(w,h):
    im=Image.new('RGB',(w,h),(222,200,160)); px=im.load()
    noise=Image.effect_noise((w,h),40).convert('L').filter(ImageFilter.GaussianBlur(6))
    big=Image.effect_noise((w//16,h//16),60).convert('L').resize((w,h),Image.BICUBIC)
    base=Image.new('RGB',(w,h),(226,204,163))
    dark=Image.new('RGB',(w,h),(170,135,90))
    m=Image.blend(noise,big,0.6).point(lambda v:max(0,min(255,(v-90)*2)))
    im=Image.composite(dark,base,m)
    # burnt edges vignette
    vig=Image.new('L',(w,h),0); d=ImageDraw.Draw(vig)
    for i in range(60): d.rectangle([i,i,w-1-i,h-1-i],outline=int(255*(1-i/60)**2))
    im=Image.composite(Image.new('RGB',(w,h),(110,75,40)),im,vig.filter(ImageFilter.GaussianBlur(8)))
    return im
ink=(60,38,22)
def gear(d,cx,cy,r,n,wd=3):
    pts=[]
    for i in range(n):
        a=2*math.pi*i/n; s=2*math.pi/n
        for f,rr in [(0,r*0.86),(0.15,r),(0.45,r),(0.6,r*0.86)]:
            pts.append((cx+rr*math.cos(a+f*s),cy+rr*math.sin(a+f*s)))
    d.line(pts+[pts[0]],fill=ink,width=wd)
    d.ellipse([cx-r*0.25,cy-r*0.25,cx+r*0.25,cy+r*0.25],outline=ink,width=wd)
    for k in range(6):
        a=k*math.pi/3; d.line([(cx+r*0.25*math.cos(a),cy+r*0.25*math.sin(a)),(cx+r*0.78*math.cos(a),cy+r*0.78*math.sin(a))],fill=ink,width=wd)
def scribble(d,x,y,wid,lines=6):
    for l in range(lines):
        yy=y+l*26; xx=x
        while xx<x+wid*random.uniform(0.6,1):
            seg=random.randint(18,60); pts=[]
            for t in range(seg//3):
                pts.append((xx+t*3,yy+4*math.sin((xx+t*3)*0.5+random.random())))
            d.line(pts,fill=ink,width=2); xx+=seg+12
# sheet 1: gear train schematic
im=parchment(1024,1400); d=ImageDraw.Draw(im)
gear(d,380,520,230,24); gear(d,700,700,140,14); gear(d,820,520,95,10)
d.line([(80,1000),(944,1000)],fill=ink,width=2)
for x in range(100,944,40): d.line([(x,990),(x,1010)],fill=ink,width=2)
scribble(d,90,1060,820,9); scribble(d,90,90,600,4)
im.filter(ImageFilter.GaussianBlur(0.6)).save(f"{out}/sheet_gears.png")
# sheet 2: armillary sphere sketch
im=parchment(1024,1400); d=ImageDraw.Draw(im); cx,cy=512,560
for r,(sx,sy) in [(330,(1,1)),(300,(1,0.35)),(300,(0.35,1)),(260,(1,0.6))]:
    d.ellipse([cx-r*sx,cy-r*sy,cx+r*sx,cy+r*sy],outline=ink,width=4)
d.ellipse([cx-40,cy-40,cx+40,cy+40],outline=ink,width=5)
d.line([(cx,cy-380),(cx,cy+520)],fill=ink,width=3)
for k in range(12):
    a=k*math.pi/6; d.line([(cx+330*math.cos(a),cy+330*math.sin(a)),(cx+355*math.cos(a),cy+355*math.sin(a))],fill=ink,width=3)
scribble(d,90,1120,820,8)
im.filter(ImageFilter.GaussianBlur(0.6)).save(f"{out}/sheet_armillary.png")
# sheet 3: star chart
im=parchment(1024,1024); d=ImageDraw.Draw(im)
d.ellipse([90,90,934,934],outline=ink,width=4); d.ellipse([140,140,884,884],outline=ink,width=2)
stars=[(random.randint(180,840),random.randint(180,840)) for _ in range(70)]
for x,y in stars:
    if (x-512)**2+(y-512)**2<350**2:
        r=random.choice([2,3,4,6]); d.ellipse([x-r,y-r,x+r,y+r],fill=ink)
for i in range(10):
    a,b=random.sample(stars,2); d.line([a,b],fill=ink,width=1)
im.filter(ImageFilter.GaussianBlur(0.6)).save(f"{out}/sheet_stars.png")
print("ok")
