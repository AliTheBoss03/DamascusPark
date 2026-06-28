const P = require("pptxgenjs");
const pres = new P();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
pres.author = "Mawqif";
pres.title = "Mawqif — Damascus Smart Parking · Phase-1 Pitch";

// ── Palette (navy + gold; gold = currency/value) ─────────────
const NAVY = "0B1220";
const NAVY2 = "14213D";
const WHITE = "FFFFFF";
const INK = "0F172A";
const MUTED = "64748B";
const FAINT = "94A3B8";
const GOLD = "D4A017";
const AMBER = "F59E0B";
const CARD = "F4F7FB";
const LINE = "E2E8F0";
const RED = "EF4444";
const GREEN = "22C55E";

const TITLE_FONT = "Cambria";
const BODY = "Calibri";
const W = 13.33, H = 7.5, M = 0.7;

const sh = () => ({ type: "outer", color: "0B1220", blur: 9, offset: 3, angle: 90, opacity: 0.16 });

// Brand "م" mark in a gold disc
function brandMark(slide, x, y, d) {
  slide.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: GOLD } });
  slide.addText("م", { x, y: y - 0.02, w: d, h: d, align: "center", valign: "middle", fontFace: TITLE_FONT, bold: true, fontSize: d * 26, color: NAVY });
}

function footer(slide, n, dark) {
  const c = dark ? FAINT : MUTED;
  slide.addText("Mawqif · موقف   ·   Damascus Smart Parking", { x: M, y: H - 0.42, w: 8, h: 0.3, fontFace: BODY, fontSize: 9, color: c, margin: 0 });
  slide.addText(String(n), { x: W - M - 0.6, y: H - 0.42, w: 0.6, h: 0.3, fontFace: BODY, fontSize: 9, color: c, align: "right", margin: 0 });
}

// Section title for light content slides
function lightTitle(slide, kicker, title) {
  brandMark(slide, M, 0.55, 0.5);
  slide.addText(kicker.toUpperCase(), { x: M + 0.72, y: 0.5, w: 11, h: 0.3, fontFace: BODY, bold: true, fontSize: 11, color: GOLD, charSpacing: 3, margin: 0 });
  slide.addText(title, { x: M + 0.72, y: 0.78, w: 11.6, h: 0.8, fontFace: TITLE_FONT, bold: true, fontSize: 30, color: INK, margin: 0 });
}

function card(slide, x, y, w, h, fill) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.09, fill: { color: fill || WHITE }, line: { color: LINE, width: 1 }, shadow: sh() });
}

// ============================================================
// 1 · TITLE
// ============================================================
let s = pres.addSlide();
s.background = { color: NAVY };
s.addShape(pres.shapes.OVAL, { x: 9.7, y: -2.2, w: 6.5, h: 6.5, fill: { color: NAVY2 } });
s.addShape(pres.shapes.OVAL, { x: 11.4, y: 4.2, w: 4.2, h: 4.2, fill: { color: "0E1A33" } });
brandMark(s, M, 0.7, 0.95);
s.addText("MAWQIF · موقف", { x: M, y: 2.45, w: 11, h: 0.5, fontFace: BODY, bold: true, fontSize: 14, color: GOLD, charSpacing: 4, margin: 0 });
s.addText("Smart Parking for Damascus", { x: M, y: 2.95, w: 11.2, h: 1.1, fontFace: TITLE_FONT, bold: true, fontSize: 48, color: WHITE, margin: 0 });
s.addText("Inflation-proof revenue · Real-time enforcement · Built sovereign.", { x: M, y: 4.15, w: 11.2, h: 0.5, fontFace: BODY, fontSize: 19, color: "CBD5E1", margin: 0 });
s.addShape(pres.shapes.LINE, { x: M, y: 5.25, w: 3.2, h: 0, line: { color: GOLD, width: 2 } });
s.addText("Phase-1 Pitch  ·  Damascus Municipality & Ministry of Transport  ·  2026", { x: M, y: 5.45, w: 11.5, h: 0.4, fontFace: BODY, fontSize: 13, color: FAINT, margin: 0 });
s.addText("Live demo:  damascus-park.vercel.app", { x: M, y: 6.6, w: 11, h: 0.4, fontFace: BODY, bold: true, fontSize: 13, color: AMBER, margin: 0 });
s.addNotes("Open warm and direct. Mawqif is a working, deployed platform — not a slide-ware concept. The three words on screen are the whole thesis: revenue that survives inflation, enforcement the city can see in real time, and infrastructure that stays sovereign. Invite them to open the live link on their phones during the talk.");

