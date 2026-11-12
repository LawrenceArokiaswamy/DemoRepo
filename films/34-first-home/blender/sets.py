# Film 34 sets: PARTY (string lights), BED (bedroom + wardrobe), KIT (kitchen), HOSP (delivery room), INS (tabletop inserts).
# Each place sits far apart on x; its lights are switched on only while a shot is there.
import bpy, math, os, types
from lib import *
R = math.radians
HERE = os.path.dirname(os.path.abspath(__file__)); TEX = os.path.join(HERE, "tex")
PL = {"party": 0.0, "bed": 40.0, "kit": 80.0, "hosp": 120.0, "ins": 160.0}
LIGHTS = {}   # (place, mode) -> [light objects]

def L(place, mode, o): LIGHTS.setdefault((place, mode), []).append(o); return o

def box_open(name, parent, loc, w=0.5, d=0.38, h=0.28, flaps=True, label="ME", scale=1.0):
    """cardboard box, open top, hinged flaps, marker label. Returns (root, flap pivots)"""
    cb, ink = mat("card", "#b98a5a", 0.85), mat("marker", "#1b1b1f", 0.6)
    root = piv(name, parent, loc); root.scale = (scale,) * 3; t = 0.012
    rbox(name + "_b", (w, d, t), cb, root, (0, 0, t / 2), 0.004)
    for sx in (-1, 1): rbox(name + "_s", (t, d, h), cb, root, (sx * (w / 2 - t / 2), 0, h / 2), 0.004)
    for sy in (-1, 1): rbox(name + "_f", (w, t, h), cb, root, (0, sy * (d / 2 - t / 2), h / 2), 0.004)
    rbox(name + "_tape", (w + 0.002, t + 0.004, 0.05), mat("tape", "#c9a979", 0.35), root, (0, -d / 2, h - 0.03), 0.002)
    text(name + "_lab", label, 0.13, ink, root, (0, -d / 2 - 0.009, h * 0.45), font="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")
    fl = []
    if flaps:
        for sy in (-1, 1):
            p = piv(name + "_fp", root, (0, sy * d / 2, h)); rbox(name + "_fl", (w, d / 2, t), cb, p, (0, -sy * d / 4, 0), 0.004); fl.append((p, sy))
    return root, fl

def dress_prop(name, parent, loc, rot=(0, 0, 0), scale=1.0):
    red = mat("dressred", "#c8202c", 0.7)
    p = piv(name, parent, loc, rot); p.scale = (scale,) * 3
    rbox(name + "_bod", (0.34, 0.06, 0.34), red, p, (0, 0, 0.12), 0.04)
    rbox(name + "_sk", (0.36, 0.06, 0.46), red, p, (0, 0, -0.27), 0.04, taper=(1.7, 1.0))
    for sx in (-1, 1): rbox(name + "_st", (0.05, 0.065, 0.14), red, p, (sx * 0.11, 0, 0.33), 0.015)
    rbox(name + "_belt", (0.35, 0.07, 0.04), mat("beltblk", "#2a1a1c", 0.4), p, (0, 0, -0.04), 0.01)
    return p

def build_party():
    P = PL["party"]; g = piv("PARTY", None, (P, 0, 0)); S = types.SimpleNamespace(root=g)
    rbox("p_floor", (14, 10, 0.1), mat("pfloor", "#3b2a22", 0.45), g, (0, 2, -0.05), 0.0)
    plane("p_back", 30, 14, mat("pback", "#1c1736", 0.95), g, (0, 7, 3))
    warm = mat("bulb", "#ffd28a", 0.4, emit=22)
    for k, (y, z0, sag) in enumerate(((0.9, 2.55, 0.35), (2.6, 2.75, 0.4), (4.8, 3.1, 0.5))):
        for i in range(26):
            u = i / 25; x = -4.5 + 9 * u; z = z0 - sag * 4 * u * (1 - u)
            sphere("bulb", 0.035 if k < 2 else 0.05, warm, g, (x, y, z))
        rbox("wire", (9.0, 0.006, 0.006), mat("wire", "#111111"), g, (0, y, z0 - sag * 0.7), 0)
    for x in (-2.5, 0, 2.5): L("party", "night", point("p_pt", (P + x, 1.6, 2.2), 60, (1, 0.8, 0.55), 0.3))
    L("party", "night", area("p_key", (P - 1.8, -2.8, 2.6), (P, 0.2, 1.0), 2.2, 360, (1, 0.85, 0.7)))
    L("party", "night", area("p_rim", (P + 2.2, 2.2, 2.2), (P, 0.2, 1.2), 1.5, 420, (0.75, 0.55, 1.0)))
    L("party", "night", area("p_fill", (P + 2.5, -2.5, 0.8), (P, 0, 0.9), 3, 90, (0.6, 0.7, 1)))
    return S

