const P = require("pptxgenjs");
const pres = new P();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
pres.rtlMode = true;
pres.author = "Mawqif";
pres.title = "موقف — مواقف دمشق الذكية · عرض المرحلة الأولى";

// ── Palette ──────────────────────────────────────────────────
const NAVY = "0B1220", NAVY2 = "14213D", WHITE = "FFFFFF", INK = "0F172A";
const MUTED = "64748B", FAINT = "94A3B8", GOLD = "D4A017", AMBER = "F59E0B";
const CARD = "F4F7FB", LINE = "E2E8F0", RED = "EF4444", GREEN = "22C55E";

const TITLE_FONT = "Cambria", BODY = "Calibri";
const SW = 13.33, H = 7.5, M = 0.7;
const rx = (x, w) => SW - x - w; // horizontal mirror for RTL layout
const sh = () => ({ type: "outer", color: "0B1220", blur: 9, offset: 3, angle: 90, opacity: 0.16 });

// Right-aligned RTL text
function rt(slide, text, x, y, w, h, o) {
  slide.addText(text, Object.assign({ x: rx(x, w), y, w, h, align: "right", rtlMode: true, fontFace: BODY, margin: 0 }, o || {}));
}
function brandMark(slide, lx, y, d) {
  slide.addShape(pres.shapes.OVAL, { x: rx(lx, d), y, w: d, h: d, fill: { color: GOLD } });
  slide.addText("م", { x: rx(lx, d), y: y - 0.02, w: d, h: d, align: "center", valign: "middle", fontFace: TITLE_FONT, bold: true, fontSize: d * 26, color: NAVY });
}
function footer(slide, n, dark) {
  const c = dark ? FAINT : MUTED;
  rt(slide, "موقف · مواقف دمشق الذكية", M, H - 0.42, 8, 0.3, { fontSize: 10, color: c });
  slide.addText(String(n), { x: M, y: H - 0.42, w: 0.6, h: 0.3, align: "left", fontFace: BODY, fontSize: 9, color: c, margin: 0 });
}
function lightTitle(slide, kicker, title) {
  brandMark(slide, M, 0.55, 0.5);
  rt(slide, kicker, M + 0.72, 0.5, 11, 0.3, { bold: true, fontSize: 12.5, color: GOLD });
  rt(slide, title, M + 0.72, 0.78, 11.6, 0.85, { bold: true, fontSize: 30, color: INK, fontFace: TITLE_FONT });
}
function card(slide, lx, y, w, h, fill) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: rx(lx, w), y, w, h, rectRadius: 0.09, fill: { color: fill || WHITE }, line: { color: LINE, width: 1 }, shadow: sh() });
}
// disc with number, placed at the RIGHT corner of a card whose mirrored left-x is X
function disc(slide, X, w, y, d, fill, num, numColor) {
  const dx = X + w - 0.3 - d;
  slide.addShape(pres.shapes.OVAL, { x: dx, y, w: d, h: d, fill: { color: fill } });
  slide.addText(String(num), { x: dx, y, w: d, h: d, align: "center", valign: "middle", fontFace: TITLE_FONT, bold: true, fontSize: d * 34, color: numColor });
}

// ============================================================ 1 · TITLE
let s = pres.addSlide(); s.background = { color: NAVY };
s.addShape(pres.shapes.OVAL, { x: -2.8, y: -2.2, w: 6.5, h: 6.5, fill: { color: NAVY2 } });
s.addShape(pres.shapes.OVAL, { x: -2.3, y: 4.2, w: 4.2, h: 4.2, fill: { color: "0E1A33" } });
brandMark(s, M, 0.7, 0.95);
rt(s, "موقف · MAWQIF", M, 2.45, 11, 0.5, { bold: true, fontSize: 15, color: GOLD });
rt(s, "مواقف ذكية لمدينة دمشق", M, 2.95, 11.4, 1.1, { bold: true, fontSize: 46, color: WHITE, fontFace: TITLE_FONT });
rt(s, "إيرادات محصّنة من التضخم · إنفاذ فوري · بنية سيادية", M, 4.2, 11.4, 0.5, { fontSize: 19, color: "CBD5E1" });
s.addShape(pres.shapes.LINE, { x: rx(M, 3.2), y: 5.25, w: 3.2, h: 0, line: { color: GOLD, width: 2 } });
rt(s, "عرض المرحلة الأولى  ·  مجلس مدينة دمشق ووزارة النقل  ·  2026", M, 5.45, 11.6, 0.4, { fontSize: 13, color: FAINT });
rt(s, "العرض المباشر:  damascus-park.vercel.app", M, 6.6, 11, 0.4, { bold: true, fontSize: 13, color: AMBER });
s.addNotes("ابدأ بثقة ومباشرة: موقف منصّة عاملة ومنشورة فعلاً — لا مجرد شرائح. الكلمات الثلاث على الشاشة هي الأطروحة كاملة: إيراد يصمد أمام التضخم، وإنفاذ تراه المدينة آنياً، وبنية تبقى سيادية. ادعُ الحضور لفتح الرابط على هواتفهم.");

