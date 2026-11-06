// Generates every SVG in this folder. Run with:  node assets/build.mjs
// Everything is hand-placed pixel art: no external fonts, images or scripts,
// so the SVGs render the same on GitHub in light and dark mode.

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OUT = dirname(fileURLToPath(import.meta.url));

// ── palette (lifted from the daily koi) ────────────────────────────────────
const C = {
  night0: "#050d1a",
  night1: "#091a30",
  night2: "#0d2645",
  water0: "#0a2240",
  water1: "#0c2c52",
  line: "#1c3556",
  glint: "#2b5d94",
  cream: "#f6efe4",
  orange: "#ff9a3c",
  fin: "#ffb468",
  coral: "#ff5e5b",
  blue: "#3d8bff",
  blueDeep: "#1f5fbf",
  sky: "#9db8db",
  dim: "#5f7a9c",
  leaf: "#23855f",
  leafHi: "#4fbf86",
  lotus: "#ff8fb1",
  lotusHi: "#ffd0de",
  moon: "#ffe7ad",
  moonShade: "#e9c77f",
  firefly: "#ffd66b",
  seal: "#d93a3a",
  eye: "#0a1424",
};

const MONO =
  "ui-monospace, SFMono-Regular, 'Cascadia Mono', 'JetBrains Mono', Menlo, Consolas, 'DejaVu Sans Mono', 'Liberation Mono', monospace";

