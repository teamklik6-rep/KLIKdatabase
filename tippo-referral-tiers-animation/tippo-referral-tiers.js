/*!
 * Tippo — Referral tiers infographic animation (You → Tier 1 → Tier 2)
 * Source design: Figma "Tippo Website" → Home v2 Desktop 1920, node 734:18948 (874×210)
 *                mobile layout: Home — Mobile 390, "Referral — infographic … — mobile" (350×92)
 *
 * Usage:
 *   <div id="tiers"></div>
 *   <script src="tippo-referral-tiers.js"></script>
 *   <script>
 *     const anim = TippoReferralTiers.mount(document.getElementById('tiers'), {
 *       variant: 'auto',   // 'auto' | 'desktop' | 'mobile'  (auto: container width < 480 → mobile)
 *       loop: true,
 *       autoplay: true,
 *       bg: '#FFFFFF',     // page background behind the graphic (used for the reward-dot halo)
 *     });
 *     // anim.play() / anim.pause() / anim.restart() / anim.seek(seconds) / anim.destroy()
 *   </script>
 *
 * Loop: 7.0 s. Respects prefers-reduced-motion (shows the final static frame).
 * No dependencies. SVG + requestAnimationFrame; every frame is a pure function of time (seek-able).
 */
(function (global) {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var LOOP = 7.0;

  var COLORS = {
    ink: '#020408',
    muted: '#8C8F93',
    orbit: '#D6DAD7',
    youTop: '#9BF0A5',
    youBottom: '#3FB437',
    green: '#47BE3F',
    yellow: '#F2B84B',
    blue: '#6F9BEB',
    grey: '#717171',
    pink: '#E573A5',
    purple: '#9B7BF0'
  };

  // ---------------------------------------------------------------------------
  // Layouts (all coordinates in the SVG viewBox of each variant)
  // ---------------------------------------------------------------------------
  function ringMembers(cx, cy, orbitR, memberR) {
    // 6 members, first at the top, clockwise (matches the Figma order 1..6)
    var colors = [COLORS.yellow, COLORS.grey, COLORS.blue, COLORS.pink, COLORS.purple, COLORS.green];
    var out = [];
    for (var i = 0; i < 6; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 3;
      out.push({ cx: cx + Math.cos(a) * orbitR, cy: cy + Math.sin(a) * orbitR, r: memberR, color: colors[i] });
    }
    return out;
  }

  var LAYOUTS = {
    desktop: {
      w: 874, h: 210,
      you: { cx: 104.74, cy: 76.89, r: 46.27, stroke: 1.84, ringScale: 1.46 },
      tier1: {
        cx: 416, cy: 75.61, r: 26.06, gap: 33.88, stroke: 3.9,
        colors: [COLORS.yellow, COLORS.blue, COLORS.green]
      },
      tier2: { cx: 727.26, cy: 75.84, orbitR: 39.96, orbitStroke: 1.31, memberR: 15.77, memberStroke: 2.1 },
      arrows: [
        { x1: 190.96, x2: 329.77, y: 76.55, head: 10.5, labelX: 260.37, labelY: 53 },
        { x1: 502.22, x2: 641.03, y: 76.55, head: 10.5, labelX: 571.63, labelY: 53 }
      ],
      arrowStroke: 2.1,
      labels: { y: 174, size: 18.93, xs: [104.74, 416, 727.26], texts: ['You', 'Tier 1', 'Tier 2'] },
      inviteSize: 12.6,
      dot: { r: 5, halo: 2 },
      shadows: true
    },
    mobile: {
      w: 350, h: 92,
      you: { cx: 36, cy: 32, r: 28, stroke: 1.2, ringScale: 1.25 }, // smaller ring: keeps inside the 350px frame
      tier1: {
        cx: 173, cy: 32, r: 16.16, gap: 21, stroke: 2.4,
        colors: [COLORS.yellow, COLORS.blue, COLORS.green]
      },
      tier2: { cx: 312, cy: 32, orbitR: 22.4, orbitStroke: 0.8, memberR: 8.83, memberStroke: 1.2 },
      arrows: [
        { x1: 76.5, x2: 126.5, y: 32, head: 6, labelX: 101.5, labelY: 20 },
        { x1: 219.5, x2: 269.5, y: 32, head: 6, labelX: 244.5, labelY: 20 }
      ],
      arrowStroke: 1.5,
      labels: { y: 86, size: 14, xs: [36, 173, 312], texts: ['You', 'Tier 1', 'Tier 2'] },
      inviteSize: 9,
      dot: { r: 3.5, halo: 1.5 },
      shadows: true
    }
  };

  // ---------------------------------------------------------------------------
  // Timeline (seconds)
  // ---------------------------------------------------------------------------
  var T = {
    youPop: [0.0, 0.5],
    youLabel: [0.3, 0.7],
    arrow1: [0.5, 1.05],
    invite1: [0.75, 1.1],
    tier1: [1.05, 1.75],      // 3 avatars, stagger 0.17
    tier1Label: [1.45, 1.85],
    arrow2: [1.8, 2.35],
    invite2: [2.05, 2.4],
    orbit: [2.35, 2.95],
    members: [2.55, 3.45],    // 6 members, stagger 0.12
    tier2Label: [3.05, 3.45],
    rewards: [3.7, 4.75],     // two reward waves: start at 3.7 and 4.75
    fadeOut: [6.45, 6.95]
  };
  var REWARD_LEG = 0.5;       // seconds per arrow leg
  var REWARD_PAUSE = 0.16;    // pause "under" Tier 1

  // ---------------------------------------------------------------------------
  // Easing / helpers
  // ---------------------------------------------------------------------------
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function outCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function inOutSine(t) { return -(Math.cos(Math.PI * t) - 1) / 2; }
  function inOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function seg(t, a, b, fn) { var u = clamp01((t - a) / (b - a)); return fn ? fn(u) : u; }
  // pop: 0 → overshoot → 1
  function pop(u, over) {
    over = over || 1.08;
    if (u <= 0) return 0;
    if (u >= 1) return 1;
    if (u < 0.65) return over * outCubic(u / 0.65);
    return over + (1 - over) * inOutSine((u - 0.65) / 0.35);
  }
  // bump: 1 → peak → 1 (symmetric-ish, fast up / slow down)
  function bump(u, peak, up) {
    up = up || 0.3;
    if (u <= 0 || u >= 1) return 1;
    if (u < up) return 1 + (peak - 1) * outCubic(u / up);
    return 1 + (peak - 1) * (1 - inOutSine((u - up) / (1 - up)));
  }

  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    if (attrs) for (var k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function tScale(cx, cy, s) {
    return 'translate(' + cx + ' ' + cy + ') scale(' + s + ') translate(' + (-cx) + ' ' + (-cy) + ')';
  }

  // Person silhouette (head + shoulders), proportions from the Figma "Avatar" vectors
  function person(parent, cx, cy, R, fill) {
    var g = el('g', { fill: fill || '#fff' }, parent);
    var hr = R * 0.25, hcy = cy - R * 0.21;
    el('circle', { cx: cx, cy: hcy, r: hr }, g);
    var hw = R * 0.46, top = cy + R * 0.1, bot = cy + R * 0.47;
    var d = 'M ' + (cx - hw) + ' ' + bot +
      ' C ' + (cx - hw * 0.92) + ' ' + (top + (bot - top) * 0.35) + ' ' + (cx - hw * 0.5) + ' ' + top + ' ' + cx + ' ' + top +
      ' C ' + (cx + hw * 0.5) + ' ' + top + ' ' + (cx + hw * 0.92) + ' ' + (top + (bot - top) * 0.35) + ' ' + (cx + hw) + ' ' + bot + ' Z';
    el('path', { d: d }, g);
    return g;
  }

  // ---------------------------------------------------------------------------
  // Scene builder
  // ---------------------------------------------------------------------------
  function buildScene(L, uid, opts) {
    var svg = el('svg', {
      viewBox: '0 0 ' + L.w + ' ' + L.h, width: '100%', height: '100%',
      role: 'img', 'aria-label': 'Referral tiers: you invite Tier 1, Tier 1 invites Tier 2',
      style: 'display:block;overflow:visible'
    });
    var defs = el('defs', null, svg);
    var grad = el('linearGradient', { id: uid + '-you', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el('stop', { offset: '0', 'stop-color': COLORS.youTop }, grad);
    el('stop', { offset: '1', 'stop-color': COLORS.youBottom }, grad);
    function shadow(id, dy, blur, a) {
      var f = el('filter', { id: id, x: '-60%', y: '-60%', width: '220%', height: '260%', 'color-interpolation-filters': 'sRGB' }, defs);
      el('feDropShadow', { dx: 0, dy: dy, stdDeviation: blur / 2, 'flood-color': COLORS.ink, 'flood-opacity': a }, f);
      return 'url(#' + id + ')';
    }
    var k = L.w / 874; // shadow scale relative to desktop
    var fYou = L.shadows ? shadow(uid + '-s1', 12.9 * k, 29.4 * k, 0.18) : null;
    var fT1 = L.shadows ? shadow(uid + '-s2', 7.8 * k, 18.2 * k, 0.10) : null;
    var fT2 = L.shadows ? shadow(uid + '-s3', 3.2 * k, 8.4 * k, 0.10) : null;

    var root = el('g', null, svg);
    var S = { svg: svg, root: root };

    // --- labels (bottom)
    S.labels = L.labels.xs.map(function (x, i) {
      var tx = el('text', {
        x: x, y: L.labels.y, 'text-anchor': 'middle', fill: COLORS.ink,
        'font-size': L.labels.size, 'font-weight': 600, 'letter-spacing': (-0.02 * L.labels.size)
      }, root);
      tx.appendChild(document.createTextNode(L.labels.texts[i]));
      return tx;
    });

    // --- arrows + INVITES
    S.arrows = L.arrows.map(function (a) {
      var g = el('g', null, root);
      var len = a.x2 - a.x1;
      var line = el('path', {
        d: 'M ' + a.x1 + ' ' + a.y + ' L ' + a.x2 + ' ' + a.y, fill: 'none', stroke: COLORS.ink,
        'stroke-width': L.arrowStroke, 'stroke-linecap': 'round', 'stroke-dasharray': len, 'stroke-dashoffset': len
      }, g);
      var head = el('path', {
        d: 'M ' + (a.x2 - a.head) + ' ' + (a.y - a.head * 0.8) + ' L ' + a.x2 + ' ' + a.y + ' L ' + (a.x2 - a.head) + ' ' + (a.y + a.head * 0.8),
        fill: 'none', stroke: COLORS.ink, 'stroke-width': L.arrowStroke, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
      }, g);
      var label = el('text', {
        x: a.labelX, y: a.labelY, 'text-anchor': 'middle', fill: COLORS.muted,
        'font-size': L.inviteSize, 'font-weight': 500, 'letter-spacing': (0.04 * L.inviteSize)
      }, g);
      label.appendChild(document.createTextNode('INVITES'));
      return { g: g, line: line, head: head, label: label, len: len, a: a };
    });

    // --- You
    var Y = L.you;
    S.youRing = el('circle', { cx: Y.cx, cy: Y.cy, r: Y.r, fill: 'none', stroke: COLORS.green, 'stroke-width': Y.stroke * 1.2, opacity: 0 }, root);
    S.you = el('g', { filter: fYou }, root);
    el('circle', { cx: Y.cx, cy: Y.cy, r: Y.r, fill: 'url(#' + uid + '-you)' }, S.you);
    el('circle', { cx: Y.cx, cy: Y.cy, r: Y.r - Y.stroke / 2, fill: 'none', stroke: '#fff', 'stroke-opacity': 0.7, 'stroke-width': Y.stroke }, S.you);
    person(S.you, Y.cx, Y.cy, Y.r);

    // --- Tier 1 (3 overlapping avatars)
    var T1 = L.tier1;
    S.tier1 = el('g', null, root);
    S.tier1Items = T1.colors.map(function (c, i) {
      var cx = T1.cx + (i - 1) * T1.gap;
      var g = el('g', { filter: fT1 }, S.tier1);
      el('circle', { cx: cx, cy: T1.cy, r: T1.r + T1.stroke / 2, fill: c, stroke: '#fff', 'stroke-width': T1.stroke }, g);
      person(g, cx, T1.cy, T1.r);
      return { g: g, cx: cx, cy: T1.cy };
    });

    // --- Tier 2 (orbit + 6 members)
    var T2 = L.tier2;
    S.tier2 = el('g', null, root);
    var circ = 2 * Math.PI * T2.orbitR;
    S.orbit = el('circle', {
      cx: T2.cx, cy: T2.cy, r: T2.orbitR, fill: 'none', stroke: COLORS.orbit, 'stroke-width': T2.orbitStroke,
      'stroke-dasharray': circ, 'stroke-dashoffset': circ, transform: 'rotate(-90 ' + T2.cx + ' ' + T2.cy + ')'
    }, S.tier2);
    S.orbitLen = circ;
    S.members = ringMembers(T2.cx, T2.cy, T2.orbitR, T2.memberR).map(function (m) {
      var g = el('g', { filter: fT2 }, S.tier2);
      el('circle', { cx: m.cx, cy: m.cy, r: m.r + T2.memberStroke / 2, fill: m.color, stroke: '#fff', 'stroke-width': T2.memberStroke }, g);
      person(g, m.cx, m.cy, m.r);
      return { g: g, cx: m.cx, cy: m.cy };
    });

    // --- reward dots (drawn above everything)
    S.dots = [0, 1].map(function () {
      var g = el('g', { opacity: 0 }, root);
      el('circle', { r: L.dot.r + L.dot.halo, fill: opts.bg || '#fff' }, g);
      el('circle', { r: L.dot.r, fill: COLORS.green }, g);
      return g;
    });

    return S;
  }

  // ---------------------------------------------------------------------------
  // Frame renderer: state = f(t)
  // ---------------------------------------------------------------------------
  function render(S, L, t) {
    var i;
    // global fade-out at the end of the loop
    var fade = 1 - seg(t, T.fadeOut[0], T.fadeOut[1], inOutSine);
    S.root.setAttribute('opacity', fade);

    // You
    var youPop = pop(seg(t, T.youPop[0], T.youPop[1]), 1.06);
    var youBreath = 1;
    var ringS = 1, ringO = 0;
    // Tier 1 pulse / You breath driven by reward waves
    var t1Pulse = 1;
    for (i = 0; i < 2; i++) {
      var w0 = T.rewards[i];
      var tArrive1 = w0 + REWARD_LEG;                        // dot reaches Tier 1
      var tArriveYou = tArrive1 + REWARD_PAUSE + REWARD_LEG;  // dot reaches You
      t1Pulse *= bump(seg(t, tArrive1 - 0.05, tArrive1 + 0.55), 1.065, 0.25);
      youBreath *= bump(seg(t, tArriveYou - 0.1, tArriveYou + 0.9), 1.045, 0.3);
      var ru = seg(t, tArriveYou - 0.02, tArriveYou + 1.0);
      if (ru > 0 && ru < 1) { ringS = 1 + (L.you.ringScale - 1) * outCubic(ru); ringO = 0.62 * (1 - ru); }
    }
    S.you.setAttribute('transform', tScale(L.you.cx, L.you.cy, youPop * youBreath));
    S.you.setAttribute('opacity', seg(t, T.youPop[0], T.youPop[0] + 0.2));
    S.youRing.setAttribute('transform', tScale(L.you.cx, L.you.cy, ringS));
    S.youRing.setAttribute('opacity', ringO);

    // labels
    var labelT = [T.youLabel, T.tier1Label, T.tier2Label];
    for (i = 0; i < 3; i++) {
      var u = seg(t, labelT[i][0], labelT[i][1], outCubic);
      S.labels[i].setAttribute('opacity', u);
      S.labels[i].setAttribute('transform', 'translate(0 ' + ((1 - u) * 6 * (L.w / 874 + 0.4)) + ')');
    }

    // arrows
    var arrowT = [T.arrow1, T.arrow2], inviteT = [T.invite1, T.invite2];
    for (i = 0; i < 2; i++) {
      var A = S.arrows[i];
      var p = seg(t, arrowT[i][0], arrowT[i][1], inOutCubic);
      A.line.setAttribute('stroke-dashoffset', A.len * (1 - p));
      A.line.setAttribute('opacity', p > 0 ? 1 : 0); // round caps would show a dot at the undrawn end
      var hp = seg(t, arrowT[i][1] - 0.12, arrowT[i][1] + 0.08, outCubic);
      A.head.setAttribute('opacity', hp);
      A.head.setAttribute('transform', tScale(A.a.x2, A.a.y, 0.4 + 0.6 * hp));
      var lu = seg(t, inviteT[i][0], inviteT[i][1], outCubic);
      A.label.setAttribute('opacity', lu);
      A.label.setAttribute('transform', 'translate(0 ' + ((1 - lu) * 4) + ')');
    }

    // Tier 1
    S.tier1.setAttribute('transform', tScale(L.tier1.cx, L.tier1.cy, t1Pulse));
    for (i = 0; i < 3; i++) {
      var s0 = T.tier1[0] + i * 0.17;
      var su = pop(seg(t, s0, s0 + 0.42), 1.1);
      var it = S.tier1Items[i];
      it.g.setAttribute('transform', tScale(it.cx, it.cy, su));
      it.g.setAttribute('opacity', seg(t, s0, s0 + 0.15));
    }

    // Tier 2
    var ou = seg(t, T.orbit[0], T.orbit[1], inOutCubic);
    S.orbit.setAttribute('stroke-dashoffset', S.orbitLen * (1 - ou));
    for (i = 0; i < 6; i++) {
      var m0 = T.members[0] + i * 0.12;
      var mu = pop(seg(t, m0, m0 + 0.4), 1.12);
      var mm = S.members[i];
      mm.g.setAttribute('transform', tScale(mm.cx, mm.cy, mu));
      mm.g.setAttribute('opacity', seg(t, m0, m0 + 0.12));
    }
    // Tier 2 "push" when a reward leaves (start of each wave)
    var t2Push = 1;
    for (i = 0; i < 2; i++) t2Push *= bump(seg(t, T.rewards[i], T.rewards[i] + 0.43), 1.07, 0.26);
    S.tier2.setAttribute('transform', tScale(L.tier2.cx, L.tier2.cy, t2Push));

    // reward dots: Tier 2 → (arrow 2, right→left) → Tier 1 → pause → (arrow 1) → You
    for (i = 0; i < 2; i++) {
      var d = S.dots[i];
      var tw = t - T.rewards[i];
      var total = REWARD_LEG * 2 + REWARD_PAUSE;
      if (tw <= 0 || tw >= total) { d.setAttribute('opacity', 0); continue; }
      var x, y, op = 1;
      var a2 = L.arrows[1], a1 = L.arrows[0];
      if (tw < REWARD_LEG) {
        var q = inOutSine(tw / REWARD_LEG);
        var sx = L.tier2.cx - L.tier2.orbitR - L.tier2.memberR; // leaves from the ring's left edge
        var tx = L.tier1.cx + L.tier1.gap + L.tier1.r;          // lands on Tier 1's right edge
        x = sx + (tx - sx) * q;
        y = a2.y;
        op = Math.min(1, tw / 0.08);
      } else if (tw < REWARD_LEG + REWARD_PAUSE) {
        x = L.tier1.cx; y = a2.y; op = 0; // "under" Tier 1
      } else {
        var q2 = inOutSine((tw - REWARD_LEG - REWARD_PAUSE) / REWARD_LEG);
        var fx = L.tier1.cx - L.tier1.gap - L.tier1.r;
        var ex = L.you.cx + L.you.r * 0.6;
        x = fx + (ex - fx) * q2; y = a1.y;
        op = q2 > 0.9 ? (1 - q2) / 0.1 : Math.min(1, (tw - REWARD_LEG - REWARD_PAUSE) / 0.08);
      }
      d.setAttribute('opacity', op);
      d.setAttribute('transform', 'translate(' + x + ' ' + y + ')');
    }
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------
  var uidCounter = 0;

  function mount(container, options) {
    var opts = Object.assign({ variant: 'auto', loop: true, autoplay: true, bg: '#FFFFFF', speed: 1 }, options || {});
    var uid = 'trt' + (++uidCounter);
    var reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var state = { variant: null, S: null, L: null, playing: false, t: 0, raf: 0, last: 0 };
    container.style.fontFamily = container.style.fontFamily || '"Non Bureau", Inter, system-ui, sans-serif';

    function pickVariant() {
      if (opts.variant === 'desktop' || opts.variant === 'mobile') return opts.variant;
      var w = container.clientWidth || (container.getBoundingClientRect && container.getBoundingClientRect().width) || 874;
      return w < 480 ? 'mobile' : 'desktop';
    }

    function build(variant) {
      if (state.S) container.removeChild(state.S.svg);
      state.variant = variant;
      state.L = LAYOUTS[variant];
      state.S = buildScene(state.L, uid + variant, opts);
      container.appendChild(state.S.svg);
      // keep aspect ratio via the container
      container.style.aspectRatio = state.L.w + ' / ' + state.L.h;
      render(state.S, state.L, reduce ? 6.2 : state.t);
    }

    function frame(now) {
      if (!state.playing) return;
      var dt = Math.min(0.1, (now - state.last) / 1000) * opts.speed;
      state.last = now;
      state.t += dt;
      if (state.t >= LOOP) {
        if (opts.loop) state.t -= LOOP; else { state.t = LOOP - 0.001; state.playing = false; }
      }
      render(state.S, state.L, state.t);
      if (state.playing) state.raf = requestAnimationFrame(frame);
    }

    var api = {
      play: function () {
        if (reduce || state.playing) return api;
        state.playing = true; state.last = performance.now();
        state.raf = requestAnimationFrame(frame);
        return api;
      },
      pause: function () { state.playing = false; cancelAnimationFrame(state.raf); return api; },
      restart: function () { state.t = 0; render(state.S, state.L, 0); return api.play(); },
      seek: function (seconds) { state.t = Math.max(0, Math.min(LOOP - 0.001, seconds)); render(state.S, state.L, state.t); return api; },
      get time() { return state.t; },
      get duration() { return LOOP; },
      get variant() { return state.variant; },
      setVariant: function (v) { opts.variant = v; build(pickVariant()); return api; },
      destroy: function () { api.pause(); if (ro) ro.disconnect(); if (state.S) container.removeChild(state.S.svg); state.S = null; }
    };

    var ro = null;
    if (opts.variant === 'auto' && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(function () { var v = pickVariant(); if (v !== state.variant) build(v); });
      ro.observe(container);
    }

    build(pickVariant());
    if (opts.autoplay) api.play();
    return api;
  }

  global.TippoReferralTiers = { mount: mount, LAYOUTS: LAYOUTS, TIMELINE: T, LOOP: LOOP, COLORS: COLORS };
})(typeof window !== 'undefined' ? window : this);
