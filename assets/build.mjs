// Generates the SVGs in this folder. Run with:  node assets/build.mjs
// Pure hand-placed pixels: no external fonts or images, so GitHub renders
// them identically everywhere.

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OUT = dirname(fileURLToPath(import.meta.url));

const MONO =
  "ui-monospace, SFMono-Regular, 'Cascadia Mono', 'JetBrains Mono', Menlo, Consolas, 'DejaVu Sans Mono', 'Liberation Mono', monospace";

// ── 5×7 pixel font ─────────────────────────────────────────────────────────
const FONT = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
  N: ["#...#", "#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  " ": ["...", "...", "...", "...", "...", "...", "..."],
};
const glyph = (ch) => FONT[ch] ?? FONT[" "];
const textWidth = (str, s, gap) =>
  [...str].reduce((w, ch, i) => w + glyph(ch)[0].length + (i ? gap : 0), 0) * s;

// Merge lit cells of a grid into one compact path (horizontal runs).
function runsToPath(rows, x0, y0, s, test) {
  let d = "";
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (!test(row[x], x, y)) { x++; continue; }
      let end = x;
      while (end < row.length && test(row[end], end, y)) end++;
      d += `M${x0 + x * s} ${y0 + y * s}h${(end - x) * s}v${s}h${-(end - x) * s}z`;
      x = end;
    }
  });
  return d;
}

function pixelText(str, x, y, s, gap) {
  const rows = Array.from({ length: 7 }, () => "");
  [...str].forEach((ch, i) => {
    for (let r = 0; r < 7; r++) rows[r] += (i ? ".".repeat(gap) : "") + glyph(ch)[r];
  });
  return runsToPath(rows, x, y, s, (c) => c === "#");
}

// ── the moon ───────────────────────────────────────────────────────────────
// A lit sphere with soft maria and a few craters, dithered to 1-bit.

// 8×8 Bayer matrix for ordered dithering
const BAYER = (() => {
  let m = [[0]];
  for (let k = 0; k < 3; k++) {
    const n = m.length, next = [];
    for (let y = 0; y < n * 2; y++) {
      next.push([]);
      for (let x = 0; x < n * 2; x++)
        next[y].push(4 * m[y % n][x % n] + [[0, 2], [3, 1]][(y / n) | 0][(x / n) | 0]);
    }
    m = next;
  }
  return m;
})();

