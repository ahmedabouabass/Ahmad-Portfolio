/* Morning Ritual: meet your future self. A short WOOP-style plan (wish, outcome, obstacle, plan)
   with an if-then sentence, and an avatar that stands for the version of you who followed it.
   Text is written in both languages here, so it does not go through i18n.js. Everything stays in localStorage. */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const store = {
  get(k, d) { try { const v = localStorage.getItem('mr.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('mr.' + k, JSON.stringify(v)); } catch (e) {} }
};
const isAr = () => !!(window.MR_I18N && window.MR_I18N.lang === 'ar');
const x = (en, ar) => (isAr() ? ar : en);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const today = () => new Date().toLocaleDateString('en-CA');
const root = $('#futureDyn'), hubLine = $('#futureLine');
if (!root) return;

const WISHES = [
  { id: 'calm', en: 'Calmer and steadier', ar: 'أكثر هدوءًا وثباتًا' },
  { id: 'focus', en: 'More focused', ar: 'أكثر تركيزًا' },
  { id: 'fit', en: 'Stronger and healthier', ar: 'أقوى وأكثر صحة' },
  { id: 'work', en: 'Doing my best work', ar: 'أقدّم أفضل ما عندي في عملي' },
  { id: 'study', en: 'Making progress in my studies', ar: 'أتقدّم في دراستي' },
  { id: 'career', en: 'Moving my career forward', ar: 'أطوّر مسيرتي المهنية' },
  { id: 'kind', en: 'Kinder to myself', ar: 'ألطف مع نفسي' }
];
const OBSTACLES = [
  { id: 'tired', en: 'I feel too tired', ar: 'أشعر بتعب شديد' },
  { id: 'doubt', en: 'I doubt myself', ar: 'أشكّ في نفسي' },
  { id: 'phone', en: 'I get pulled into my phone', ar: 'ينجذب انتباهي إلى هاتفي' },
  { id: 'delay', en: 'I put it off', ar: 'أؤجّل الأمر' },
  { id: 'perfect', en: 'I want it to be perfect', ar: 'أريده أن يكون مثاليًا' },
  { id: 'time', en: 'I feel I have no time', ar: 'أشعر أنه لا وقت لدي' }
];
const ACTIONS = [
  { id: 'breathe', en: 'take three slow breaths', ar: 'آخذ ثلاثة أنفاس بطيئة' },
  { id: 'two', en: 'start for just two minutes', ar: 'أبدأ دقيقتين فقط' },
  { id: 'phone', en: 'put my phone in another room', ar: 'أضع هاتفي في غرفة أخرى' },
  { id: 'step', en: 'do the smallest first step', ar: 'أنجز أصغر خطوة أولى' },
  { id: 'walk', en: 'stand up and walk for a minute', ar: 'أقف وأمشي دقيقة' },
  { id: 'kind', en: 'say something kind to myself', ar: 'أقول لنفسي كلمة طيبة' }
];
const HAIR = [{ id: 'short', en: 'Short', ar: 'قصير' }, { id: 'curly', en: 'Curly', ar: 'مجعّد' }, { id: 'long', en: 'Long', ar: 'طويل' }, { id: 'none', en: 'None', ar: 'بدون' }];
const HEAD = [{ id: 'none', en: 'None', ar: 'بدون' }, { id: 'cap', en: 'Cap', ar: 'قبعة' }, { id: 'ghutra', en: 'Ghutra', ar: 'غترة' }, { id: 'hijab', en: 'Hijab', ar: 'حجاب' }];
const OUTFIT = [{ id: 'smart', en: 'Smart', ar: 'أنيق' }, { id: 'casual', en: 'Casual', ar: 'كاجوال' }, { id: 'active', en: 'Active', ar: 'رياضي' }, { id: 'thobe', en: 'Thobe', ar: 'ثوب' }];
const SKIN = ['#F5D5B8', '#E8B98F', '#D39A6B', '#B97A4C', '#8A5634', '#5E3A22'];
const COLORS = ['#C9974B', '#2F5D8C', '#3E7C6B', '#8C3F4F', '#4A4A5A', '#E6BC73'];
const CUES = [
  ['See where you are. Picture the room, the light, the people.', 'تخيّل أين أنت: المكان، الضوء، من حولك.'],
  ['Notice what you see and hear when it has happened.', 'لاحظ ما تراه وما تسمعه بعد أن تحقّق الأمر.'],
  ['Feel it in your body. Shoulders, breath, face.', 'اشعر به في جسدك: الكتفان، النَّفَس، الوجه.'],
  ['Notice how it feels to have done it. Stay with that.', 'لاحظ شعورك وقد أنجزتَ الأمر. ابقَ مع هذا الشعور.']
];

/* ---------- state ---------- */
const F = Object.assign({ wishId: '', wishText: '', outcome: '', obsId: '', obsText: '', actId: '', actText: '', av: {}, done: false, log: {} }, store.get('future', {}));
F.av = Object.assign({ skin: 1, hair: 'short', head: 'none', outfit: 'smart', color: 0 }, F.av || {});
F.log = F.log && typeof F.log === 'object' ? F.log : {};
let step = F.done ? 5 : 0, timer = null, uid = 0;
const save = () => store.set('future', F);
const lab = (list, id) => { const i = list.filter(k => k.id === id)[0]; return i ? x(i.en, i.ar) : ''; };
const wish = () => (F.wishText || '').trim() || lab(WISHES, F.wishId);
const obs = () => (F.obsText || '').trim() || lab(OBSTACLES, F.obsId);
const act = () => (F.actText || '').trim() || lab(ACTIONS, F.actId);
const sentence = () => { const o = obs(), a = act(); if (!o || !a) return ''; return x('If ' + o + ', then I will ' + a + '.', 'عندما ' + o + '، فسوف ' + a + '.'); };
function weekCount() { let n = 0; for (let i = 0; i < 7; i++) { const d = new Date(); d.setDate(d.getDate() - i); if (F.log[d.toLocaleDateString('en-CA')]) n++; } return n; }

/* ---------- avatar ---------- */
function dark(hex, f) { const n = parseInt(hex.slice(1), 16); return 'rgb(' + [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v * f)).join(',') + ')'; }
function avatar(a, size, label) {
  const id = 'fy' + (++uid), s = SKIN[a.skin] || SKIN[1], c = COLORS[a.color] || COLORS[0], hair = '#2b1b12', cloth = '#F5F0E6';
  const cover = a.head !== 'none', hairOn = !cover && a.hair !== 'none';
  let o = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280" width="' + size + '" height="' + Math.round(size * 1.4) + '" role="img" aria-label="' + esc(label || x('Your future self', 'نسختك المستقبلية')) + '">';
  o += '<defs><radialGradient id="' + id + '"><stop offset="0" stop-color="#E6BC73" stop-opacity=".42"/><stop offset="1" stop-color="#E6BC73" stop-opacity="0"/></radialGradient></defs>';
  o += '<circle cx="100" cy="135" r="112" fill="url(#' + id + ')"/>';
  o += '<path d="M160 44l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill="#E6BC73"/>';
  if (hairOn && a.hair === 'long') o += '<path d="M58 118C52 190 60 218 78 224L122 224C140 218 148 190 142 118Z" fill="' + hair + '"/>';
  o += '<path d="M30 280C30 214 64 192 100 192C136 192 170 214 170 280Z" fill="' + c + '"/>';
  if (a.outfit === 'smart') o += '<path d="M84 194L100 228L116 194Z" fill="' + cloth + '"/><path d="M84 194L100 244L68 216Z" fill="' + dark(c, .78) + '"/><path d="M116 194L100 244L132 216Z" fill="' + dark(c, .78) + '"/>';
  if (a.outfit === 'active') o += '<path d="M30 254H170" stroke="' + cloth + '" stroke-width="5" opacity=".8"/><path d="M100 200V280" stroke="' + dark(c, .7) + '" stroke-width="3"/>';
  if (a.outfit === 'thobe') o += '<path d="M100 214V280" stroke="' + dark(c, .75) + '" stroke-width="3"/><circle cx="100" cy="232" r="2.6" fill="' + dark(c, .6) + '"/>';
  if (a.head !== 'hijab') o += '<rect x="86" y="160" width="28" height="42" rx="10" fill="' + s + '"/>';
  if (a.outfit === 'casual') o += '<path d="M82 194Q100 216 118 194Z" fill="' + s + '"/>';
  if (a.outfit === 'thobe') o += '<path d="M90 194L100 212L110 194Z" fill="' + s + '"/>';
  if (a.head === 'ghutra') o += '<path d="M52 128C48 58 152 58 148 128L150 176L128 162L72 162L50 176Z" fill="' + cloth + '" stroke="#d9d2c3"/>';
  if (a.head === 'hijab') o += '<path d="M50 130C46 58 154 58 150 130C150 170 140 194 124 204L76 204C60 194 50 170 50 130Z" fill="' + c + '"/>';
  o += '<ellipse cx="100" cy="116" rx="37" ry="44" fill="' + s + '"/>';
  o += '<ellipse cx="86" cy="116" rx="3.2" ry="4" fill="' + hair + '"/><ellipse cx="114" cy="116" rx="3.2" ry="4" fill="' + hair + '"/>';
  o += '<path d="M78 106Q86 101 94 105M106 105Q114 101 122 106" stroke="' + hair + '" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
  o += '<path d="M88 138Q100 148 112 138" stroke="#7a3d2b" stroke-width="3" fill="none" stroke-linecap="round"/>';
  if (hairOn && (a.hair === 'short' || a.hair === 'long')) o += '<path d="M63 112C60 70 90 60 100 60C118 60 142 72 137 112C130 92 118 84 100 84C82 84 70 92 63 112Z" fill="' + hair + '"/>';
  if (hairOn && a.hair === 'curly') o += [[68, 92], [78, 76], [94, 68], [110, 68], [124, 76], [134, 92], [100, 80]].map(p => '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="14" fill="' + hair + '"/>').join('');
  if (a.head === 'cap') o += '<path d="M62 106C62 66 138 66 138 106Z" fill="' + c + '"/><rect x="56" y="102" width="88" height="9" rx="4.5" fill="' + dark(c, .8) + '"/>';
  if (a.head === 'ghutra') o += '<path d="M62 100C64 66 136 66 138 100C128 86 114 80 100 80C86 80 72 86 62 100Z" fill="' + cloth + '"/><path d="M62 84Q100 62 138 84" stroke="#1b1b1b" stroke-width="6" fill="none" stroke-linecap="round"/>';
  if (a.head === 'hijab') o += '<path d="M63 104C66 76 134 76 137 104C126 90 114 86 100 86C86 86 74 90 63 104Z" fill="' + c + '"/>';
  return o + '</svg>';
}

/* ---------- step markup ---------- */
const chips = (list, sel, attr) => '<div class="chips">' + list.map(i => '<button type="button" class="chip" ' + attr + '="' + i.id + '" aria-pressed="' + (i.id === sel) + '">' + esc(x(i.en, i.ar)) + '</button>').join('') + '</div>';
const field = (id, label, val, long) => '<label class="fy-field" for="' + id + '"><span>' + label + '</span>' + (long
  ? '<textarea id="' + id + '" rows="4" maxlength="400">' + esc(val) + '</textarea>'
  : '<input id="' + id + '" type="text" maxlength="120" value="' + esc(val) + '">') + '</label>';
const prog = n => '<p class="fy-prog">' + x('Step ' + n + ' of 5', 'الخطوة ' + n + ' من 5') + '</p>';
function valid(s) { return s === 0 ? !!wish() : s === 2 ? !!obs() : s === 3 ? !!act() : true; }
function nav(s) {
  const last = s === 4, back = s > 0 && s < 5 ? '<button type="button" class="btn btn-ghost" data-go="' + (s - 1) + '">' + x('Back', 'رجوع') + '</button>' : '';
  return '<div class="actions">' + back + '<button type="button" class="btn btn-primary" id="fyNext" data-go="' + (s + 1) + '" data-save="' + (last ? 1 : 0) + '"' + (valid(s) ? '' : ' disabled') + '>' + (last ? x('Save my future self', 'احفظ نسختي المستقبلية') : x('Continue', 'متابعة')) + '</button></div>';
}
function swatches(list, sel, attr, label) {
  return '<div class="fy-sws" role="group" aria-label="' + label + '">' + list.map((c, i) => '<button type="button" class="fy-sw" ' + attr + '="' + i + '" aria-pressed="' + (i === sel) + '" aria-label="' + label + ' ' + (i + 1) + '" style="background:' + c + '"></button>').join('') + '</div>';
}
function stepHtml(s) {
  if (s === 0) return prog(1) + '<h2 class="fy-q">' + x('What do you want to become, or do?', 'ماذا تريد أن تصبح أو أن تفعل؟') + '</h2>' + chips(WISHES, F.wishText ? '' : F.wishId, 'data-wish') + field('fyWish', x('Or in your own words', 'أو بكلماتك أنت'), F.wishText) + nav(0);
  if (s === 1) return prog(2) + '<h2 class="fy-q">' + x('Picture the best outcome', 'تخيّل أفضل نتيجة') + '</h2><p class="fy-help">' + x('Where are you, and what do you see, hear and feel when it has happened?', 'أين أنت، وماذا ترى وتسمع وتشعر حين يتحقّق الأمر؟') + '</p>' +
    '<div class="fy-timer"><button type="button" class="btn btn-ghost sm" id="fyTimer">' + x('Picture it for 60 seconds', 'تخيّله لمدة 60 ثانية') + '</button><span class="fy-clock" id="fyClock" aria-hidden="true"></span></div><p class="fy-cue" id="fyCue" role="status" aria-live="polite"></p>' +
    field('fyOutcome', x('What you saw (optional)', 'ما رأيته (اختياري)'), F.outcome, true) + nav(1);
  if (s === 2) return prog(3) + '<h2 class="fy-q">' + x('What in you could get in the way?', 'ما الذي بداخلك قد يقف في طريقك؟') + '</h2><p class="fy-help">' + x('Pick something inside you, such as a feeling or a habit.', 'اختر شيئًا من داخلك، مثل شعور أو عادة.') + '</p>' + chips(OBSTACLES, F.obsText ? '' : F.obsId, 'data-obs') + field('fyObs', x('Or in your own words', 'أو بكلماتك أنت'), F.obsText) + nav(2);
  if (s === 3) return prog(4) + '<h2 class="fy-q">' + x('Make an if–then plan', 'ضع خطة «إذا… فإنني…»') + '</h2><p class="fy-help">' + x('Choose what you will do the moment that obstacle shows up.', 'اختر ما ستفعله لحظة ظهور هذه العقبة.') + '</p>' + chips(ACTIONS, F.actText ? '' : F.actId, 'data-act') + field('fyAct', x('Or in your own words', 'أو بكلماتك أنت'), F.actText) + '<p class="fy-plan" id="fyPlan">' + esc(sentence()) + '</p>' + nav(3);
  if (s === 4) return prog(5) + '<h2 class="fy-q">' + x('Dress your future self', 'ألبِس نسختك المستقبلية') + '</h2><div class="fy-look"><div class="fy-avatar" id="fyAv">' + avatar(F.av, 170) + '</div><div class="fy-opts">' +
    '<p class="fy-ol">' + x('Skin tone', 'لون البشرة') + '</p>' + swatches(SKIN, F.av.skin, 'data-skin', x('Skin tone', 'لون البشرة')) +
    '<p class="fy-ol">' + x('Hair', 'الشعر') + '</p>' + chips(HAIR, F.av.hair, 'data-hair') +
    '<p class="fy-ol">' + x('Head', 'غطاء الرأس') + '</p>' + chips(HEAD, F.av.head, 'data-head') +
    '<p class="fy-ol">' + x('Outfit', 'الملابس') + '</p>' + chips(OUTFIT, F.av.outfit, 'data-outfit') +
    '<p class="fy-ol">' + x('Colour', 'اللون') + '</p>' + swatches(COLORS, F.av.color, 'data-color', x('Colour', 'اللون')) + '</div></div>' + nav(4);
  const done = !!F.log[today()], wk = weekCount();
  return '<div class="fy-card"><div class="fy-avatar">' + avatar(F.av, 190) + '</div><div class="fy-sum">' +
    '<p class="fy-ol">' + x('Your wish', 'أمنيتك') + '</p><p class="fy-v">' + esc(wish()) + '</p>' +
    (F.outcome ? '<p class="fy-ol">' + x('What you saw', 'ما رأيته') + '</p><p class="fy-v">' + esc(F.outcome) + '</p>' : '') +
    '<p class="fy-ol">' + x('Your plan', 'خطتك') + '</p><p class="fy-v fy-plan">' + esc(sentence()) + '</p></div></div>' +
    '<div class="actions"><button type="button" class="btn btn-primary" id="fyCheck" aria-pressed="' + done + '">' + (done ? x('Marked for today', 'تم تسجيل اليوم') : x('I followed my plan today', 'نفّذتُ خطتي اليوم')) + '</button></div>' +
    '<p class="fy-help" role="status" aria-live="polite" id="fyWeek">' + x('You followed your plan on ' + wk + ' of the last 7 days.', 'نفّذتَ خطتك في ' + wk + ' من آخر 7 أيام.') + '</p>' +
    '<div class="actions"><button type="button" class="btn btn-ghost sm" data-go="0">' + x('Change my plan', 'غيّر خطتي') + '</button><button type="button" class="btn btn-ghost sm" data-go="4">' + x('Change my look', 'غيّر مظهري') + '</button><button type="button" class="btn btn-ghost sm" id="fyCopy">' + x('Copy my plan', 'انسخ خطتي') + '</button></div><p class="fy-help" id="fyCopied" role="status" aria-live="polite"></p>';
}
function render(focus) {
  stopTimer();
  root.innerHTML = '<a class="back" href="#hub">' + x('Back to the ritual', 'العودة إلى الطقس') + '</a><h1 id="future-title" tabindex="-1">' + x('Meet your future self', 'تعرّف على نسختك المستقبلية') + '</h1>' +
    (step === 0 ? '<p class="lede">' + x('Picture the best version of you, then plan for what could get in the way. Research on mental contrasting suggests this works better than picturing success alone.', 'تخيّل أفضل نسخة منك، ثم خطّط لما قد يعترض طريقك. تشير أبحاث «التباين الذهني» إلى أن هذا أنفع من تخيّل النجاح وحده.') + '</p>' : '') +
    '<div class="fy-body" id="fyBody">' + stepHtml(step) + '</div>';
  if (focus) { const t = $('.fy-q', root) || $('#fyCheck', root); if (t) { t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: false }); } }
}
function renderHub() {
  if (!hubLine) return;
  const s = F.done ? sentence() : '';
  if (!s) { hubLine.hidden = true; hubLine.innerHTML = ''; return; }
  hubLine.hidden = false;
  hubLine.innerHTML = '<span class="fy-mini">' + avatar(F.av, 40) + '</span><span class="fy-hubtext">' + esc(s) + ' <a class="cw-link" href="#future">' + x('Open', 'فتح') + '</a></span>';
}

