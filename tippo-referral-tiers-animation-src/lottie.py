#!/usr/bin/env python3
"""
Generates Lottie JSON for the Tippo referral tiers reward-dots animation (You → Tier 1 → Tier 2).
Same layouts and timing as tippo-referral-tiers.js: desktop 874×210, mobile 350×108, 30 fps, 6 s seamless loop.
The scene is static; only the dots move, along the arrows in their direction (You → Tier 1 → Tier 2).

    python3 lottie.py ../tippo-referral-tiers-animation/lottie

Drop shadows are not exported (Lottie's SVG renderer support is partial); the web widget keeps them.
Text uses font "Non Bureau" (SemiBold / Medium) by family name — load it on the page, or lottie-web falls back.
"""
import json
import math
import os
import sys

FPS = 30
F = lambda s: round(s * FPS, 2)  # seconds → frames

COLORS = {
    "ink": "#020408", "muted": "#8C8F93", "orbit": "#D6DAD7",
    "youTop": "#9BF0A5", "youBottom": "#3FB437", "green": "#47BE3F",
    "yellow": "#F2B84B", "blue": "#6F9BEB", "grey": "#717171", "pink": "#E573A5", "purple": "#9B7BF0",
}

FLOW = {"loop": 6.0, "every": 1.5, "leg1": 1.1, "pause": 0.2, "leg2": 1.2, "tier1Offset": 0.75, "fadeIn": 0.1, "fadeOut": 0.15}
N_DOTS = round(FLOW["loop"] / FLOW["every"])

LAYOUTS = {
    "desktop": {
        "w": 874, "h": 210,
        "you": {"cx": 104.74, "cy": 76.89, "r": 46.27, "stroke": 1.84},
        "tier1": {"cx": 416, "cy": 75.61, "r": 26.06, "gap": 33.88, "stroke": 3.9, "colors": ["yellow", "blue", "green"]},
        "tier2": {"cx": 727.26, "cy": 75.84, "orbitR": 39.96, "orbitStroke": 1.31, "memberR": 15.77, "memberStroke": 2.1},
        "arrows": [
            {"x1": 190.96, "y1": 76.55, "x2": 329.77, "y2": 76.55, "head": 10.5, "labelX": 260.37, "labelY": 53},
            {"x1": 502.22, "y1": 76.55, "x2": 641.03, "y2": 76.55, "head": 10.5, "labelX": 571.63, "labelY": 53},
        ],
        "arrowStroke": 2.1,
        "labels": {"size": 18.93, "items": [("You", 104.74, 174), ("Tier 1", 416, 174), ("Tier 2", 727.26, 174)]},
        "inviteSize": 12.6,
        "dots": {"r": 4, "halo": 2},
    },
    "mobile": {
        "w": 350, "h": 108,
        "you": {"cx": 32, "cy": 42, "r": 32, "stroke": 1.27},
        "tier1": {"cx": 165, "cy": 42, "r": 18, "gap": 23.4, "stroke": 2.7, "colors": ["yellow", "blue", "green"]},
        "tier2": {"cx": 308, "cy": 42, "orbitR": 28, "orbitStroke": 0.92, "memberR": 11, "memberStroke": 1.47},
        "arrows": [
            {"x1": 72, "y1": 42, "x2": 115.5, "y2": 42, "head": 6, "labelX": 93.75, "labelY": 31},
            {"x1": 214.5, "y1": 42, "x2": 258, "y2": 42, "head": 6, "labelX": 236.25, "labelY": 31},
        ],
        "arrowStroke": 1.5,
        "labels": {"size": 14, "items": [("You", 32, 104), ("Tier 1", 165, 104), ("Tier 2", 308, 104)]},
        "inviteSize": 9,
        "dots": {"r": 3.5, "halo": 1.5},
    },
}


# ------------------------------------------------------------------ helpers
def rgb(hexs):
    h = hexs.lstrip("#")
    return [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]


def const(val):
    return {"a": 0, "k": val}


