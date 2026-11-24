# Static Electrical Services: send kit

**Their current site:** https://www.staticelectricalcanada.com/ (Squarespace; images uploaded June 2016)
**Phone:** 416.346.5359 · **Email:** info@staticelectricalcanada.com (published on their own site, with no "no solicitation" notice seen on 2026-11-24)
**Licence:** ECRA/ESA #7011530. Check it at https://www.esasafe.com before you call.
**Address:** 883 Laurier Ave, Milton

## Before you contact them (10 minutes)
1. Look them up on Google Maps. Note the review count and the date of the last review. **If there are no reviews in the past 6 months, move on to Kronos or Norris.**
2. Open their current site **on your phone** and take one screenshot. That's your "before" image. Put it next to `screenshots/mobile-index.png` for the "after".
3. In `site.json`, replace `[Your name]` with your name and rebuild:
   `python3 template/build.py previews/static-electrical`
4. Deploy the preview (see `../../DEPLOY.md`) and test the link on your phone.

## What makes their current site weak (say this nicely)
- The phone number isn't tappable on mobile, so people have to copy it by hand.
- There's no quote form; "Get A Quote" just jumps down the same page.
- Their licence number is at the very bottom. The preview puts it at the top, which is exactly what homeowners look for.
- It's a single page, so there's nothing for Google to rank for "pot lights Milton" or "basement electrician Milton".

## Call first (cleanest under Canadian rules)
> "Hi, is this the owner of Static Electrical? My name's ___, I build websites for trades here in Milton. I was on your site on my phone and the number isn't tappable and the quote button doesn't go anywhere, so I went ahead and rebuilt it, using your own wording and your licence number up top. It's already done. Can I text you the link to look at? ... If you like it, it's $1,500 and I handle hosting for $99 a month. If not, no worries, I'll take it down Friday."

Voicemail:
> "Hi, ___ here, a web designer in Milton. I rebuilt Static Electrical's website as a free preview: it's mobile-friendly with a proper quote form. I'll send the link to info@staticelectricalcanada.com. My number is ___."

## Email (after the call, or if you can't reach them)
```
Subject: New website for Static Electrical (already built)

Hi,

I'm [your name], a web designer in Milton. I rebuilt Static
Electrical's website to show how it could look and work on a phone,
using your own wording, with your ESA licence #7011530 up top, a
tap-to-call button and a quote form:

[preview link]

If you like it, it's yours for $1,500 (includes setup on your
existing domain). Hosting and small edits are $99/month after that.
If not, no problem. I'll take the preview down on [Friday date].

[Your name] · [Your business name] · [phone]
[Your mailing address]
Not interested? Reply "unsubscribe" and I won't contact you again.
```

**Day 3:** "Hi, just checking the link came through: [link]. Happy to change anything, including adding your own job photos."
**Day 7:** "Last note from me. The preview comes down Friday. Want me to keep it up for you?"

## If they say yes
- Ask for: 6–10 photos of their own jobs, how many years in business **now** (the site's "15 years" was written around 2016), their hours, and their Google Business Profile link so you can add reviews.
- Send a 1-page agreement and take a 50% deposit (Stripe or Square link).
- Get access to their domain registrar. Point the DNS to your host. Remove the preview ribbon and `noindex`. Connect the quote form to their email (Formspree, or Netlify Forms).
