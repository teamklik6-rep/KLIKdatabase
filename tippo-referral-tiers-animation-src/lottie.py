#!/usr/bin/env python3
"""
Generates Lottie JSON for the Tippo referral tiers animation (You → Tier 1 → Tier 2).
Same layouts and timeline as tippo-referral-tiers.js (desktop 874×210, mobile 350×92), 30 fps, 7 s loop.

    python3 lottie.py ../tippo-referral-tiers-animation/lottie

Drop shadows are not exported (Lottie's SVG renderer support is partial); the web widget keeps them.
Text uses font "Non Bureau" (SemiBold / Medium) by family name — load it on the page, or lottie-web falls back.
"""
import json
import math
import os
import sys

FPS = 30
LOOP = 7.0
F = lambda s: round(s * FPS, 2)  # seconds → frames

COLORS = {
    "ink": "#020408", "muted": "#8C8F93", "orbit": "#D6DAD7",
    "youTop": "#9BF0A5", "youBottom": "#3FB437", "green": "#47BE3F",
    "yellow": "#F2B84B", "blue": "#6F9BEB", "grey": "#717171", "pink": "#E573A5", "purple": "#9B7BF0",
}

LAYOUTS = {
    "desktop": {
        "w": 874, "h": 210,
        "you": {"cx": 104.74, "cy": 76.89, "r": 46.27, "stroke": 1.84, "ringScale": 1.46},
        "tier1": {"cx": 416, "cy": 75.61, "r": 26.06, "gap": 33.88, "stroke": 3.9, "colors": ["yellow", "blue", "green"]},
        "tier2": {"cx": 727.26, "cy": 75.84, "orbitR": 39.96, "orbitStroke": 1.31, "memberR": 15.77, "memberStroke": 2.1},
        "arrows": [
            {"x1": 190.96, "x2": 329.77, "y": 76.55, "head": 10.5, "labelX": 260.37, "labelY": 53},
            {"x1": 502.22, "x2": 641.03, "y": 76.55, "head": 10.5, "labelX": 571.63, "labelY": 53},
        ],
        "arrowStroke": 2.1,
        "labels": {"y": 174, "size": 18.93, "xs": [104.74, 416, 727.26], "texts": ["You", "Tier 1", "Tier 2"]},
        "inviteSize": 12.6, "dot": {"r": 5, "halo": 2},
    },
    "mobile": {
        "w": 350, "h": 92,
        "you": {"cx": 36, "cy": 32, "r": 28, "stroke": 1.2, "ringScale": 1.25},
        "tier1": {"cx": 173, "cy": 32, "r": 16.16, "gap": 21, "stroke": 2.4, "colors": ["yellow", "blue", "green"]},
        "tier2": {"cx": 312, "cy": 32, "orbitR": 22.4, "orbitStroke": 0.8, "memberR": 8.83, "memberStroke": 1.2},
        "arrows": [
            {"x1": 76.5, "x2": 126.5, "y": 32, "head": 6, "labelX": 101.5, "labelY": 20},
            {"x1": 219.5, "x2": 269.5, "y": 32, "head": 6, "labelX": 244.5, "labelY": 20},
        ],
        "arrowStroke": 1.5,
        "labels": {"y": 86, "size": 14, "xs": [36, 173, 312], "texts": ["You", "Tier 1", "Tier 2"]},
        "inviteSize": 9, "dot": {"r": 3.5, "halo": 1.5},
    },
}

T = {
    "youPop": (0.0, 0.5), "youLabel": (0.3, 0.7),
    "arrow1": (0.5, 1.05), "invite1": (0.75, 1.1),
    "tier1": (1.05, 1.75), "tier1Label": (1.45, 1.85),
    "arrow2": (1.8, 2.35), "invite2": (2.05, 2.4),
    "orbit": (2.35, 2.95), "members": (2.55, 3.45), "tier2Label": (3.05, 3.45),
    "rewards": (3.7, 4.75), "fadeOut": (6.45, 6.95),
}
REWARD_LEG, REWARD_PAUSE = 0.5, 0.16

# ------------------------------------------------------------------ helpers
EASE = {  # cubic-bezier (x1,y1,x2,y2)
    "outCubic": (0.33, 1, 0.68, 1), "inOutSine": (0.37, 0, 0.63, 1), "inOutCubic": (0.65, 0, 0.35, 1), "linear": (0, 0, 1, 1),
}


def rgb(hexs):
    h = hexs.lstrip("#")
    return [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]