// ============================================================ 2 · PROBLEM
s = pres.addSlide(); s.background = { color: WHITE };
lightTitle(s, "الفرصة", "دمشق تترك المال على الرصيف.");
const probs = [
  ["نقدي بالكامل", "إدارة المواقف تعتمد على النقد والورق — تحصيل غير رسمي يستحيل تدقيقه."],
  ["غياب الرؤية", "لا تملك المدينة رؤية آنية للإشغال أو الإيرادات أو مواضع الحاجة للإنفاذ."],
  ["التضخم يأكل التعرفة", "السعر الثابت بالليرة يفقد معناه خلال أشهر — تتآكل الإيرادات فعلياً بصمت."],
  ["تسرّب ونزاعات", "النقد غير المتعقَّب يفتح باب التسرّب ونزاعات السائقين دون سجلّ لحسمها."],
];
let cw = 2.86, gap = 0.22, cy = 2.0, ch = 3.7;
probs.forEach((p, i) => {
  const lx = M + i * (cw + gap), X = rx(lx, cw);
  card(s, lx, cy, cw, ch, CARD);
  slide_disc_light(s, X, cw, cy + 0.32, i + 1);
  rt(s, p[0], lx + 0.28, cy + 1.0, cw - 0.56, 0.8, { bold: true, fontSize: 18, color: INK, fontFace: TITLE_FONT });
  rt(s, p[1], lx + 0.28, cy + 1.7, cw - 0.56, 1.8, { fontSize: 13.5, color: MUTED, lineSpacingMultiple: 1.06 });
});
s.addText([
  { text: "النتيجة: ", options: { bold: true, color: INK } },
  { text: "أصل عام حقيقي يدرّ إيراداً رسمياً ضئيلاً — وبلا بيانات لإدارته.", options: { color: MUTED } },
], { x: rx(M, 12), y: 6.05, w: 12, h: 0.5, align: "right", rtlMode: true, fontFace: BODY, fontSize: 15, margin: 0 });
footer(s, 2, false);
s.addNotes("قدّم المواقف بوصفها أصلاً عاماً غير مستثمَر، لا مجرد إزعاج. البطاقات الأربع هي الوضع الراهن. اختم بالخلاصة: اليوم تملك المدينة الرصيف لكنها لا تلتقط قيمته ولا تحصل منه على أي بيانات.");

function slide_disc_light(slide, X, w, y, num) {
  const d = 0.5, dx = X + w - 0.3 - d;
  slide.addShape(pres.shapes.OVAL, { x: dx, y, w: d, h: d, fill: { color: "FBEFC9" } });
  slide.addText(String(num), { x: dx, y, w: d, h: d, align: "center", valign: "middle", fontFace: TITLE_FONT, bold: true, fontSize: 18, color: GOLD, margin: 0 });
}

// ============================================================ 3 · WHY NOW
s = pres.addSlide(); s.background = { color: WHITE };
lightTitle(s, "لماذا الآن", "لحظة الرقمنة هي الآن.");
const now = [
  ["إعادة بناء المؤسسات", "تشهد المرحلة الانتقالية بعد 2024 تحديثاً فعلياً للإدارة العامة — نافذة نادرة لإرساء المعيار الرقمي من البداية."],
  ["دفعة رقمية وطنية", "بوابة الحكومة الإلكترونية (egov.sy) وبرنامج الخدمات الرقمية لوزارة النقل قيد التنفيذ بالفعل."],
  ["شبكة مركبات موحّدة ولوحات جديدة", "تتشارك مديريات النقل شبكة مركزية، ويجري طرح نموذج لوحات جديد في دمشق أولاً — بنية الإنفاذ موجودة."],
];
now.forEach((p, i) => {
  const y = 2.05 + i * 1.5, lx = M, X = rx(lx, 12.0);
  card(s, lx, y, 12.0, 1.34, WHITE);
  const d = 0.6, dx = X + 12.0 - 0.35 - d;
  s.addShape(pres.shapes.OVAL, { x: dx, y: y + 0.37, w: d, h: d, fill: { color: NAVY } });
  s.addText(String(i + 1), { x: dx, y: y + 0.37, w: d, h: d, align: "center", valign: "middle", fontFace: TITLE_FONT, bold: true, fontSize: 20, color: GOLD, margin: 0 });
  rt(s, p[0], lx + 0.3, y + 0.2, 10.4, 0.5, { bold: true, fontSize: 18, color: INK, fontFace: TITLE_FONT });
  rt(s, p[1], lx + 0.3, y + 0.66, 10.4, 0.6, { fontSize: 13.5, color: MUTED });
});
footer(s, 3, false);
s.addNotes("هذه الشريحة تجيب عن سؤال «لماذا ليس بعد سنتين». ثلاثة عوامل دافعة حقيقية: إعادة بناء المؤسسات، أجندة رقمنة وطنية نشطة، وشبكة المركبات المركزية الجديدة مع طرح اللوحات. موقف يتّصل بزخم قائم بدل أن يطلب من المدينة البدء من الصفر.");

