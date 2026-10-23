// MONACHI Party Pass (1080 × 1350 image) and the illustrated cards for events without photos.

const PASS_THEMES = {
  halloween: { bg1: "#2A1850", bg2: "#100A22", accent: "#F7931E", gold: "#F9C440", card: "#FCF2DC", ink: "#1B1335", soft: "#6E6390" },
  diwali:    { bg1: "#6A1234", bg2: "#250614", accent: "#F9B233", gold: "#FFD27A", card: "#FFF4E0", ink: "#3A0A1E", soft: "#8A5A66" },
  christmas: { bg1: "#0F4A3A", bg2: "#06221B", accent: "#E8473C", gold: "#F5CE62", card: "#FFF8EC", ink: "#12352B", soft: "#5E7A70" },
  newyear:   { bg1: "#1D2A66", bg2: "#0A0F2C", accent: "#F5CE62", gold: "#E9D7A6", card: "#FBF6EC", ink: "#1D2240", soft: "#66657A" },
  baking:    { bg1: "#6B3E26", bg2: "#2E170C", accent: "#F6B37A", gold: "#F3D29C", card: "#FFF6EA", ink: "#3B2214", soft: "#8A6A57" },
  monachi:   { bg1: "#26305E", bg2: "#11152E", accent: "#2BC1C9", gold: "#E3C27F", card: "#FBF6EC", ink: "#1D2240", soft: "#66657A" }
};

function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function fitFont(ctx, text, maxW, size, weight, family) { let s = size; do { ctx.font = `${weight} ${s}px ${family}`; s -= 2; } while (ctx.measureText(text).width > maxW && s > 18); }
function spaced(ctx, text, x, y, spacing, align) {
  const chars = [...text]; const w = chars.reduce((a, c) => a + ctx.measureText(c).width, 0) + spacing * (chars.length - 1);
  let cx = align === "center" ? x - w / 2 : x; ctx.textAlign = "left";
  for (const c of chars) { ctx.fillText(c, cx, y); cx += ctx.measureText(c).width + spacing; }
}