// ============================================================
// 2 · PROBLEM
// ============================================================
s = pres.addSlide(); s.background = { color: WHITE };
lightTitle(s, "The opportunity", "Damascus is leaving money on the street.");
const probs = [
  ["Cash-only", "On-street parking runs on cash and paper. Collection is informal and impossible to audit."],
  ["No visibility", "The city has no real-time view of occupancy, revenue, or where enforcement is needed."],
  ["Inflation erodes tariffs", "A fixed price in SYP loses meaning within months — revenue silently shrinks in real terms."],
  ["Leakage & disputes", "Untracked cash invites leakage and driver disputes, with no record to settle them."],
];
let cx = M, cw = 2.86, gap = 0.22, cy = 2.0, ch = 3.7;
probs.forEach((p, i) => {
  const x = M + i * (cw + gap);
  card(s, x, cy, cw, ch, CARD);
  s.addShape(pres.shapes.OVAL, { x: x + 0.3, y: cy + 0.32, w: 0.5, h: 0.5, fill: { color: "FBEFC9" } });
  s.addText(String(i + 1), { x: x + 0.3, y: cy + 0.3, w: 0.5, h: 0.5, align: "center", valign: "middle", fontFace: TITLE_FONT, bold: true, fontSize: 18, color: GOLD, margin: 0 });
  s.addText(p[0], { x: x + 0.28, y: cy + 1.0, w: cw - 0.56, h: 0.8, fontFace: TITLE_FONT, bold: true, fontSize: 18, color: INK, margin: 0 });
  s.addText(p[1], { x: x + 0.28, y: cy + 1.7, w: cw - 0.56, h: 1.8, fontFace: BODY, fontSize: 13.5, color: MUTED, margin: 0, lineSpacingMultiple: 1.05 });
});
s.addText([
  { text: "The result:  ", options: { bold: true, color: INK } },
  { text: "a real public asset that generates little formal revenue — and no data to manage it with.", options: { color: MUTED } },
], { x: M, y: 6.05, w: 12, h: 0.5, fontFace: BODY, fontSize: 15, margin: 0 });
footer(s, 2, false);
s.addNotes("Frame parking as an under-monetized public asset, not a nuisance. The four cards are the status quo. Land the bottom line: today the city owns the curb but captures little of its value and gets no data from it.");

// ============================================================
// 3 · WHY NOW
// ============================================================
s = pres.addSlide(); s.background = { color: WHITE };
lightTitle(s, "Why now", "The moment to digitize is now.");
const now = [
  ["Institutions are being rebuilt", "The post-2024 transition is actively modernizing public administration — a rare window to set the digital standard from the start."],
  ["A national digital push", "The e-government portal (egov.sy) and the Ministry of Transport's own digital-services program are already underway."],
  ["A unified vehicle network + new plates", "Transport directorates now share a central network and a new plate model is rolling out in Damascus first — the rails for enforcement exist."],
];
now.forEach((p, i) => {
  const y = 2.05 + i * 1.5;
  card(s, M, y, 12.0, 1.34, WHITE);
  s.addShape(pres.shapes.OVAL, { x: M + 0.35, y: y + 0.37, w: 0.6, h: 0.6, fill: { color: NAVY } });
  s.addText(String(i + 1), { x: M + 0.35, y: y + 0.37, w: 0.6, h: 0.6, align: "center", valign: "middle", fontFace: TITLE_FONT, bold: true, fontSize: 20, color: GOLD, margin: 0 });
  s.addText(p[0], { x: M + 1.25, y: y + 0.2, w: 10.5, h: 0.5, fontFace: TITLE_FONT, bold: true, fontSize: 18, color: INK, margin: 0 });
  s.addText(p[1], { x: M + 1.25, y: y + 0.66, w: 10.6, h: 0.6, fontFace: BODY, fontSize: 13.5, color: MUTED, margin: 0 });
});
footer(s, 3, false);
s.addNotes("This slide answers 'why not in two years.' Three real tailwinds: institutional rebuild, an active national digitization agenda, and the new central vehicle network + plate rollout. Mawqif plugs into momentum that already exists rather than asking the city to start from zero.");