// ============================================================ 4 · SOLUTION (dark)
s = pres.addSlide(); s.background = { color: NAVY };
s.addShape(pres.shapes.OVAL, { x: SW - 3.8, y: 4.4, w: 6, h: 6, fill: { color: NAVY2 } });
brandMark(s, M, 0.6, 0.55);
rt(s, "الحل", M + 0.78, 0.62, 10, 0.35, { bold: true, fontSize: 13, color: GOLD });
rt(s, "موقف هو نظام تشغيل المواقف للمدينة.", M, 1.35, 11.8, 1.0, { bold: true, fontSize: 32, color: WHITE, fontFace: TITLE_FONT });
rt(s, "منصّة واحدة تربط السائقين والحرّاس والبلدية — وتحوّل كل موقف على الرصيف إلى إيراد قابل للتدقيق ومحصَّن من التضخم.", M, 2.45, 11.6, 0.7, { fontSize: 16, color: "CBD5E1" });
const pillars = [
  ["ادفع", "يركن السائق ويدفع من محفظة مسبقة الدفع — تُشحن بالقسائم وقنوات الدفع المحلية، دون بطاقات أجنبية."],
  ["أنفِذ", "يفحص الحارس أي لوحة خلال ثوانٍ مقابل سجلّ المركبات ويصدر المخالفة فوراً."],
  ["احكم", "يضبط المدير سعراً واحداً مرتبطاً بالوقود ويراقب الإيراد والإشغال وحصة المدينة آنياً."],
];
pillars.forEach((p, i) => {
  const lx = M + i * (3.95 + 0.2), X = rx(lx, 3.95), y = 3.6;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: X, y, w: 3.95, h: 2.9, rectRadius: 0.09, fill: { color: NAVY2 }, line: { color: "23304D", width: 1 } });
  const d = 0.7, dx = X + 3.95 - 0.35 - d;
  s.addShape(pres.shapes.OVAL, { x: dx, y: y + 0.35, w: d, h: d, fill: { color: GOLD } });
  s.addText(String(i + 1), { x: dx, y: y + 0.35, w: d, h: d, align: "center", valign: "middle", fontFace: TITLE_FONT, bold: true, fontSize: 24, color: NAVY, margin: 0 });
  rt(s, p[0], lx + 0.35, y + 1.2, 3.25, 0.5, { bold: true, fontSize: 21, color: WHITE, fontFace: TITLE_FONT });
  rt(s, p[1], lx + 0.35, y + 1.72, 3.25, 1.1, { fontSize: 13, color: "AEBBD0", lineSpacingMultiple: 1.05 });
});
footer(s, 4, true);
s.addNotes("هذه هي الجملة المحورية: نظام تشغيل المواقف للمدينة. «ادفع / أنفِذ / احكم» تقابل التطبيقات الثلاثة في العرض الحيّ. أبقِها موجزة — فهي تمهّد للجولة المباشرة.");

// ============================================================ 5 · HOW IT WORKS
s = pres.addSlide(); s.background = { color: WHITE };
lightTitle(s, "كيف يعمل", "من الرصيف إلى خزينة المدينة في مسار واحد.");
const steps = [
  ["اركن", "يتوقّف السائق ويفتح تطبيق موقف."],
  ["ابدأ", "يختار المنطقة (باقتراح من GPS)؛ ويُحدَّد السعر بمؤشر الوقود الحيّ."],
  ["ادفع", "تُحتسب المدة من المحفظة المسبقة — بلا نقد وبلا عدّاد."],
  ["أنفِذ", "يمسح الحارس اللوحة؛ لا جلسة فعّالة = مخالفة فورية."],
  ["سَوِّ", "تُقسَّم الإيرادات للمدينة آنياً وبتدقيق كامل."],
];
const sw = 2.3, sgap = 0.2, sy = 2.7;
steps.forEach((st, i) => {
  const lx = M + i * (sw + sgap), X = rx(lx, sw);
  card(s, lx, sy, sw, 2.5, CARD);
  s.addShape(pres.shapes.OVAL, { x: X + sw / 2 - 0.4, y: sy + 0.35, w: 0.8, h: 0.8, fill: { color: NAVY } });
  s.addText(String(i + 1), { x: X + sw / 2 - 0.4, y: sy + 0.35, w: 0.8, h: 0.8, align: "center", valign: "middle", fontFace: TITLE_FONT, bold: true, fontSize: 26, color: GOLD, margin: 0 });
  s.addText(st[0], { x: X + 0.15, y: sy + 1.3, w: sw - 0.3, h: 0.45, align: "center", rtlMode: true, fontFace: TITLE_FONT, bold: true, fontSize: 18, color: INK, margin: 0 });
  s.addText(st[1], { x: X + 0.18, y: sy + 1.74, w: sw - 0.36, h: 0.7, align: "center", rtlMode: true, fontFace: BODY, fontSize: 12.5, color: MUTED, margin: 0, lineSpacingMultiple: 1.05 });
  if (i < steps.length - 1) s.addText("‹", { x: X - sgap - 0.06, y: sy + 0.7, w: sgap + 0.12, h: 0.6, align: "center", valign: "middle", fontFace: BODY, bold: true, fontSize: 26, color: GOLD, margin: 0 });
});
s.addText([
  { text: "كل خطوة مسجّلة. ", options: { bold: true, color: INK } },
  { text: "تحصل المدينة على سجلّ كامل يصعب العبث به لكل جلسة وكل ليرة.", options: { color: MUTED } },
], { x: 0.5, y: 5.75, w: 12.33, h: 0.5, align: "center", rtlMode: true, fontFace: BODY, fontSize: 15, margin: 0 });
footer(s, 5, false);
s.addNotes("اسرد الخطوات الخمس كقصة سائق واحد. شدّد على أن المسار نفسه الذي يخدم السائق يُنتج سجلّ التدقيق الذي لم تملكه المدينة من قبل. هنا تنتقل إلى العرض الحيّ إن سمح الوقت.");