/* ---------- 60-second picture-it timer ---------- */
function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }
function startTimer() {
  const btn = $('#fyTimer'), clock = $('#fyClock'), cue = $('#fyCue'); if (!btn) return;
  if (timer) { stopTimer(); btn.textContent = x('Picture it for 60 seconds', 'تخيّله لمدة 60 ثانية'); clock.textContent = ''; cue.textContent = ''; return; }
  let left = 60; btn.textContent = x('Stop', 'إيقاف');
  const tick = () => {
    clock.textContent = '0:' + String(left).padStart(2, '0');
    const c = CUES[Math.min(3, Math.floor((60 - left) / 15))]; if (cue.dataset.i !== String(CUES.indexOf(c))) { cue.dataset.i = String(CUES.indexOf(c)); cue.textContent = x(c[0], c[1]); }
    if (left <= 0) { stopTimer(); btn.textContent = x('Picture it again', 'تخيّله مرة أخرى'); clock.textContent = ''; cue.textContent = x('Take a slow breath. Then write what you saw.', 'خذ نفسًا بطيئًا، ثم اكتب ما رأيته.'); return; }
    left--;
  };
  tick(); timer = setInterval(tick, 1000);
}

/* ---------- events ---------- */
function press(btn) { Array.prototype.forEach.call(btn.parentNode.children, b => b.setAttribute('aria-pressed', String(b === btn))); }
function refreshNav() { const n = $('#fyNext', root); if (n) n.disabled = !valid(step); const p = $('#fyPlan', root); if (p && step === 3) p.textContent = sentence(); }
function redrawAvatar() { const a = $('#fyAv', root); if (a) a.innerHTML = avatar(F.av, 170); }
root.addEventListener('click', e => {
  const t = e.target.closest('button'); if (!t || !root.contains(t)) return;
  const d = t.dataset;
  if (d.wish !== undefined) { F.wishId = d.wish; F.wishText = ''; const i = $('#fyWish', root); if (i) i.value = ''; press(t); save(); refreshNav(); return; }
  if (d.obs !== undefined) { F.obsId = d.obs; F.obsText = ''; const i = $('#fyObs', root); if (i) i.value = ''; press(t); save(); refreshNav(); return; }
  if (d.act !== undefined) { F.actId = d.act; F.actText = ''; const i = $('#fyAct', root); if (i) i.value = ''; press(t); save(); refreshNav(); return; }
  const map = { skin: ['skin', true], color: ['color', true], hair: ['hair'], head: ['head'], outfit: ['outfit'] };
  for (const k in map) if (d[k] !== undefined) { F.av[k] = map[k][1] ? +d[k] : d[k]; press(t); save(); redrawAvatar(); return; }
  if (d.go !== undefined && !t.disabled) { if (d.save === '1') F.done = true; step = +d.go; save(); render(true); renderHub(); return; }
  if (t.id === 'fyTimer') { startTimer(); return; }
  if (t.id === 'fyCheck') { const k = today(); if (F.log[k]) delete F.log[k]; else F.log[k] = true; save(); render(false); const b = $('#fyCheck', root); if (b) b.focus(); return; }
  if (t.id === 'fyCopy') {
    const txt = [wish(), F.outcome, sentence()].filter(Boolean).join('\n'), say = ok => { const p = $('#fyCopied'); if (p) p.textContent = ok ? x('Copied.', 'تم النسخ.') : x('Copy this: ', 'انسخ هذا: ') + txt; };
    const fb = () => { try { const ta = document.createElement('textarea'); ta.value = txt; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); const ok = document.execCommand && document.execCommand('copy'); document.body.removeChild(ta); say(!!ok); } catch (err) { say(false); } };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(() => say(true), fb); else fb();
  }
});
root.addEventListener('input', e => {
  const id = e.target.id;
  if (id === 'fyWish') { F.wishText = e.target.value; if (F.wishText.trim()) { F.wishId = ''; } }
  else if (id === 'fyObs') { F.obsText = e.target.value; if (F.obsText.trim()) F.obsId = ''; }
  else if (id === 'fyAct') { F.actText = e.target.value; if (F.actText.trim()) F.actId = ''; }
  else if (id === 'fyOutcome') { F.outcome = e.target.value; }
  else return;
  Array.prototype.forEach.call(root.querySelectorAll('.chips .chip'), b => { if (e.target.value.trim()) b.setAttribute('aria-pressed', 'false'); });
  save(); refreshNav();
});
function enter() { step = F.done ? 5 : 0; render(false); }
document.addEventListener('mr:lang', () => { render(false); renderHub(); });
window.addEventListener('hashchange', () => {
  if (location.hash === '#future') enter(); else stopTimer();
  if (location.hash === '' || location.hash === '#hub') renderHub();
});
render(false); renderHub();
window.MR_FUTURE = { avatar, sentence, stepHtml, F, WISHES, OBSTACLES, ACTIONS };
})();