// ============================================================
// 4 · SOLUTION (dark section)
// ============================================================
s = pres.addSlide(); s.background = { color: NAVY };
s.addShape(pres.shapes.OVAL, { x: -2.2, y: 4.4, w: 6, h: 6, fill: { color: NAVY2 } });
brandMark(s, M, 0.6, 0.55);
s.addText("THE SOLUTION", { x: M + 0.78, y: 0.62, w: 10, h: 0.35, fontFace: BODY, bold: true, fontSize: 12, color: GOLD, charSpacing: 3, margin: 0 });
s.addText("Mawqif is the city's parking operating system.", { x: M, y: 1.35, w: 11.8, h: 1.0, fontFace: TITLE_FONT, bold: true, fontSize: 32, color: WHITE, margin: 0 });
s.addText("One platform connects drivers, wardens, and the municipality — turning every curbside space into auditable, inflation-resilient revenue.", { x: M, y: 2.45, w: 11.6, h: 0.7, fontFace: BODY, fontSize: 16, color: "CBD5E1", margin: 0 });
const pillars = [
  ["Pay", "Drivers park and pay from a prepaid wallet — topped up by vouchers and local payment rails, no foreign cards."],
  ["Enforce", "Wardens check any plate in seconds against the vehicle registry and issue fines on the spot."],
  ["Govern", "Admins set one gas-pegged price and watch live revenue, occupancy, and the city's share in real time."],
];
pillars.forEach((p, i) => {
  const x = M + i * (3.95 + 0.2), y = 3.6;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 3.95, h: 2.9, rectRadius: 0.09, fill: { color: NAVY2 }, line: { color: "23304D", width: 1 } });
  s.addShape(pres.shapes.OVAL, { x: x + 0.35, y: y + 0.35, w: 0.7, h: 0.7, fill: { color: GOLD } });
  s.addText(["Pay", "Enforce", "Govern"][i][0], { x: x + 0.35, y: y + 0.33, w: 0.7, h: 0.7, align: "center", valign: "middle", fontFace: TITLE_FONT, bold: true, fontSize: 24, color: NAVY, margin: 0 });
  s.addText(p[0], { x: x + 0.35, y: y + 1.2, w: 3.2, h: 0.5, fontFace: TITLE_FONT, bold: true, fontSize: 21, color: WHITE, margin: 0 });
  s.addText(p[1], { x: x + 0.35, y: y + 1.72, w: 3.3, h: 1.1, fontFace: BODY, fontSize: 13, color: "AEBBD0", margin: 0, lineSpacingMultiple: 1.04 });
});
footer(s, 4, true);
s.addNotes("This is the one-sentence pitch: the city's parking operating system. Pay / Enforce / Govern map to the three apps you'll demo. Keep it tight — this slide sets up the live walkthrough.");

// ============================================================
// 5 · HOW IT WORKS
// ============================================================
s = pres.addSlide(); s.background = { color: WHITE };
lightTitle(s, "How it works", "From curb to city treasury in one flow.");
const steps = [
  ["Park", "Driver pulls in and opens Mawqif."],
  ["Start", "Picks the zone (GPS-suggested); price is set by the live gas index."],
  ["Pay", "Time is billed from the prepaid wallet — no cash, no meter."],
  ["Enforce", "Warden scans the plate; no active session = instant fine."],
  ["Settle", "Revenue splits to the city in real time, fully audited."],
];
const sw = 2.3, sgap = 0.2, sy = 2.7;
steps.forEach((st, i) => {
  const x = M + i * (sw + sgap);
  card(s, x, sy, sw, 2.5, CARD);
  s.addShape(pres.shapes.OVAL, { x: x + sw / 2 - 0.4, y: sy + 0.35, w: 0.8, h: 0.8, fill: { color: NAVY } });
  s.addText(String(i + 1), { x: x + sw / 2 - 0.4, y: sy + 0.35, w: 0.8, h: 0.8, align: "center", valign: "middle", fontFace: TITLE_FONT, bold: true, fontSize: 26, color: GOLD, margin: 0 });
  s.addText(st[0], { x: x + 0.15, y: sy + 1.3, w: sw - 0.3, h: 0.45, align: "center", fontFace: TITLE_FONT, bold: true, fontSize: 18, color: INK, margin: 0 });
  s.addText(st[1], { x: x + 0.18, y: sy + 1.74, w: sw - 0.36, h: 0.7, align: "center", fontFace: BODY, fontSize: 12.5, color: MUTED, margin: 0, lineSpacingMultiple: 1.03 });
  if (i < steps.length - 1) s.addText("›", { x: x + sw - 0.06, y: sy + 0.7, w: sgap + 0.12, h: 0.6, align: "center", valign: "middle", fontFace: BODY, bold: true, fontSize: 26, color: GOLD, margin: 0 });
});
s.addText([
  { text: "Every step is logged. ", options: { bold: true, color: INK } },
  { text: "The city gets a complete, tamper-evident record of every session and every dinar.", options: { color: MUTED } },
], { x: M, y: 5.75, w: 12, h: 0.5, fontFace: BODY, fontSize: 15, align: "center", margin: 0 });
footer(s, 5, false);
s.addNotes("Walk the five steps as a story of a single driver. Emphasize that the same flow that serves the driver also produces the audit trail the city has never had. This is where you cut to the live demo if time allows.");