// ============================================================ 6 · TRACTION
s = pres.addSlide(); s.background = { color: WHITE };
lightTitle(s, "الإنجاز", "ليست فكرة — منصّة عاملة ومتاحة اليوم.");
const feats = [
  ["ثلاثة تطبيقات بحسب الدور", "تجارب للسائق والحارس والمدير — كلٌّ مصمّمة لما يحتاجه ذلك المستخدم بالضبط."],
  ["عربية أولاً، وثنائية اللغة", "واجهة عربية أصيلة من اليمين لليسار، وزر واحد للإنجليزية، ووضعان فاتح وداكن."],
  ["خريطة تفاعلية حيّة", "خريطة دمشق حقيقية بمناطق محدّدة جغرافياً (حمراء وصفراء وخضراء) وموقع مباشر."],
  ["محفظة مسبقة ودفتر قيود", "شحن بالقسائم، وتسعير مرتبط بالوقود، ودفتر قيود إلحاقي للتدقيق."],
  ["محصّنة وآمنة", "تحكّم بالوصول حسب الدور وأمان على مستوى الصفوف لكل جدول؛ ومدفوعات مانعة للتكرار."],
  ["منشورة وبتكلفة بنية صفرية", "تعمل على بنية مفتوحة المصدر — بلا تراخيص وبلا مفاتيح خدمات أجنبية."],
];
const gw = 3.9, gh = 1.62, ggx = 0.2, ggy = 0.2, gy0 = 2.05;
feats.forEach((f, i) => {
  const col = i % 3, row = Math.floor(i / 3);
  const lx = M + col * (gw + ggx), X = rx(lx, gw), y = gy0 + row * (gh + ggy);
  card(s, lx, y, gw, gh, WHITE);
  const dd = 0.42, dx = X + gw - 0.28 - dd;
  s.addShape(pres.shapes.OVAL, { x: dx, y: y + 0.3, w: dd, h: dd, fill: { color: GOLD } });
  s.addText("✓", { x: dx, y: y + 0.3, w: dd, h: dd, align: "center", valign: "middle", fontFace: BODY, bold: true, fontSize: 15, color: NAVY, margin: 0 });
  rt(s, f[0], lx + 0.28, y + 0.26, gw - 1.05, 0.5, { bold: true, fontSize: 15, color: INK, fontFace: TITLE_FONT });
  rt(s, f[1], lx + 0.28, y + 0.74, gw - 1.05, 0.78, { fontSize: 12, color: MUTED, lineSpacingMultiple: 1.03 });
});
s.addText([
  { text: "جرّبها الآن:  ", options: { bold: true, color: INK } },
  { text: "damascus-park.vercel.app", options: { bold: true, color: GOLD } },
  { text: "  ·  driver@ / warden@ / admin@mawqif.sy  ·  Demo@Mawqif2025!", options: { color: MUTED } },
], { x: 0.5, y: 6.3, w: 12.33, h: 0.4, align: "center", fontFace: BODY, fontSize: 12.5, margin: 0 });
footer(s, 6, false);
s.addNotes("قلّل المخاطرة عن القرار: المنصّة موجودة وتعمل. سلّمهم بيانات الدخول ودعهم يجرّبون التحكّم بالسعر في تطبيق المدير مباشرة. سطر البنية الصفرية مفتوحة المصدر مهمّ للميزانية ولمناعة العقوبات معاً.");

