#!/usr/bin/env python3
"""stills.py: PNG frames of a packed short at chosen seconds, plus one contact sheet, using the Chrome or Edge
already on this computer (headless). Nothing to install. Python standard library only.

    python3 stills.py out/my-short.html 1.5 4 7.2 10 …        -> out/my-short-stills/t001.50.png … + contact.html
    python3 stills.py out/my-short.html --every 2.5             -> one frame every 2.5 s

Claude: open the PNGs with your Read tool and check them against references/checklist.md.
If no browser is found, set CHROME_PATH to chrome.exe / msedge.exe / the Chrome app binary.
Free from Anylancer.com.
"""
import sys, os, re, subprocess, shutil, platform, pathlib, json

def find_browser():
    if os.environ.get("CHROME_PATH") and os.path.exists(os.environ["CHROME_PATH"]): return os.environ["CHROME_PATH"]
    c = []
    if platform.system() == "Windows":
        for base in [os.environ.get("PROGRAMFILES", r"C:\Program Files"), os.environ.get("PROGRAMFILES(X86)", r"C:\Program Files (x86)"), os.environ.get("LOCALAPPDATA", "")]:
            c += [os.path.join(base, r"Google\Chrome\Application\chrome.exe"), os.path.join(base, r"Microsoft\Edge\Application\msedge.exe")]
    elif platform.system() == "Darwin":
        c += ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge", "/Applications/Chromium.app/Contents/MacOS/Chromium"]
    c += [shutil.which(x) or "" for x in ["google-chrome", "chromium", "chromium-browser", "microsoft-edge"]]
    for p in c:
        if p and os.path.exists(p): return p
    sys.exit("stills.py: no Chrome or Edge found. Set CHROME_PATH, or open the HTML in Chrome and use the scrub bar.")

def main():
    a = sys.argv[1:]
    if not a or a[0] in ("-h", "--help"): print(__doc__); return
    html = os.path.abspath(a[0]); times = []
    if "--every" in a:
        step = float(a[a.index("--every") + 1]); src = open(html, encoding="utf-8").read()
        dur = 60.0
        m = re.search(r"tail\s*:\s*([\d.]+)", src)
        try:
            words = json.loads(re.search(r"window\.SHORT_WORDS = (\[.*?\]);", src, re.S).group(1)); dur = words[-1]["end"] + (float(m.group(1)) if m else .8)
        except Exception: pass
        t = .5
        while t < dur: times.append(round(t, 2)); t += step
    else: times = [float(x) for x in a[1:]]
    out = os.path.splitext(html)[0] + "-stills"; os.makedirs(out, exist_ok=True)
    br = find_browser(); url = pathlib.Path(html).as_uri()
    for t in times:
        png = os.path.join(out, "t%06.2f.png" % t)
        args = [br, "--headless=new", "--hide-scrollbars", "--enable-unsafe-swiftshader", "--use-angle=swiftshader", "--window-size=1080,1920", "--force-device-scale-factor=1",
                "--virtual-time-budget=25000", "--run-all-compositor-stages-before-draw", "--screenshot=" + png, url + "?render=1&t=%s" % t]
        subprocess.run(args, capture_output=True, timeout=180)
        print(("ok   " if os.path.exists(png) else "FAIL ") + png)
    imgs = sorted(f for f in os.listdir(out) if f.endswith(".png"))
    open(os.path.join(out, "contact.html"), "w").write("<body style='background:#111;margin:0'>" + "".join(f"<img src='{f}' style='width:270px;margin:2px' title='{f}'>" for f in imgs) + "</body>")
    print("contact sheet:", os.path.join(out, "contact.html"))

if __name__ == "__main__":
    main()