// ── 5×7 pixel font ─────────────────────────────────────────────────────────
const FONT = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".###.", "#...#", "#....", "#....", "#....", "#...#", ".###."],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".###.", "#...#", "#....", "#.###", "#...#", "#...#", ".####"],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
  J: ["..###", "...#.", "...#.", "...#.", "#..#.", "#..#.", ".##.."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  N: ["#...#", "#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "#.#.#", ".#.#."],
  X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
  0: [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."],
  1: ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  2: [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  3: ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
  4: ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  5: ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  6: [".###.", "#....", "#....", "####.", "#...#", "#...#", ".###."],
  7: ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
  8: [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  9: [".###.", "#...#", "#...#", ".####", "....#", "....#", ".###."],
  " ": ["...", "...", "...", "...", "...", "...", "..."],
  ".": [".", ".", ".", ".", ".", ".", "#"],
  ",": ["..", "..", "..", "..", "..", ".#", "#."],
  "'": ["#", "#", ".", ".", ".", ".", "."],
  "-": ["...", "...", "...", "###", "...", "...", "..."],
  "!": ["#", "#", "#", "#", "#", ".", "#"],
  "?": [".###.", "#...#", "....#", "...#.", "..#..", ".....", "..#.."],
  ":": [".", ".", "#", ".", ".", "#", "."],
  "/": ["....#", "....#", "...#.", "..#..", ".#...", "#....", "#...."],
  "~": [".....", ".....", ".#..#", "#.##.", ".....", ".....", "....."],
  ">": ["#...", ".#..", "..#.", "...#", "..#.", ".#..", "#..."],
  "<": ["...#", "..#.", ".#..", "#...", ".#..", "..#.", "...#"],
  _: [".....", ".....", ".....", ".....", ".....", ".....", "#####"],
};

const glyph = (ch) => FONT[ch.toUpperCase()] ?? FONT[" "];
const textCols = (str, gap = 1) =>
  [...str].reduce((w, ch, i) => w + glyph(ch)[0].length + (i ? gap : 0), 0);
const textWidth = (str, s, gap = 1) => textCols(str, gap) * s;

// Turn a set of lit cells into one compact path (horizontal runs merged).
function runsToPath(rows, x0, y0, s, test) {
  let d = "";
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (!test(row[x])) { x++; continue; }
      let end = x;
      while (end < row.length && test(row[end])) end++;
      d += `M${x0 + x * s} ${y0 + y * s}h${(end - x) * s}v${s}h${-(end - x) * s}z`;
      x = end;
    }
  });
  return d;
}

function pixelText(str, x, y, s, gap = 1) {
  const rows = Array.from({ length: 7 }, () => "");
  [...str].forEach((ch, i) => {
    const g = glyph(ch);
    for (let r = 0; r < 7; r++) rows[r] += (i ? ".".repeat(gap) : "") + g[r];
  });
  return runsToPath(rows, x, y, s, (c) => c === "#");
}

// Multi-colour sprite: one <path> per colour.
function sprite(grid, pal, x, y, s, extra = "") {
  const keys = [...new Set(grid.join(""))].filter((k) => k !== "." && pal[k]);
  return keys
    .map((k) => `<path ${extra} fill="${pal[k]}" d="${runsToPath(grid, x, y, s, (c) => c === k)}"/>`)
    .join("");
}

const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const svg = (w, h, title, body, style = "") => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}">
<title>${esc(title)}</title>
<style>
${style}
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; } }
</style>
${body}
</svg>
`;

// ── sprites ────────────────────────────────────────────────────────────────
const KOI_PAL = { w: C.cream, b: C.blue, B: C.blueDeep, o: C.fin, O: C.orange, r: C.coral, k: C.eye };

// side view, facing right. tail = cols 0..4 (animated separately)
const KOI_SIDE = [
  "..............oo........",
  "............oooo........",
  "oo.......wwwbbbbbww.....",
  "ooo....wwbbbBBbbbbwww...",
  ".ooo.wwwbbbbbbbbbbbwwww.",
  ".ooowwwwwwwrrwwwwwwwwkww",
  "ooo...wwwwrrrrOOwwwwwww.",
  "oo......wwwwOOOOwwwww...",
  "...........oo.....oo....",
  "..........ooo....ooo....",
];

// top-down, head up
const KOI_TOP = [
  "......www......",
  ".....wwwww.....",
  "....wwwwwww....",
  "...wkwwwwwkw...",
  "...wwbbbbbww...",
  "..wwbbBBBbbww..",
  "..wbbbbBbbbbw..",
  "..wbbbbbbbbbw..",
  ".owrbbbbbbbrwo.",
  "oowrrbbBbbrrwoo",
  "ooowrrbbbrrwooo",
  "oo.wwrbbbrww.oo",
  "o..wwwbbbwww..o",
  "...wwwrbrwww...",
  "...wwOOOOOww...",
  "....wOOOOOw....",
  "....wwOOOww....",
  "....wwwOwww....",
  ".....wwbww.....",
  ".....wbbbw.....",
  "......wbw......",
  "......www......",
  "......www......",
  ".......w.......",
  "......ooo......",
  ".....ooooo.....",
  "....ooo.ooo....",
  "...ooo...ooo...",
  "..ooo.....ooo..",
  "..oo.......oo..",
];

const LILY = [
  "...gggggg...",
  ".ggggggggGg.",
  "gggGgggg..gg",
  "ggggggGg.ggg",
  ".gggGggggggg",
  "...gggggg...",
];
const LILY_PAL = { g: C.leaf, G: C.leafHi };
const LOTUS = [".p.p.", "pPpPp", ".ppp."];
const LOTUS_PAL = { p: C.lotus, P: C.lotusHi };

function moonGrid(r = 9) {
  const rows = [];
  for (let y = -r; y <= r; y++) {
    let row = "";
    for (let x = -r; x <= r; x++) {
      const inMoon = x * x + y * y <= r * r + r * 0.6;
      const bite = (x + 5) * (x + 5) + (y + 3) * (y + 3) <= r * r * 0.72;
      row += inMoon && !bite ? "m" : ".";
    }
    rows.push(row);
  }
  // a couple of craters
  const put = (x, y) => {
    const row = rows[y + r];
    if (row && row[x + r] === "m") rows[y + r] = row.slice(0, x + r) + "M" + row.slice(x + r + 1);
  };
  [[5, 2], [6, 3], [3, 6], [7, -2]].forEach(([x, y]) => put(x, y));
  return rows;
}

function hanko(x, y, size, rot = -6) {
  const s = 3;
  const tw = textWidth("NO", s);
  const th = 7 * s;
  return `<g transform="rotate(${rot} ${x + size / 2} ${y + size / 2})">
  <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="6" fill="${C.seal}"/>
  <rect x="${x + 4}" y="${y + 4}" width="${size - 8}" height="${size - 8}" rx="3" fill="none" stroke="${C.cream}" stroke-opacity=".55" stroke-width="2"/>
  <path fill="${C.cream}" d="${pixelText("NO", x + (size - tw) / 2, y + (size - th) / 2, s)}"/>