def kf(keys):
    """keys: [(sec, value(list), easeName)] → animated property."""
    out = []
    for i, (sec, val, ease) in enumerate(keys):
        x1, y1, x2, y2 = EASE[ease]
        n = len(val)
        k = {"t": F(sec), "s": val, "o": {"x": [x1] * n, "y": [y1] * n}, "i": {"x": [x2] * n, "y": [y2] * n}}
        if i < len(keys) - 1:
            k["e"] = keys[i + 1][1]
        out.append(k)
    return {"a": 1, "k": out}


def const(val):
    return {"a": 0, "k": val}


def pop_keys(t0, d, over=1.08, base=0.0):
    """scale %: 0 → over → 1."""
    return [(t0, [base * 100] * 2, "outCubic"), (t0 + d * 0.65, [over * 100] * 2, "inOutSine"), (t0 + d, [100, 100], "linear")]


def bump_keys(t0, d, peak, up=0.3):
    return [(t0, [100, 100], "outCubic"), (t0 + d * up, [peak * 100] * 2, "inOutSine"), (t0 + d, [100, 100], "linear")]


def fade_keys(t0, t1, a=0, b=100, ease="outCubic"):
    return [(t0, [a], ease), (t1, [b], "linear")]


def scale3(keys):  # add z to 2D scale keys
    return kf([(t, v + [100], e) for t, v, e in keys])


def ellipse(cx, cy, r, fill=None, stroke=None, sw=0, name="ellipse"):
    """One style per group: Lottie draws the first-listed shape on top, so callers list stroke/person groups before the fill disc."""
    assert not (fill and stroke), "use two ellipse() groups: stroke first (on top), then fill"
    items = [{"ty": "el", "p": const([cx, cy]), "s": const([2 * r, 2 * r]), "nm": name}]
    if stroke:
        items.append({"ty": "st", "c": const(rgb(stroke) + [1]), "o": const(100), "w": const(sw), "lc": 2, "lj": 1, "nm": "stroke"})
    if fill:
        items.append({"ty": "fl", "c": const(rgb(fill) + [1]), "o": const(100), "nm": "fill"})
    return {"ty": "gr", "it": items + [{"ty": "tr", "p": const([0, 0]), "a": const([0, 0]), "s": const([100, 100]), "r": const(0), "o": const(100)}], "nm": name}


def path_shape(verts, ins, outs, closed, fill=None, stroke=None, sw=0, name="path", extra=None):
    items = [{"ty": "sh", "ks": const({"c": closed, "v": verts, "i": ins, "o": outs}), "nm": name}]
    if extra:
        items += extra
    if stroke:
        items.append({"ty": "st", "c": const(rgb(stroke) + [1]), "o": const(100), "w": const(sw), "lc": 2, "lj": 2, "nm": "stroke"})
    if fill:
        items.append({"ty": "fl", "c": const(rgb(fill) + [1]), "o": const(100), "nm": "fill"})
    return {"ty": "gr", "it": items + [{"ty": "tr", "p": const([0, 0]), "a": const([0, 0]), "s": const([100, 100]), "r": const(0), "o": const(100)}], "nm": name}


def person(cx, cy, R):
    hr, hcy = R * 0.25, cy - R * 0.21
    hw, top, bot = R * 0.46, cy + R * 0.1, cy + R * 0.47
    head = ellipse(cx, hcy, hr, fill="#FFFFFF", name="head")
    # body: M(-hw,bot) C(-.92hw, top+.35h)(-.5hw, top)(0,top) C(.5hw,top)(.92hw, top+.35h)(hw,bot) Z   (abs → tangents)
    v = [[cx - hw, bot], [cx, top], [cx + hw, bot]]
    o = [[(cx - hw * 0.92) - v[0][0], (top + (bot - top) * 0.35) - v[0][1]], [(cx + hw * 0.5) - v[1][0], 0], [0, 0]]
    i = [[0, 0], [(cx - hw * 0.5) - v[1][0], 0], [(cx + hw * 0.92) - v[2][0], (top + (bot - top) * 0.35) - v[2][1]]]
    body = path_shape(v, i, o, True, fill="#FFFFFF", name="body")
    return [head, body]