def build_bed():
    P = PL["bed"]; g = piv("BEDROOM", None, (P, 0, 0)); S = types.SimpleNamespace(root=g)
    wood, wall = mat("bfloor", "#8b6545", 0.5), mat("bwall", "#d8c7b2", 0.9)
    rbox("b_floor", (8, 7, 0.1), wood, g, (0, 1, -0.05), 0)
    rbox("b_wall", (8, 0.12, 3.2), wall, g, (0, 2.45, 1.6), 0.0)
    rbox("b_wallL", (0.12, 6, 3.2), wall, g, (-2.75, 0.5, 1.6), 0.0)
    rbox("b_rug", (2.4, 1.6, 0.02), mat("rug", "#7d4b54", 0.95), g, (-0.3, 0.2, 0.01), 0.01)
    # bed along x, headboard on the left
    fr = mat("bframe", "#6e4a33", 0.5)
    rbox("b_frame", (2.15, 1.7, 0.36), fr, g, (-0.45, 1.5, 0.22), 0.04)
    rbox("b_head", (0.12, 1.75, 1.05), fr, g, (-1.55, 1.5, 0.55), 0.04)
    rbox("b_matt", (2.05, 1.62, 0.2), mat("sheet", "#f2efe9", 0.8), g, (-0.42, 1.5, 0.48), 0.06)
    rbox("b_blank", (1.3, 1.66, 0.08), mat("blanket", "#7f9cc7", 0.9), g, (0.0, 1.5, 0.6), 0.04)
    for y in (1.1, 1.9): rbox("b_pil", (0.32, 0.62, 0.16), mat("pillow", "#fbf8f3", 0.85), g, (-1.3, y, 0.66), 0.07, seg=4)
    # nightstand + digital clock + lamp
    ns = mat("ns", "#9b7653", 0.6)
    rbox("b_ns", (0.5, 0.45, 0.55), ns, g, (-2.0, 1.95, 0.28), 0.03)
    rbox("b_clk", (0.22, 0.1, 0.1), mat("clkb", "#1b1b1f", 0.4), g, (-2.05, 1.85, 0.6), 0.015)
    text("b_clktxt", "3:00", 0.06, mat("clkred", "#ff4a3a", 0.5, emit=12), g, (-2.05, 1.795, 0.6), font="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")
    cyl("b_lampb", 0.05, 0.3, mat("lampb", "#d9c4a0", 0.4), g, (-1.88, 2.05, 0.7))
    rbox("b_shade", (0.3, 0.3, 0.22), mat("shade", "#f3e3c3", 0.8, emit=1.5), g, (-1.88, 2.05, 0.95), 0.03, taper=(1.3, 1.3))
    # window
    rbox("b_winf", (1.3, 0.1, 1.2), mat("winframe", "#f4f1ea", 0.5), g, (0.75, 2.4, 1.75), 0.02)
    S.win = plane("b_win", 1.16, 1.06, mat("bwinglass", "#bcd8ff", 0.2, emit=1.0), g, (0.75, 2.34, 1.75))
    # wardrobe (box goes on top)
    wd = mat("wardrobe", "#a07b55", 0.55)
    rbox("b_ward", (1.15, 0.62, 2.05), wd, g, (2.0, 2.05, 1.03), 0.03)
    rbox("b_wline", (0.015, 0.02, 1.9), mat("wline", "#5d4330"), g, (2.0, 1.735, 1.03), 0)
    for x in (1.93, 2.07): rbox("b_knob", (0.03, 0.04, 0.12), mat("knob", "#d8b56a", 0.3, metal=1), g, (x, 1.72, 1.05), 0.01)
    S.topbox, _ = box_open("b_topbox", g, (2.0, 2.05, 2.06), flaps=False, scale=1.0)
    rbox("b_dust", (0.5, 0.38, 0.012), mat("dust", "#cfc7bb", 0.95), S.topbox, (0, 0, 0.29), 0.003)
    rbox("b_lid", (0.52, 0.4, 0.015), mat("card", "#b98a5a"), S.topbox, (0, 0, 0.285), 0.004)
    # lights
    L("bed", "morning", area("b_sun", (P + 0.75, 3.6, 2.4), (P - 0.3, 0.6, 0.6), 1.4, 650, (1, 0.86, 0.66)))
    L("bed", "morning", area("b_mfill", (P - 0.5, -3.0, 2.2), (P - 0.3, 1.0, 0.8), 3.5, 240, (0.9, 0.93, 1)))
    L("bed", "night", area("b_moon", (P + 0.75, 3.6, 2.2), (P - 0.4, 1.0, 0.6), 1.3, 260, (0.45, 0.6, 1)))
    L("bed", "night", point("b_lamp", (P - 1.88, 1.85, 0.98), 90, (1, 0.72, 0.42), 0.12))
    L("bed", "night", area("b_nkey", (P + 0.7, -0.6, 1.7), (P - 0.6, 1.0, 1.1), 1.2, 140, (1, 0.8, 0.6)))
    L("bed", "night", area("b_nfill", (P + 0.8, -3.0, 1.8), (P - 0.3, 1.0, 0.8), 3.5, 150, (0.55, 0.65, 1)))
    L("bed", "day", area("b_dsun", (P + 0.75, 3.6, 2.4), (P + 1.0, 1.0, 0.8), 1.4, 420, (1, 0.93, 0.82)))
    L("bed", "day", area("b_dfill", (P - 0.2, -3.0, 2.2), (P + 1.0, 1.0, 1.0), 3.5, 260, (0.95, 0.95, 1)))
    L("bed", "day", area("b_dfill2", (P + 2.5, -1.0, 2.5), (P + 1.2, 1.6, 1.8), 1.5, 120, (1, 0.9, 0.8)))
    return S