</g>`;
}

const fireflies = (pts) =>
  pts
    .map(
      ([x, y, d], i) => `<g class="ff" style="animation-delay:${d}s;animation-duration:${5 + (i % 3)}s">
  <rect x="${x - 5}" y="${y - 5}" width="14" height="14" fill="${C.firefly}" opacity=".14"/>
  <rect x="${x}" y="${y}" width="4" height="4" fill="${C.firefly}"/>
</g>`
    )
    .join("");

const ripples = (pts) =>
  pts
    .map(
      ([x, y, rx, d]) =>
        `<ellipse class="rip" style="animation-delay:${d}s" cx="${x}" cy="${y}" rx="${rx}" ry="${rx * 0.28}" fill="none" stroke="${C.sky}" stroke-width="2" stroke-dasharray="6 5" vector-effect="non-scaling-stroke"/>`
    )
    .join("");

const SHARED_STYLE = `
.ff { animation: ff 6s ease-in-out infinite both; }
@keyframes ff { 0%,100% { opacity:.15; transform:translate(0,0) } 40% { opacity:1; transform:translate(4px,-8px) } 70% { opacity:.6; transform:translate(-3px,-3px) } }
.rip { transform-box: fill-box; transform-origin: center; animation: rip 5s ease-out infinite both; }
@keyframes rip { 0% { transform:scale(.15); opacity:0 } 15% { opacity:.7 } 100% { transform:scale(1.25); opacity:0 } }
.cur { animation: cur 1.1s steps(1) infinite; }
@keyframes cur { 50% { fill: transparent } }
`;

// ── hero ───────────────────────────────────────────────────────────────────
function hero() {
  const W = 1000, H = 400, horizon = 284;
  const name = "NATHAN OTIENO";
  const s = 9;
  const nw = textWidth(name, s);
  const seal = 52;
  const blockW = nw + 26 + seal;
  const nx = (W - blockW) / 2;
  const ny = 112;
  const namePath = pixelText(name, nx, ny, s);

  const moon = moonGrid(9);
  const ms = 3, mx = 52, my = 26;

  // moon reflection: broken bars that shimmer
  const refl = [
    [0, 34, 0], [9, 22, 6], [19, 28, -4], [30, 14, 8], [42, 20, -6], [55, 10, 4], [70, 12, -2], [86, 6, 3],
  ]
    .map(
      ([dy, w, ox], i) =>
        `<rect class="sh" style="animation-delay:${(i * 0.37).toFixed(2)}s" x="${mx + 27 + ox - w / 2}" y="${horizon + 8 + dy}" opacity=".8" width="${w}" height="3" fill="${C.moon}"/>`
    )
    .join("");

  // drifting surface glints
  const glints = [
    [180, 304, 36], [330, 320, 20], [520, 298, 44], [700, 316, 24], [860, 306, 30],
    [250, 350, 28], [610, 362, 18], [450, 342, 32], [940, 352, 22], [160, 378, 26], [760, 382, 30], [380, 384, 16],
  ]
    .map(([x, y, w], i) => `<rect class="gl g${i % 3}" x="${x}" y="${y}" width="${w}" height="3" fill="${C.glint}"/>`)
    .join("");

  const tail = KOI_SIDE.map((r) => r.slice(0, 5) + ".".repeat(r.length - 5));
  const body = KOI_SIDE.map((r) => ".....".concat(r.slice(5)));
  const ks = 4;

  const style = `${SHARED_STYLE}