const hash = (x, y) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
function noise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}
const fbm = (x, y) => noise(x, y) * 0.5 + noise(x * 2.1, y * 2.1) * 0.3 + noise(x * 4.3, y * 4.3) * 0.2;
const smooth = (e0, e1, v) => { const t = Math.min(1, Math.max(0, (v - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

const MARIA = [[-0.28, -0.22, 0.34], [0.12, -0.38, 0.22], [0.3, 0.06, 0.27], [-0.04, 0.3, 0.2], [-0.5, 0.22, 0.17], [0.42, -0.42, 0.12]];
const CRATERS = [[0.18, 0.55, 0.09], [-0.35, 0.58, 0.06], [0.55, 0.3, 0.07], [-0.6, -0.3, 0.05], [0.02, -0.08, 0.05], [0.62, -0.1, 0.04]];
const LIGHT = (() => { const v = [-0.5, -0.38, 0.78], l = Math.hypot(...v); return v.map((c) => c / l); })();

function moonAt(nx, ny) {
  const d2 = nx * nx + ny * ny;
  if (d2 > 1) return -1;
  const nz = Math.sqrt(1 - d2);
  const lambert = Math.max(0, nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]);

  let albedo = 0.95 - 0.12 * (fbm(nx * 5 + 3, ny * 5 + 7) - 0.5);
  for (const [cx, cy, r] of MARIA) {
    const dist = Math.hypot(nx - cx, ny - cy) / r + 0.35 * (fbm(nx * 6, ny * 6) - 0.5);
    albedo -= 0.32 * (1 - smooth(0.6, 1.1, dist));
  }
  for (const [cx, cy, r] of CRATERS) {
    const dist = Math.hypot(nx - cx, ny - cy) / r;
    if (dist < 0.8) albedo -= 0.1;
    else if (dist < 1.05) albedo += 0.16;
  }

  let b = albedo * Math.pow(lambert, 0.85) * (0.75 + 0.25 * nz);
  return Math.max(0.035, b); // a whisper of earthshine on the dark side
}

function ditherMoon(cx, cy, R, sub) {
  const n = Math.ceil(R / sub);
  const rows = [];
  for (let sy = -n; sy < n; sy++) {
    const row = [];
    for (let sx = -n; sx < n; sx++) row.push(moonAt(((sx + 0.5) * sub) / R, ((sy + 0.5) * sub) / R));
    rows.push(row);
  }
  return runsToPath(rows, cx - n * sub, cy - n * sub, sub, (b, x, y) => b >= 0 && b > (BAYER[y % 8][x % 8] + 0.5) / 64);
}

// deterministic "random" so rebuilds don't churn the diff
function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const svg = (w, h, title, body, style = "") => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${title}">
<title>${title}</title>
<style>${style}
@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
</style>
${body}
</svg>
`;

// ── header ─────────────────────────────────────────────────────────────────
function header() {
  const W = 1000, H = 380, cx = W / 2, cy = H / 2;

  const s = 4, gap = 2;
  const left = "NATHAN", right = "OTIENO";
  const lw = textWidth(left, s, gap), rw = textWidth(right, s, gap);
  const ty = cy - (7 * s) / 2;

  const r = rng(320);
  let grain = "";
  for (let i = 0; i < 260; i++) {
    const x = Math.floor(r() * W / 2) * 2, y = Math.floor(r() * H / 2) * 2;
    if (Math.hypot(x - cx, y - cy) < 190) continue;
    grain += `M${x} ${y}h2v2h-2z`;
  }

  const style = `
.glow { animation: glow 8s ease-in-out infinite alternate; }
@keyframes glow { from { opacity: .7 } to { opacity: 1 } }
.ring { transform-box: fill-box; transform-origin: center; animation: ring 9s ease-out infinite both; }
@keyframes ring { 0% { transform: scale(.55); opacity: 0 } 20% { opacity: .35 } 100% { transform: scale(1.35); opacity: 0 } }`;

  return svg(W, H, "Nathan Otieno",
`<defs>
  <radialGradient id="glow" cx=".5" cy=".5" r=".5">
    <stop offset="0" stop-color="#ffffff" stop-opacity=".09"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
  </radialGradient>
  <clipPath id="frame"><rect width="${W}" height="${H}" rx="14"/></clipPath>
</defs>
<g clip-path="url(#frame)">
  <rect width="${W}" height="${H}" fill="#0a0a0b"/>
  <path fill="#ffffff" opacity=".07" d="${grain}"/>
  <circle class="glow" cx="${cx}" cy="${cy}" r="260" fill="url(#glow)"/>
  <circle cx="${cx}" cy="${cy}" r="176" fill="none" stroke="#ffffff" stroke-opacity=".08" stroke-width="1.5"/>
  <circle cx="${cx}" cy="${cy}" r="190" fill="none" stroke="#ffffff" stroke-opacity=".05" stroke-width="1" stroke-dasharray="2 6"/>
  <circle class="ring" cx="${cx}" cy="${cy}" r="176" fill="none" stroke="#ffffff" stroke-width="1.5"/>
  <circle class="ring" style="animation-delay:4.5s" cx="${cx}" cy="${cy}" r="176" fill="none" stroke="#ffffff" stroke-width="1.5"/>

  <path fill="#ececec" d="${ditherMoon(cx, cy, 142, 2)}"/>

  <path fill="#d6d6d6" d="${pixelText(left, 200 - lw / 2, ty, s, gap)}"/>
  <path fill="#d6d6d6" d="${pixelText(right, W - 200 - rw / 2, ty, s, gap)}"/>

  <circle cx="30" cy="30" r="4" fill="#ffffff" opacity=".5"/>
  <text x="${W - 28}" y="${H - 24}" text-anchor="end" font-family="${MONO}" font-size="11" letter-spacing="2" fill="#ffffff" opacity=".28">01.29°S 36.82°E</text>
  <g fill="#ffffff" opacity=".18">${[0, 1, 2, 3, 4].map((i) => `<rect x="${W - 150 + (i % 2) * 18}" y="${H - 92 + i * 9}" width="${70 - i * 10}" height="1.5"/>`).join("")}</g>
</g>`, style);
}

// ── tagline: three quiet lines that fade into one another ──────────────────
function tagline(fill) {
  const W = 640, H = 40;
  const lines = ["computer science student", "cybersecurity enthusiast", "nairobi, kenya · utc+3"];
  const T = lines.length * 3.5;
  const style = `
.l { opacity: 0; animation: l ${T}s ease-in-out infinite both; }
.l:first-of-type { opacity: 1; }
@keyframes l { 0% { opacity: 0 } 4%, 29% { opacity: 1 } 33%, 100% { opacity: 0 } }
.cur { animation: cur 1.1s steps(1) infinite; } @keyframes cur { 50% { fill: transparent } }`;
  return svg(W, H, lines.join(" · "),
    lines.map((t, i) =>
      `<text class="l" style="animation-delay:${(i * T) / lines.length}s" x="${W / 2}" y="27" text-anchor="middle" font-family="${MONO}" font-size="19" letter-spacing="1" fill="${fill}">&gt; ${t}<tspan class="cur">_</tspan></text>`
    ).join("\n"), style);
}

const files = {
  "header.svg": header(),
  "tagline-dark.svg": tagline("#c9d1d9"),
  "tagline-light.svg": tagline("#57606a"),
};
for (const [name, content] of Object.entries(files)) {
  writeFileSync(join(OUT, name), content);
  console.log(`wrote assets/${name} (${(content.length / 1024).toFixed(1)} KB)`);
}