// ============================================================
// 6 · ALREADY BUILT
// ============================================================
s = pres.addSlide(); s.background = { color: WHITE };
lightTitle(s, "Traction", "Not a concept — a working platform, live today.");
const feats = [
  ["Three role apps", "Driver, Warden, and Admin experiences — each scoped to exactly what that user needs."],
  ["Arabic-first, bilingual", "Native right-to-left UI in Arabic, one tap to English, light & dark themes."],
  ["Live interactive map", "Real Damascus map with geo-fenced Red / Yellow / Green zones and live location."],
  ["Prepaid wallet & ledger", "Voucher top-ups, gas-pegged charging, and an append-only audit ledger."],
  ["Hardened & secure", "Role-based access and row-level security on every table; idempotent payments."],
  ["Deployed & $0 stack", "Running on open-source infrastructure — no licenses, no foreign API keys."],
];
const gw = 3.9, gh = 1.62, ggx = 0.2, ggy = 0.2, gx0 = M, gy0 = 2.05;
feats.forEach((f, i) => {
  const col = i % 3, row = Math.floor(i / 3);
  const x = gx0 + col * (gw + ggx), y = gy0 + row * (gh + ggy);
  card(s, x, y, gw, gh, WHITE);
  s.addShape(pres.shapes.OVAL, { x: x + 0.28, y: y + 0.3, w: 0.42, h: 0.42, fill: { color: GOLD } });
  s.addText("✓", { x: x + 0.28, y: y + 0.29, w: 0.42, h: 0.42, align: "center", valign: "middle", fontFace: BODY, bold: true, fontSize: 15, color: NAVY, margin: 0 });
  s.addText(f[0], { x: x + 0.85, y: y + 0.26, w: gw - 1.05, h: 0.5, fontFace: TITLE_FONT, bold: true, fontSize: 15.5, color: INK, margin: 0 });
  s.addText(f[1], { x: x + 0.85, y: y + 0.74, w: gw - 1.05, h: 0.78, fontFace: BODY, fontSize: 12, color: MUTED, margin: 0, lineSpacingMultiple: 1.02 });
});
s.addText([
  { text: "Try it now:  ", options: { bold: true, color: INK } },
  { text: "damascus-park.vercel.app", options: { bold: true, color: GOLD } },
  { text: "   —  driver@mawqif.sy / warden@mawqif.sy / admin@mawqif.sy  ·  Demo@Mawqif2025!", options: { color: MUTED } },
], { x: M, y: 6.25, w: 12.2, h: 0.4, fontFace: BODY, fontSize: 12.5, align: "center", margin: 0 });
footer(s, 6, false);
s.addNotes("De-risk the decision: this already exists and runs. Hand them the demo credentials and let them poke at the admin price control live. The $0 open-source stack line matters for both budget and sanctions resilience.");

