"""Download Commons files straight from upload.wikimedia.org (the API is rate-limited here) and log licence/credit/page via footage.py."""
import hashlib, subprocess, sys, time, urllib.parse, os
L = [  # file title | name | width (0 = original) | licence | credit
 ("Jensen Huang - Nvidia Keynote - CES 2025 Las Vegas (1).jpg", "ces1", 1920, "CC0", "Pronoia"),
 ("Jensen Huang - RTX Blackwell - Nvidia Keynote - CES 2025 Las Vegas (2).jpg", "ces2", 1920, "CC0", "Pronoia"),
 ("Jensen Huang - RTX Blackwell - Nvidia Keynote - CES 2025 Las Vegas (3).jpg", "ces3", 1920, "CC0", "Pronoia"),
 ("Jensen Huang - RTX 5070 Laptop - Nvidia Keynote - CES 2025 Las Vegas.jpg", "ces4", 1920, "CC0", "Pronoia"),
 ("Jensen Huang (cropped) (2024).jpg", "portrait", 0, "CC BY 4.0", "Peter DaSilva"),
 ("Nvidia CEO Jensen Huang gestikuliert.jpg", "gest", 1920, "CC BY 2.0", "Maurizio Pesce"),
 ("Nvidia sign.jpg", "sign", 1920, "CC BY 2.0", "Will Buckner"),
 ("Nvidia HQ.jpg", "hq", 0, "CC BY 2.0", "Kevin McCarthy"),
 ("NVIDIA H100 (极客湾Geekerwan) 003.png", "h100a", 1920, "CC BY 3.0", "极客湾Geekerwan"),
 ("NVIDIA H100 (极客湾Geekerwan) 010.png", "h100b", 1920, "CC BY 3.0", "极客湾Geekerwan"),
 ("Datacenter Server Racks (22370909788).jpg", "racks", 1920, "CC BY 2.0", "Carl Lender"),
 ("Server Rack (54126210834).jpg", "rack2", 1280, "CC BY 2.0", "Tony Webster"),
 ("Rear of rack at NERSC data center - closeup.jpg", "nersc", 0, "CC0", "Derrick Coetzee"),
 ("US Capitol Building at night Jan 2006.jpg", "capitol", 1920, "Public domain", "Diliff"),
 ("GTC Taiwan 2016 - 36569951911.jpg", "gtc1", 1920, "CC BY 2.0", "NVIDIA Taiwan"),
 ("GTC Taiwan 2016 - 35898592443.jpg", "gtc2", 1920, "CC BY 2.0", "NVIDIA Taiwan"),
]
only = sys.argv[1:]
for title, name, w, lic, credit in L:
    if only and name not in only: continue
    if any(f.startswith(name + ".") for f in os.listdir("raw")): continue
    fn = title.replace(" ", "_"); h = hashlib.md5(fn.encode()).hexdigest(); q = urllib.parse.quote(fn)
    if w: url = f"https://upload.wikimedia.org/wikipedia/commons/thumb/{h[0]}/{h[:2]}/{q}/{w}px-{q}" + (".png" if fn.endswith(".png") else "")
    else: url = f"https://upload.wikimedia.org/wikipedia/commons/{h[0]}/{h[:2]}/{q}"
    page = "https://commons.wikimedia.org/wiki/File:" + q
    for k in range(5):
        r = subprocess.run(["python3", "tools_cn/footage.py", "fetch", url, "--name", name, "--page", page, "--license", lic, "--credit", credit, "--title", "File:" + title], capture_output=True, text=True)
        if r.returncode == 0: print(name, "ok", (r.stdout.strip().splitlines() or [""])[-1][:120]); break
        print(name, "retry", r.stderr.strip().splitlines()[-1:]); time.sleep(30 * (k + 1))
    sys.stdout.flush(); time.sleep(2)