def kf(keys, hold=False):
    """keys: [(sec, value(list))] → linear animated property (hold=True: step keyframes)."""
    out = []
    for i, (sec, val) in enumerate(keys):
        n = len(val)
        k = {"t": F(sec), "s": val, "o": {"x": [0] * n, "y": [0] * n}, "i": {"x": [1] * n, "y": [1] * n}}
        if hold:
            k["h"] = 1
        if i < len(keys) - 1:
            k["e"] = keys[i + 1][1]
        out.append(k)
    return {"a": 1, "k": out}


def tr():
    return {"ty": "tr", "p": const([0, 0]), "a": const([0, 0]), "s": const([100, 100]), "r": const(0), "o": const(100)}


def ellipse(cx, cy, r, fill=None, stroke=None, sw=0, opacity=100, name="ellipse"):
    """One style per group (Lottie draws the first-listed item on top)."""
    assert not (fill and stroke)
    items = [{"ty": "el", "p": const([cx, cy]), "s": const([2 * r, 2 * r]), "nm": name}]
    if stroke:
        items.append({"ty": "st", "c": const(rgb(stroke) + [1]), "o": const(opacity), "w": const(sw), "lc": 2, "lj": 1, "nm": "stroke"})
    if fill:
        items.append({"ty": "fl", "c": const(rgb(fill) + [1]), "o": const(opacity), "nm": "fill"})
    return {"ty": "gr", "it": items + [tr()], "nm": name}


def path_shape(verts, ins, outs, closed, fill=None, stroke=None, sw=0, name="path"):
    items = [{"ty": "sh", "ks": const({"c": closed, "v": verts, "i": ins, "o": outs}), "nm": name}]
    if stroke:
        items.append({"ty": "st", "c": const(rgb(stroke) + [1]), "o": const(100), "w": const(sw), "lc": 2, "lj": 2, "nm": "stroke"})
    if fill:
        items.append({"ty": "fl", "c": const(rgb(fill) + [1]), "o": const(100), "nm": "fill"})
    return {"ty": "gr", "it": items + [tr()], "nm": name}


def person(cx, cy, R):
    hw, top, bot = R * 0.46, cy + R * 0.1, cy + R * 0.47
    v = [[cx - hw, bot], [cx, top], [cx + hw, bot]]
    o = [[(cx - hw * 0.92) - v[0][0], (top + (bot - top) * 0.35) - v[0][1]], [(cx + hw * 0.5) - v[1][0], 0], [0, 0]]
    i = [[0, 0], [(cx - hw * 0.5) - v[1][0], 0], [(cx + hw * 0.92) - v[2][0], (top + (bot - top) * 0.35) - v[2][1]]]
    return [ellipse(cx, cy - R * 0.21, R * 0.25, fill="#FFFFFF", name="head"), path_shape(v, i, o, True, fill="#FFFFFF", name="body")]


def layer(name, shapes, op=None, pos=None, opacity=None):
    ks = {"a": const([0, 0, 0]), "p": pos if pos is not None else const([0, 0, 0]), "s": const([100, 100, 100]),
          "o": opacity if opacity is not None else const(100), "r": const(0)}
    return {"ddd": 0, "ind": 0, "ty": 4, "nm": name, "sr": 1, "ks": ks, "ao": 0, "shapes": shapes, "ip": 0, "op": F(op or FLOW["loop"]), "st": 0, "bm": 0}


def text_layer(name, text, x, y, size, color, font, tracking, justify):
    doc = {"s": size, "f": font, "t": text, "j": justify, "tr": tracking, "lh": size * 1.2, "ls": 0, "fc": rgb(color)}
    return {"ddd": 0, "ind": 0, "ty": 5, "nm": name, "sr": 1,
            "ks": {"a": const([0, 0, 0]), "o": const(100), "r": const(0), "s": const([100, 100, 100]), "p": const([x, y, 0])},
            "ao": 0, "t": {"d": {"k": [{"s": doc, "t": 0}]}, "p": {}, "m": {"g": 1, "a": const([0, 0])}, "a": []},
            "ip": 0, "op": F(FLOW["loop"]), "st": 0, "bm": 0}