def build_kitchen():
    P = PL["kit"]; g = piv("KITCHEN", None, (P, 0, 0)); S = types.SimpleNamespace(root=g)
    rbox("k_floor", (8, 7, 0.1), mat("kfloor", "#d8ccb8", 0.6), g, (0, 1, -0.05), 0)
    wall = mat("kwall", "#ead9bd", 0.9)
    rbox("k_wall", (8, 0.12, 3.2), wall, g, (0, 2.3, 1.6), 0)
    rbox("k_tiles", (3.4, 0.03, 0.6), mat("ktile", "#9fbfbf", 0.3), g, (-0.2, 2.23, 1.2), 0.0)
    cab, top = mat("kcab", "#f1ede4", 0.5), mat("ktop", "#5f4c3f", 0.35)
    rbox("k_counter", (3.4, 0.66, 0.88), cab, g, (-0.2, 1.9, 0.44), 0.03)
    rbox("k_top", (3.45, 0.7, 0.05), top, g, (-0.2, 1.9, 0.9), 0.01)
    rbox("k_sink", (0.6, 0.42, 0.05), mat("sink", "#9aa0a6", 0.25, metal=0.8), g, (-0.8, 1.88, 0.91), 0.02)
    cyl("k_fauc", 0.025, 0.32, mat("chrome", "#d9dde2", 0.15, metal=1), g, (-0.8, 2.12, 1.08))
    rbox("k_faucs", (0.04, 0.2, 0.04), mat("chrome", "#d9dde2"), g, (-0.8, 2.03, 1.23), 0.01)
    rbox("k_stove", (0.75, 0.6, 0.03), mat("stove", "#1d1d21", 0.3), g, (0.65, 1.9, 0.93), 0.01)
    S.pot = cyl("k_pot", 0.16, 0.2, mat("pot", "#c0392b", 0.3, coat=0.6), g, (0.5, 1.85, 1.05))
    rbox("k_upper", (3.4, 0.38, 0.7), cab, g, (-0.2, 2.08, 2.3), 0.03)
    for x in (-1.5, -0.65, 0.2, 1.05): rbox("k_ukn", (0.03, 0.03, 0.12), mat("knob", "#d8b56a"), g, (x, 1.885, 2.08), 0.01)
    rbox("k_winf", (1.0, 0.08, 0.6), mat("winframe", "#f4f1ea"), g, (-0.8, 2.25, 1.65), 0.02)
    plane("k_win", 0.9, 0.5, mat("kwinglass", "#cfe3ff", 0.2, emit=1.4), g, (-0.8, 2.2, 1.65))
    rbox("k_fridge", (0.85, 0.72, 1.9), mat("fridge", "#e9ecef", 0.3, coat=0.3), g, (2.05, 1.85, 0.95), 0.05)
    rbox("k_fhandle", (0.04, 0.05, 0.5), mat("chrome", "#d9dde2"), g, (1.7, 1.47, 1.2), 0.01)
    plane("k_kidpic", 0.22, 0.28, mat("kidpic", "#f7e27a", 0.8), g, (2.15, 1.485, 1.35), (R(90), 0, 0))
    # table + chairs (front left)
    tb = mat("table", "#a77b52", 0.5)
    rbox("k_table", (1.3, 0.85, 0.06), tb, g, (-1.2, 0.35, 0.74), 0.015)
    for x in (-1.75, -0.65):
        for y in (0.0, 0.7): rbox("k_tleg", (0.06, 0.06, 0.72), tb, g, (x, y, 0.36), 0.01)
    S.chairs = []
    for i, (x, y, rz) in enumerate(((-1.2, -0.35, 180), (-1.2, 1.05, 0), (-0.15, -0.55, 25))):
        c = piv("k_chair%d" % i, g, (x, y, 0), (0, 0, R(rz)))
        rbox("k_cs", (0.46, 0.44, 0.05), tb, c, (0, 0, 0.46), 0.012)
        rbox("k_cb", (0.46, 0.05, 0.5), tb, c, (0, 0.2, 0.72), 0.012)
        for sx in (-0.19, 0.19):
            for sy in (-0.18, 0.18): rbox("k_cl", (0.05, 0.05, 0.46), tb, c, (sx, sy, 0.23), 0.008)
        S.chairs.append(c)
    S.dress = dress_prop("k_folddress", S.chairs[2], (0, 0.0, 0.53), (R(-90), 0, 0), 0.8)
    S.bowl = cyl("k_bowl", 0.11, 0.07, mat("bowl", "#f3f0e9", 0.3), g, (-1.2, 0.15, 0.81))
    L("kit", "day", area("k_sun", (P - 0.8, 3.5, 2.2), (P - 0.2, 0.8, 0.9), 1.4, 520, (1, 0.9, 0.72)))
    L("kit", "day", area("k_fill", (P + 0.4, -3.2, 2.4), (P, 1.0, 1.0), 4, 260, (0.92, 0.95, 1)))
    L("kit", "day", area("k_ceil", (P - 0.3, 0.8, 2.9), (P - 0.3, 0.8, 0), 1.2, 160, (1, 0.88, 0.7)))
    L("kit", "eve", area("k_esun", (P - 0.8, 3.5, 1.8), (P - 0.2, 0.8, 0.6), 1.4, 380, (1, 0.62, 0.36)))
    L("kit", "eve", area("k_eceil", (P - 0.3, 0.6, 2.9), (P - 0.3, 0.6, 0), 1.4, 260, (1, 0.8, 0.55)))
    L("kit", "eve", area("k_efill", (P + 0.4, -3.2, 2.0), (P, 1.0, 1.0), 4, 110, (0.7, 0.75, 1)))
    return S

