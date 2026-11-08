/* Morning Ritual: country calendar.
   Weekends, public holidays and the Hijri date for the country you are in. Everything is worked out
   on the device (Intl handles the Hijri calendar), so nothing is sent anywhere. */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const store = {
  get(k, d) { try { const v = localStorage.getItem('mr.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('mr.' + k, JSON.stringify(v)); } catch (e) {} }
};
const isAr = () => !!(window.MR_I18N && MR_I18N.lang === 'ar');
const T = (en, ar) => isAr() ? ar : en;
const pad = n => String(n).padStart(2, '0');
const at = (y, m, d) => new Date(y, m, d, 12);
const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const parse = s => new Date(s + 'T12:00:00');
const addDays = (d, n) => at(d.getFullYear(), d.getMonth(), d.getDate() + n);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---- Intl helpers ---- */
const fc = {};
const fmt = (loc, o) => { const k = loc + JSON.stringify(o); return fc[k] || (fc[k] = new Intl.DateTimeFormat(loc, o)); };
const HC = 'islamic-umalqura';
function hijri(d) {
  const o = {}; fmt('en-u-ca-' + HC + '-nu-latn', { day: 'numeric', month: 'numeric', year: 'numeric' }).formatToParts(d).forEach(p => { o[p.type] = p.value; });
  return { d: +o.day, m: +o.month, y: parseInt(o.year, 10) };
}
const hMonth = d => fmt((isAr() ? 'ar' : 'en') + '-u-ca-' + HC + '-nu-latn', { month: 'long' }).format(d);
const hMap = {};
function hijriMap(y) {
  if (hMap[y]) return hMap[y]; const m = {};
  for (let d = at(y, 0, 1); d.getFullYear() === y; d = addDays(d, 1)) { const h = hijri(d), k = h.m + '-' + h.d; (m[k] = m[k] || []).push(iso(d)); }
  return (hMap[y] = m);
}

/* ---- date rules ---- */
function easter(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3),
    h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
    mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1;
  return at(y, mo - 1, da);
}
function orthodoxEaster(y) {
  const a = y % 4, b = y % 7, c = y % 19, d = (19 * c + 15) % 30, e = (2 * a + 4 * b - d + 34) % 7, mo = Math.floor((d + e + 114) / 31), da = ((d + e + 114) % 31) + 1;
  return at(y, mo - 1, da + 13);
}
function nth(y, m0, dow, n) {
  if (n > 0) { let d = at(y, m0, 1); while (d.getDay() !== dow) d = addDays(d, 1); return addDays(d, (n - 1) * 7); }
  let d = at(y, m0 + 1, 0); while (d.getDay() !== dow) d = addDays(d, -1); return d;
}
const F = (m, d, en, ar, t) => ({ k: 'f', m, d, en, ar, t: t || 'h' });
const N = (m, w, q, en, ar, t) => ({ k: 'n', m, w, q, en, ar, t: t || 'h' });
const H = (hm, hd, n, en, ar, t, g) => ({ k: 'h', hm, hd, n, en, ar, t: t || 'h', g });
const E = (o, en, ar, t) => ({ k: 'e', o, en, ar, t: t || 'h' });
const O = (o, en, ar, t) => ({ k: 'o', o, en, ar, t: t || 'h' });
const B = (m, d, w, en, ar, t) => ({ k: 'b', m, d, w, en, ar, t: t || 'h' });
const EID = { en: 'Eid Mubarak', ar: 'عيد مبارك' };
const FITR = H(10, 1, 3, 'Eid al-Fitr', 'عيد الفطر', 'h', EID), ADHA = H(12, 10, 4, 'Eid al-Adha', 'عيد الأضحى', 'h', EID), ARAFAT = H(12, 9, 1, 'Arafat Day', 'يوم عرفة');
const NY = H(1, 1, 1, 'Islamic New Year', 'رأس السنة الهجرية'), MAWLID = H(3, 12, 1, "Prophet's Birthday", 'المولد النبوي الشريف'), ISRA = H(7, 27, 1, 'Isra and Miraj', 'الإسراء والمعراج');
const ASHURA = H(1, 10, 1, 'Ashura', 'عاشوراء'), RAMADAN = H(9, 1, 30, 'Ramadan', 'شهر رمضان', 'o', { en: 'Ramadan Kareem', ar: 'رمضان كريم' });
const NYD = F(1, 1, "New Year's Day", 'رأس السنة الميلادية'), LABOUR = F(5, 1, 'Labour Day', 'عيد العمال'), XMAS = F(12, 25, 'Christmas Day', 'عيد الميلاد المجيد');

const FRISAT = [5, 6], SATSUN = [6, 0];
const COUNTRIES = {
  SA: { en: 'Saudi Arabia', ar: 'المملكة العربية السعودية', loc: 'ar-SA', we: FRISAT, ws: 0, rules: [RAMADAN, FITR, ARAFAT, ADHA, F(2, 22, 'Founding Day', 'يوم التأسيس'), F(9, 23, 'National Day', 'اليوم الوطني'), F(3, 11, 'Flag Day', 'يوم العلم', 'o'), NY] .map((r, i) => (r === NY ? Object.assign({}, r, { t: 'o' }) : r)) },
  AE: { en: 'United Arab Emirates', ar: 'الإمارات العربية المتحدة', loc: 'ar-AE', we: SATSUN, ws: 1, rules: [NYD, RAMADAN, FITR, ARAFAT, ADHA, NY, F(12, 1, 'Commemoration Day', 'يوم الشهيد', 'o'), F(12, 2, 'National Day', 'اليوم الوطني', 'h'), F(12, 3, 'National Day holiday', 'عطلة اليوم الوطني')] },
  KW: { en: 'Kuwait', ar: 'الكويت', loc: 'ar-KW', we: FRISAT, ws: 0, rules: [NYD, RAMADAN, ISRA, FITR, ARAFAT, ADHA, NY, F(2, 25, 'National Day', 'اليوم الوطني'), F(2, 26, 'Liberation Day', 'يوم التحرير')] },
  QA: { en: 'Qatar', ar: 'قطر', loc: 'ar-QA', we: FRISAT, ws: 0, rules: [RAMADAN, FITR, ARAFAT, ADHA, N(2, 2, 2, 'National Sports Day', 'اليوم الوطني للرياضة'), F(12, 18, 'National Day', 'اليوم الوطني')] },
  BH: { en: 'Bahrain', ar: 'البحرين', loc: 'ar-BH', we: FRISAT, ws: 0, rules: [NYD, LABOUR, RAMADAN, FITR, ARAFAT, ADHA, NY, ASHURA, F(12, 16, 'National Day', 'اليوم الوطني'), F(12, 17, 'Accession Day', 'يوم الجلوس')] },
  OM: { en: 'Oman', ar: 'عُمان', loc: 'ar-OM', we: FRISAT, ws: 0, rules: [RAMADAN, ISRA, FITR, ARAFAT, ADHA, NY, MAWLID, F(11, 18, 'National Day', 'اليوم الوطني')] },
  JO: { en: 'Jordan', ar: 'الأردن', loc: 'ar-JO', we: FRISAT, ws: 0, rules: [NYD, LABOUR, F(5, 25, 'Independence Day', 'عيد الاستقلال'), XMAS, RAMADAN, ISRA, FITR, ARAFAT, ADHA, NY, MAWLID] },
  LB: { en: 'Lebanon', ar: 'لبنان', loc: 'ar-LB', we: SATSUN, ws: 0, rules: [NYD, F(1, 6, 'Armenian Christmas', 'عيد الميلاد الأرمني'), F(2, 9, 'Saint Maroun', 'عيد مار مارون'), F(3, 25, 'Annunciation', 'عيد البشارة'),
    E(-2, 'Good Friday', 'الجمعة العظيمة'), E(0, 'Easter', 'عيد الفصح'), E(1, 'Easter Monday', 'اثنين الفصح'), O(-2, 'Good Friday (Orthodox)', 'الجمعة العظيمة (للشرقيين)'), O(0, 'Easter (Orthodox)', 'عيد الفصح (للشرقيين)'), O(1, 'Easter Monday (Orthodox)', 'اثنين الفصح (للشرقيين)'),
    LABOUR, F(5, 25, 'Resistance and Liberation Day', 'عيد المقاومة والتحرير'), F(8, 15, 'Assumption Day', 'عيد انتقال العذراء'), F(11, 22, 'Independence Day', 'عيد الاستقلال'), XMAS,
    RAMADAN, FITR, ADHA, NY, ASHURA, MAWLID] },
  EG: { en: 'Egypt', ar: 'مصر', loc: 'ar-EG', we: FRISAT, ws: 6, rules: [NYD, F(1, 7, 'Coptic Christmas', 'عيد الميلاد المجيد'), F(1, 25, 'Revolution and Police Day', 'عيد ثورة 25 يناير وعيد الشرطة'), O(1, 'Sham el-Nessim', 'شم النسيم'), F(4, 25, 'Sinai Liberation Day', 'عيد تحرير سيناء'), LABOUR,
    F(6, 30, '30 June Revolution', 'ثورة 30 يونيو'), F(7, 23, 'Revolution Day', 'عيد ثورة 23 يوليو'), F(10, 6, 'Armed Forces Day', 'عيد القوات المسلحة'), RAMADAN, FITR, ARAFAT, ADHA, NY, MAWLID] },
  MA: { en: 'Morocco', ar: 'المغرب', loc: 'ar-MA', we: SATSUN, ws: 1, rules: [NYD, F(1, 11, 'Independence Manifesto Day', 'ذكرى تقديم وثيقة الاستقلال'), LABOUR, F(7, 30, 'Throne Day', 'عيد العرش'), F(8, 14, 'Oued Ed-Dahab Day', 'ذكرى استرجاع وادي الذهب'), F(8, 20, 'Revolution of the King and the People', 'ثورة الملك والشعب'),
    F(8, 21, 'Youth Day', 'عيد الشباب'), F(11, 6, 'Green March', 'ذكرى المسيرة الخضراء'), F(11, 18, 'Independence Day', 'عيد الاستقلال'), RAMADAN, FITR, ADHA, NY, MAWLID] },
  CA: { en: 'Canada', ar: 'كندا', loc: 'ar', we: SATSUN, ws: 0, rules: [NYD, E(-2, 'Good Friday', 'الجمعة العظيمة'), B(5, 24, 1, 'Victoria Day', 'يوم فيكتوريا'), F(7, 1, 'Canada Day', 'يوم كندا'), N(9, 1, 1, 'Labour Day', 'يوم العمال'),
    F(9, 30, 'Truth and Reconciliation Day', 'يوم الحقيقة والمصالحة'), N(10, 1, 2, 'Thanksgiving', 'عيد الشكر'), F(11, 11, 'Remembrance Day', 'يوم الذكرى'), XMAS, F(12, 26, 'Boxing Day', 'يوم الملاكمة')] },
  US: { en: 'United States', ar: 'الولايات المتحدة', loc: 'ar', we: SATSUN, ws: 0, rules: [NYD, N(1, 1, 3, 'Martin Luther King Jr. Day', 'يوم مارتن لوثر كينغ'), N(2, 1, 3, "Presidents' Day", 'يوم الرؤساء'), N(5, 1, -1, 'Memorial Day', 'يوم الذكرى'), F(6, 19, 'Juneteenth', 'يوم جونتينث'),
    F(7, 4, 'Independence Day', 'يوم الاستقلال'), N(9, 1, 1, 'Labor Day', 'يوم العمال'), N(10, 1, 2, 'Columbus Day', 'يوم كولومبوس'), F(11, 11, 'Veterans Day', 'يوم المحاربين القدامى'), N(11, 4, 4, 'Thanksgiving', 'عيد الشكر'), XMAS] },
  GB: { en: 'United Kingdom', ar: 'المملكة المتحدة', loc: 'ar', we: SATSUN, ws: 1, rules: [NYD, E(-2, 'Good Friday', 'الجمعة العظيمة'), E(1, 'Easter Monday', 'اثنين الفصح'), N(5, 1, 1, 'Early May bank holiday', 'عطلة مايو المصرفية'), N(5, 1, -1, 'Spring bank holiday', 'عطلة الربيع المصرفية'),
    N(8, 1, -1, 'Summer bank holiday', 'عطلة الصيف المصرفية'), XMAS, F(12, 26, 'Boxing Day', 'يوم الملاكمة')] },
  XX: { en: 'Other country', ar: 'بلد آخر', loc: 'ar', we: SATSUN, ws: 0, rules: [NYD] }
};
const TZ = { 'Asia/Riyadh': 'SA', 'Asia/Dubai': 'AE', 'Asia/Kuwait': 'KW', 'Asia/Qatar': 'QA', 'Asia/Bahrain': 'BH', 'Asia/Muscat': 'OM', 'Asia/Amman': 'JO', 'Asia/Beirut': 'LB', 'Africa/Cairo': 'EG', 'Africa/Casablanca': 'MA',
  'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Edmonton': 'CA', 'America/Winnipeg': 'CA', 'America/Halifax': 'CA', 'America/Regina': 'CA', 'America/St_Johns': 'CA', 'America/Montreal': 'CA',
  'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US', 'America/Los_Angeles': 'US', 'America/Phoenix': 'US', 'America/Anchorage': 'US', 'Pacific/Honolulu': 'US', 'Europe/London': 'GB' };

function country() {
  const s = store.get('country', null); if (s && COUNTRIES[s]) return s;
  const atm = store.get('atm', null); if (atm && atm.place && atm.place.cc) { const k = String(atm.place.cc).toUpperCase(); return COUNTRIES[k] ? k : 'XX'; }
  try { const tz = Intl.DateTimeFormat().resolvedOptions().timeZone; if (TZ[tz]) return TZ[tz]; } catch (e) {}
  return 'SA';
}

/* ---- holidays ---- */
function expand(r, y) {
  switch (r.k) {
    case 'f': return [at(y, r.m - 1, r.d)];
    case 'n': return [nth(y, r.m - 1, r.w, r.q)];
    case 'e': return [addDays(easter(y), r.o)];
    case 'o': return [addDays(orthodoxEaster(y), r.o)];
    case 'b': { let d = at(y, r.m - 1, r.d); while (d.getDay() !== r.w) d = addDays(d, -1); return [d]; }
    case 'h': return (hijriMap(y)[r.hm + '-' + r.hd] || []).map(parse);
  }
  return [];
}
const hc = {};
function yearMap(cc, y) {
  const key = cc + y; if (hc[key]) return hc[key];
  const map = {};
  COUNTRIES[cc].rules.forEach(r => {
    const n = r.n || 1;
    expand(r, y).forEach(d0 => { for (let i = 0; i < n; i++) { const d = addDays(d0, i), k = iso(d); (map[k] = map[k] || []).push({ r, i, n }); } });
  });
  return (hc[key] = map);
}
const itemsOn = (cc, d) => yearMap(cc, d.getFullYear())[iso(d)] || [];
const isWeekend = (cc, d) => COUNTRIES[cc].we.indexOf(d.getDay()) >= 0;
const nm = r => isAr() ? r.ar : r.en;
const pub = items => items.filter(x => x.r.t === 'h');

/* collapse consecutive days of the same holiday into ranges, from a start date for a number of days */
function ranges(cc, from, days) {
  const out = []; let cur = null;
  for (let i = 0; i < days; i++) {
    const d = addDays(from, i), its = itemsOn(cc, d);
    its.forEach(x => {
      if (cur && cur.r === x.r && cur.last === iso(addDays(d, -1))) { cur.last = iso(d); cur.end = d; }
      else { cur = { r: x.r, first: iso(d), last: iso(d), start: d, end: d }; out.push(cur); }
    });
  }
  return out;
}

/* ---- formatting ---- */
const gLoc = cc => (isAr() ? (COUNTRIES[cc].loc && /^ar-/.test(COUNTRIES[cc].loc) ? COUNTRIES[cc].loc : 'ar') : 'en-GB') + '-u-ca-gregory-nu-latn';
const gFmt = (cc, d, o) => fmt(gLoc(cc), o).format(d);
const hLabel = d => { const h = hijri(d); return h.d + ' ' + hMonth(d) + ' ' + h.y; };
const rel = n => n === 0 ? T('today', 'اليوم') : n === 1 ? T('tomorrow', 'غدًا') : T('in ' + n + ' days', n === 2 ? 'بعد يومين' : n <= 10 ? 'بعد ' + n + ' أيام' : 'بعد ' + n + ' يومًا');
const dayDiff = (a, b) => Math.round((at(b.getFullYear(), b.getMonth(), b.getDate()) - at(a.getFullYear(), a.getMonth(), a.getDate())) / 864e5);
function rangeLabel(cc, g) {
  const a = gFmt(cc, g.start, { day: 'numeric', month: 'long' });
  if (g.first === g.last) return a;
  return g.start.getMonth() === g.end.getMonth() ? gFmt(cc, g.start, { day: 'numeric' }) + '–' + gFmt(cc, g.end, { day: 'numeric', month: 'long' }) : a + ' – ' + gFmt(cc, g.end, { day: 'numeric', month: 'long' });
}
function nextPublic(cc, today) {
  const list = ranges(cc, today, 400).filter(g => g.r.t === 'h' && g.end >= today);
  return list[0] || null;
}

/* ---- the line on the first screen ---- */
function renderToday() {
  const el = $('#todayLine'); if (!el) return;
  const cc = country(), now = new Date(), items = itemsOn(cc, now), p = pub(items), obs = items.filter(x => x.r.t === 'o');
  const date = gFmt(cc, now, { weekday: 'long', day: 'numeric', month: 'long' }) + ' · ' + hLabel(now);
  const parts = [];
  const greet = items.map(x => x.r.g).filter(Boolean)[0];
  if (greet) parts.push(isAr() ? greet.ar : greet.en);
  if (p.length) parts.push(T('Public holiday: ', 'عطلة رسمية: ') + p.map(x => nm(x.r)).join(T(' and ', ' و')));
  else if (isWeekend(cc, now)) parts.push(T('Weekend', 'عطلة نهاية الأسبوع'));
  obs.forEach(x => { parts.push(x.n > 1 ? nm(x.r) + T(', day ', '، اليوم ') + (x.i + 1) : nm(x.r)); });
  const nx = !p.length && nextPublic(cc, addDays(now, 1));
  if (nx) parts.push(T('Next: ', 'القادمة: ') + nm(nx.r) + ', ' + rel(dayDiff(now, nx.start)));
  el.hidden = false;
  el.innerHTML = '<span class="today-date">' + esc(date) + '</span>' + (parts.length ? '<span class="today-note">' + esc(parts.join(' · ')) + '</span>' : '');
}

/* ---- the calendar page ---- */
const view = { y: new Date().getFullYear(), m: new Date().getMonth() };
function renderCal() {
  const box = $('#calDyn'); if (!box) return;
  const cc = country(), C = COUNTRIES[cc], y = view.y, m = view.m, first = at(y, m, 1), todayD = new Date(), tIso = iso(todayD);
  const offset = (first.getDay() - C.ws + 7) % 7, dim = at(y, m + 1, 0).getDate(), rows = Math.ceil((offset + dim) / 7);
  const wd = i => gFmt(cc, at(2024, 0, 7 + ((C.ws + i) % 7)), { weekday: 'short' }), wdLong = i => gFmt(cc, at(2024, 0, 7 + ((C.ws + i) % 7)), { weekday: 'long' });
  const h1 = hijri(first), hEndD = at(y, m, dim), h2 = hijri(hEndD);
  const hTitle = h1.m === h2.m && h1.y === h2.y ? hMonth(first) + ' ' + h1.y : hMonth(first) + (h1.y !== h2.y ? ' ' + h1.y : '') + ' – ' + hMonth(hEndD) + ' ' + h2.y;
  const opts = Object.keys(COUNTRIES).sort((a, b) => a === 'XX' ? 1 : b === 'XX' ? -1 : (isAr() ? C_ar(a, b) : COUNTRIES[a].en.localeCompare(COUNTRIES[b].en)));
  function C_ar(a, b) { return COUNTRIES[a].ar.localeCompare(COUNTRIES[b].ar, 'ar'); }
  let h = '<div class="cal-tools"><label class="cal-country"><span>' + T('Country', 'البلد') + '</span><select id="calCountry">' +
    opts.map(k => '<option value="' + k + '"' + (k === cc ? ' selected' : '') + '>' + esc(isAr() ? COUNTRIES[k].ar : COUNTRIES[k].en) + '</option>').join('') + '</select></label>' +
    '<div class="cal-nav"><button type="button" class="btn btn-ghost sm" id="calPrev" aria-label="' + T('Previous month', 'الشهر السابق') + '">' + (isAr() ? '›' : '‹') + '</button>' +
    '<button type="button" class="btn btn-ghost sm" id="calToday">' + T('Today', 'اليوم') + '</button>' +
    '<button type="button" class="btn btn-ghost sm" id="calNext" aria-label="' + T('Next month', 'الشهر التالي') + '">' + (isAr() ? '‹' : '›') + '</button></div></div>';
  h += '<table class="cal-grid"><caption><strong>' + esc(gFmt(cc, first, { month: 'long', year: 'numeric' })) + '</strong><span>' + esc(hTitle) + '</span></caption><thead><tr>';
  for (let i = 0; i < 7; i++) h += '<th scope="col" abbr="' + esc(wdLong(i)) + '">' + esc(wd(i)) + '</th>'; h += '</tr></thead><tbody>';
  for (let r = 0; r < rows; r++) {
    h += '<tr>';
    for (let c = 0; c < 7; c++) {
      const d = addDays(first, r * 7 + c - offset), inM = d.getMonth() === m, its = itemsOn(cc, d), p = pub(its), o = its.filter(x => x.r.t === 'o'), hd = hijri(d);
      const cls = ['cal-day']; if (!inM) cls.push('out'); if (isWeekend(cc, d)) cls.push('we'); if (p.length) cls.push('hol'); else if (o.length) cls.push('obs'); if (iso(d) === tIso) cls.push('today');
      const label = gFmt(cc, d, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + ', ' + hLabel(d) + (its.length ? ', ' + its.map(x => nm(x.r)).join(', ') : '') + (isWeekend(cc, d) ? ', ' + T('weekend', 'عطلة نهاية الأسبوع') : '');
      h += '<td class="' + cls.join(' ') + '" aria-label="' + esc(label) + '"' + (iso(d) === tIso ? ' aria-current="date"' : '') + '><span class="g">' + d.getDate() + '</span><span class="hj" aria-hidden="true">' + hd.d + '</span></td>';
    }
    h += '</tr>';
  }
  h += '</tbody></table>';
  h += '<p class="cal-legend"><span><i class="k hol"></i>' + T('Public holiday', 'عطلة رسمية') + '</span><span><i class="k obs"></i>' + T('Observance', 'مناسبة') + '</span><span><i class="k we"></i>' + T('Weekend', 'نهاية الأسبوع') + '</span><span><i class="k hj"></i>' + T('Small number: Hijri day', 'الرقم الصغير: اليوم الهجري') + '</span></p>';
  const monthR = ranges(cc, first, dim).filter(g => g.start.getMonth() === m);
  h += '<h2 class="cal-h">' + T('This month', 'هذا الشهر') + '</h2>';
  h += monthR.length ? '<ul class="cal-list">' + monthR.map(g => '<li><span class="cl-d">' + esc(rangeLabel(cc, g)) + '</span><span class="cl-n">' + esc(nm(g.r)) + (g.r.t === 'o' ? '<em>' + T('observance', 'مناسبة') + '</em>' : '') + '</span></li>').join('') + '</ul>'
    : '<p class="cal-empty">' + T('No public holidays or observances this month.', 'لا عطل رسمية ولا مناسبات هذا الشهر.') + '</p>';
  const up = ranges(cc, todayD, 400).filter(g => g.r.t === 'h' && g.end >= todayD).slice(0, 5);
  h += '<h2 class="cal-h">' + T('Coming up in ', 'القادم في ') + esc(isAr() ? C.ar : C.en) + '</h2>';
  h += up.length ? '<ul class="cal-list">' + up.map(g => '<li><span class="cl-d">' + esc(rangeLabel(cc, g)) + '</span><span class="cl-n">' + esc(nm(g.r)) + '<em>' + rel(Math.max(0, dayDiff(todayD, g.start))) + '</em></span></li>').join('') + '</ul>'
    : '<p class="cal-empty">' + T('No public holidays are listed for this country.', 'لا توجد عطل رسمية مدرجة لهذا البلد.') + '</p>';
  h += '<p class="cal-note">' + T('Hijri dates follow the Umm al-Qura calendar and can differ by a day from the local moon sighting. Holidays and weekends are the usual public schedule, so check official announcements before you plan around them.',
    'التواريخ الهجرية وفق تقويم أم القرى وقد تختلف بيوم عن الرؤية المحلية للهلال. العطل وأيام نهاية الأسبوع هي الجدول الرسمي المعتاد، فتحقق من الإعلانات الرسمية قبل أن تخطط لها.') + '</p>';
  box.innerHTML = h;
  $('#calCountry').addEventListener('change', e => { store.set('country', e.target.value); renderAll(); });
  $('#calPrev').addEventListener('click', () => { view.m--; if (view.m < 0) { view.m = 11; view.y--; } renderCal(); });
  $('#calNext').addEventListener('click', () => { view.m++; if (view.m > 11) { view.m = 0; view.y++; } renderCal(); });
  $('#calToday').addEventListener('click', () => { const n = new Date(); view.y = n.getFullYear(); view.m = n.getMonth(); renderCal(); });
}
function renderAll() { renderToday(); renderCal(); }
function onRoute(h) { if (h === 'hub') renderToday(); if (h === 'calendar') renderCal(); }

window.MR_CAL = { onRoute, refresh: renderAll, _core: { hijri, hijriMap, yearMap, easter, orthodoxEaster, ranges, country, COUNTRIES, itemsOn, isWeekend } };
document.addEventListener('mr:lang', renderAll);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') renderToday(); });
onRoute((location.hash || '#hub').slice(1)); renderToday();
})();