// ============================================================
// 7 · INFLATION-PROOF PRICING (chart)
// ============================================================
s = pres.addSlide(); s.background = { color: WHITE };
lightTitle(s, "The differentiator", "Tariffs that hold their value.");
s.addText([
  { text: "Mawqif never stores a fixed price. Every zone's rate is ", options: { color: INK } },
  { text: "pegged to the gasoline price index", options: { bold: true, color: GOLD } },
  { text: ":", options: { color: INK } },
], { x: M, y: 1.85, w: 6.0, h: 0.7, fontFace: BODY, fontSize: 16, margin: 0, lineSpacingMultiple: 1.1 });
card(s, M, 2.6, 5.9, 1.0, CARD);
s.addText("hourly rate  =  (gas price ÷ 1000)  ×  zone ratio", { x: M + 0.2, y: 2.6, w: 5.5, h: 1.0, align: "center", valign: "middle", fontFace: "Consolas", bold: true, fontSize: 15, color: NAVY, margin: 0 });
[["When fuel doubles, parking tariffs double — automatically.", GOLD],
 ["Admin changes ONE number; every zone re-prices instantly.", NAVY],
 ["Revenue tracks real value instead of eroding in SYP.", NAVY]].forEach((t, i) => {
  const y = 3.95 + i * 0.62;
  s.addShape(pres.shapes.OVAL, { x: M + 0.05, y: y + 0.07, w: 0.16, h: 0.16, fill: { color: t[1] } });
  s.addText(t[0], { x: M + 0.35, y: y - 0.05, w: 5.7, h: 0.5, fontFace: BODY, fontSize: 14, color: INK, margin: 0 });
});
s.addChart(pres.charts.BAR, [
  { name: "Gas 5,000 SYP/L", labels: ["Red", "Yellow", "Green"], values: [15, 10, 5] },
  { name: "Gas 10,000 SYP/L", labels: ["Red", "Yellow", "Green"], values: [30, 20, 10] },
], {
  x: 7.0, y: 1.9, w: 5.6, h: 4.6, barDir: "col",
  chartColors: [FAINT, GOLD], showLegend: true, legendPos: "t", legendColor: MUTED, legendFontFace: BODY, legendFontSize: 11,
  showTitle: true, title: "Hourly rate (credits) by zone", titleColor: INK, titleFontFace: TITLE_FONT, titleFontSize: 13,
  catAxisLabelColor: MUTED, catAxisLabelFontFace: BODY, valAxisLabelColor: MUTED,
  valGridLine: { color: LINE, size: 0.5 }, catGridLine: { style: "none" },
  showValue: true, dataLabelPosition: "outEnd", dataLabelColor: INK, dataLabelFontFace: BODY, dataLabelFontSize: 10,
  barGapWidthPct: 60, valAxisHidden: true,
});
footer(s, 7, false);
s.addNotes("This is the slide that wins the room. Make the point plainly: in a high-inflation economy, a fixed tariff is a slow-motion revenue loss. The peg means the city never has to pass a new fee schedule again — it tracks fuel automatically. The chart shows rates doubling with fuel.");

// ============================================================
// 8 · SOVEREIGN & SECURE (dark)
// ============================================================
s = pres.addSlide(); s.background = { color: NAVY };
s.addShape(pres.shapes.OVAL, { x: 10.4, y: 3.6, w: 6, h: 6, fill: { color: NAVY2 } });
brandMark(s, M, 0.6, 0.55);
s.addText("SOVEREIGN BY DESIGN", { x: M + 0.78, y: 0.62, w: 10, h: 0.35, fontFace: BODY, bold: true, fontSize: 12, color: GOLD, charSpacing: 3, margin: 0 });
s.addText("Independent of foreign rails, secure by default.", { x: M, y: 1.25, w: 11.8, h: 0.9, fontFace: TITLE_FONT, bold: true, fontSize: 30, color: WHITE, margin: 0 });
const sov = [
  ["Local payment rails", "Top-ups via the national payment network and prepaid vouchers — no Visa / Mastercard dependency."],
  ["Data stays in-country", "A government-controllable database; no reliance on foreign-owned cloud identity."],
  ["Sanctions-resilient", "Built entirely on open-source software and free OpenStreetMap tiles — nothing to license or lose."],
  ["Bank-grade security", "Role-based access, row-level security on every table, idempotent payments, append-only audit ledger."],
];
sov.forEach((p, i) => {
  const col = i % 2, row = Math.floor(i / 2);
  const x = M + col * (5.9 + 0.2), y = 2.45 + row * 1.95;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 5.9, h: 1.75, rectRadius: 0.08, fill: { color: NAVY2 }, line: { color: "23304D", width: 1 } });
  s.addShape(pres.shapes.OVAL, { x: x + 0.3, y: y + 0.3, w: 0.55, h: 0.55, fill: { color: GOLD } });
  s.addText("✓", { x: x + 0.3, y: y + 0.27, w: 0.55, h: 0.55, align: "center", valign: "middle", fontFace: BODY, bold: true, fontSize: 18, color: NAVY, margin: 0 });
  s.addText(p[0], { x: x + 1.05, y: y + 0.26, w: 4.6, h: 0.45, fontFace: TITLE_FONT, bold: true, fontSize: 17, color: WHITE, margin: 0 });
  s.addText(p[1], { x: x + 1.05, y: y + 0.72, w: 4.65, h: 0.95, fontFace: BODY, fontSize: 12.5, color: "AEBBD0", margin: 0, lineSpacingMultiple: 1.03 });
});
footer(s, 8, true);
s.addNotes("Sovereignty is the argument a foreign vendor can't make. Money moves on local rails, data stays under government control, and because the whole stack is open-source there is nothing a sanction can switch off. Then close on security: this was engineered to bank standards, not bolted on.");