// ============================================================ 7 · PRICING (chart)
s = pres.addSlide(); s.background = { color: WHITE };
lightTitle(s, "الميزة الفارقة", "تعرفة تحافظ على قيمتها.");
rt(s, "موقف لا يخزّن سعراً ثابتاً أبداً. سعر كل منطقة مرتبط بمؤشر سعر البنزين:", M, 1.85, 6.0, 0.7, { fontSize: 16, color: INK, lineSpacingMultiple: 1.1 });
card(s, M, 2.6, 5.9, 1.0, CARD);
s.addText("سعر الساعة  =  ( سعر البنزين ÷ 1000 )  ×  معامل المنطقة", { x: rx(M, 5.9), y: 2.6, w: 5.9, h: 1.0, align: "center", valign: "middle", rtlMode: true, fontFace: BODY, bold: true, fontSize: 15, color: NAVY, margin: 0 });
[["حين يتضاعف الوقود، تتضاعف تعرفة المواقف — تلقائياً.", GOLD],
 ["يغيّر المدير رقماً واحداً؛ فتُعاد تسعيرة كل المناطق فوراً.", NAVY],
 ["الإيراد يلاحق القيمة الحقيقية بدل أن يتآكل بالليرة.", NAVY]].forEach((t, i) => {
  const y = 3.95 + i * 0.62;
  s.addShape(pres.shapes.OVAL, { x: rx(M + 0.05, 0.16), y: y + 0.07, w: 0.16, h: 0.16, fill: { color: t[1] } });
  rt(s, t[0], M + 0.35, y - 0.05, 5.5, 0.5, { fontSize: 14, color: INK });
});
s.addChart(pres.charts.BAR, [
  { name: "بنزين 5,000 ل.س/ل", labels: ["حمراء", "صفراء", "خضراء"], values: [15, 10, 5] },
  { name: "بنزين 10,000 ل.س/ل", labels: ["حمراء", "صفراء", "خضراء"], values: [30, 20, 10] },
], {
  x: rx(7.0, 5.6), y: 1.9, w: 5.6, h: 4.6, barDir: "col",
  chartColors: [FAINT, GOLD], showLegend: true, legendPos: "t", legendColor: MUTED, legendFontFace: BODY, legendFontSize: 11,
  showTitle: true, title: "سعر الساعة (نقاط) حسب المنطقة", titleColor: INK, titleFontFace: BODY, titleFontSize: 13,
  catAxisLabelColor: MUTED, catAxisLabelFontFace: BODY, valGridLine: { color: LINE, size: 0.5 }, catGridLine: { style: "none" },
  showValue: true, dataLabelPosition: "outEnd", dataLabelColor: INK, dataLabelFontFace: BODY, dataLabelFontSize: 10,
  barGapWidthPct: 60, valAxisHidden: true,
});
footer(s, 7, false);
s.addNotes("هذه الشريحة تكسب القاعة. قُل المعنى بوضوح: في اقتصاد تضخّمي، التعرفة الثابتة خسارة إيراد بطيئة. الربط يعني أن المدينة لن تحتاج أبداً لإصدار جدول رسوم جديد — يتتبّع الوقود تلقائياً. الرسم يُظهر تضاعف الأسعار مع الوقود.");

// ============================================================ 8 · SOVEREIGN (dark)
s = pres.addSlide(); s.background = { color: NAVY };
s.addShape(pres.shapes.OVAL, { x: -3.0, y: 3.6, w: 6, h: 6, fill: { color: NAVY2 } });
brandMark(s, M, 0.6, 0.55);
rt(s, "سيادية بالتصميم", M + 0.78, 0.62, 10, 0.35, { bold: true, fontSize: 13, color: GOLD });
rt(s, "مستقلّة عن القنوات الأجنبية، وآمنة افتراضياً.", M, 1.25, 11.8, 0.9, { bold: true, fontSize: 30, color: WHITE, fontFace: TITLE_FONT });
const sov = [
  ["قنوات دفع محلية", "شحن عبر شبكة الدفع الوطنية والقسائم — دون اعتماد على فيزا أو ماستركارد."],
  ["البيانات تبقى داخل البلد", "قاعدة بيانات قابلة لتحكّم الحكومة؛ دون اعتماد على هويّة سحابية أجنبية."],
  ["صامدة أمام العقوبات", "مبنية كلياً على برمجيات مفتوحة المصدر وخرائط OpenStreetMap المجانية — لا شيء يُرخَّص أو يُفقَد."],
  ["أمان بمستوى المصارف", "تحكّم بالوصول حسب الدور، وأمان على مستوى الصفوف لكل جدول، ومدفوعات مانعة للتكرار، ودفتر تدقيق إلحاقي."],
];
sov.forEach((p, i) => {
  const col = i % 2, row = Math.floor(i / 2);
  const lx = M + col * (5.9 + 0.2), X = rx(lx, 5.9), y = 2.45 + row * 1.95;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: X, y, w: 5.9, h: 1.75, rectRadius: 0.08, fill: { color: NAVY2 }, line: { color: "23304D", width: 1 } });
  const d = 0.55, dx = X + 5.9 - 0.3 - d;
  s.addShape(pres.shapes.OVAL, { x: dx, y: y + 0.3, w: d, h: d, fill: { color: GOLD } });
  s.addText("✓", { x: dx, y: y + 0.3, w: d, h: d, align: "center", valign: "middle", fontFace: BODY, bold: true, fontSize: 18, color: NAVY, margin: 0 });
  rt(s, p[0], lx + 0.3, y + 0.26, 4.95, 0.45, { bold: true, fontSize: 17, color: WHITE, fontFace: TITLE_FONT });
  rt(s, p[1], lx + 0.3, y + 0.72, 4.95, 0.95, { fontSize: 12.5, color: "AEBBD0", lineSpacingMultiple: 1.04 });
});
footer(s, 8, true);
s.addNotes("السيادة هي الحجّة التي لا يستطيع المورّد الأجنبي تقديمها. المال يتحرّك على قنوات محلية، والبيانات تبقى تحت سيطرة الحكومة، ولأن البنية كلها مفتوحة المصدر فلا شيء تستطيع عقوبة إيقافه. ثم اختم بالأمان: صُمّم بمعايير مصرفية لا مُلحقاً لاحقاً.");