.sh { animation: sh 2.4s ease-in-out infinite both; }
@keyframes sh { 0%,100% { opacity:.85 } 50% { opacity:.2 } }
.gl { animation: drift 9s linear infinite; }
.g1 { animation-duration: 12s; } .g2 { animation-duration: 15s; animation-direction: reverse; }
@keyframes drift { 0% { transform:translateX(0); opacity:0 } 20%,80% { opacity:.9 } 100% { transform:translateX(-60px); opacity:0 } }
.swim { animation: swim 30s linear infinite; }
@keyframes swim { from { transform:translate(-140px, 0) } to { transform:translate(1080px, 0) } }
.bob { animation: bob 1.8s ease-in-out infinite; }
@keyframes bob { 50% { transform:translateY(5px) } }
.tail { transform-box: fill-box; transform-origin: right center; animation: tail .7s ease-in-out infinite alternate; }
@keyframes tail { from { transform:skewY(-14deg) scaleX(.9) } to { transform:skewY(14deg) } }
.shine { animation: shine 7s ease-in-out infinite; }
@keyframes shine { 0% { transform:translateX(-260px) } 55%,100% { transform:translateX(${W}px) } }
.pad { animation: pad 6s ease-in-out infinite; }
@keyframes pad { 50% { transform:translateY(3px) } }
`;

  const body_ = `
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.night0}"/><stop offset="1" stop-color="${C.night2}"/>
  </linearGradient>
  <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.water1}"/><stop offset="1" stop-color="${C.night0}"/>
  </linearGradient>
  <linearGradient id="shineGrad" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </linearGradient>
  <clipPath id="card"><rect width="${W}" height="${H}" rx="18"/></clipPath>
  <clipPath id="nameClip"><path d="${namePath}"/></clipPath>
</defs>
<g clip-path="url(#card)">
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <!-- stars -->
  ${[[170, 30], [300, 64], [420, 28], [540, 58], [700, 92], [860, 70], [960, 96], [36, 140], [960, 250], [30, 262]]
    .map(([x, y], i) => `<rect class="sh" style="animation-delay:${i * 0.5}s;animation-duration:${3 + (i % 4)}s" x="${x}" y="${y}" width="3" height="3" fill="${C.sky}" opacity=".7"/>`)
    .join("")}
  ${sprite(moon, { m: C.moon, M: C.moonShade }, mx, my, ms)}

  <!-- labels -->
  <text x="${W - 36}" y="40" text-anchor="end" font-family="${MONO}" font-size="14" letter-spacing="1.5" fill="${C.dim}">NAIROBI, KE · 01.29°S 36.82°E · UTC+3</text>

  <!-- name: blue + orange offset layers, cream face, sweeping shine -->
  <path fill="${C.blueDeep}" transform="translate(${s} ${s})" d="${namePath}"/>
  <path fill="${C.orange}" transform="translate(${s / 2} ${s / 2})" d="${namePath}"/>
  <path fill="${C.cream}" d="${namePath}"/>
  <g clip-path="url(#nameClip)"><g class="shine"><rect x="0" y="${ny - 20}" width="180" height="${7 * s + 40}" fill="url(#shineGrad)" transform="skewX(-20)"/></g></g>
  ${hanko(nx + nw + 26, ny + 4, seal)}

  <text x="${W / 2}" y="${ny + 7 * s + 62}" text-anchor="middle" font-family="${MONO}" font-size="19" letter-spacing="1" fill="${C.sky}">computer science student <tspan fill="${C.orange}">·</tspan> cybersecurity enthusiast</text>

  <!-- pond -->
  <rect y="${horizon}" width="${W}" height="${H - horizon}" fill="url(#water)"/>
  <rect y="${horizon}" width="${W}" height="3" fill="${C.glint}" opacity=".8"/>
  ${refl}
  ${glints}
  ${ripples([[150, 332, 70, 0], [790, 322, 90, 1.7], [520, 370, 60, 3.2]])}

  <g class="swim"><g class="bob">
    <g class="tail">${sprite(tail, KOI_PAL, 0, 318, ks)}</g>
    ${sprite(body, KOI_PAL, 0, 318, ks)}
  </g></g>

  <g class="pad">${sprite(LILY, LILY_PAL, 112, 318, 5)}${sprite(LOTUS, LOTUS_PAL, 138, 312, 4)}</g>
  <g class="pad" style="animation-delay:-2s">${sprite(LILY, LILY_PAL, 770, 310, 6)}</g>
  <g class="pad" style="animation-delay:-4s">${sprite(LILY, LILY_PAL, 880, 358, 4)}${sprite(LOTUS, LOTUS_PAL, 896, 352, 3)}</g>

  ${fireflies([[230, 84, 0], [640, 70, 1.2], [930, 200, 2.3], [70, 200, 3.1], [480, 268, 0.6], [820, 262, 1.8]])}