def layer(name, shapes, cx, cy, scale_keys=None, opacity_keys=None, parent=None, pos=None, rot=0):
    ks = {
        "a": const([cx, cy, 0]), "p": const([cx, cy, 0]) if pos is None else pos,
        "s": scale3(scale_keys) if scale_keys else const([100, 100, 100]),
        "o": kf(opacity_keys) if opacity_keys else const(100), "r": const(rot),
    }
    L = {"ddd": 0, "ind": 0, "ty": 4, "nm": name, "sr": 1, "ks": ks, "ao": 0, "shapes": shapes, "ip": 0, "op": F(LOOP), "st": 0, "bm": 0}
    if parent is not None:
        L["parent"] = parent
    return L


def null_layer(name, cx, cy, scale_keys=None):
    return {"ddd": 0, "ind": 0, "ty": 3, "nm": name, "sr": 1, "ks": {
        "a": const([cx, cy, 0]), "p": const([cx, cy, 0]), "s": scale3(scale_keys) if scale_keys else const([100, 100, 100]),
        "o": const(100), "r": const(0)}, "ao": 0, "ip": 0, "op": F(LOOP), "st": 0, "bm": 0}


def text_layer(name, text, x, y, size, color, font, tracking, opacity_keys, slide):
    doc = {"s": size, "f": font, "t": text, "j": 2, "tr": tracking, "lh": size * 1.2, "ls": 0, "fc": rgb(color)}
    L = {"ddd": 0, "ind": 0, "ty": 5, "nm": name, "sr": 1, "ks": {
        "a": const([0, 0, 0]), "o": kf(opacity_keys), "r": const(0), "s": const([100, 100, 100]),
        "p": kf([(opacity_keys[0][0], [x, y + slide, 0], "outCubic"), (opacity_keys[1][0], [x, y, 0], "linear")])},
        "ao": 0, "t": {"d": {"k": [{"s": doc, "t": 0}]}, "p": {}, "m": {"g": 1, "a": const([0, 0])}, "a": []},
        "ip": 0, "op": F(LOOP), "st": 0, "bm": 0}
    return L