// ============================================================ 9 · BUSINESS CASE
s = pres.addSlide(); s.background = { color: WHITE };
lightTitle(s, "الجدوى الاقتصادية", "نموذج ذاتي التمويل — المدينة تربح من اليوم الأول.");
s.addText([
  { text: "بلا كلفة مسبقة. ", options: { bold: true, color: INK } },
  { text: "لا يتقاضى موقف إلا مع تحصيل الإيراد — تقاسم شفّاف للإيرادات.", options: { color: MUTED } },
], { x: rx(M, 5.7), y: 1.8, w: 5.7, h: 0.7, align: "right", rtlMode: true, fontFace: BODY, fontSize: 15, margin: 0, lineSpacingMultiple: 1.08 });
s.addChart(pres.charts.DOUGHNUT, [
  { name: "التقاسم", labels: ["المدينة (60%)", "المنصّة (40%)"], values: [60, 40] },
], {
  x: rx(0.5, 5.6), y: 2.5, w: 5.6, h: 4.0, holeSize: 62,
  chartColors: [GOLD, NAVY], showLegend: true, legendPos: "b", legendColor: MUTED, legendFontFace: BODY, legendFontSize: 12,
  showPercent: true, dataLabelColor: WHITE, dataLabelFontFace: BODY, dataLabelFontSize: 13, dataLabelPosition: "ctr",
  showTitle: true, title: "تقاسم الإيراد", titleColor: INK, titleFontFace: BODY, titleFontSize: 13,
});
card(s, 6.7, 2.0, 5.95, 4.4, WHITE);
const tcx = rx(6.7, 5.95);
s.addText("اقتصاديات تجريبية إرشادية", { x: tcx + 0.25, y: 2.2, w: 5.45, h: 0.4, align: "right", rtlMode: true, fontFace: TITLE_FONT, bold: true, fontSize: 16, color: INK, margin: 0 });
const hL = (t) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: NAVY }, fontFace: BODY, fontSize: 12.5, align: "right" } });
const cL = (t, b) => ({ text: t, options: { color: b ? INK : MUTED, bold: !!b, fontFace: BODY, fontSize: 12.5, align: "right" } });
const cG = (t) => ({ text: t, options: { color: GOLD, bold: true, fontFace: BODY, fontSize: 12.5, align: "right" } });
const roi = [
  [hL("القيمة"), hL("البند")],
  [cL("1,000"), cL("مواقف مُدارة (3 مناطق تجريبية)", true)],
  [cL("5"), cL("ساعات مدفوعة / موقف / يوم", true)],
  [cL("≈ 10,000 ل.س/س"), cL("سعر مرجّح عند بنزين 5,000 ل.س/ل", true)],
  [cL("30"), cL("أيام التشغيل / شهر", true)],
  [cL("≈ 1.5 مليار ل.س", true), cL("إجمالي التحصيل الشهري", true)],
  [cG("≈ 0.9 مليار ل.س"), { text: "حصة المدينة (60%)", options: { color: "7A5C00", bold: true, fontFace: BODY, fontSize: 12.5, align: "right" } }],
];
s.addTable(roi, { x: tcx + 0.25, y: 2.7, w: 5.45, colW: [1.7, 3.75], rowH: 0.42, valign: "middle", border: { type: "solid", pt: 0.5, color: LINE }, rtlMode: true });
s.addText("نموذج إرشادي — تتغيّر الأرقام مع بيانات الإشغال البلدية الفعلية. وحتى عند نصف هذه الفرضيات، تجني المدينة إيراداً رسمياً جديداً دون أي إنفاق رأسمالي.", { x: tcx + 0.25, y: 5.95, w: 5.45, h: 0.6, align: "right", rtlMode: true, fontFace: BODY, italic: true, fontSize: 10.5, color: MUTED, margin: 0, lineSpacingMultiple: 1.03 });
footer(s, 9, false);
s.addNotes("ابدأ بعكس المخاطرة: لا كلفة مسبقة، والمدينة هي الشريك الأكبر بنسبة 60%. كن صريحاً بأن الجدول إرشادي وأن الرقم الحقيقي يعتمد على بيانات إشغالهم — واعرض إعادة احتسابه بأرقامهم. الفكرة في البنية: المدينة تربح من اليوم الأول والمنصّة لا تربح إلا حين تربح المدينة.");