</g>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="17" fill="none" stroke="${C.line}" stroke-width="2"/>
`;
  return svg(W, H, "Nathan Otieno — computer science student, cybersecurity enthusiast. Nairobi, Kenya.", body_, style);
}

// ── koifetch card ──────────────────────────────────────────────────────────
function fetchCard() {
  const W = 1000, H = 470;
  const rows = [
    ["role", "computer science student"],
    ["focus", "web development · cybersecurity"],
    ["stack", "typescript · next.js · node · postgres"],
    ["editor", "vs code"],
    ["design", "figma"],
    ["locale", "nairobi, kenya · utc+3"],
    ["koi", "a new one is drawn every night at 03:20"],
  ];
  const kx = 340, vx = 450, y0 = 186, dy = 31;
  const cx = 172, cy = 252, pr = 118;

  const lines = rows
    .map(
      ([k, v], i) => `<text class="ln" style="animation-delay:${(0.5 + i * 0.12).toFixed(2)}s" y="${y0 + i * dy}" font-family="${MONO}" font-size="18">
  <tspan x="${kx}" fill="${C.blue}" font-weight="700">${k}</tspan><tspan x="${vx}" fill="${C.cream}">${esc(v)}</tspan></text>`
    )
    .join("\n");

  const swatches = [C.night0, C.line, C.blueDeep, C.blue, C.cream, C.firefly, C.orange, C.coral]
    .map((c, i) => `<rect x="${kx + i * 40}" y="${y0 + rows.length * dy - 4}" width="36" height="18" fill="${c}"/>`)
    .join("");

  const ks = 6;
  const kw = KOI_TOP[0].length * ks, kh = KOI_TOP.length * ks;
  const orbit = 46;

  const style = `${SHARED_STYLE}
.ln { animation: ln .5s ease-out backwards; }
@keyframes ln { from { opacity:0; transform:translateX(-8px) } }
.orbit { transform-origin: ${cx}px ${cy}px; animation: orbit 16s linear infinite; }
@keyframes orbit { to { transform: rotate(-360deg) } }
.sway { transform-box: fill-box; transform-origin: center; animation: sway 1.4s ease-in-out infinite alternate; }
@keyframes sway { from { transform: rotate(-4deg) } to { transform: rotate(4deg) } }
`;

  const body = `
<defs>
  <clipPath id="card"><rect width="${W}" height="${H}" rx="16"/></clipPath>
  <clipPath id="pond"><circle cx="${cx}" cy="${cy}" r="${pr}"/></clipPath>
  <radialGradient id="pondGrad" cx=".5" cy=".42" r=".6">
    <stop offset="0" stop-color="${C.water1}"/><stop offset="1" stop-color="${C.night0}"/>
  </radialGradient>
