exec(open(__file__.replace('mix34.py', 'mix34_head.py')).read())
# ================= score =================
F_, Bb, C_, Dm, Am, Gm = [41, 45, 48], [46, 50, 53], [48, 52, 55], [38, 41, 45], [45, 48, 52], [43, 46, 50]
THEME = [(0, 69, .6), (.6, 72, .6), (1.2, 77, 1.0), (2.4, 76, .5), (2.9, 74, .5), (3.4, 72, 1.3)]   # her waltz: A C F . E D C
def theme(t0, vel=.3, oct=0, k=1.0, minor=False, upto=6):
    for dt, m, d in THEME[:upto]: piano(t0 + dt * k, (m - 1 if minor and m in (69, 76) else m) + oct, vel, d * k, .12)
def waltz(t0, bars, ch_seq, bar=1.2, vel=.3):
    for b in range(bars):
        ch, bass = ch_seq[b % len(ch_seq)]; t = t0 + b * bar
        piano(t, bass, vel, bar * .9, -.25)
        for k in (1, 2): [piano(t + k * bar / 3, m + 12, vel * .7, bar / 3, .2) for m in ch]
# 0-5 the party: a carefree waltz; it stops dead on the cut (5.0)
waltz(0.1, 4, [(F_, 29), (C_, 36), (Bb, 34), (C_, 36)], 1.2, .32); theme(0.2, .36, 12, .95)
# 5-10 the test: silence, one high note on the shock, then a tender swell; "Hi, little one" gets the theme as a music box
piano(6.1, 84, .3, 2.0, .2); strings(7.0, [53, 57, 60, 65], 3.2, .05, att=1.4, rel=1.2, bright=1900)
piano(8.4, 29, .3, 2.5, -.2); theme(8.6, .24, 24, .55, upto=3)
# 10-17 pregnancy: sick (Dm), 3 AM (Am, slow ticks), the kick (F, rising notes)
piano(10.1, 26, .26, 2.3, -.2); arp(10.1, Dm, .55, 4, .18)
piano(12.5, 33, .22, 2.3, -.2); theme(12.7, .18, 12, .8, minor=True, upto=4)
piano(14.9, 29, .28, 2.0, -.2); arp(14.9, F_ + [60], .4, 4, .22)
for t0, m in [(15.9, 72), (16.1, 76), (16.3, 79), (16.5, 84)]: piano(t0, m, .3, .8, .2)
# 17-23.6 labour: a low drone that climbs; strings swell on the grip; the push crescendos and is cut by the flash
strings(17.0, [26, 33, 38], 6.6, .06, att=2.5, rel=.05, bright=700)
strings(20.9, [50, 53, 57], 2.7, .05, att=.8, rel=.05, bright=1300)
strings(21.7, [62, 65, 69], 1.9, .07, att=1.6, rel=.03, bright=2200)
for t0, m in [(17.3, 38), (19.0, 38), (21.7, 41), (22.6, 43)]: piano(t0, m, .34, 1.4, -.1)
# 25.2-32 the baby: warm F major, the theme whole and slow
piano(25.4, 29, .3, 3.2, -.2); piano(25.42, 41, .24, 3.2); strings(25.4, [41, 48, 53, 57, 60], 6.6, .06, att=2.2, rel=1.6, bright=1900)
arp(25.4, F_ + [60, 65], .5, 12, .2); theme(26.6, .3, 12, 1.0)
# 32-40 the box: the waltz again, slow, as a music box, minor; the flaps close (35.0); the box goes up
for t0, (ch, b) in zip([32.1, 33.9, 35.7, 37.5], [(Dm, 26), (Bb, 34), (F_, 29), (C_, 36)]): piano(t0, b, .24, 1.8, -.2); arp(t0, ch, .6, 3, .16)
theme(32.4, .2, 24, 1.15, minor=True)
# 40-46.5 years go by: light arpeggios; "why don't you ever dress up?" (42.8) thins to one note; "I'm fine like this" a small sad chord
piano(40.1, 29, .26, 2.4, -.2); arp(40.1, F_ + [65], .3, 8, .22)
piano(42.9, 74, .22, 1.8, .1); piano(44.8, 34, .24, 1.8, -.2); arp(44.8, Gm, .5, 3, .16)
# 46.5-54 he opens the box: the theme in minor, building; strings rise to his tears
piano(46.6, 26, .3, 3.4, -.2); theme(46.9, .28, 12, 1.0, minor=True); strings(46.6, [38, 45, 50, 53], 7.4, .05, att=4.5, rel=.4, bright=1500)
piano(50.2, 34, .32, 2.0, -.2); arp(50.2, Bb + [58], .4, 5, .22); piano(52.2, 36, .34, 1.8, -.2); arp(52.2, C_ + [60], .35, 5, .24)
# 54-62 the hug: home. F major, the waltz theme in full; the end card gets a last music-box echo
piano(55.3, 29, .42, 4.5, -.2); piano(55.32, 41, .34, 4.5); strings(55.3, [29, 41, 48, 53, 57, 60, 65], 6.5, .1, att=1.2, rel=2.2, bright=2300)
arp(55.3, F_ + [60, 65], .4, 10, .26); theme(55.8, .36, 12, 1.0)
theme(59.4, .16, 24, .7, upto=3)
mus = hall(mus)
cut = int(23.6 * SR); mus[cut:int(25.2 * SR)] *= 0.0           # the flash: everything stops
mus[-int(1.6 * SR):] *= np.linspace(1, 0, int(1.6 * SR))[:, None] ** 2
# ================= foley =================
def amb(t0, t1, x, g):
    i0, i1 = int(t0 * SR), int(t1 * SR); n = i1 - i0; y = np.stack([x[:n], np.roll(x[:n], 997)], 1)
    f = np.minimum(1, np.minimum(np.arange(n), n - np.arange(n)) / (.25 * SR))[:, None]; fx[i0:i1] += y * f * g