// ============================================================ 10 · CITY WINS
s = pres.addSlide(); s.background = { color: WHITE };
lightTitle(s, "القيمة للبلدية", "ما الذي تكسبه المدينة.");
const wins = [
  ["إيراد رسمي جديد", "تحويل أصل نقدي غير رسمي إلى دخل قابل للتدقيق — بحصة الأغلبية للمدينة."],
  ["شفافية ومنع التسرّب", "كل جلسة وكل ليرة مسجّلة؛ تختفي مشكلة اقتطاع النقد."],
  ["بيانات إنفاذ حقيقية", "إشغال وامتثال آنيان حسب المنطقة — انشر الحرّاس حيث يَلزمون."],
  ["تجربة أفضل للمواطن", "بلا قطع نقدية وبلا نزاعات؛ خدمة عصرية عربية أولاً يفخر بها المواطن."],
  ["وظائف رقمية", "يصبح الحرّاس ضباط ميدان رقميين مجهَّزين؛ وأدوار جديدة في التشغيل."],
  ["أساس للمدينة الذكية", "طبقة بيانات نظيفة تمتدّ إلى التراخيص والازدحام وتخطيط التنقّل."],
];
wins.forEach((wn, i) => {
  const col = i % 3, row = Math.floor(i / 3);
  const lx = M + col * (3.9 + 0.2), X = rx(lx, 3.9), y = 2.05 + row * 2.05;
  card(s, lx, y, 3.9, 1.85, CARD);
  slide_disc_light(s, X, 3.9, y + 0.32, i + 1);
  rt(s, wn[0], lx + 0.3, y + 0.92, 3.3, 0.45, { bold: true, fontSize: 16, color: INK, fontFace: TITLE_FONT });
  rt(s, wn[1], lx + 0.3, y + 1.34, 3.3, 0.5, { fontSize: 12, color: MUTED });
});
footer(s, 10, false);
s.addNotes("خاطب تفويض صنّاع القرار: الإيراد، والشفافية ومكافحة الفساد، وتحسين الخدمة الملموس للمواطن. البطاقتان الأخيرتان — الوظائف وأساس بيانات المدينة الذكية — تحوّلان تطبيق مواقف إلى منصّة استراتيجية.");

// ============================================================ 11 · BUILD VS BUY
s = pres.addSlide(); s.background = { color: WHITE };
lightTitle(s, "بناء أم شراء", "لماذا هذه المنصّة، ولماذا الآن.");
const hdr = (t, fill) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: fill }, fontFace: BODY, fontSize: 13, align: "center", valign: "middle" } });
const cc = (t, b) => ({ text: t, options: { color: b ? INK : MUTED, bold: !!b, fontFace: BODY, fontSize: 12, align: "center", valign: "middle" } });
const cm = (t) => ({ text: t, options: { color: "7A5C00", bold: true, fill: { color: "FBEFC9" }, fontFace: BODY, fontSize: 12, align: "center", valign: "middle" } });
// RTL: reverse columns so "المعيار" is rightmost
const rows = [
  [hdr("مورّد أجنبي", NAVY2), hdr("بناء داخلي", NAVY2), hdr("موقف", GOLD), hdr("المعيار", NAVY2)],
  [cc("6–12 شهراً"), cc("12–18 شهراً"), cm("90 يوماً (حيّ الآن)"), cc("زمن الإطلاق", true)],
  [cc("ترخيص + صرف أجنبي"), cc("إنفاق رأسمالي مرتفع"), cm("لا شيء — تقاسم إيراد"), cc("الكلفة المسبقة", true)],
  [cc("نادراً"), cc("تُبنى"), cm("أصيلة"), cc("عربية أولاً / RTL", true)],
  [cc("لا"), cc("ربما"), cm("نعم — داخل البلد"), cc("بيانات ودفع سياديان", true)],
  [cc("لا"), cc("تُبنى"), cm("مدمجة"), cc("تعرفة مرتبطة بالتضخم", true)],
  [cc("معرّضة"), cc("يعتمد"), cm("نعم — مفتوحة المصدر"), cc("صمود أمام العقوبات", true)],
];
s.addTable(rows, { x: rx(M, 12.0), y: 2.05, w: 12.0, colW: [2.85, 2.85, 3.0, 3.3], rowH: 0.6, valign: "middle", border: { type: "solid", pt: 0.5, color: LINE }, rtlMode: true });
footer(s, 11, false);
s.addNotes("استبق البديلين. البناء الداخلي بطيء ويجمّد رأس مال تفضّل المدينة عدم إنفاقه؛ والمورّد الأجنبي يسقط في السيادة وكلفة الصرف والتعرّض للعقوبات. موقف هو العمود الوحيد الأخضر بالكامل — وهو يعمل بالفعل.");