// ============================================================
// 9 · BUSINESS MODEL + ROI
// ============================================================
s = pres.addSlide(); s.background = { color: WHITE };
lightTitle(s, "The business case", "A self-funding model — the city earns from day one.");
s.addText([
  { text: "Zero upfront cost. ", options: { bold: true, color: INK } },
  { text: "Mawqif is paid only as revenue is collected — a transparent revenue share.", options: { color: MUTED } },
], { x: M, y: 1.8, w: 5.7, h: 0.7, fontFace: BODY, fontSize: 15, margin: 0, lineSpacingMultiple: 1.08 });
s.addChart(pres.charts.DOUGHNUT, [
  { name: "Split", labels: ["City (60%)", "Platform (40%)"], values: [60, 40] },
], {
  x: 0.5, y: 2.5, w: 5.6, h: 4.0, holeSize: 62,
  chartColors: [GOLD, NAVY], showLegend: true, legendPos: "b", legendColor: MUTED, legendFontFace: BODY, legendFontSize: 12,
  showValue: false, showPercent: true, dataLabelColor: WHITE, dataLabelFontFace: BODY, dataLabelFontSize: 13, dataLabelPosition: "ctr",
  showTitle: true, title: "Revenue split", titleColor: INK, titleFontFace: TITLE_FONT, titleFontSize: 13,
});
// ROI table
card(s, 6.7, 2.0, 5.95, 4.4, WHITE);
s.addText("Illustrative pilot economics", { x: 6.95, y: 2.2, w: 5.5, h: 0.4, fontFace: TITLE_FONT, bold: true, fontSize: 16, color: INK, margin: 0 });
const roi = [
  [{ text: "Input", options: { bold: true, color: WHITE, fill: { color: NAVY }, fontFace: BODY, fontSize: 12.5, align: "left" } }, { text: "Value", options: { bold: true, color: WHITE, fill: { color: NAVY }, fontFace: BODY, fontSize: 12.5, align: "right" } }],
  ["Managed spaces (3 pilot zones)", "1,000"],
  ["Paid hours / space / day", "5"],
  ["Blended rate @ gas 5,000 SYP/L", "≈ 10,000 SYP/hr"],
  ["Operating days / month", "30"],
  [{ text: "Gross monthly collection", options: { bold: true, color: INK } }, { text: "≈ 1.5 B SYP", options: { bold: true, color: INK, align: "right" } }],
  [{ text: "City share (60%)", options: { bold: true, color: "7A5C00" } }, { text: "≈ 0.9 B SYP", options: { bold: true, color: GOLD, align: "right" } }],
];
s.addTable(roi, {
  x: 6.95, y: 2.7, w: 5.45, colW: [3.75, 1.7], rowH: 0.42,
  fontFace: BODY, fontSize: 12.5, color: INK, valign: "middle",
  border: { type: "solid", pt: 0.5, color: LINE }, align: "left",
});
s.addText("Illustrative model — figures scale with verified municipal occupancy data. Even at half these assumptions, the city nets new formal revenue with no capital outlay.", { x: 6.95, y: 5.95, w: 5.5, h: 0.6, fontFace: BODY, italic: true, fontSize: 10.5, color: MUTED, margin: 0, lineSpacingMultiple: 1.02 });
footer(s, 9, false);
s.addNotes("Lead with the risk reversal: no upfront cost, the city is the majority partner at 60%. Be explicit that the table is illustrative and the real number depends on their occupancy data — offer to re-run it with their figures. The point is the structure: the city earns from day one and the platform only earns when the city does.");

