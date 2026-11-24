#!/usr/bin/env python3
"""Build a 4-page trades preview site from a site.json.

Usage:  python3 template/build.py previews/<slug>
Output: previews/<slug>/site/  (index, services, about, contact + style.css)

Only put facts from the business's own site or Google profile in site.json.
Leave anything unknown out; sections disappear when their data is missing.
"""
import html, json, pathlib, shutil, sys

ICONS = {
    "bolt": '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>',
    "home": '<path d="M3 11 12 3l9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    "building": '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2"/>',
    "stairs": '<path d="M3 20h5v-5h5v-5h5V5h3"/>',
    "check": '<path d="M20 6 9 17l-5-5"/>',
    "shield": '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3z"/><path d="m9 12 2 2 4-4"/>',
    "phone": '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
    "mail": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    "pin": '<path d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
    "menu": '<path d="M4 7h16M4 12h16M4 17h16"/>',
    "clock": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
}


def icon(name, size=22, sw=2):
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
            f'stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICONS[name]}</svg>')


def build(folder):
    folder = pathlib.Path(folder)
    d = json.loads((folder / "site.json").read_text())
    e = lambda k: html.escape(str(d.get(k, "")))
    out = folder / "site"
    out.mkdir(exist_ok=True)
    shutil.copy(pathlib.Path(__file__).with_name("style.css"), out / "style.css")

    pages = [("index.html", "Home"), ("services.html", "Services"), ("about.html", "Why Licensed"), ("contact.html", "Free Quote")]
    lic = f'<span class="lic">{icon("shield",16)} ECRA/ESA Licence <b>#{e("licence")}</b></span>' if d.get("licence") else ""

    def shell(fname, title, desc, body):
        nav = "".join(f'<a href="{f}"{" aria-current=page" if f==fname else ""}>{html.escape(t)}</a>' for f, t in pages[:3])
        mnav = "".join(f'<a href="{f}">{html.escape(t)}</a>' for f, t in pages)
        social = ""
        if d.get("instagram"):
            social += f'<div>Instagram: <a href="https://instagram.com/{e("instagram")}">@{e("instagram")}</a></div>'
        if d.get("facebook"):
            social += f'<div>Facebook: <a href="https://facebook.com/{e("facebook")}">{e("facebook")}</a></div>'
        return f"""<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(desc)}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
</head><body>
<div class="ribbon">Website preview prepared for {e("name")} by {e("preview_by")}. Not the live site.</div>
<div class="topbar"><div class="wrap">{lic}<a href="tel:{e("phone_tel")}">{icon("phone",15)} {e("phone")}</a></div></div>
<header class="site"><div class="wrap">
  <a class="logo" href="index.html"><span class="bolt" style="color:var(--volt-ink)">{icon("bolt",20)}</span><span>{e("short")}<small>{e("town").upper()}, {e("province").upper()}</small></span></a>
  <nav class="main">{nav}<a class="btn btn-volt" href="contact.html">Get a Free Quote</a></nav>
  <button class="menu-btn" aria-label="Menu" onclick="document.getElementById('mnav').classList.toggle('open')">{icon("menu",28)}</button>
</div><nav class="mobile-nav" id="mnav">{mnav}</nav></header>
{body}
<footer><div class="wrap">
  <div class="cols">
    <div><h4>{e("legal_name") or e("name")}</h4><p>{e("tagline")}</p>{('<p style="margin-top:10px">Licensed Electrical Contractor: ECRA/ESA #'+e("licence")+'</p>') if d.get("licence") else ""}</div>
    <div><h4>Contact</h4><div><a href="tel:{e("phone_tel")}">{e("phone")}</a></div>{('<div><a href="mailto:'+e("email")+'">'+e("email")+'</a></div>') if d.get("email") else ""}<div>{e("address")}</div></div>
    <div><h4>Follow</h4>{social}</div>
  </div>
  <div class="legal">&copy; {e("legal_name") or e("name")}. Preview only.</div>
</div></footer>
<div class="callbar"><a class="btn btn-volt" href="tel:{e("phone_tel")}">{icon("phone",18)} Call now</a><a class="btn btn-ghost" href="contact.html">Free quote</a></div>
</body></html>"""

    svcs = d.get("services", [])
    trust = [f'<div>{icon("shield",18)} ECRA/ESA #{e("licence")}</div>' if d.get("licence") else "",
             f'<div>{icon("check",18)} {e("years")}+ years experience</div>' if d.get("years") else "",
             f'<div>{icon("check",18)} Residential &amp; commercial</div>']

    cards = "".join(f"""<div class="card"><div class="ic">{icon(s["icon"],24)}</div><h3>{html.escape(s["title"])}</h3>
      <p>{html.escape(s["blurb"])}</p><a class="more" href="services.html#{s["id"]}">Learn more &rarr;</a></div>""" for s in svcs)

    index = f"""
<section class="hero"><div class="wrap">
  <span class="eyebrow">{e("subtag")}</span>
  <h1>{e("town")}'s <span>licensed</span> electrical contractor.</h1>
  <p class="lead">{html.escape(svcs[0]["blurb"]) if svcs else ""} Homes, businesses and basements across {e("town")}, {e("province")}.</p>
  <div class="ctas"><a class="btn btn-volt" href="contact.html">Get a Free Quote</a><a class="btn btn-ghost" href="tel:{e("phone_tel")}">{icon("phone",18)} {e("phone")}</a></div>
  <div class="trust">{"".join(trust)}</div>
</div></section>
<section><div class="wrap">
  <div class="kicker">What we do</div><h2>Electrical work, done right the first time.</h2>
  <p class="sub">{e("tagline")}.</p>
  <div class="grid3">{cards}</div>
</div></section>
<section class="soft"><div class="wrap split">
  <div><div class="kicker">Why it matters</div><h2>Why hire a licensed electrical contractor?</h2>
  <p class="sub">{html.escape(d["why_licensed"][0]) if d.get("why_licensed") else ""}</p>
  <p style="margin-top:18px"><a class="btn btn-dark" href="about.html">Read more</a></p></div>
  {('<div class="licbox"><div class="kicker" style="color:var(--volt)">Licensed contractor</div><div class="num">ECRA/ESA #'+e("licence")+'</div><p>Licensed through the Electrical Contractor Registration Agency of the Electrical Safety Authority. You can confirm any contractor\'s licence on the ESA website.</p></div>') if d.get("licence") else ""}
</div></section>
<section class="band"><div class="wrap"><h2>Planning a project in {e("town")}?</h2><a class="btn btn-dark" href="contact.html">Get a Free Quote</a></div></section>
"""

    detail = "".join(f"""<div class="svc" id="{s["id"]}"><div class="card" style="padding:16px;width:72px;align-items:center"><div class="ic">{icon(s["icon"],24)}</div></div>
      <div><h3>{html.escape(s["title"])}</h3><p>{html.escape(s["body"])}</p>
      <div class="tags">{"".join("<span>"+html.escape(t)+"</span>" for t in s.get("tags",[]))}</div></div>
      <a class="btn btn-volt" href="contact.html?service={s["id"]}">Get a quote</a></div>""" for s in svcs)
    services = f"""<div class="pagehead"><div class="wrap"><h1>Services</h1><p>{e("subtag")} in {e("town")}, {e("province")}.</p></div></div>
<section><div class="wrap">{detail}</div></section>
<section class="band"><div class="wrap"><h2>Not sure what you need?</h2><a class="btn btn-dark" href="tel:{e("phone_tel")}">Call {e("phone")}</a></div></section>"""

    paras = "".join(f"<p class='sub' style='margin-top:14px'>{html.escape(p)}</p>" for p in d.get("why_licensed", []))
    about = f"""<div class="pagehead"><div class="wrap"><h1>Why hire a licensed electrician?</h1><p>{e("tagline")}.</p></div></div>
<section><div class="wrap split"><div>{paras}
  <ul class="checks">
    {('<li>'+icon("check",18)+'<span>Licensed: ECRA/ESA #'+e("licence")+'</span></li>') if d.get("licence") else ""}
    {('<li>'+icon("check",18)+'<span>Over '+e("years")+' years of experience</span></li>') if d.get("years") else ""}
    <li>{icon("check",18)}<span>A business that stands behind its work and its workers</span></li>
  </ul></div>
  {('<div class="licbox"><div class="kicker" style="color:var(--volt)">Licence</div><div class="num">#'+e("licence")+'</div><p>Electrical Contractor Registration Agency of the Electrical Safety Authority (ECRA/ESA).</p></div>') if d.get("licence") else ""}
</div></section>
<section class="band"><div class="wrap"><h2>Get peace of mind on your next project.</h2><a class="btn btn-dark" href="contact.html">Get a Free Quote</a></div></section>"""

    opts = "".join(f'<option value="{s["id"]}">{html.escape(s["title"])}</option>' for s in svcs)
    contact = f"""<div class="pagehead"><div class="wrap"><h1>Get a free quote</h1><p>Tell us about your project and we'll get back to you.</p></div></div>
<section><div class="wrap contact-grid">
  <div class="info">
    <a href="tel:{e("phone_tel")}">{icon("phone")}<span><small>Call or text</small>{e("phone")}</span></a>
    {('<a href="mailto:'+e("email")+'">'+icon("mail")+'<span><small>Email</small>'+e("email")+'</span></a>') if d.get("email") else ""}
    <a href="https://maps.google.com/?q={html.escape(d.get("address",""))}">{icon("pin")}<span><small>Location</small>{e("address")}</span></a>
  </div>
  <form class="quote" onsubmit="event.preventDefault();this.querySelector('.ok').style.display='block';this.querySelector('button').disabled=true">
    <div class="row2"><label>Name<input required autocomplete="name"></label><label>Phone<input type="tel" required autocomplete="tel"></label></div>
    <label>Email<input type="email" autocomplete="email"></label>
    <label>Type of work<select id="svc">{opts}<option>Something else</option></select></label>
    <label>Project details<textarea placeholder="e.g. 12 pot lights in the basement, panel upgrade, new kitchen circuits"></textarea></label>
    <button class="btn btn-volt" type="submit">Send my quote request</button>
    <div class="ok">Preview only: on the live site, this goes straight to {e("email") or "your inbox"}.</div>
    <p class="note">We'll only use your details to reply to your request.</p>
  </form>
</div></section>
<script>var s=new URLSearchParams(location.search).get('service');if(s){{var el=document.getElementById('svc');if(el)el.value=s}}</script>"""

    T = f'{d["name"]} | Licensed Electrician in {d["town"]}, {d["province"]}'
    files = {
        "index.html": (T, f'{d["tagline"]}. ECRA/ESA #{d.get("licence","")}.', index),
        "services.html": (f'Services | {d["name"]}', d["subtag"], services),
        "about.html": (f'Why Hire a Licensed Electrician | {d["name"]}', d["tagline"], about),
        "contact.html": (f'Free Quote | {d["name"]}', f'Get a free quote from {d["name"]}.', contact),
    }
    for f, (t, desc, body) in files.items():
        (out / f).write_text(shell(f, t, desc, body))
    (out / "robots.txt").write_text("User-agent: *\nDisallow: /\n")
    print("built", out)


if __name__ == "__main__":
    build(sys.argv[1])