// ============================================================ 12 · ROADMAP
s = pres.addSlide(); s.background = { color: WHITE };
lightTitle(s, "خطة الإطلاق", "مسار متدرّج من التجربة إلى المستوى الوطني.");
const phases = [
  ["المرحلة 1", "تجربة 90 يوماً", "شعلان والمزة وكفرسوسة. إثبات الإيراد والإنفاذ وإقبال المواطنين على لوحة حيّة."],
  ["المرحلة 2", "دمشق بالكامل", "توسيع المناطق في العاصمة؛ ودمج شبكة الدفع الوطنية وتأهيل سلك الحرّاس."],
  ["المرحلة 3", "وطني + السجل", "التوسّع إلى محافظات أخرى وربط سجلّ مركبات وزارة النقل الحيّ."],
];
s.addShape(pres.shapes.LINE, { x: rx(M + 1.0, 10.2), y: 3.35, w: 10.2, h: 0, line: { color: LINE, width: 2 } });
phases.forEach((ph, i) => {
  const lx = M + i * 4.1, X = rx(lx, 3.75);
  const dx = X + 3.75 / 2 - 0.4;
  s.addShape(pres.shapes.OVAL, { x: dx, y: 2.95, w: 0.8, h: 0.8, fill: { color: i === 0 ? GOLD : NAVY } });
  s.addText(String(i + 1), { x: dx, y: 2.95, w: 0.8, h: 0.8, align: "center", valign: "middle", fontFace: TITLE_FONT, bold: true, fontSize: 24, color: i === 0 ? NAVY : GOLD, margin: 0 });
  card(s, lx, 4.0, 3.75, 2.2, i === 0 ? CARD : WHITE);
  rt(s, ph[0], lx + 0.3, 4.2, 3.15, 0.3, { bold: true, fontSize: 12, color: GOLD });
  rt(s, ph[1], lx + 0.3, 4.48, 3.15, 0.5, { bold: true, fontSize: 19, color: INK, fontFace: TITLE_FONT });
  rt(s, ph[2], lx + 0.3, 5.0, 3.15, 1.1, { fontSize: 12.5, color: MUTED, lineSpacingMultiple: 1.05 });
});
footer(s, 12, false);
s.addNotes("اجعل الطلب يبدو صغيراً وآمناً: نطلب المرحلة الأولى فقط. المرحلتان 2 و3 تُظهران مساراً موثوقاً للتوسّع ولربط السجل الحقيقي، لكن القرار اليوم مجرّد تجربة محصورة 90 يوماً في ثلاث مناطق مسمّاة.");

// ============================================================ 13 · THE ASK (dark)
s = pres.addSlide(); s.background = { color: NAVY };
s.addShape(pres.shapes.OVAL, { x: -3.1, y: -2.4, w: 7, h: 7, fill: { color: NAVY2 } });
brandMark(s, M, 0.65, 0.7);
rt(s, "الطلب", M + 0.95, 0.78, 8, 0.4, { bold: true, fontSize: 13, color: GOLD });
rt(s, "اعتمدوا تجربة لمدة 90 يوماً في ثلاث مناطق بدمشق.", M, 1.7, 11.8, 1.4, { bold: true, fontSize: 33, color: WHITE, fontFace: TITLE_FONT });
rt(s, "ما نحتاجه منكم", M, 3.25, 5.6, 0.3, { bold: true, fontSize: 13, color: GOLD });
s.addText([
  { text: "تفويض بثلاث مناطق تجريبية", options: { bullet: true, breakLine: true } },
  { text: "تنسيق الإنفاذ (الحرّاس)", options: { bullet: true, breakLine: true } },
  { text: "تعريف بشبكة الدفع الوطنية", options: { bullet: true, breakLine: true } },
  { text: "مسار إلى سجلّ مركبات وزارة النقل", options: { bullet: true } },
], { x: rx(M, 5.6), y: 3.6, w: 5.6, h: 2.0, align: "right", rtlMode: true, fontFace: BODY, fontSize: 14.5, color: "E2E8F0", paraSpaceAfter: 6, margin: 0 });
rt(s, "ما تحصلون عليه", 7.1, 3.25, 5.6, 0.3, { bold: true, fontSize: 13, color: GOLD });
s.addText([
  { text: "إيراد حيّ ولوحة تحكّم خلال 90 يوماً", options: { bullet: true, breakLine: true } },
  { text: "بلا كلفة مسبقة — الدفع مع التحصيل", options: { bullet: true, breakLine: true } },
  { text: "60% من كل ليرة، بتدقيق كامل", options: { bullet: true, breakLine: true } },
  { text: "أصل سيادي تملكه المدينة", options: { bullet: true } },
], { x: rx(7.1, 5.6), y: 3.6, w: 5.6, h: 2.0, align: "right", rtlMode: true, fontFace: BODY, fontSize: 14.5, color: "E2E8F0", paraSpaceAfter: 6, margin: 0 });
s.addShape(pres.shapes.LINE, { x: rx(M, 11.9), y: 6.05, w: 11.9, h: 0, line: { color: "23304D", width: 1 } });
s.addText([
  { text: "damascus-park.vercel.app", options: { bold: true, color: AMBER } },
  { text: "  :شاهدوها مباشرة اليوم", options: { color: FAINT } },
], { x: rx(M, 11.9), y: 6.25, w: 11.9, h: 0.5, align: "right", rtlMode: true, fontFace: BODY, fontSize: 16, margin: 0 });
s.addNotes("اختم بطلب صغير ملموس ومنخفض المخاطر: تجربة محصورة 90 يوماً. اقرأ العمودين كصفقة — أربعة أمور خفيفة منهم، وأربعة أمور جوهرية مقابلها، والمدينة لا تحمل أي مخاطرة مالية. أنهِ بوضع الرابط على الشاشة ودعوتهم لفتحه الآن.");

pres.writeFile({ fileName: "Mawqif-Pitch-AR.pptx" }).then((f) => console.log("WROTE", f));