// p: { event, child, age, parent, code, passId, paid }
function drawPass(canvas, p) {
  const W = 1080, H = 1350; canvas.width = W; canvas.height = H;
  const t = PASS_THEMES[p.event.theme] || PASS_THEMES.monachi, ctx = canvas.getContext("2d");
  const FB = '"Fredoka", "Poppins", sans-serif', FP = '"Poppins", system-ui, sans-serif';
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, t.bg1); g.addColorStop(1, t.bg2);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  ctx.fillStyle = "rgba(255,240,210,.55)";
  for (let i = 0; i < 70; i++) { const x = rnd() * W, y = rnd() * 360, r = rnd() * 1.8 + .4; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }

  const letters = "MONACHI".split(""), cols = ["#E0306A", "#F39200", "#00A0AA", "#8A5BD0", "#8A5BD0", "#FCF2DC", "#FCF2DC"];
  ctx.font = `600 72px ${FB}`; ctx.textBaseline = "alphabetic";
  const lw = letters.reduce((a, c) => a + ctx.measureText(c).width + 5, -5); let lx = W / 2 - lw / 2;
  letters.forEach((c, i) => { ctx.fillStyle = cols[i]; ctx.textAlign = "left"; ctx.fillText(c, lx, 118); lx += ctx.measureText(c).width + 5; });
  ctx.fillStyle = t.gold; ctx.font = `500 19px ${FP}`; spaced(ctx, "CRAFTING CELEBRATIONS", W / 2, 156, 6, "center");

  ctx.strokeStyle = t.gold; ctx.lineWidth = 2.5; rr(ctx, W / 2 - 150, 190, 300, 54, 27); ctx.stroke();
  ctx.fillStyle = t.gold; ctx.font = `600 24px ${FB}`; spaced(ctx, "PARTY PASS", W / 2, 226, 7, "center");
  ctx.fillStyle = t.accent; fitFont(ctx, p.event.title, 920, 92, 700, FB); ctx.textAlign = "center"; ctx.fillText(p.event.title, W / 2, 338);

  const cx = 70, cy = 386, cw = 940, ch = 790, perf = cy + 548;
  ctx.fillStyle = t.card; rr(ctx, cx, cy, cw, ch, 36); ctx.fill();
  const notch = ctx.createLinearGradient(0, 0, 0, H); notch.addColorStop(0, t.bg1); notch.addColorStop(1, t.bg2);
  ctx.fillStyle = notch; ctx.beginPath(); ctx.arc(cx, perf, 26, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(cx + cw, perf, 26, 0, 7); ctx.fill();
  ctx.setLineDash([14, 12]); ctx.strokeStyle = t.soft; ctx.globalAlpha = .45; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(cx + 44, perf); ctx.lineTo(cx + cw - 44, perf); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;

  const L = cx + 56, R = cx + cw - 56;
  ctx.fillStyle = t.soft; ctx.font = `600 20px ${FP}`; spaced(ctx, "ADMIT ONE CHILD", L, cy + 66, 4);
  if (p.paid) {
    ctx.save(); ctx.translate(R - 84, cy + 64); ctx.rotate(-0.08);
    ctx.strokeStyle = "#157F5B"; ctx.lineWidth = 4; rr(ctx, -84, -34, 168, 58, 12); ctx.stroke();
    ctx.fillStyle = "#157F5B"; ctx.font = `700 30px ${FB}`; ctx.textAlign = "center"; ctx.fillText("✓ PAID", 0, 6); ctx.restore();
  }
  ctx.fillStyle = t.ink; fitFont(ctx, p.child, cw - 112, 104, 700, FB); ctx.textAlign = "left"; ctx.fillText(p.child, L, cy + 186);
  ctx.fillStyle = t.soft; ctx.font = `500 32px ${FP}`; ctx.fillText(p.age ? `Age ${p.age}` : "", L, cy + 238);
  ctx.strokeStyle = t.soft; ctx.globalAlpha = .3; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(L, cy + 278); ctx.lineTo(R, cy + 278); ctx.stroke(); ctx.globalAlpha = 1;

  const col2 = L + 440, rows = [[["PARENT", p.parent], ["DATE", p.event.short || p.event.date]], [["TIME", p.event.time], ["VENUE", p.event.venue]]];
  rows.forEach((row, ri) => row.forEach(([lab, val], ci) => {
    const x = ci ? col2 : L, y = cy + 332 + ri * 108;
    ctx.fillStyle = t.soft; ctx.font = `600 18px ${FP}`; spaced(ctx, lab, x, y, 3);
    ctx.fillStyle = t.ink; fitFont(ctx, val || "", ci ? R - col2 : 410, 34, 600, FP); ctx.textAlign = "left"; ctx.fillText(val || "", x, y + 46);
  }));

  const qy = perf + 36, qs = 190;
  ctx.fillStyle = "#FFFFFF"; rr(ctx, L - 10, qy - 10, qs + 20, qs + 20, 14); ctx.fill();
  if (window.qrcode) {
    const q = qrcode(0, "M"); q.addData(`MONACHI PARTY PASS ${p.passId} | ${p.child} | ${p.event.title}`); q.make();
    const n = q.getModuleCount(), m = qs / n; ctx.fillStyle = t.ink;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) ctx.fillRect(L + c * m, qy + r * m, Math.ceil(m), Math.ceil(m));
  }
  const tx = L + qs + 46;
  ctx.fillStyle = t.soft; ctx.font = `600 18px ${FP}`; spaced(ctx, "PASS ID", tx, qy + 34, 3);
  ctx.fillStyle = t.ink; fitFont(ctx, p.passId, R - tx, 46, 700, FB); ctx.textAlign = "left"; ctx.fillText(p.passId, tx, qy + 88);
  ctx.fillStyle = t.soft; ctx.font = `500 24px ${FP}`;
  ctx.fillText(`Booking ${p.code}`, tx, qy + 132); ctx.fillText("Show this pass at the entry", tx, qy + 170);

  const M = window.MONACHI || {};
  ctx.fillStyle = "#F7EEDD"; ctx.font = `500 26px ${FP}`; ctx.textAlign = "center";
  ctx.fillText(`WhatsApp +91 ${String(M.WHATSAPP || "").slice(2, 7)} ${String(M.WHATSAPP || "").slice(7)}   ·   Instagram @${M.INSTAGRAM || ""}`, W / 2, 1252);
  ["#E0306A", "#F39200", "#00A0AA", "#6A3FA0", "#1D2240"].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(i * W / 5, H - 16, W / 5 + 1, 16); });
}