</defs>
<g clip-path="url(#card)">
  <rect width="${W}" height="${H}" fill="${C.night1}"/>
  <rect width="${W}" height="44" fill="${C.night0}"/>
  <rect y="44" width="${W}" height="2" fill="${C.line}"/>
  <circle cx="28" cy="22" r="7" fill="${C.coral}"/><circle cx="52" cy="22" r="7" fill="${C.orange}"/><circle cx="76" cy="22" r="7" fill="${C.cream}"/>
  <text x="${W / 2}" y="27" text-anchor="middle" font-family="${MONO}" font-size="14" fill="${C.dim}">nathan@nairobi: ~/pond</text>

  <text x="40" y="92" font-family="${MONO}" font-size="18"><tspan fill="${C.orange}" font-weight="700">nathan@nairobi</tspan><tspan fill="${C.dim}"> ~/pond </tspan><tspan fill="${C.cream}">$ koifetch</tspan></text>

  <!-- the porthole pond with a koi swimming laps -->
  <circle cx="${cx}" cy="${cy}" r="${pr}" fill="url(#pondGrad)"/>
  <g clip-path="url(#pond)">
    ${ripples([[cx - 40, cy + 50, 60, 0], [cx + 50, cy - 40, 50, 2.5]])}
    <g class="orbit">
      <g class="sway">${sprite(KOI_TOP, KOI_PAL, cx + orbit - kw / 2, cy - kh / 2, ks)}</g>
    </g>
  </g>
  <circle cx="${cx}" cy="${cy}" r="${pr}" fill="none" stroke="${C.line}" stroke-width="3" stroke-dasharray="8 6"/>
  ${sprite(LILY, LILY_PAL, cx + 64, cy + 82, 5)}${sprite(LOTUS, LOTUS_PAL, cx + 92, cy + 76, 4)}

  <text class="ln" style="animation-delay:.3s" x="${kx}" y="138" font-family="${MONO}" font-size="22" font-weight="700"><tspan fill="${C.orange}">nathan</tspan><tspan fill="${C.dim}">@</tspan><tspan fill="${C.blue}">nairobi</tspan></text>
  <rect class="ln" style="animation-delay:.4s" x="${kx}" y="152" width="222" height="3" fill="${C.line}"/>
  ${lines}
  <g class="ln" style="animation-delay:${(0.5 + rows.length * 0.12).toFixed(2)}s">${swatches}</g>

  <text x="40" y="${H - 28}" font-family="${MONO}" font-size="18"><tspan fill="${C.orange}" font-weight="700">nathan@nairobi</tspan><tspan fill="${C.dim}"> ~/pond </tspan><tspan fill="${C.cream}">$ </tspan><tspan class="cur" fill="${C.cream}">█</tspan></text>
</g>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="15" fill="none" stroke="${C.line}" stroke-width="2"/>
`;
  return svg(
    W, H,
    "koifetch — role: computer science student; focus: web development and cybersecurity; stack: TypeScript, Next.js, Node, Postgres; editor: VS Code; design: Figma; based in Nairobi, Kenya.",
    body, style
  );
}

// ── section titles ─────────────────────────────────────────────────────────
function sectionTitle(num, label) {
  const W = 1000, H = 44, s = 4, y = 6;
  const nw = textWidth(num, s);
  const slashX = nw + 16;
  const lx = slashX + textWidth("/", s) + 16;
  const lw = textWidth(label, s);
  const waveX = lx + lw + 28;
  // pixel wave, period 32px, drawn wide enough to scroll seamlessly
  const pat = [0, 0, 1, 2, 2, 2, 1, 0];
  let wave = "";
  for (let x = 0, i = 0; x < W - waveX + 64; x += 4, i++) wave += `M${x} ${12 + pat[i % 8] * 4}h4v4h-4z`;
  return svg(
    W, H, `${num} — ${label.toLowerCase()}`,
    `<path fill="${C.blue}" d="${pixelText(num, 0, y, s)}"/>
<path fill="${C.dim}" d="${pixelText("/", slashX, y, s)}"/>
<path fill="${C.orange}" d="${pixelText(label, lx, y, s)}"/>
<svg x="${waveX}" y="0" width="${W - waveX}" height="${H}"><path class="wave" fill="${C.blue}" opacity=".45" d="${wave}"/></svg>`,
    `.wave { animation: wave 2.4s linear infinite; } @keyframes wave { to { transform: translateX(-32px) } }`
  );
}

// ── link buttons ───────────────────────────────────────────────────────────
const ICON_IN = [
  ".bbbbbbbbbb.",
  "bbbbbbbbbbbb",
  "bwwbbbbbbbbb",
  "bwwbbbbbbbbb",
  "bbbbbbbbbbbb",
  "bwwbwwwwwbbb",
  "bwwbwwwwwwbb",
  "bwwbwwbbwwbb",
  "bwwbwwbbwwbb",
  "bwwbwwbbwwbb",
  "bbbbbbbbbbbb",
  ".bbbbbbbbbb.",
];
const ICON_MAIL = [
  "oooooooooooooo",
  "owwcccccccccwo",
  "ocwwcccccccwwo",
  "occwwcccccwwco",
  "occcwwcccwwcco",
  "occccwwwwwccco",
  "occcccwwwcccco",
  "occcccccccccco",
  "occcccccccccco",
  "oooooooooooooo",
];

const ARROW = ["..aaaa", "....aa", "...a.a", "..a..a", ".a....", "a....."];

function button(label, icon, pal, accent) {
  const W = 230, H = 56, s = 3;
  const iw = icon[0].length * s, ih = icon.length * s;
  return svg(
    W, H, label,
    `<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="12" fill="${C.night1}" stroke="${C.line}" stroke-width="2"/>