room = lp(noise(DUR), 220)
tick = lambda: bp(noise(.02), 3000, 7000) * np.exp(-t_(.02) / .004)
rustle = lambda d=.35: bp(noise(d), 1500, 7000) * (np.abs(np.sin(2 * np.pi * 9 * t_(d))) ** 2) * np.sin(np.pi * t_(d) / d)
clink = lambda f=2600: (np.sin(2 * np.pi * f * t_(.4)) + .5 * np.sin(2 * np.pi * f * 2.7 * t_(.4))) * np.exp(-t_(.4) / .06)
beep = lambda: np.sin(2 * np.pi * 1046 * t_(.12)) * np.sin(np.pi * t_(.12) / .12)
def cry(d, seed=0):
    """newborn cry: 'waa' bursts, f0 ~ 420-560 Hz with a rise-fall, jitter, vowel formants, breath gaps"""
    r = np.random.default_rng(seed); out = np.zeros(int(d * SR)); t = 0.05
    while t < d - .3:
        L = r.uniform(.45, .8); tt = t_(L); u = tt / L
        f0 = r.uniform(430, 520) * (1 + .18 * np.sin(np.pi * u) - .1 * u) * (1 + .012 * np.sin(2 * np.pi * 9 * tt)) * (1 + .006 * r.standard_normal(len(tt)))
        ph = 2 * np.pi * np.cumsum(f0) / SR; x = sum(np.sin(k * ph) / k ** 1.1 for k in range(1, 14))
        x = bp(x, 900, 1400, 1) * 1.0 + bp(x, 1500, 2100, 1) * .8 + bp(x, 2800, 3600, 1) * .4 + bp(r.standard_normal(len(tt)), 2000, 6000) * .05
        env = np.minimum(1, u / .08) * np.minimum(1, (1 - u) / .25) ** 1.5
        i = int(t * SR); out[i:i + len(x)] += (x * env)[:len(out) - i]; t += L + r.uniform(.12, .3)
    return out
# 0-5 party: crowd + laughter
crowd = bp(noise(5.2), 300, 2500) * (.7 + .3 * np.sin(2 * np.pi * .9 * t_(5.2))); amb(0, 5.0, crowd, .018)
# 5-10 bedroom morning: birds, a gasp is silent; quiet room
amb(5, 10, room, .012)
# 10-12.4 kitchen: tap running at the sink
amb(10, 12.4, hp(bp(noise(2.4), 1500, 8000), 900), .02)
# 12.4-14.8 3 AM: clock ticks
amb(12.4, 14.8, room, .01)
for t0 in np.arange(12.5, 14.8, .5): add(fx, tick(), t0, .014, -.3)
# 17-23.6 labour: heartbeat (speeding up), monitor beeps, the spinning clock's rapid ticks
hb_t = 17.1
while hb_t < 23.5:
    add(fx, sfx.heartbeat(), hb_t, .12 + .08 * (hb_t - 17) / 6.5); hb_t += (.85 - .4 * (hb_t - 17) / 6.5)
for t0 in np.arange(17.4, 20.0, .75): add(fx, beep(), t0, .012, .4)
for t0 in np.arange(20.0, 20.9, .06): add(fx, tick(), t0, .02, -.1)
for t0 in np.arange(21.0, 21.7, .12): add(fx, bp(noise(.08), 200, 1200) * np.exp(-t_(.08) / .03), t0, .03)   # the rail creaks under her grip
# 23.6 flash: silence; 24.35 the cry
add(fx, cry(1.7, 3), 24.35, .07); add(fx, cry(3.5, 5), 25.4, .035, .1)
# 25.2-32 dawn: soft room, a monitor beep or two
amb(25.2, 32, room, .01)
# 32-40 the box: cardboard, the dress laid down, flaps closing, the box pushed onto the wardrobe
amb(32, 40, room, .012); add(fx, rustle(.5), 32.3, .03); add(fx, rustle(.4), 33.8, .025)
add(fx, sfx.thump(.5, 110), 35.05, .05); add(fx, sfx.thump(.4, 130), 35.35, .04); add(fx, bp(noise(.5), 200, 1800) * np.sin(np.pi * t_(.5) / .5), 38.3, .04)
# 40-46.5 kitchen years: a spoon in the pot, the son's footsteps
amb(40, 46.5, room, .012)
for t0 in [40.4, 41.2, 42.0]: add(fx, clink(rng.uniform(2200, 2800)), t0, .01, .3)
for t0 in np.arange(42.6, 46.2, .47): add(fx, sfx.step(.5), t0, .03, .5 - (t0 - 42.6) / 3.6)
# 46.5-54 the box opened: dust, cardboard, the photo lifted
amb(46.5, 54, room, .012); add(fx, rustle(.6), 46.8, .03); add(fx, rustle(.3), 47.9, .02)
# 54-62 the hug: footsteps in, quiet kitchen
amb(54, 62, room, .012)
for t0 in [54.1, 54.55, 55.0]: add(fx, sfx.step(.5), t0, .03, -.2)
mus *= .5 / np.sqrt((mus[int(1 * SR):int(60 * SR)] ** 2).mean()); fx *= 4.0
mix_ = mus * .5 + fx; mix_ = hp(mix_.T, 30).T; mix_ *= .7 / np.abs(mix_).max()
for ch in range(2): mix_[:, ch] = sfx.limit(mix_[:, ch], ceil=.7)
os.makedirs(f'{H}/out', exist_ok=True); sf.write(f'{H}/out/mix.wav', mix_.astype(np.float32), SR, subtype='FLOAT'); print('mix written', mix_.shape[0] / SR)