// ============================================================
// 10 · WHY THE CITY WINS
// ============================================================
s = pres.addSlide(); s.background = { color: WHITE };
lightTitle(s, "Value to the municipality", "What the city gains.");
const wins = [
  ["New formal revenue", "Convert an informal, cash asset into auditable income — majority share to the city."],
  ["Transparency & anti-leakage", "Every session and dinar is logged; the cash-skim problem disappears."],
  ["Real enforcement data", "Live occupancy and compliance by zone — deploy wardens where they're needed."],
  ["Better citizen experience", "No coins, no disputes; a modern, Arabic-first service citizens are proud of."],
  ["Digital jobs", "Wardens become equipped digital field officers; new roles in operations."],
  ["Smart-city foundation", "A clean data layer to extend into permits, congestion, and mobility planning."],
];
wins.forEach((wn, i) => {
  const col = i % 3, row = Math.floor(i / 3);
  const x = M + col * (3.9 + 0.2), y = 2.05 + row * 2.05;
  card(s, x, y, 3.9, 1.85, CARD);
  s.addShape(pres.shapes.OVAL, { x: x + 0.3, y: y + 0.32, w: 0.5, h: 0.5, fill: { color: "FBEFC9" } });
  s.addText(String(i + 1), { x: x + 0.3, y: y + 0.3, w: 0.5, h: 0.5, align: "center", valign: "middle", fontFace: TITLE_FONT, bold: true, fontSize: 17, color: GOLD, margin: 0 });
  s.addText(wn[0], { x: x + 0.3, y: y + 0.92, w: 3.3, h: 0.45, fontFace: TITLE_FONT, bold: true, fontSize: 16, color: INK, margin: 0 });
  s.addText(wn[1], { x: x + 0.3, y: y + 1.34, w: 3.35, h: 0.5, fontFace: BODY, fontSize: 12, color: MUTED, margin: 0, lineSpacingMultiple: 1.0 });
});
footer(s, 10, false);
s.addNotes("Speak to the decision-makers' mandate: revenue, transparency/anti-corruption, and visible service improvement for citizens. The last two cards — jobs and a smart-city data foundation — turn a parking app into a strategic platform play.");

// ============================================================
// 11 · WHY MAWQIF (comparison)
// ============================================================
s = pres.addSlide(); s.background = { color: WHITE };
lightTitle(s, "Build vs. buy", "Why this platform, and why now.");
const hdr = (t, fill) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: fill }, fontFace: BODY, fontSize: 13, align: "center", valign: "middle" } });
const cellC = (t, bold) => ({ text: t, options: { color: bold ? INK : MUTED, bold: !!bold, fontFace: BODY, fontSize: 12, align: "center", valign: "middle" } });
const cellM = (t) => ({ text: t, options: { color: "7A5C00", bold: true, fill: { color: "FBEFC9" }, fontFace: BODY, fontSize: 12, align: "center", valign: "middle" } });
const cmp = [
  [hdr("Criterion", NAVY2), hdr("Mawqif", GOLD), hdr("Build in-house", NAVY2), hdr("Foreign vendor", NAVY2)],
  [cellC("Time to launch", true), cellM("90 days (live now)"), cellC("12–18 months"), cellC("6–12 months")],
  [cellC("Upfront cost", true), cellM("None — revenue share"), cellC("High capex"), cellC("License + FX")],
  [cellC("Arabic-first / RTL", true), cellM("Native"), cellC("Build it"), cellC("Rarely")],
  [cellC("Sovereign data & payments", true), cellM("Yes — in-country"), cellC("Maybe"), cellC("No")],
  [cellC("Inflation-pegged tariffs", true), cellM("Built-in"), cellC("Build it"), cellC("No")],
  [cellC("Sanctions-resilient", true), cellM("Yes — open-source"), cellC("Depends"), cellC("Exposed")],
];
s.addTable(cmp, {
  x: M, y: 2.05, w: 12.0, colW: [3.3, 3.0, 2.85, 2.85], rowH: 0.6,
  border: { type: "solid", pt: 0.5, color: LINE }, valign: "middle",
});
footer(s, 11, false);
s.addNotes("Pre-empt the two alternatives. Building in-house is slow and ties up capital the city would rather not spend; a foreign vendor fails on sovereignty, FX cost, and sanctions exposure. Mawqif is the only column that's green down the line — and it's already running.");

// ============================================================
// 12 · ROADMAP
// ============================================================
s = pres.addSlide(); s.background = { color: WHITE };
lightTitle(s, "Rollout", "A phased path from pilot to national.");
const phases = [
  ["Phase 1", "90-day pilot", "Shaalan, Mezzeh & Kafarsouseh. Prove revenue, enforcement, and citizen uptake on a live dashboard."],
  ["Phase 2", "Damascus-wide", "Scale zones across the capital; integrate the national payment network and onboard the warden corps."],
  ["Phase 3", "National + registry", "Extend to other governorates and wire the live Ministry of Transport vehicle registry."],
];
s.addShape(pres.shapes.LINE, { x: M + 1.0, y: 3.35, w: 10.2, h: 0, line: { color: LINE, width: 2 } });
phases.forEach((ph, i) => {
  const x = M + i * 4.1;
  s.addShape(pres.shapes.OVAL, { x: x + 0.55, y: 2.95, w: 0.8, h: 0.8, fill: { color: i === 0 ? GOLD : NAVY } });
  s.addText(String(i + 1), { x: x + 0.55, y: 2.95, w: 0.8, h: 0.8, align: "center", valign: "middle", fontFace: TITLE_FONT, bold: true, fontSize: 24, color: i === 0 ? NAVY : GOLD, margin: 0 });
  card(s, x, 4.0, 3.75, 2.2, i === 0 ? CARD : WHITE);
  s.addText(ph[0].toUpperCase(), { x: x + 0.3, y: 4.2, w: 3.2, h: 0.3, fontFace: BODY, bold: true, fontSize: 11, color: GOLD, charSpacing: 2, margin: 0 });
  s.addText(ph[1], { x: x + 0.3, y: 4.48, w: 3.2, h: 0.5, fontFace: TITLE_FONT, bold: true, fontSize: 19, color: INK, margin: 0 });
  s.addText(ph[2], { x: x + 0.3, y: 5.0, w: 3.25, h: 1.1, fontFace: BODY, fontSize: 12.5, color: MUTED, margin: 0, lineSpacingMultiple: 1.04 });
});
footer(s, 12, false);
s.addNotes("Make the ask feel small and safe: we're only asking for Phase 1. Phases 2 and 3 show there's a credible path to scale and to the real registry integration, but the decision today is just a contained 90-day pilot in three named zones.");