# ------------------------------------------------------------------ scene
def build(variant):
    L = LAYOUTS[variant]
    layers = []  # appended bottom → top; reversed at the end (Lottie lists the top layer first)

    def add(l):
        layers.append(l)

    for text, x, y in L["labels"]["items"]:
        add(text_layer("Label " + text, text, x, y, L["labels"]["size"], COLORS["ink"], "NonBureau-SemiBold", -2, 2))

    for i, a in enumerate(L["arrows"]):
        dx, dy = a["x2"] - a["x1"], a["y2"] - a["y1"]
        ln = math.hypot(dx, dy)
        ux, uy = dx / ln, dy / ln
        px, py = -uy, ux
        bx, by, hw = a["x2"] - ux * a["head"], a["y2"] - uy * a["head"], a["head"] * 0.8
        line = path_shape([[a["x1"], a["y1"]], [a["x2"], a["y2"]]], [[0, 0]] * 2, [[0, 0]] * 2, False, stroke=COLORS["ink"], sw=L["arrowStroke"], name="line")
        head = path_shape([[bx + px * hw, by + py * hw], [a["x2"], a["y2"]], [bx - px * hw, by - py * hw]], [[0, 0]] * 3, [[0, 0]] * 3, False,
                          stroke=COLORS["ink"], sw=L["arrowStroke"], name="head")
        add(layer(f"Arrow {i+1}", [head, line]))
        add(text_layer(f"INVITES {i+1}", "INVITES", a["labelX"], a["labelY"], L["inviteSize"], COLORS["muted"], "NonBureau-Medium", 4, 2))

    # invite dots — along the arrow lines, in the arrows' direction (start → head); one layer per emission,
    # a copy shifted by -loop covers the wrap-around. Added here so they sit above the arrows and below the nodes.
    a1, a2 = L["arrows"]
    Fl = {"a1Start": [a1["x1"], a1["y1"]], "a1End": [a1["x2"], a1["y2"]], "a2Start": [a2["x1"], a2["y1"]], "a2End": [a2["x2"], a2["y2"]]}
    D = L["dots"]
    LOOP = FLOW["loop"]

    def dot_shapes():
        return [ellipse(0, 0, D["r"], fill=COLORS["green"], name="dot"), ellipse(0, 0, D["r"] + D["halo"], fill="#FFFFFF", name="halo")]

    def xyz(p):
        return [p[0], p[1], 0]

    def you_dot(t0, n):
        t1 = t0 + FLOW["leg1"]; t2 = t1 + FLOW["pause"]; t3 = t2 + FLOW["leg2"]
        pos = kf([(t0, xyz(Fl["a1Start"])), (t1, xyz(Fl["a1End"])), (t2, xyz(Fl["a2Start"])), (t3, xyz(Fl["a2End"]))])
        pos["k"][1]["h"] = 1  # jump to the other side of Tier 1 after the pause
        op = kf([(t0 - 0.01, [0]), (t0, [0]), (t0 + FLOW["fadeIn"], [100]), (t1 - 0.01, [100]), (t1, [0]), (t2, [0]),
                 (t2 + FLOW["fadeIn"], [100]), (t3 - FLOW["leg2"] * FLOW["fadeOut"], [100]), (t3, [0]), (t3 + 0.01, [0])])
        return layer(f"Dot from You {n}", dot_shapes(), pos=pos, opacity=op)

    def tier1_dot(t0, n):
        t3 = t0 + FLOW["leg2"]
        pos = kf([(t0, xyz(Fl["a2Start"])), (t3, xyz(Fl["a2End"]))])
        op = kf([(t0 - 0.01, [0]), (t0, [0]), (t0 + FLOW["fadeIn"], [100]), (t3 - FLOW["leg2"] * FLOW["fadeOut"], [100]), (t3, [0]), (t3 + 0.01, [0])])
        return layer(f"Dot from Tier 1 {n}", dot_shapes(), pos=pos, opacity=op)

    for i in range(N_DOTS):
        e = i * FLOW["every"]
        add(you_dot(e, i + 1))
        if e + FLOW["leg1"] + FLOW["pause"] + FLOW["leg2"] > LOOP:
            add(you_dot(e - LOOP, f"{i+1} (wrap)"))
        e1 = e + FLOW["tier1Offset"]
        add(tier1_dot(e1, i + 1))
        if e1 + FLOW["leg2"] > LOOP:
            add(tier1_dot(e1 - LOOP, f"{i+1} (wrap)"))

    Y = L["you"]
    grad = {"ty": "gf", "o": const(100), "r": 1, "t": 1, "s": const([Y["cx"], Y["cy"] - Y["r"]]), "e": const([Y["cx"], Y["cy"] + Y["r"]]),
            "g": {"p": 2, "k": const([0] + rgb(COLORS["youTop"]) + [1] + rgb(COLORS["youBottom"]))}, "nm": "gradient"}
    disc = {"ty": "gr", "it": [{"ty": "el", "p": const([Y["cx"], Y["cy"]]), "s": const([2 * Y["r"], 2 * Y["r"]]), "nm": "disc"}, grad, tr()], "nm": "disc"}
    inner = ellipse(Y["cx"], Y["cy"], Y["r"] - Y["stroke"] / 2, stroke="#FFFFFF", sw=Y["stroke"], opacity=70, name="inner stroke")
    add(layer("You", person(Y["cx"], Y["cy"], Y["r"]) + [inner, disc]))

    T1 = L["tier1"]
    for i, c in enumerate(T1["colors"]):
        cx = T1["cx"] + (i - 1) * T1["gap"]
        add(layer(f"Tier 1 avatar {i+1}", person(cx, T1["cy"], T1["r"]) + [
            ellipse(cx, T1["cy"], T1["r"] + T1["stroke"] / 2, stroke="#FFFFFF", sw=T1["stroke"], name="border"),
            ellipse(cx, T1["cy"], T1["r"] + T1["stroke"] / 2, fill=COLORS[c], name="avatar")]))

    T2 = L["tier2"]
    add(layer("Tier 2 orbit", [ellipse(T2["cx"], T2["cy"], T2["orbitR"], stroke=COLORS["orbit"], sw=T2["orbitStroke"], name="orbit")]))
    mcolors = ["yellow", "grey", "blue", "pink", "purple", "green"]
    for i in range(6):
        ang = -math.pi / 2 + i * math.pi / 3
        cx, cy = T2["cx"] + math.cos(ang) * T2["orbitR"], T2["cy"] + math.sin(ang) * T2["orbitR"]
        add(layer(f"Tier 2 member {i+1}", person(cx, cy, T2["memberR"]) + [
            ellipse(cx, cy, T2["memberR"] + T2["memberStroke"] / 2, stroke="#FFFFFF", sw=T2["memberStroke"], name="border"),
            ellipse(cx, cy, T2["memberR"] + T2["memberStroke"] / 2, fill=COLORS[mcolors[i]], name="member")]))

    layers.reverse()
    for n, l in enumerate(layers):
        l["ind"] = n + 1
    return {
        "v": "5.9.0", "fr": FPS, "ip": 0, "op": F(LOOP), "w": L["w"], "h": L["h"], "nm": f"tippo-referral-tiers-{variant}", "ddd": 0,
        "assets": [],
        "fonts": {"list": [
            {"fName": "NonBureau-SemiBold", "fFamily": "Non Bureau, Inter, system-ui, sans-serif", "fStyle": "SemiBold", "ascent": 75},
            {"fName": "NonBureau-Medium", "fFamily": "Non Bureau, Inter, system-ui, sans-serif", "fStyle": "Medium", "ascent": 75},
        ]},
        "layers": layers, "markers": [],
    }


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "..", "tippo-referral-tiers-animation", "lottie")
    os.makedirs(out, exist_ok=True)
    for v in ("desktop", "mobile"):
        p = os.path.join(out, f"tippo-referral-tiers-{v}.json")
        with open(p, "w") as f:
            json.dump(build(v), f, separators=(",", ":"))
        print(p, os.path.getsize(p), "bytes")
