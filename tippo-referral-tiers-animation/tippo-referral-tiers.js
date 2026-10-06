/*!
 * Tippo — Referral tiers infographic (You → Tier 1 → Tier 2): invite-dots animation
 * Source design: Figma "Tippo Website" → Home v2 Desktop 1920, node 734:18948 (874×210)
 *                mobile: Home — Mobile 390, "Referral — infographic … — mobile" (350×108, horizontal)
 *
 * The scene itself is static (identical to the Figma illustration). The only motion is the dots:
 * they travel along the arrows, in the arrows' direction — You → Tier 1 → Tier 2, left to right.
 *
 * Usage:
 *   <div id="tiers"></div>
 *   <script src="tippo-referral-tiers.js"></script>
 *   <script>
 *     const anim = TippoReferralTiers.mount(document.getElementById('tiers'), {
 *       variant: 'auto',   // 'auto' | 'desktop' | 'mobile'  (auto: container width < 480 → mobile)
 *       autoplay: true,
 *       bg: '#FFFFFF',     // page background behind the graphic (halo around the dots)
 *     });
 *     // anim.play() / anim.pause() / anim.seek(seconds) / anim.destroy()
 *   </script>
 *
 * Loop: 6.0 s (seamless). Respects prefers-reduced-motion (static scene, no dots).
 * No dependencies. SVG + requestAnimationFrame; every frame is a pure function of time (seek-able).
 */