def build_hosp():
    P = PL["hosp"]; g = piv("HOSP", None, (P, 0, 0)); S = types.SimpleNamespace(root=g)
    rbox("h_floor", (8, 7, 0.1), mat("hfloor", "#c8d2d2", 0.4), g, (0, 1, -0.05), 0)
    rbox("h_wall", (8, 0.12, 3.2), mat("hwall", "#dfe8e6", 0.9), g, (0, 2.3, 1.6), 0)
    met, sheet = mat("hmetal", "#b9c0c6", 0.3, metal=0.7), mat("hsheet", "#f4f6f6", 0.8)
    # bed along y, head at the wall
    rbox("h_frame", (1.1, 2.1, 0.12), met, g, (0, 1.0, 0.55), 0.02)
    rbox("h_matt", (1.0, 1.25, 0.16), sheet, g, (0, 0.65, 0.68), 0.05)
    bk = piv("h_backrest", g, (0, 1.28, 0.62), (R(-42), 0, 0))
    rbox("h_bk", (1.0, 0.16, 0.95), sheet, bk, (0, 0.05, 0.48), 0.05)
    rbox("h_pil", (0.7, 0.14, 0.32), mat("pillow", "#fbf8f3"), bk, (0, -0.06, 0.86), 0.06, seg=4)
    S.blanket = rbox("h_blank", (1.06, 1.15, 0.2), mat("hblank", "#9fc5d6", 0.9), g, (0, 0.55, 0.8), 0.07)
    for sx in (-1, 1):
        rbox("h_rail", (0.04, 0.9, 0.04), met, g, (sx * 0.58, 0.85, 0.98), 0.01)
        for y in (0.45, 1.25): rbox("h_rpost", (0.035, 0.035, 0.32), met, g, (sx * 0.58, y, 0.82), 0.008)
    # clock (hands animated), IV pole, monitor, curtain, window
    S.clk = piv("h_clk", g, (-1.15, 2.22, 2.15))
    cyl("h_clkr", 0.24, 0.05, mat("hclkrim", "#2f3338", 0.4), S.clk, (0, 0.01, 0), (R(90), 0, 0))
    plane("h_clkf", 0.44, 0.44, img_mat("clkface", os.path.join(TEX, "clock.png")), S.clk, (0, -0.02, 0))
    hand = mat("hhand", "#1d1f22", 0.4)
    S.hh = piv("h_hh", S.clk, (0, -0.035, 0)); rbox("h_hhb", (0.03, 0.01, 0.13), hand, S.hh, (0, 0, 0.06), 0.004)
    S.mh = piv("h_mh", S.clk, (0, -0.04, 0)); rbox("h_mhb", (0.02, 0.01, 0.19), hand, S.mh, (0, 0, 0.09), 0.003)
    cyl("h_iv", 0.015, 1.9, met, g, (0.95, 1.4, 0.95)); rbox("h_bag", (0.16, 0.06, 0.24), mat("ivbag", "#e8f4ff", 0.1, trans=0.6), g, (0.95, 1.4, 1.75), 0.03)
    rbox("h_mon", (0.5, 0.25, 0.38), mat("monb", "#3a3f45", 0.4), g, (-1.0, 1.6, 1.35), 0.03)
    plane("h_mons", 0.42, 0.28, mat("monscr", "#0d2b1a", 0.3, emit=0.6), g, (-1.0, 1.472, 1.36))
    text("h_bpm", "142", 0.08, mat("mongreen", "#39ff88", 0.5, emit=8), g, (-0.92, 1.465, 1.4))
    rbox("h_monpole", (0.05, 0.05, 1.2), met, g, (-1.0, 1.65, 0.6), 0.01)
    for i in range(7): rbox("h_curt", (0.22, 0.12, 2.5), mat("curtain", "#8fb9c4", 0.9), g, (1.6 + i * 0.2, 1.4 - (i % 2) * 0.08, 1.35), 0.06)
    rbox("h_winf", (1.1, 0.08, 1.0), mat("winframe", "#f4f1ea"), g, (0.4, 2.25, 1.9), 0.02)
    S.win = plane("h_win", 1.0, 0.9, mat("hwin", "#1c2b55", 0.2, emit=1.2), g, (0.4, 2.2, 1.9))
    L("hosp", "night", area("h_ovh", (P, 0.4, 2.9), (P, 0.6, 0.8), 1.6, 300, (0.85, 0.95, 1)))
    L("hosp", "night", area("h_key", (P - 1.4, -1.6, 2.0), (P, 0.9, 1.1), 1.5, 210, (1, 0.86, 0.72)))
    L("hosp", "night", area("h_rim", (P + 1.3, 2.0, 2.2), (P, 1.0, 1.2), 1.0, 160, (0.5, 0.65, 1)))
    L("hosp", "dawn", area("h_dsun", (P + 0.4, 3.4, 2.2), (P, 0.8, 1.0), 1.4, 520, (1, 0.8, 0.6)))
    L("hosp", "dawn", area("h_dfill", (P - 0.6, -2.5, 2.0), (P, 0.9, 1.1), 3, 230, (1, 0.92, 0.85)))
    return S