// Illustrated art (SVG) for cards that have no photo yet.
function eventArt(theme) {
  const sky = (a, b) => `<defs><linearGradient id="g-${theme}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="320" height="200" fill="url(#g-${theme})"/>`;
  const stars = (n, c) => { let s = "", k = 3; for (let i = 0; i < n; i++) { k = (k * 37 + 11) % 997; s += `<circle cx="${(k * 7) % 320}" cy="${(k * 3) % 120}" r="${(k % 3) * .5 + .6}" fill="${c}" opacity=".7"/>`; } return s; };
  if (theme === "diwali") {
    let diyas = ""; [70, 160, 250].forEach((x, i) => {
      diyas += `<ellipse cx="${x}" cy="${150 - i % 2 * 10}" rx="34" ry="13" fill="#C4562A"/><path d="M${x - 34} ${148 - i % 2 * 10} Q${x} ${178 - i % 2 * 10} ${x + 34} ${148 - i % 2 * 10}Z" fill="#E07A3F"/>
      <path d="M${x} ${136 - i % 2 * 10} C${x - 10} ${120 - i % 2 * 10} ${x - 4} ${104 - i % 2 * 10} ${x} ${96 - i % 2 * 10} C${x + 4} ${104 - i % 2 * 10} ${x + 10} ${120 - i % 2 * 10} ${x} ${136 - i % 2 * 10}Z" fill="#FFD27A"/>
      <circle cx="${x}" cy="${118 - i % 2 * 10}" r="26" fill="#FFD27A" opacity=".18"/>`; });
    let rangoli = ""; for (let i = 0; i < 12; i++) rangoli += `<ellipse cx="160" cy="46" rx="6" ry="22" fill="${["#F9B233", "#E0306A", "#00A0AA"][i % 3]}" opacity=".85" transform="rotate(${i * 30} 160 68)"/>`;
    return `<svg viewBox="0 0 320 200" aria-hidden="true">${sky("#6A1234", "#2A0716")}${stars(30, "#FFD27A")}<circle cx="160" cy="68" r="10" fill="#FFD27A"/>${rangoli}${diyas}</svg>`;
  }
  if (theme === "christmas") {
    let snow = ""; for (let i = 0; i < 40; i++) snow += `<circle cx="${(i * 53) % 320}" cy="${(i * 29) % 200}" r="${i % 3 + 1}" fill="#fff" opacity=".6"/>`;
    return `<svg viewBox="0 0 320 200" aria-hidden="true">${sky("#0F4A3A", "#06221B")}${snow}
      <polygon points="160,40 210,110 110,110" fill="#2E8B57"/><polygon points="160,70 225,150 95,150" fill="#237A4B"/><polygon points="160,105 240,185 80,185" fill="#1B6B40"/>
      <rect x="150" y="185" width="20" height="15" fill="#7A4A2A"/><polygon points="160,24 165,36 178,36 168,44 172,57 160,49 148,57 152,44 142,36 155,36" fill="#F5CE62"/>
      <circle cx="140" cy="128" r="6" fill="#E8473C"/><circle cx="186" cy="140" r="6" fill="#F5CE62"/><circle cx="125" cy="170" r="6" fill="#F5CE62"/><circle cx="200" cy="172" r="6" fill="#E8473C"/><circle cx="165" cy="95" r="5" fill="#E8473C"/></svg>`;
  }
  if (theme === "newyear") {
    const burst = (x, y, c, r) => { let s = ""; for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; s += `<line x1="${x + Math.cos(a) * r * .3}" y1="${y + Math.sin(a) * r * .3}" x2="${x + Math.cos(a) * r}" y2="${y + Math.sin(a) * r}" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`; } return s; };
    return `<svg viewBox="0 0 320 200" aria-hidden="true">${sky("#1D2A66", "#0A0F2C")}${stars(40, "#E9D7A6")}${burst(80, 60, "#F5CE62", 38)}${burst(240, 52, "#E0306A", 32)}${burst(170, 92, "#2BC1C9", 26)}
      <text x="160" y="178" text-anchor="middle" font-family="Fredoka, Poppins, sans-serif" font-weight="700" font-size="54" fill="#F5CE62">2027</text></svg>`;
  }
  if (theme === "clay") {
    return `<svg viewBox="0 0 320 240" aria-hidden="true"><rect width="320" height="240" fill="#F3E3CF"/>
      <ellipse cx="90" cy="150" rx="52" ry="40" fill="#E07A3F"/><ellipse cx="90" cy="120" rx="30" ry="26" fill="#E8925C"/>
      <circle cx="210" cy="140" r="44" fill="#00A0AA"/><circle cx="196" cy="128" r="6" fill="#fff"/><circle cx="224" cy="128" r="6" fill="#fff"/><path d="M196 154 Q210 166 224 154" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>
      <rect x="120" y="180" width="84" height="26" rx="13" fill="#6A3FA0"/><circle cx="268" cy="196" r="16" fill="#F9B233"/><circle cx="40" cy="206" r="12" fill="#E0306A"/></svg>`;
  }
  if (theme === "tiedye") {
    let rings = ""; const c = ["#E0306A", "#F08C00", "#F9B233", "#00A0AA", "#6A3FA0"];
    for (let i = 9; i >= 0; i--) rings += `<circle cx="160" cy="120" r="${i * 22 + 12}" fill="${c[i % 5]}" opacity=".9"/>`;
    let spokes = ""; for (let i = 0; i < 12; i++) spokes += `<path d="M160 120 L${160 + Math.cos(i * Math.PI / 6) * 260} ${120 + Math.sin(i * Math.PI / 6) * 260}" stroke="#fff" stroke-width="7" opacity=".35"/>`;
    return `<svg viewBox="0 0 320 240" aria-hidden="true"><rect width="320" height="240" fill="#6A3FA0"/>${rings}${spokes}</svg>`;
  }
  return `<svg viewBox="0 0 320 200" aria-hidden="true">${sky("#26305E", "#11152E")}${stars(40, "#E3C27F")}</svg>`;
}
