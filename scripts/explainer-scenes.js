/* Scene painter for the original explainers. Runs inside a headless browser page that
 * scripts/render-explainers.ts drives frame by frame: window.paint(t) draws time t (seconds).
 * Everything is plain SVG built from the explainer data, so the films are fully original. */
/* eslint-disable */
(function () {
  const W = 1280, H = 720;
  const C = { night: "#0a1220", deep: "#101b2e", ink: "#18243a", gold: "#c9a35a", gold2: "#e4c486", gold3: "#f0dcb0", ivory: "#f6efe2", muted: "#9aa4b5", ember: "#c56a2d", nile: "#2f6f8f", nile2: "#4f97b4", sand: "#d8b27a", red: "#a8573a", silt: "#2b2219" };
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const es = (p, a, b) => ease(seg(p, a, b));
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const serif = "'Fraunces Variable', Georgia, serif";
  const sans = "'Inter Variable', system-ui, sans-serif";
  const text = (x, y, s, o = {}) =>
    `<text x="${x}" y="${y}" font-family="${o.serif ? serif : sans}" font-size="${o.size || 22}" font-weight="${o.weight || 400}" fill="${o.fill || C.ivory}" opacity="${o.op ?? 1}" text-anchor="${o.anchor || "start"}" letter-spacing="${o.ls || 0}" ${o.italic ? 'font-style="italic"' : ""}>${esc(s)}</text>`;
  // Deterministic pseudo-random for decorative marks.
  function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

  const pyr = (cx, base, w, h, fill, op = 1) => `<path d="M${cx - w / 2} ${base} L${cx} ${base - h} L${cx + w / 2} ${base} Z" fill="${fill}" opacity="${op}"/>`;
  const pyrLit = (cx, base, w, h, op = 1) =>
    `<g opacity="${op}"><path d="M${cx - w / 2} ${base} L${cx} ${base - h} L${cx + w * 0.08} ${base} Z" fill="#b98c4f"/><path d="M${cx + w * 0.08} ${base} L${cx} ${base - h} L${cx + w / 2} ${base} Z" fill="#7a5a33"/></g>`;

  const seated = (x, base, s, fill) => `<g transform="translate(${x} ${base}) scale(${s})" fill="${fill}"><rect x="-28" y="-150" width="56" height="70" rx="10"/><circle cx="0" cy="-170" r="20"/><path d="M-26 -186 L26 -186 L18 -150 L-18 -150 Z"/><rect x="-36" y="-80" width="72" height="80"/></g>`;
  function motif(kind) {
    if (kind === "river")
      return `<path d="M0 560 C 300 540 520 600 760 575 C 980 552 1120 590 1280 570 L1280 720 L0 720 Z" fill="#2a1d14"/>
        <path d="M0 600 C 320 585 560 640 800 615 C 1000 596 1150 628 1280 612 L1280 660 C 1100 676 980 650 800 668 C 560 690 300 640 0 652 Z" fill="#3f6f86" opacity=".9"/>
        <path d="M640 612 L1160 612" stroke="#f6c97a" stroke-width="3" opacity=".5" stroke-dasharray="40 26"/>
        ${[1000, 1060, 1140].map((x, i) => `<g><path d="M${x} 590 q -6 -60 4 -110" stroke="#1b130d" stroke-width="7" fill="none"/>${[-50, -20, 15, 45].map((a) => `<path d="M${x + 4} 480 q ${a} ${-20 + Math.abs(a) / 3} ${a * 1.6} ${20}" stroke="#1b130d" stroke-width="6" fill="none"/>`).join("")}</g>`).join("")}`;
    if (kind === "temple")
      return `<path d="M520 560 L560 300 L1280 270 L1280 560 Z" fill="#7a5638"/>${[680, 820, 1000, 1140].map((x) => seated(x, 560, 1.35, "#a97b4c")).join("")}
        <rect x="886" y="430" width="48" height="130" fill="#1b130d"/><rect y="560" width="${W}" height="160" fill="#2a1d14"/>`;
    return `${pyrLit(760, 560, 380, 230)}${pyrLit(1040, 560, 300, 170)}${pyrLit(1210, 560, 150, 86)}<rect y="560" width="${W}" height="160" fill="#2a1d14"/>`;
  }

  const headline = (s, p, y = 150, size = 54) => text(96, y + (1 - es(p, 0, 0.12)) * 18, s, { serif: true, size, weight: 500, op: es(p, 0, 0.12) });

  const scenes = {
    title(p, d, c) {
      const sunY = 470 - es(p, 0, 0.9) * 150;
      return `
        <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.night}"/><stop offset=".62" stop-color="#3a2a2a"/><stop offset=".78" stop-color="#b5733d"/><stop offset="1" stop-color="#e2a35a"/></linearGradient>
        <radialGradient id="sun"><stop offset="0" stop-color="#fff3d6"/><stop offset=".35" stop-color="#f6c97a"/><stop offset="1" stop-color="#f6c97a" stop-opacity="0"/></radialGradient></defs>
        <rect width="${W}" height="${H}" fill="url(#sky)"/>
        <circle cx="900" cy="${sunY}" r="170" fill="url(#sun)" opacity=".9"/>
        <circle cx="900" cy="${sunY}" r="34" fill="#fff1cf"/>
        ${motif(d.motif || "pyramids")}
        
        ${d.bare ? "" : `${text(96, 150, d.kicker || "", { size: 16, weight: 600, fill: C.gold2, ls: 3, op: es(p, 0.02, 0.12) })}
        ${headline(c.headline, p, 245, 76)}
        ${text(98, 300, d.sub || "", { size: 24, fill: C.gold3, op: es(p, 0.08, 0.2), italic: true, serif: true })}`}`;
    },

    timeline(p, d) {
      const pts = d.points || [];
      const lineW = 1000 * es(p, 0.05, 0.35);
      let g = `<rect x="140" y="470" width="${lineW}" height="2" fill="${C.gold}"/>`;
      pts.forEach((pt, i) => {
        const x = 220 + i * 420, a = es(p, 0.12 + i * 0.22, 0.26 + i * 0.22);
        const base = 440, s = 0.55 + i * 0.25;
        let icon;
        if (i === 0) {
          icon = [0, 1, 2, 3, 4, 5].map((k) => `<rect x="${x - (110 - k * 16) * s}" y="${base - (k + 1) * 22 * s}" width="${(220 - k * 32) * s}" height="${22 * s}" fill="${k % 2 ? "#a9824c" : "#bf9759"}"/>`).join("");
        } else if (i === 1) icon = pyr(x, base, 260 * s, 120 * s, "#b9714d");
        else icon = pyrLit(x, base, 260 * s, 170 * s);
        g += `<g opacity="${a}" transform="translate(0 ${(1 - a) * 20})">${icon}
          <circle cx="${x}" cy="471" r="7" fill="${C.night}" stroke="${C.gold}" stroke-width="3"/>
          ${text(x, 520, pt.year, { anchor: "middle", size: 18, weight: 600, fill: C.gold2, ls: 1 })}
          ${text(x, 556, pt.label, { anchor: "middle", serif: true, size: 28 })}
          ${text(x, 586, pt.place, { anchor: "middle", size: 18, fill: C.muted })}</g>`;
      });
      return headline(arguments[2].headline, p) + g;
    },

    stats(p, d, c) {
      const st = d.stats || [];
      let g = "";
      st.forEach((s, i) => {
        const a = es(p, 0.08 + i * 0.16, 0.22 + i * 0.16);
        const isYear = !s.unit && s.value > 1000;
        const v = isYear ? s.value : s.value * es(p, 0.08 + i * 0.16, 0.4 + i * 0.16);
        const shown = isYear ? String(s.value) : s.value % 1 ? v.toFixed(1) : Math.round(v).toLocaleString("en");
        const x = 96 + i * 380;
        g += `<g opacity="${a}">
          <rect x="${x}" y="250" width="340" height="2" fill="${C.gold}" opacity=".7"/>
          ${text(x, 360, shown, { serif: true, size: 96, weight: 400, fill: C.gold3 })}
          ${text(x + 4, 400, s.unit, { size: 22, weight: 600, fill: C.gold2, ls: 1 })}
          ${text(x + 4, 440, s.label, { size: 22, fill: C.ivory, op: 0.85 })}</g>`;
      });
      // A pyramid built up course by course along the bottom right
      const courses = d.build ? 14 : 0, built = Math.floor(courses * es(p, 0.1, 0.85));
      let py = "";
      for (let k = 0; k < built; k++) {
        const w = 300 - k * 20;
        py += `<rect x="${1040 - w / 2}" y="${560 - (k + 1) * 9}" width="${w}" height="8" fill="${k % 2 ? "#a9824c" : "#c39b5d"}" opacity=".55"/>`;
      }
      return headline(c.headline, p) + g + py;
    },

    papyrus(p, d, c) {
      const wv = 760 * es(p, 0.05, 0.4);
      const r = rng(7);
      let marks = "";
      for (let row = 0; row < 7; row++) {
        let x = 320;
        while (x < 300 + wv - 30) {
          const len = 6 + r() * 22;
          marks += `<path d="M${x} ${300 + row * 34 + r() * 6} q ${len / 2} ${-6 + r() * 12} ${len} ${-2 + r() * 4}" stroke="#3b2a17" stroke-width="${2 + r() * 2}" fill="none" stroke-linecap="round" opacity=".75"/>`;
          x += len + 6 + r() * 14;
        }
      }
      return `${headline(c.headline, p)}
        <clipPath id="unroll"><rect x="300" y="260" width="${wv}" height="270"/></clipPath>
        <g clip-path="url(#unroll)"><rect x="300" y="260" width="760" height="270" fill="#d9c08f"/>
        ${Array.from({ length: 30 }, (_, k) => `<rect x="300" y="${262 + k * 9}" width="760" height="1" fill="#b89e6c" opacity=".5"/>`).join("")}${marks}</g>
        <rect x="${292 + wv}" y="252" width="16" height="286" rx="8" fill="#b39463"/>
        ${text(300, 580, d.place || "", { size: 22, weight: 600, fill: C.gold2, op: es(p, 0.3, 0.42), ls: 1 })}
        ${text(1060, 580, d.found || "", { size: 22, anchor: "end", fill: C.muted, op: es(p, 0.3, 0.42) })}
        ${text(300, 612, "Decorative marks — not a facsimile of the papyrus", { size: 14, fill: C.muted, op: 0.6 })}`;
    },

    river(p, d, c) {
      const path = "M790 520 C 740 500 690 480 660 455 C 640 420 650 360 640 320 C 600 300 520 290 420 270";
      const prog = es(p, 0.15, 0.85);
      const pt = (() => { const el = document.getElementById("probe"); el.setAttribute("d", path); return el.getPointAtLength(el.getTotalLength() * prog); })();
      return `${headline(c.headline, p)}
        <path d="M600 720 C 640 600 610 520 660 430 C 700 340 630 260 660 180 C 680 120 640 60 650 0 L 720 0 C 710 60 750 120 730 180 C 700 260 770 340 730 430 C 680 520 710 600 680 720 Z" fill="${C.nile}" opacity=".85"/>
        <path d="M640 320 C 600 300 520 290 420 270" stroke="${C.nile2}" stroke-width="10" fill="none" opacity=".6"/>
        
        ${pyrLit(330, 250, 90, 56)}${pyrLit(250, 262, 70, 42)}
        <path d="${path}" stroke="${C.gold3}" stroke-width="3" stroke-dasharray="6 9" fill="none" opacity=".9" pathLength="1" style="stroke-dasharray:0.012 0.012"/>
        <circle cx="790" cy="520" r="9" fill="${C.gold}"/>${text(812, 528, d.from, { size: 22, weight: 600 })}
        ${text(812, 556, "east bank", { size: 17, fill: C.muted })}
        <circle cx="420" cy="270" r="9" fill="${C.gold}"/>${text(400, 308, d.to, { size: 22, weight: 600, anchor: "end" })}
        ${text(400, 334, "west bank", { size: 17, fill: C.muted, anchor: "end" })}
        <g transform="translate(${pt.x} ${pt.y})"><path d="M-22 0 Q0 14 22 0 Z" fill="${C.ivory}"/><rect x="-12" y="-14" width="24" height="12" fill="#e9dcc2"/><path d="M0 -14 L0 -40" stroke="${C.ivory}" stroke-width="2"/></g>
        <g transform="translate(1140 230)"><path d="M0 40 L0 -10" stroke="${C.gold2}" stroke-width="2"/><path d="M-7 0 L0 -14 L7 0" fill="${C.gold2}"/>${text(0, 66, "N", { anchor: "middle", size: 18, weight: 600, fill: C.gold2 })}</g>
        ${text(706, 680, "Nile", { size: 20, italic: true, serif: true, fill: C.ivory, op: 0.8 })}
        ${text(1180, 680, "Schematic, not to scale", { size: 14, anchor: "end", fill: C.muted })}
        ${text(96, 640, prog < 0.98 ? "Day " + (prog < 0.5 ? 1 : 2) + " · loaded" : "Arrived · return trip ≈ 1 day", { size: 22, fill: C.gold3, op: es(p, 0.15, 0.2) })}`;
    },

    people(p, d, c) {
      let g = "";
      const cols = 16, rows = 5;
      for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
        const i = r * cols + k, a = es(p, 0.05 + (i / (rows * cols)) * 0.5, 0.1 + (i / (rows * cols)) * 0.5);
        const x = 110 + k * 36, y = 280 + r * 62;
        g += `<g opacity="${a}"><circle cx="${x}" cy="${y}" r="8" fill="${r % 2 ? C.gold2 : C.gold}"/><path d="M${x - 11} ${y + 36} Q${x} ${y + 6} ${x + 11} ${y + 36} Z" fill="${r % 2 ? C.gold2 : C.gold}"/></g>`;
      }
      // galleries plan
      let plan = "";
      for (let i = 0; i < 6; i++) {
        const a = es(p, 0.4 + i * 0.05, 0.5 + i * 0.05);
        plan += `<rect x="760" y="${270 + i * 40}" width="${380 * a}" height="26" fill="none" stroke="${C.gold2}" stroke-width="2" opacity="${a}"/>`;
      }
      return `${headline(c.headline, p)}${g}${plan}
        ${text(760, 532, "Galleries, bakeries and stores (plan, simplified)", { size: 17, fill: C.muted, op: es(p, 0.5, 0.6) })}
        ${text(760, 250, d.place, { size: 20, weight: 600, fill: C.gold2, op: es(p, 0.4, 0.5) })}
        ${text(110, 250, "Teams of workers (illustrative)", { size: 17, fill: C.muted, op: es(p, 0.05, 0.12) })}`;
    },

    ramps(p, d, c) {
      const opts = d.options || [];
      let g = "";
      opts.forEach((o, i) => {
        const x = 96 + i * 370, a = es(p, 0.08 + i * 0.12, 0.2 + i * 0.12);
        const cx = x + 165, base = 500;
        let ramp = "";
        if (i === 0) ramp = `<path d="M${x} ${base} L${cx + 10} ${base - 150} L${cx + 40} ${base - 150} L${x + 60} ${base} Z" fill="${C.sand}" opacity=".7"/>`;
        if (i === 1) ramp = `<path d="M${cx - 120} ${base} L${cx + 100} ${base - 50} L${cx - 70} ${base - 100} L${cx + 50} ${base - 150}" stroke="${C.sand}" stroke-width="12" fill="none" opacity=".8"/>`;
        if (i === 2) ramp = `<path d="M${cx - 90} ${base - 20} L${cx + 80} ${base - 60} L${cx - 50} ${base - 100} L${cx + 40} ${base - 135}" stroke="${C.gold3}" stroke-width="5" stroke-dasharray="10 7" fill="none" opacity=".9"/>`;
        g += `<g opacity="${a}"><rect x="${x}" y="240" width="330" height="300" fill="${C.ink}" rx="6"/>
          ${pyrLit(cx, base, 300, 190, 0.85)}${ramp}
          ${text(x + 20, 580, o, { size: 22, weight: 600 })}</g>`;
      });
      const q = es(p, 0.55, 0.65);
      return `${headline(c.headline, p)}${g}${text(1180, 230, "?", { serif: true, size: 110, anchor: "end", fill: C.gold, op: q * 0.7 })}`;
    },

    compass(p, d, c) {
      const rot = -12 * (1 - es(p, 0.1, 0.7)) - 0.6;
      const cx = 860, cy = 400;
      const ticks = Array.from({ length: 72 }, (_, i) => {
        const a = (i * 5 * Math.PI) / 180, r1 = i % 18 === 0 ? 190 : 200;
        return `<line x1="${cx + Math.sin(a) * r1}" y1="${cy - Math.cos(a) * r1}" x2="${cx + Math.sin(a) * 210}" y2="${cy - Math.cos(a) * 210}" stroke="${C.gold}" stroke-width="${i % 18 === 0 ? 3 : 1}" opacity=".7"/>`;
      }).join("");
      const lab = [["N", 0, -240], ["E", 240, 8], ["S", 0, 256], ["W", -240, 8]].map(([s, x, y]) => text(cx + x, cy + y, s, { anchor: "middle", size: 22, weight: 600, fill: C.gold2 })).join("");
      return `${headline(c.headline, p)}<g transform="translate(900 455) scale(0.8) translate(-860 -400)">
        <circle cx="${cx}" cy="${cy}" r="210" fill="none" stroke="${C.gold}" stroke-width="1" opacity=".4"/>${ticks}${lab}
        <line x1="${cx}" y1="${cy - 230}" x2="${cx}" y2="${cy + 230}" stroke="${C.gold3}" stroke-width="1" stroke-dasharray="4 6" opacity=".6"/>
        <g transform="rotate(${rot} ${cx} ${cy})"><rect x="${cx - 120}" y="${cy - 120}" width="240" height="240" fill="#b98c4f" opacity=".85"/><path d="M${cx - 120} ${cy - 120} L${cx + 120} ${cy + 120} M${cx + 120} ${cy - 120} L${cx - 120} ${cy + 120}" stroke="#7a5a33" stroke-width="2"/></g></g>
        ${text(96, 300, "error  < 4′ of arc", { serif: true, size: 44, fill: C.gold3, op: es(p, 0.4, 0.5) })}
        ${text(96, 340, "≈ 1/15 of a degree", { size: 22, fill: C.ivory, op: es(p, 0.45, 0.55) })}
        ${text(96, 400, "Twist shown greatly exaggerated", { size: 16, fill: C.muted, op: es(p, 0.45, 0.55) })}`;
    },

    valley(p, d, c) {
      const flood = Math.sin(Math.PI * es(p, 0.05, 0.75));
      const wy = 500 - flood * 70;
      const silt = 6 + 16 * es(p, 0.35, 0.8);
      return `${headline(c.headline, p)}
        <path d="M0 330 L230 330 L330 500 L950 500 L1050 330 L1280 330 L1280 720 L0 720 Z" fill="${C.red}" opacity=".85"/>
        <rect x="330" y="${500 - silt}" width="620" height="${silt}" fill="${C.silt}"/>
        <path d="M${330 - flood * 60} ${wy} L${950 + flood * 60} ${wy} L950 500 L330 500 Z" fill="${C.nile2}" opacity=".75"/>
        <rect x="600" y="470" width="80" height="30" fill="${C.nile}"/>
        ${text(120, 300, d.left, { size: 20, weight: 600, fill: "#e6a37f", op: es(p, 0.2, 0.3) })}
        ${text(640, 560, d.center, { size: 24, weight: 600, fill: C.ivory, anchor: "middle", op: es(p, 0.4, 0.5) })}
        ${text(1160, 300, d.right, { size: 20, weight: 600, fill: "#e6a37f", anchor: "end", op: es(p, 0.2, 0.3) })}
        ${text(640, 600, "black silt left by the flood", { size: 17, fill: C.muted, anchor: "middle", op: es(p, 0.45, 0.55) })}`;
    },

    wheel(p, d, c) {
      const names = [["Akhet", "inundation"], ["Peret", "emergence"], ["Shemu", "harvest"]];
      const cols = [C.nile2, "#6f9a4a", C.gold];
      const cx = 860, cy = 410, R = 190;
      const arc = (i) => {
        const a0 = ((-90 + i * 120 + 2) * Math.PI) / 180, a1 = ((-90 + (i + 1) * 120 - 2) * Math.PI) / 180;
        return `M${cx + Math.cos(a0) * R} ${cy + Math.sin(a0) * R} A${R} ${R} 0 0 1 ${cx + Math.cos(a1) * R} ${cy + Math.sin(a1) * R}`;
      };
      let g = "";
      names.forEach(([n, m], i) => {
        const on = i === d.active;
        const mid = ((-90 + i * 120 + 60) * Math.PI) / 180;
        g += `<path d="${arc(i)}" stroke="${cols[i]}" stroke-width="${on ? 34 : 18}" fill="none" opacity="${on ? 1 : 0.35}"/>
          ${text(cx + Math.cos(mid) * (R + 64), cy + Math.sin(mid) * (R + 64) + 8, n, { anchor: "middle", serif: true, size: on ? 30 : 22, fill: on ? C.ivory : C.muted })}`;
      });
      const prev = (d.active + 2) % 3;
      const ang = -90 + prev * 120 + 60 + 120 * es(p, 0.05, 0.4);
      const ma = (ang * Math.PI) / 180;
      return `${headline(c.headline, p)}${g}
        <circle cx="${cx + Math.cos(ma) * R}" cy="${cy + Math.sin(ma) * R}" r="12" fill="${C.ivory}"/>
        ${text(cx, cy - 6, "4 months", { anchor: "middle", size: 22, fill: C.gold3 })}${text(cx, cy + 26, "each", { anchor: "middle", size: 18, fill: C.muted })}
        ${text(96, 260, names[d.active][1], { serif: true, italic: true, size: 34, fill: cols[d.active], op: es(p, 0.1, 0.2) })}`;
    },

    gauge(p, d, c) {
      const level = es(p, 0.1, 0.8);
      let steps = "";
      for (let i = 0; i < 9; i++) steps += `<rect x="${660 + i * 34}" y="${250 + i * 34}" width="${440 - i * 34}" height="34" fill="${i % 2 ? "#8c7350" : "#9d8259"}"/>`;
      let marks = "";
      for (let i = 0; i <= 12; i++) marks += `<line x1="1080" y1="${560 - i * 24}" x2="${i % 2 ? 1096 : 1110}" y2="${560 - i * 24}" stroke="${C.gold3}" stroke-width="2"/>${i % 2 ? "" : text(1120, 566 - i * 24, String(i), { size: 16, fill: C.gold3 })}`;
      const wy = 560 - level * 230;
      return `${headline(c.headline, p)}${steps}
        <rect x="660" y="${wy}" width="440" height="${560 - wy}" fill="${C.nile2}" opacity=".55"/>${marks}
        ${text(1112, 236, "cubits", { size: 16, fill: C.muted })}
        ${text(96, 260, d.place, { size: 22, weight: 600, fill: C.gold2, op: es(p, 0.1, 0.2) })}
        ${text(96, 300, "Steps lead down to the water;", { size: 20, fill: C.ivory, op: es(p, 0.15, 0.25) })}
        ${text(96, 328, "marks on the wall record its height.", { size: 20, fill: C.ivory, op: es(p, 0.15, 0.25) })}
        ${text(96, 362, "Illustration, not to scale", { size: 15, fill: C.muted, op: es(p, 0.15, 0.25) })}`;
    },

    sky(p, d, c) {
      const r = rng(3);
      let stars = "";
      for (let i = 0; i < 90; i++) stars += `<circle cx="${r() * W}" cy="${r() * 360}" r="${r() * 1.6 + 0.4}" fill="#fff" opacity="${0.3 + r() * 0.5}"/>`;
      const sy = 380 - es(p, 0.05, 0.35) * 120;
      let cal = "";
      for (let m = 0; m < 12; m++) {
        const a = es(p, 0.35 + m * 0.025, 0.4 + m * 0.025);
        cal += `<rect x="${110 + m * 80 + Math.floor(m / 4) * 24}" y="560" width="70" height="40" rx="4" fill="${[C.nile2, "#6f9a4a", C.gold][Math.floor(m / 4)]}" opacity="${a * 0.85}"/>`;
      }
      for (let k = 0; k < 5; k++) cal += `<rect x="${1118 + k * 14}" y="572" width="10" height="16" fill="${C.ivory}" opacity="${es(p, 0.7, 0.78)}"/>`;
      return `<rect width="${W}" height="420" fill="#0d1830"/>${stars}
        <circle cx="980" cy="${sy}" r="7" fill="#e8f3ff"/><circle cx="980" cy="${sy}" r="26" fill="#cfe4ff" opacity=".18"/>
        ${text(1004, sy + 6, "Sirius · Sopdet", { size: 18, fill: "#cfe4ff", op: es(p, 0.15, 0.25) })}
        <rect y="400" width="${W}" height="20" fill="#3a2a2a" opacity=".6"/>
        ${headline(c.headline, p)}${cal}
        ${text(110, 545, "12 months × 30 days", { size: 18, fill: C.ivory, op: es(p, 0.35, 0.45) })}
        ${text(1190, 545, "+ 5 days", { size: 18, fill: C.ivory, anchor: "end", op: es(p, 0.7, 0.78) })}
        ${text(110, 630, "Akhet", { size: 16, fill: C.muted, op: es(p, 0.4, 0.5) })}${text(454, 630, "Peret", { size: 16, fill: C.muted, op: es(p, 0.5, 0.6) })}${text(798, 630, "Shemu", { size: 16, fill: C.muted, op: es(p, 0.6, 0.7) })}`;
    },

    dam(p, d, c) {
      const wall = es(p, 0.05, 0.25);
      const fill = es(p, 0.25, 0.9);
      const lakeX = 860 - fill * 700;
      const temples = [300, 470, 640].map((x, i) => {
        const under = fill > (860 - x) / 700 ? 0.25 : 1;
        return `<g opacity="${under}"><rect x="${x - 18}" y="452" width="36" height="28" fill="${C.sand}"/><rect x="${x - 24}" y="446" width="48" height="8" fill="${C.sand}"/></g>`;
      }).join("");
      return `${headline(c.headline, p)}
        <rect y="480" width="${W}" height="240" fill="#6b4a2c"/>
        <rect x="0" y="470" width="${W}" height="14" fill="${C.nile}"/>
        ${temples}
        <rect x="${lakeX}" y="${480 - fill * 60}" width="${860 - lakeX}" height="${fill * 60 + 4}" fill="${C.nile2}" opacity=".8"/>
        <path d="M860 ${480 - wall * 110} L900 ${480 - wall * 110} L930 484 L840 484 Z" fill="#9aa4b5"/>
        ${text(880, 340, "Aswan High Dam", { anchor: "middle", size: 20, weight: 600, op: wall })}
        ${text(lakeX + 20, 400, "Lake Nasser", { size: 22, italic: true, serif: true, fill: C.gold3, op: es(p, 0.4, 0.5) })}
        ${text(60, 520, "← upstream · Nubia", { size: 17, fill: C.ivory, op: 0.7 })}
        ${text(1220, 520, "downstream →", { size: 17, fill: C.ivory, op: 0.7, anchor: "end" })}
        ${text(1220, 680, "Schematic, not to scale", { size: 14, anchor: "end", fill: C.muted })}`;
    },

    temple(p, d, c) {
      const a = es(p, 0.05, 0.4);
      const seat = (x, s) => `<g transform="translate(${x} 560) scale(${s})"><rect x="-28" y="-150" width="56" height="70" rx="10" fill="#d1a56c"/><circle cx="0" cy="-170" r="20" fill="#d1a56c"/><path d="M-26 -186 L26 -186 L18 -150 L-18 -150 Z" fill="#b98c4f"/><rect x="-36" y="-80" width="72" height="80" fill="#c39b5d"/></g>`;
      const stand = (x, s, q) => `<g transform="translate(${x} 560) scale(${s})"><circle cx="0" cy="-160" r="13" fill="${q ? "#e0b98a" : "#d1a56c"}"/><rect x="-14" y="-146" width="28" height="146" rx="6" fill="${q ? "#e0b98a" : "#d1a56c"}"/></g>`;
      return `${headline(c.headline, p, 150, 46)}
        <path d="M60 560 L60 260 L640 230 L700 560 Z" fill="#a4774a" opacity="${a}"/>
        <g opacity="${a}">${[150, 270, 430, 550].map((x) => seat(x, 1.25)).join("")}<rect x="335" y="420" width="50" height="140" fill="#1a1410"/></g>
        <path d="M760 560 L760 330 L1220 310 L1240 560 Z" fill="#a4774a" opacity="${es(p, 0.35, 0.65)}"/>
        <g opacity="${es(p, 0.4, 0.7)}">${[800, 860, 920, 1060, 1120, 1180].map((x, i) => stand(x, 1, i === 2 || i === 3)).join("")}<rect x="975" y="460" width="40" height="100" fill="#1a1410"/></g>
        <rect y="560" width="${W}" height="160" fill="#2a1d14"/>
        ${text(380, 600, "Great Temple · Ramesses II", { anchor: "middle", size: 20, weight: 600, op: a })}
        ${text(1000, 600, "Small Temple · Hathor & Nefertari", { anchor: "middle", size: 20, weight: 600, op: es(p, 0.4, 0.7) })}
        ${text(1220, 680, "Simplified illustration", { size: 14, anchor: "end", fill: C.muted })}`;
    },

    blocks(p, d, c) {
      const cut = es(p, 0.15, 0.55);
      const num = es(p, 0.55, 0.85);
      let grid = "", nums = "";
      const cols = 10, rows = 5;
      for (let k = 1; k < cols; k++) grid += `<line x1="${290 + k * 70}" y1="230" x2="${290 + k * 70}" y2="${230 + 300 * cut}" stroke="${C.night}" stroke-width="3"/>`;
      for (let r = 1; r < rows; r++) grid += `<line x1="290" y1="${230 + r * 60}" x2="${290 + 700 * cut}" y2="${230 + r * 60}" stroke="${C.night}" stroke-width="3"/>`;
      let n = 1;
      for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++, n++) nums += text(290 + k * 70 + 35, 230 + r * 60 + 38, String(n), { anchor: "middle", size: 15, weight: 600, fill: C.night, op: num * (n <= cols * rows * num ? 1 : 0) });
      return `${headline(c.headline, p)}
        <rect x="290" y="230" width="700" height="300" fill="#b98c4f"/>
        ${[380, 540, 700, 860].map((x) => `<g opacity=".45"><circle cx="${x}" cy="300" r="26" fill="#7a5a33"/><rect x="${x - 40}" y="330" width="80" height="200" fill="#7a5a33"/></g>`).join("")}
        ${grid}${nums}
        ${text(290, 590, d.count + " blocks", { size: 24, weight: 600, fill: C.gold3, op: es(p, 0.3, 0.4) })}
        ${text(990, 590, d.weight, { size: 22, anchor: "end", fill: C.ivory, op: es(p, 0.4, 0.5) })}
        ${text(990, 620, "Illustrative grid — not the real cut plan", { size: 14, anchor: "end", fill: C.muted })}`;
    },

    lift(p, d, c) {
      const m = es(p, 0.15, 0.7);
      const water = es(p, 0.2, 0.9);
      const bx = 330 + m * 330, by = 520 - m * 230;
      const dome = es(p, 0.7, 0.92);
      return `${headline(c.headline, p)}
        <path d="M0 560 L240 560 L320 560 L420 400 L560 330 L700 280 L1280 280 L1280 720 L0 720 Z" fill="#7a5a33"/>
        <rect x="0" y="${560 - water * 90}" width="${300 + water * 60}" height="${water * 90 + 160}" fill="${C.nile2}" opacity=".75"/>
        <rect x="290" y="490" width="80" height="70" fill="none" stroke="${C.gold3}" stroke-dasharray="5 5" opacity="${1 - m * 0.4}"/>
        ${text(330, 610, "original site", { anchor: "middle", size: 16, fill: C.muted })}
        <g transform="translate(${bx - 330} ${by - 520})"><rect x="290" y="490" width="80" height="70" fill="#d1a56c"/>${[300, 318, 336, 354].map((x) => `<rect x="${x}" y="510" width="12" height="40" fill="#a4774a"/>`).join("")}</g>
        <path d="M${620} ${290} q 40 -120 120 -120 q 80 0 120 120" fill="#8c6a43" opacity="${dome}"/>
        <path d="M620 290 q 40 -120 120 -120 q 80 0 120 120" stroke="${C.ivory}" stroke-width="3" fill="none" stroke-dasharray="7 6" opacity="${dome * 0.8}"/>
        ${text(740, 150, "concrete dome under an artificial hill", { anchor: "middle", size: 17, fill: C.ivory, op: dome })}
        <g opacity="${es(p, 0.3, 0.45)}"><line x1="250" y1="560" x2="250" y2="290" stroke="${C.gold}" stroke-width="2"/><path d="M243 300 L250 286 L257 300" fill="${C.gold}"/>${text(236, 430, "≈ 65 m", { anchor: "end", size: 22, weight: 600, fill: C.gold3 })}</g>
        <g opacity="${es(p, 0.45, 0.6)}"><line x1="330" y1="640" x2="660" y2="640" stroke="${C.gold}" stroke-width="2"/><path d="M650 633 L664 640 L650 647" fill="${C.gold}"/>${text(495, 675, "≈ 200 m back from the river", { anchor: "middle", size: 20, fill: C.gold3 })}</g>
        ${text(1220, 700, "Schematic, not to scale", { size: 14, anchor: "end", fill: C.muted })}`;
    },

    sun(p, d, c) {
      const beam = es(p, 0.1, 0.6);
      const statues = [520, 600, 680, 760].map((x, i) => {
        const lit = i < 3 ? beam : 0.15;
        return `<g><rect x="${x - 26}" y="360" width="52" height="110" rx="8" fill="${i < 3 ? "#e0b070" : "#5b4630"}" opacity="${0.35 + lit * 0.65}"/><circle cx="${x}" cy="345" r="18" fill="${i < 3 ? "#e0b070" : "#5b4630"}" opacity="${0.35 + lit * 0.65}"/></g>`;
      }).join("");
      return `
        <path d="M0 720 L470 470 L810 470 L1280 720 Z" fill="#3a2a1d"/>
        <path d="M0 230 L470 300 L810 300 L1280 230 L1280 0 L0 0 Z" fill="#2a1d14" opacity=".9"/>
        <rect x="470" y="300" width="340" height="170" fill="#1c140d"/>
        <path d="M80 720 L560 470 L700 470 L330 720 Z" fill="#f6c97a" opacity="${beam * 0.28}"/>
        ${statues}
        ${headline(c.headline, p)}
        ${text(640, 520, "The statue of Ptah stays in shadow", { anchor: "middle", size: 17, fill: C.ivory, op: es(p, 0.5, 0.6) })}
        ${text(1220, 700, "Simplified illustration", { size: 14, anchor: "end", fill: C.muted })}`;
    },

    outro(p, d, c) {
      return `<defs><linearGradient id="o" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.night}"/><stop offset="1" stop-color="#2a1d14"/></linearGradient></defs>
        <rect width="${W}" height="${H}" fill="url(#o)"/>
        ${headline(c.headline, p, 230, 64)}
        ${text(98, 290, d.next || "", { size: 26, serif: true, italic: true, fill: C.gold3, op: es(p, 0.1, 0.22) })}
        <g opacity="${es(p, 0.4, 0.6)}"><circle cx="118" cy="470" r="20" fill="none" stroke="${C.gold}" stroke-width="3"/><line x1="86" y1="490" x2="150" y2="490" stroke="${C.gold}" stroke-width="3"/>
        ${text(170, 482, "DISCOVER EGYPT", { size: 22, weight: 700, ls: 5, fill: C.ivory })}
        ${text(170, 512, "Original explainer · sources listed below the video", { size: 17, fill: C.muted })}</g>`;
    },
  };

  let DATA = null;
  window.setup = (data) => { DATA = data; };
  window.paint = (t) => {
    const { chapters, timed, total, title } = DATA;
    let i = timed.findIndex((c) => t >= c.start && t < c.end);
    if (i < 0) i = timed.length - 1;
    const tc = timed[i];
    const p = clamp((t - tc.start) / (tc.end - tc.start));
    const ch = chapters[i];
    const body = (scenes[ch.scene] || scenes.outro)(p, { ...(ch.data || {}), bare: !!DATA.bare }, ch);
    const fade = Math.min(seg(t - tc.start, 0, 0.5), 1 - seg(t, tc.end - 0.45, tc.end));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
      <rect width="${W}" height="${H}" fill="${C.night}"/>
      <g opacity="${fade}">${body}</g>
      ${DATA.bare ? "" : `${ch.scene === "title" ? "" : text(96, 72, String(i + 1).padStart(2, "0") + " / " + String(timed.length).padStart(2, "0") + "  ·  " + ch.title, { size: 15, weight: 600, fill: C.gold2, ls: 2, op: 0.85 })}
      ${text(1184, 72, title, { size: 15, anchor: "end", fill: C.muted, op: 0.8 })}
      <rect x="0" y="${H - 4}" width="${W * (t / total)}" height="4" fill="${C.gold}" opacity=".8"/>`}
    </svg>`;
    document.getElementById("stage").innerHTML = svg;
  };
})();