def build_ins():
    P = PL["ins"]; g = piv("INSERT", None, (P, 0, 0)); S = types.SimpleNamespace(root=g)
    rbox("i_table", (4, 3, 0.06), mat("itable", "#7a5a40", 0.45), g, (0, 0.6, -0.03), 0.01)
    plane("i_back", 8, 5, mat("iback", "#3a2c28", 0.95), g, (0, 2.5, 1.0))
    # blanket under the test / box (bedroom)
    S.blanket = rbox("i_blank", (1.6, 1.2, 0.04), mat("blanket", "#7f9cc7"), g, (0, 0.4, 0.02), 0.02)
    # pregnancy test
    S.test = piv("i_test", g, (0, 0.25, 0.06), (0, 0, R(-8)))
    rbox("i_tb", (0.32, 0.06, 0.022), mat("testw", "#f7f7f7", 0.35), S.test, (0, 0, 0), 0.008)
    rbox("i_tcap", (0.09, 0.062, 0.024), mat("testcap", "#7fb3e8", 0.3), S.test, (0.15, 0, 0.0), 0.008)
    rbox("i_twin", (0.08, 0.03, 0.006), mat("testwin", "#efe9ec", 0.3), S.test, (-0.02, 0, 0.012), 0.002)
    pink = mat("testpink", "#e0306a", 0.4, emit=0.6)
    rbox("i_l1", (0.007, 0.026, 0.004), pink, S.test, (-0.04, 0, 0.0155), 0)
    S.line2 = rbox("i_l2", (0.007, 0.026, 0.004), pink, S.test, (-0.005, 0, 0.0155), 0)
    # the ME box with her things
    S.box, S.flaps = box_open("i_box", g, (0.0, 0.5, 0.04))
    S.items = piv("i_items", S.box, (0, 0, 0))
    dress = mat("dressred", "#c8202c")
    rbox("i_fdress", (0.42, 0.3, 0.07), dress, S.items, (0, 0.02, 0.05), 0.03)
    rbox("i_fdress2", (0.2, 0.3, 0.05), dress, S.items, (-0.06, 0.02, 0.1), 0.02)
    for x in (0.12, 0.18):
        rbox("i_shoe", (0.05, 0.13, 0.04), mat("shoegold", "#d8b25a", 0.3, metal=0.6), S.items, (x, -0.06, 0.14), 0.015, rot=(0, 0, R(10)))
    S.sketch = piv("i_sketchp", S.items, (-0.06, -0.05, 0.16), (0, 0, R(-6)))
    rbox("i_sk", (0.28, 0.2, 0.02), mat("skcover", "#2f5a4a", 0.6), S.sketch, (0, 0, 0), 0.006)
    S.page = plane("i_page", 0.5, 0.36, img_mat("sketchpage", os.path.join(TEX, "sketch.png"), 0.8), S.items, (-0.02, 0.0, 0.215), (0, 0, 0))
    S.photo = piv("i_photo", g, (0.05, 0.32, 0.22))
    rbox("i_phb", (0.17, 0.004, 0.21), mat("phborder", "#fbfaf6", 0.6), S.photo, (0, 0.002, 0), 0.003)
    pth = os.path.join(TEX, "photo.png")
    S.phimg = plane("i_phimg", 0.145, 0.165, img_mat("photoimg", pth) if os.path.exists(pth) else mat("phgrey", "#888888"), S.photo, (0, -0.001, 0.012))
    # son's / mom's forearm + hand for inserts
    S.arm = piv("i_arm", g, (0.6, 0.0, 0.5))
    S.sleeve = rbox("i_sleeve", (0.14, 0.15, 0.5), mat("navy", "#2c3e66", 0.85), S.arm, (0, 0, 0.25), 0.04)
    rbox("i_hand", (0.13, 0.15, 0.12), mat("ins_skin", "#e9b996", 0.5, sss=0.1), S.arm, (0, 0, -0.06), 0.04)
    L("ins", "warm", area("i_key", (P - 0.9, -0.9, 1.6), (P, 0.4, 0.1), 1.2, 160, (1, 0.86, 0.7)))
    L("ins", "warm", area("i_rim", (P + 1.0, 1.4, 1.2), (P, 0.4, 0.1), 0.8, 90, (0.7, 0.8, 1)))
    L("ins", "cool", area("i_ckey", (P - 0.9, -0.9, 1.6), (P, 0.4, 0.1), 1.2, 140, (0.9, 0.95, 1)))
    L("ins", "cool", area("i_crim", (P + 1.0, 1.4, 1.2), (P, 0.4, 0.1), 0.8, 110, (1, 0.85, 0.7)))
    return S