(function (global) {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

  var COLORS = {
    ink: '#020408', muted: '#8C8F93', orbit: '#D6DAD7',
    youTop: '#9BF0A5', youBottom: '#3FB437', green: '#47BE3F',
    yellow: '#F2B84B', blue: '#6F9BEB', grey: '#717171', pink: '#E573A5', purple: '#9B7BF0'
  };

  // ---------------------------------------------------------------------------
  // Dot flow timing (same on every breakpoint)
  // ---------------------------------------------------------------------------
  var FLOW = {
    loop: 6.0,     // seconds, seamless
    every: 1.5,    // one dot from You and one from Tier 1 per 1.5 s
    leg1: 1.1,     // along arrow 1: You → Tier 1
    pause: 0.2,    // hidden "under" Tier 1
    leg2: 1.2,     // along arrow 2: Tier 1 → Tier 2
    tier1Offset: 0.75, // Tier 1 dots start half a period after the You dots
    fadeIn: 0.1,
    fadeOut: 0.15  // last 15 % of a leg that ends at an arrowhead
  };
  var N_DOTS = Math.round(FLOW.loop / FLOW.every); // 4 of each kind per loop

  // ---------------------------------------------------------------------------
  // Layouts (SVG viewBox coordinates)
  // ---------------------------------------------------------------------------
  var LAYOUTS = {
    desktop: {
      w: 874, h: 210,
      you: { cx: 104.74, cy: 76.89, r: 46.27, stroke: 1.84 },
      tier1: { cx: 416, cy: 75.61, r: 26.06, gap: 33.88, stroke: 3.9, colors: [COLORS.yellow, COLORS.blue, COLORS.green] },
      tier2: { cx: 727.26, cy: 75.84, orbitR: 39.96, orbitStroke: 1.31, memberR: 15.77, memberStroke: 2.1 },
      arrows: [
        { x1: 190.96, y1: 76.55, x2: 329.77, y2: 76.55, head: 10.5, labelX: 260.37, labelY: 53 },
        { x1: 502.22, y1: 76.55, x2: 641.03, y2: 76.55, head: 10.5, labelX: 571.63, labelY: 53 }
      ],
      arrowStroke: 2.1,
      labels: { size: 18.93, items: [{ t: 'You', x: 104.74, y: 174 }, { t: 'Tier 1', x: 416, y: 174 }, { t: 'Tier 2', x: 727.26, y: 174 }] },
      inviteSize: 12.6,
      dots: { r: 4, halo: 2 },
      shadowScale: 1
    },
    mobile: { // horizontal, elements at ~0.7× desktop size, arrows 43.5 px
      w: 350, h: 108,
      you: { cx: 32, cy: 42, r: 32, stroke: 1.27 },
      tier1: { cx: 165, cy: 42, r: 18, gap: 23.4, stroke: 2.7, colors: [COLORS.yellow, COLORS.blue, COLORS.green] },
      tier2: { cx: 308, cy: 42, orbitR: 28, orbitStroke: 0.92, memberR: 11, memberStroke: 1.47 },
      arrows: [
        { x1: 72, y1: 42, x2: 115.5, y2: 42, head: 6, labelX: 93.75, labelY: 31 },
        { x1: 214.5, y1: 42, x2: 258, y2: 42, head: 6, labelX: 236.25, labelY: 31 }
      ],
      arrowStroke: 1.5,
      labels: { size: 14, items: [{ t: 'You', x: 32, y: 104 }, { t: 'Tier 1', x: 165, y: 104 }, { t: 'Tier 2', x: 308, y: 104 }] },
      inviteSize: 9,
      dots: { r: 3.5, halo: 1.5 },
      shadowScale: 0.7
    }
  };

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    if (attrs) for (var k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function lerp(a, b, p) { return [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p]; }
  // Dots run along the arrow lines only, from each arrow's start to its head (the arrows' own direction).
  function flowPoints(L) {
    var a1 = L.arrows[0], a2 = L.arrows[1];
    return { a1Start: [a1.x1, a1.y1], a1End: [a1.x2, a1.y2], a2Start: [a2.x1, a2.y1], a2End: [a2.x2, a2.y2] };
  }

  // Person silhouette (head + shoulders), proportions from the Figma "Avatar" vectors
  function person(parent, cx, cy, R) {
    var g = el('g', { fill: '#fff' }, parent);
    el('circle', { cx: cx, cy: cy - R * 0.21, r: R * 0.25 }, g);
    var hw = R * 0.46, top = cy + R * 0.1, bot = cy + R * 0.47;
    el('path', {
      d: 'M ' + (cx - hw) + ' ' + bot +
        ' C ' + (cx - hw * 0.92) + ' ' + (top + (bot - top) * 0.35) + ' ' + (cx - hw * 0.5) + ' ' + top + ' ' + cx + ' ' + top +
        ' C ' + (cx + hw * 0.5) + ' ' + top + ' ' + (cx + hw * 0.92) + ' ' + (top + (bot - top) * 0.35) + ' ' + (cx + hw) + ' ' + bot + ' Z'
    }, g);
    return g;
  }

  function ringMembers(cx, cy, orbitR, memberR) {
    var colors = [COLORS.yellow, COLORS.grey, COLORS.blue, COLORS.pink, COLORS.purple, COLORS.green];
    var out = [];
    for (var i = 0; i < 6; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 3;
      out.push({ cx: cx + Math.cos(a) * orbitR, cy: cy + Math.sin(a) * orbitR, r: memberR, color: colors[i] });
    }
    return out;
  }

  // ---------------------------------------------------------------------------
  // Static scene
  // ---------------------------------------------------------------------------
  function buildScene(L, uid, opts) {
    var svg = el('svg', {
      viewBox: '0 0 ' + L.w + ' ' + L.h, width: '100%', height: '100%', role: 'img',
      'aria-label': 'Referral tiers: you invite Tier 1, Tier 1 invites Tier 2',
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
    var k = L.shadowScale;
    var fYou = shadow(uid + '-s1', 12.9 * k, 29.4 * k, 0.18);
    var fT1 = shadow(uid + '-s2', 7.8 * k, 18.2 * k, 0.10);
    var fT2 = shadow(uid + '-s3', 3.2 * k, 8.4 * k, 0.10);

    var S = { svg: svg };
    var root = el('g', null, svg);

    // labels
    L.labels.items.forEach(function (it) {
      el('text', { x: it.x, y: it.y, 'text-anchor': 'middle', fill: COLORS.ink, 'font-size': L.labels.size, 'font-weight': 600, 'letter-spacing': -0.02 * L.labels.size }, root)
        .appendChild(document.createTextNode(it.t));
    });

    // arrows + INVITES
    L.arrows.forEach(function (a) {
      var dx = a.x2 - a.x1, dy = a.y2 - a.y1, len = Math.sqrt(dx * dx + dy * dy), ux = dx / len, uy = dy / len;
      var px = -uy, py = ux;
      var bx = a.x2 - ux * a.head, by = a.y2 - uy * a.head, hw = a.head * 0.8;
      el('path', { d: 'M ' + a.x1 + ' ' + a.y1 + ' L ' + a.x2 + ' ' + a.y2, fill: 'none', stroke: COLORS.ink, 'stroke-width': L.arrowStroke, 'stroke-linecap': 'round' }, root);
      el('path', {
        d: 'M ' + (bx + px * hw) + ' ' + (by + py * hw) + ' L ' + a.x2 + ' ' + a.y2 + ' L ' + (bx - px * hw) + ' ' + (by - py * hw),
        fill: 'none', stroke: COLORS.ink, 'stroke-width': L.arrowStroke, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
      }, root);
      el('text', { x: a.labelX, y: a.labelY, 'text-anchor': 'middle', fill: COLORS.muted, 'font-size': L.inviteSize, 'font-weight': 500, 'letter-spacing': 0.04 * L.inviteSize }, root)
        .appendChild(document.createTextNode('INVITES'));
    });

    // dots: above the arrow lines, below the nodes
    function dot(r) {
      var g = el('g', { opacity: 0 }, root);
      el('circle', { r: r + L.dots.halo, fill: opts.bg || '#fff' }, g);
      el('circle', { r: r, fill: COLORS.green }, g);
      return g;
    }
    S.fromYou = []; S.fromTier1 = [];
    for (var i = 0; i < N_DOTS; i++) { S.fromYou.push(dot(L.dots.r)); S.fromTier1.push(dot(L.dots.r)); }

    // You
    var Y = L.you;
    var gy = el('g', { filter: fYou }, root);
    el('circle', { cx: Y.cx, cy: Y.cy, r: Y.r, fill: 'url(#' + uid + '-you)' }, gy);
    el('circle', { cx: Y.cx, cy: Y.cy, r: Y.r - Y.stroke / 2, fill: 'none', stroke: '#fff', 'stroke-opacity': 0.7, 'stroke-width': Y.stroke }, gy);
    person(gy, Y.cx, Y.cy, Y.r);

    // Tier 1 (3 overlapping avatars)
    var T1 = L.tier1;
    T1.colors.forEach(function (c, i) {
      var cx = T1.cx + (i - 1) * T1.gap;
      var g = el('g', { filter: fT1 }, root);
      el('circle', { cx: cx, cy: T1.cy, r: T1.r + T1.stroke / 2, fill: c, stroke: '#fff', 'stroke-width': T1.stroke }, g);
      person(g, cx, T1.cy, T1.r);
    });

    // Tier 2 (orbit + 6 members)
    var T2 = L.tier2;
    el('circle', { cx: T2.cx, cy: T2.cy, r: T2.orbitR, fill: 'none', stroke: COLORS.orbit, 'stroke-width': T2.orbitStroke }, root);
    ringMembers(T2.cx, T2.cy, T2.orbitR, T2.memberR).forEach(function (m) {
      var g = el('g', { filter: fT2 }, root);
      el('circle', { cx: m.cx, cy: m.cy, r: m.r + T2.memberStroke / 2, fill: m.color, stroke: '#fff', 'stroke-width': T2.memberStroke }, g);
      person(g, m.cx, m.cy, m.r);
    });

    return S;
  }

  // ---------------------------------------------------------------------------
  // Frame: only the dots move. state = f(t), seamless over FLOW.loop
  // ---------------------------------------------------------------------------
  function place(g, pos, op) {
    g.setAttribute('transform', 'translate(' + pos[0] + ' ' + pos[1] + ')');
    g.setAttribute('opacity', Math.max(0, Math.min(1, op)));
  }
  function hide(g) { g.setAttribute('opacity', 0); }

  function render(S, L, t) {
    var F = flowPoints(L), i, age, p;
    for (i = 0; i < N_DOTS; i++) {
      // dot from You: arrow 1 → hidden under Tier 1 → arrow 2
      age = ((t - i * FLOW.every) % FLOW.loop + FLOW.loop) % FLOW.loop;
      if (age < FLOW.leg1) {
        place(S.fromYou[i], lerp(F.a1Start, F.a1End, age / FLOW.leg1), age / FLOW.fadeIn);
      } else if (age < FLOW.leg1 + FLOW.pause) {
        hide(S.fromYou[i]);
      } else if (age < FLOW.leg1 + FLOW.pause + FLOW.leg2) {
        p = (age - FLOW.leg1 - FLOW.pause) / FLOW.leg2;
        place(S.fromYou[i], lerp(F.a2Start, F.a2End, p), Math.min((age - FLOW.leg1 - FLOW.pause) / FLOW.fadeIn, (1 - p) / FLOW.fadeOut));
      } else hide(S.fromYou[i]);

      // dot from Tier 1: arrow 2 only
      age = ((t - i * FLOW.every - FLOW.tier1Offset) % FLOW.loop + FLOW.loop) % FLOW.loop;
      if (age < FLOW.leg2) {
        p = age / FLOW.leg2;
        place(S.fromTier1[i], lerp(F.a2Start, F.a2End, p), Math.min(age / FLOW.fadeIn, (1 - p) / FLOW.fadeOut));
      } else hide(S.fromTier1[i]);
    }
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------
  var uidCounter = 0;

  function mount(container, options) {
    var opts = Object.assign({ variant: 'auto', autoplay: true, bg: '#FFFFFF', speed: 1 }, options || {});
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
      container.style.aspectRatio = state.L.w + ' / ' + state.L.h;
      if (!reduce) render(state.S, state.L, state.t);
    }
    function frame(now) {
      if (!state.playing) return;
      state.t = (state.t + Math.min(0.1, (now - state.last) / 1000) * opts.speed) % FLOW.loop;
      state.last = now;
      render(state.S, state.L, state.t);
      state.raf = requestAnimationFrame(frame);
    }

    var api = {
      play: function () { if (reduce || state.playing) return api; state.playing = true; state.last = performance.now(); state.raf = requestAnimationFrame(frame); return api; },
      pause: function () { state.playing = false; cancelAnimationFrame(state.raf); return api; },
      restart: function () { state.t = 0; return api.play(); },
      seek: function (s) { state.t = ((s % FLOW.loop) + FLOW.loop) % FLOW.loop; render(state.S, state.L, state.t); return api; },
      get time() { return state.t; },
      get duration() { return FLOW.loop; },
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

  global.TippoReferralTiers = { mount: mount, LAYOUTS: LAYOUTS, FLOW: FLOW, COLORS: COLORS };
})(typeof window !== 'undefined' ? window : this);