<rect x="1" y="${H - 7}" width="${W - 2}" height="6" rx="3" fill="${accent}" opacity=".9"/>
${sprite(icon, pal, 20, (H - 4 - ih) / 2, s)}
<text x="${20 + iw + 16}" y="${H / 2 + 4}" font-family="${MONO}" font-size="18" font-weight="700" fill="${C.cream}">${esc(label)}</text>
${sprite(ARROW, { a: accent }, W - 20 - 18, (H - 4 - 18) / 2, 3)}`
  );
}

// ── footer ─────────────────────────────────────────────────────────────────
function footer() {
  const W = 1000, H = 210;
  const msg = "THANKS FOR SWIMMING BY";
  const s = 5;
  const mw = textWidth(msg, s);
  const ks = 3;
  const style = `${SHARED_STYLE}
.dive { animation: dive 9s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
@keyframes dive { 0%,100% { transform: translate(0,0) rotate(0) } 50% { transform: translate(40px,6px) rotate(6deg) } }
`;
  return svg(
    W, H, "Thanks for swimming by.",
    `<defs>
  <linearGradient id="deep" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.water1}"/><stop offset="1" stop-color="${C.night0}"/></linearGradient>
  <clipPath id="card"><rect width="${W}" height="${H}" rx="18"/></clipPath>
</defs>
<g clip-path="url(#card)">
  <rect width="${W}" height="${H}" fill="url(#deep)"/>
  ${ripples([[150, 56, 80, 0], [800, 186, 100, 2], [470, 192, 60, 3.6]])}
  <path fill="${C.blueDeep}" transform="translate(${s} ${s})" d="${pixelText(msg, (W - mw) / 2, 58, s)}"/>
  <path fill="${C.cream}" d="${pixelText(msg, (W - mw) / 2, 58, s)}"/>
  <text x="${W / 2}" y="138" text-anchor="middle" font-family="${MONO}" font-size="16" fill="${C.sky}"><tspan fill="${C.orange}">$</tspan> exit <tspan fill="${C.dim}">·</tspan> connection to the pond closed <tspan fill="${C.dim}">·</tspan> come back tomorrow for a new koi</text>
  <g class="dive">${sprite(KOI_SIDE, KOI_PAL, 70, 150, ks)}</g>
  ${sprite(LILY, LILY_PAL, 860, 40, 5)}${sprite(LOTUS, LOTUS_PAL, 886, 34, 4)}
  ${hanko(W - 84, H - 76, 46, 5)}
  ${fireflies([[340, 30, 0.4], [660, 40, 1.6], [940, 160, 2.6]])}
</g>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="17" fill="none" stroke="${C.line}" stroke-width="2"/>`,
    style
  );
}

// ── write ──────────────────────────────────────────────────────────────────
const files = {
  "hero.svg": hero(),
  "koifetch.svg": fetchCard(),
  "title-stack.svg": sectionTitle("01", "THE STACK"),
  "title-log.svg": sectionTitle("02", "THE POND LOG"),
  "title-koi.svg": sectionTitle("03", "TODAY'S KOI"),
  "btn-linkedin.svg": button("linkedin", ICON_IN, { b: "#2f7fd8", w: C.cream }, C.blue),
  "btn-email.svg": button("email", ICON_MAIL, { o: C.orange, c: C.cream, w: C.coral }, C.orange),
  "footer.svg": footer(),
};
for (const [name, content] of Object.entries(files)) {
  writeFileSync(join(OUT, name), content);
  console.log(`wrote assets/${name} (${(content.length / 1024).toFixed(1)} KB)`);
}