// ============================================================
// 13 · THE ASK (dark close)
// ============================================================
s = pres.addSlide(); s.background = { color: NAVY };
s.addShape(pres.shapes.OVAL, { x: 9.4, y: -2.4, w: 7, h: 7, fill: { color: NAVY2 } });
brandMark(s, M, 0.65, 0.7);
s.addText("THE ASK", { x: M + 0.95, y: 0.78, w: 8, h: 0.4, fontFace: BODY, bold: true, fontSize: 13, color: GOLD, charSpacing: 3, margin: 0 });
s.addText("Approve a 90-day pilot in three Damascus zones.", { x: M, y: 1.7, w: 11.8, h: 1.4, fontFace: TITLE_FONT, bold: true, fontSize: 33, color: WHITE, margin: 0, lineSpacingMultiple: 1.0 });
s.addText("WHAT WE NEED FROM YOU", { x: M, y: 3.25, w: 5.6, h: 0.3, fontFace: BODY, bold: true, fontSize: 12, color: GOLD, charSpacing: 2, margin: 0 });
s.addText([
  { text: "Authorization for 3 pilot zones", options: { bullet: true, breakLine: true, color: "E2E8F0" } },
  { text: "Enforcement coordination (wardens)", options: { bullet: true, breakLine: true, color: "E2E8F0" } },
  { text: "Intro to the national payment network", options: { bullet: true, breakLine: true, color: "E2E8F0" } },
  { text: "A path to the MoT vehicle registry", options: { bullet: true, color: "E2E8F0" } },
], { x: M, y: 3.6, w: 5.6, h: 2.0, fontFace: BODY, fontSize: 14.5, paraSpaceAfter: 6, margin: 0 });
s.addText("WHAT YOU GET", { x: 7.1, y: 3.25, w: 5.6, h: 0.3, fontFace: BODY, bold: true, fontSize: 12, color: GOLD, charSpacing: 2, margin: 0 });
s.addText([
  { text: "Live revenue + dashboard in 90 days", options: { bullet: true, breakLine: true, color: "E2E8F0" } },
  { text: "Zero upfront cost — pay as you collect", options: { bullet: true, breakLine: true, color: "E2E8F0" } },
  { text: "60% of every dinar, fully audited", options: { bullet: true, breakLine: true, color: "E2E8F0" } },
  { text: "A sovereign asset the city owns", options: { bullet: true, color: "E2E8F0" } },
], { x: 7.1, y: 3.6, w: 5.6, h: 2.0, fontFace: BODY, fontSize: 14.5, paraSpaceAfter: 6, margin: 0 });
s.addShape(pres.shapes.LINE, { x: M, y: 6.05, w: 11.9, h: 0, line: { color: "23304D", width: 1 } });
s.addText([
  { text: "See it live today:  ", options: { color: FAINT } },
  { text: "damascus-park.vercel.app", options: { bold: true, color: AMBER } },
], { x: M, y: 6.25, w: 11.9, h: 0.5, fontFace: BODY, fontSize: 16, margin: 0 });
s.addNotes("Close with a small, concrete, low-risk ask: a contained 90-day pilot. Read the two columns as a trade — four lightweight things from them, four substantial things back, with the city carrying no financial risk. End by putting the live URL on screen and inviting them to open it now.");

pres.writeFile({ fileName: "Mawqif-Pitch.pptx" }).then((f) => console.log("WROTE", f));