# ------------------------------------------------------------------ scene
def build(variant):
    L = LAYOUTS[variant]
    layers = []

    def add(l):
        l["ind"] = len(layers) + 1
        layers.append(l)
        return l["ind"]

    # labels
    label_t = [T["youLabel"], T["tier1Label"], T["tier2Label"]]
    for i, x in enumerate(L["labels"]["xs"]):
        add(text_layer("Label " + L["labels"]["texts"][i], L["labels"]["texts"][i], x, L["labels"]["y"], L["labels"]["size"], COLORS["ink"],
                       "NonBureau-SemiBold", -2, fade_keys(*label_t[i]), 6))

    # arrows + INVITES
    arrow_t, invite_t = [T["arrow1"], T["arrow2"]], [T["invite1"], T["invite2"]]
    for i, a in enumerate(L["arrows"]):
        y = a["y"]
        trim = {"ty": "tm", "s": const(0), "e": kf([(arrow_t[i][0], [0], "inOutCubic"), (arrow_t[i][1], [100], "linear")]), "o": const(0), "m": 1, "nm": "draw"}
        line = path_shape([[a["x1"], y], [a["x2"], y]], [[0, 0], [0, 0]], [[0, 0], [0, 0]], False, stroke=COLORS["ink"], sw=L["arrowStroke"], name="line", extra=[trim])
        add(layer(f"Arrow {i+1} line", [line], a["x1"], y, opacity_keys=[(arrow_t[i][0], [0], "linear"), (arrow_t[i][0] + 0.01, [100], "linear")]))
        hx, hy = a["x2"] - a["head"], a["head"] * 0.8
        head = path_shape([[hx, y - hy], [a["x2"], y], [hx, y + hy]], [[0, 0]] * 3, [[0, 0]] * 3, False, stroke=COLORS["ink"], sw=L["arrowStroke"], name="head")
        h0, h1 = arrow_t[i][1] - 0.12, arrow_t[i][1] + 0.08
        add(layer(f"Arrow {i+1} head", [head], a["x2"], y, scale_keys=[(h0, [40, 40], "outCubic"), (h1, [100, 100], "linear")], opacity_keys=fade_keys(h0, h1)))
        add(text_layer(f"INVITES {i+1}", "INVITES", a["labelX"], a["labelY"], L["inviteSize"], COLORS["muted"], "NonBureau-Medium", 4, fade_keys(*invite_t[i]), 4))

    # reward timing
    waves = []
    for w0 in T["rewards"]:
        t_arrive1 = w0 + REWARD_LEG
        t_arrive_you = t_arrive1 + REWARD_PAUSE + REWARD_LEG
        waves.append((w0, t_arrive1, t_arrive_you))

    # You ring (expanding) — one layer per wave
    Y = L["you"]
    for n, (_, _, t_you) in enumerate(waves):
        ring = ellipse(Y["cx"], Y["cy"], Y["r"], stroke=COLORS["green"], sw=Y["stroke"] * 1.2, name="ring")
        add(layer(f"You ring {n+1}", [ring], Y["cx"], Y["cy"],
                  scale_keys=[(t_you - 0.02, [100, 100], "outCubic"), (t_you + 1.0, [Y["ringScale"] * 100] * 2, "linear")],
                  opacity_keys=[(t_you - 0.03, [0], "linear"), (t_you - 0.02, [62], "linear"), (t_you + 1.0, [0], "linear"), (t_you + 1.01, [0], "linear")]))

    # You (pop, then one breath per wave)
    you_scale = pop_keys(T["youPop"][0], T["youPop"][1] - T["youPop"][0], over=1.06)
    for (_, _, t_you) in waves:
        you_scale += bump_keys(t_you - 0.1, 1.0, 1.045, 0.3)
    grad = {"ty": "gf", "o": const(100), "r": 1, "t": 1, "s": const([Y["cx"], Y["cy"] - Y["r"]]), "e": const([Y["cx"], Y["cy"] + Y["r"]]),
            "g": {"p": 2, "k": const([0] + rgb(COLORS["youTop"]) + [1] + rgb(COLORS["youBottom"]))}, "nm": "gradient"}
    disc = {"ty": "gr", "it": [{"ty": "el", "p": const([Y["cx"], Y["cy"]]), "s": const([2 * Y["r"], 2 * Y["r"]]), "nm": "disc"}, grad,
                             {"ty": "tr", "p": const([0, 0]), "a": const([0, 0]), "s": const([100, 100]), "r": const(0), "o": const(100)}], "nm": "disc"}
    inner = ellipse(Y["cx"], Y["cy"], Y["r"] - Y["stroke"] / 2, stroke="#FFFFFF", sw=Y["stroke"], name="inner stroke")
    inner["it"][1]["o"] = const(70)
    add(layer("You", person(Y["cx"], Y["cy"], Y["r"]) + [inner, disc], Y["cx"], Y["cy"], scale_keys=you_scale,
              opacity_keys=fade_keys(T["youPop"][0], T["youPop"][0] + 0.2, ease="linear")))

    # Tier 1: null (pulse per wave) + 3 avatars
    T1 = L["tier1"]
    pulse = []
    for (_, t1, _) in waves:
        pulse += bump_keys(t1 - 0.05, 0.6, 1.065, 0.25)
    t1_null = add(null_layer("Tier 1 pulse", T1["cx"], T1["cy"], pulse))
    for i, c in enumerate(T1["colors"]):
        cx = T1["cx"] + (i - 1) * T1["gap"]
        s0 = T["tier1"][0] + i * 0.17
        shapes = person(cx, T1["cy"], T1["r"]) + [ellipse(cx, T1["cy"], T1["r"] + T1["stroke"] / 2, stroke="#FFFFFF", sw=T1["stroke"], name="border"),
                                                  ellipse(cx, T1["cy"], T1["r"] + T1["stroke"] / 2, fill=COLORS[c], name="avatar")]
        add(layer(f"Tier 1 avatar {i+1}", shapes, cx, T1["cy"], scale_keys=pop_keys(s0, 0.42, 1.1), opacity_keys=fade_keys(s0, s0 + 0.15, ease="linear"), parent=t1_null))

    # Tier 2: null (push per wave) + orbit + 6 members
    T2 = L["tier2"]
    push = []
    for (w0, _, _) in waves:
        push += bump_keys(w0, 0.43, 1.07, 0.26)
    t2_null = add(null_layer("Tier 2 push", T2["cx"], T2["cy"], push))
    orbit_trim = {"ty": "tm", "s": const(0), "e": kf([(T["orbit"][0], [0], "inOutCubic"), (T["orbit"][1], [100], "linear")]), "o": const(0), "m": 1, "nm": "draw"}
    orbit = ellipse(T2["cx"], T2["cy"], T2["orbitR"], stroke=COLORS["orbit"], sw=T2["orbitStroke"], name="orbit")
    orbit["it"].insert(1, orbit_trim)
    add(layer("Tier 2 orbit", [orbit], T2["cx"], T2["cy"], parent=t2_null, rot=-90))
    mcolors = ["yellow", "grey", "blue", "pink", "purple", "green"]
    for i in range(6):
        ang = -math.pi / 2 + i * math.pi / 3
        cx, cy = T2["cx"] + math.cos(ang) * T2["orbitR"], T2["cy"] + math.sin(ang) * T2["orbitR"]
        m0 = T["members"][0] + i * 0.12
        shapes = person(cx, cy, T2["memberR"]) + [ellipse(cx, cy, T2["memberR"] + T2["memberStroke"] / 2, stroke="#FFFFFF", sw=T2["memberStroke"], name="border"),
                                                  ellipse(cx, cy, T2["memberR"] + T2["memberStroke"] / 2, fill=COLORS[mcolors[i]], name="member")]
        add(layer(f"Tier 2 member {i+1}", shapes, cx, cy, scale_keys=pop_keys(m0, 0.4, 1.12), opacity_keys=fade_keys(m0, m0 + 0.12, ease="linear"), parent=t2_null))

    # reward dots: Tier 2 → Tier 1 (pause) → You
    a1, a2 = L["arrows"]
    D = L["dot"]
    for n, (w0, t1, t_you) in enumerate(waves):
        sx = T2["cx"] - T2["orbitR"] - T2["memberR"]
        tx = T1["cx"] + T1["gap"] + T1["r"]
        fx = T1["cx"] - T1["gap"] - T1["r"]
        ex = Y["cx"] + Y["r"] * 0.6
        t_leave1 = t1 + REWARD_PAUSE
        pos = kf([(w0, [sx, a2["y"], 0], "inOutSine"), (t1, [tx, a2["y"], 0], "linear"),
                  (t_leave1, [fx, a1["y"], 0], "inOutSine"), (t_you, [ex, a1["y"], 0], "linear")])
        pos["k"][1]["h"] = 1  # hold while "under" Tier 1 (position jumps at t_leave1)
        op = kf([(w0 - 0.01, [0], "linear"), (w0, [0], "linear"), (w0 + 0.08, [100], "linear"), (t1 - 0.01, [100], "linear"), (t1, [0], "linear"),
                 (t_leave1, [0], "linear"), (t_leave1 + 0.08, [100], "linear"), (t_leave1 + REWARD_LEG * 0.9, [100], "linear"), (t_you, [0], "linear")])
        shapes = [ellipse(0, 0, D["r"], fill=COLORS["green"], name="dot"), ellipse(0, 0, D["r"] + D["halo"], fill="#FFFFFF", name="halo")]
        lay = layer(f"Reward dot {n+1}", shapes, 0, 0, pos=pos)
        lay["ks"]["o"] = op
        add(lay)

    # Lottie draws the first layer in the list on top; the SVG widget appends later items on top → reverse.
    layers.reverse()
    # scene precomp with the global fade-out
    scene = {"id": "scene", "nm": "scene", "fr": FPS, "layers": layers}
    main = {"ddd": 0, "ind": 1, "ty": 0, "nm": "Scene", "refId": "scene", "sr": 1, "w": L["w"], "h": L["h"],
            "ks": {"a": const([0, 0, 0]), "p": const([0, 0, 0]), "s": const([100, 100, 100]), "r": const(0),
                   "o": kf([(0, [100], "linear"), (T["fadeOut"][0], [100], "inOutSine"), (T["fadeOut"][1], [0], "linear")])},
            "ao": 0, "ip": 0, "op": F(LOOP), "st": 0, "bm": 0}
    return {
        "v": "5.9.0", "fr": FPS, "ip": 0, "op": F(LOOP), "w": L["w"], "h": L["h"], "nm": f"tippo-referral-tiers-{variant}", "ddd": 0,
        "assets": [scene],
        "fonts": {"list": [
            {"fName": "NonBureau-SemiBold", "fFamily": "Non Bureau, Inter, system-ui, sans-serif", "fStyle": "SemiBold", "ascent": 75},
            {"fName": "NonBureau-Medium", "fFamily": "Non Bureau, Inter, system-ui, sans-serif", "fStyle": "Medium", "ascent": 75},
        ]},
        "layers": [main], "markers": [],
    }


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "..", "tippo-referral-tiers-animation", "lottie")
    os.makedirs(out, exist_ok=True)
    for v in ("desktop", "mobile"):
        p = os.path.join(out, f"tippo-referral-tiers-{v}.json")
        with open(p, "w") as f:
            json.dump(build(v), f, separators=(",", ":"))
        print(p, os.path.getsize(p), "bytes")
