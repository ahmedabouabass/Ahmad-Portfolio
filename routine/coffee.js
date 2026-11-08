/* Morning Ritual: coffee for every mood. Make it, buy it or order it, with an intensity scale.
   The text here is written in both languages, so it does not go through i18n.js. */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const store = {
  get(k, d) { try { const v = localStorage.getItem('mr.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('mr.' + k, JSON.stringify(v)); } catch (e) {} }
};
const isAr = () => !!(window.MR_I18N && window.MR_I18N.lang === 'ar');
const x = (en, ar) => (isAr() ? ar : en);
const enc = encodeURIComponent;
const root = $('#coffeeWays'), moodBox = $('#coffeeMood'), list = $('#drinks');
if (!root || !moodBox || !list) return;

/* The shop link stays switched off until coffee products are published in the Shopify store. */
const SHOP = { base: 'https://ybe37y-m1.myshopify.com', live: false };
const NOON = { SA: 'saudi', AE: 'uae', EG: 'egypt' };
const HUNGER = { SA: 1, KW: 1 };
function country() { try { return (window.MR_CAL && window.MR_CAL._core && window.MR_CAL._core.country()) || 'SA'; } catch (e) { return 'SA'; } }

const a = (href, text, cls) => '<a class="' + (cls || 'cw-link') + '" href="' + href + '" target="_blank" rel="noopener noreferrer">' + text + '</a>';
function shopLink(term) {
  if (!SHOP.live) return '<span class="cw-link is-off" title="' + x('Our shop is opening soon', 'متجرنا سيفتح قريبًا') + '">' + x('Our shop, soon', 'متجرنا، قريبًا') + '</span>';
  return a(SHOP.base + '/search?q=' + enc(term), x('Our shop', 'متجرنا'));
}
function noonUrl(term) { const c = NOON[country()]; return c ? 'https://www.noon.com/' + c + '-' + (isAr() ? 'ar' : 'en') + '/search/?q=' + enc(term) : null; }
function noonLink(term, cls, label) { const u = noonUrl(term); return u ? a(u, label || x('Noon', 'نون'), cls) : ''; }
const mapsUrl = () => 'https://www.google.com/maps/search/' + enc(x('specialty coffee roasters', 'محامص قهوة مختصة'));
const mapsLink = (cls, label) => a(mapsUrl(), label || x('Roasters near you', 'محامص قريبة منك'), cls);
const ytUrl = term => 'https://www.youtube.com/results?search_query=' + enc(term);

/* ---------- content ---------- */
const MILK_TOOLS = [['Espresso machine', 'ماكينة إسبريسو', 'espresso machine', 'ماكينة اسبريسو'], ['Burr coffee grinder', 'مطحنة قهوة', 'burr coffee grinder', 'مطحنة قهوة'], ['Milk frother', 'مخفقة حليب', 'milk frother', 'مخفقة حليب'], ['Milk jug', 'إبريق حليب', 'milk frothing jug', 'إبريق حليب']];
const BEAN = ['Espresso beans', 'حبوب إسبريسو', 'espresso coffee beans', 'حبوب قهوة اسبريسو'];
const DRINK = {
  espresso: { name: ['Espresso', 'إسبريسو'], coffee: true, caps: true, buy: BEAN, roast: true,
    tools: [['Espresso machine', 'ماكينة إسبريسو', 'espresso machine', 'ماكينة اسبريسو'], ['Burr coffee grinder', 'مطحنة قهوة', 'burr coffee grinder', 'مطحنة قهوة'], ['Kitchen scale', 'ميزان مطبخ', 'coffee scale', 'ميزان قهوة'], ['Moka pot, if you have no machine', 'موكا بوت، إن لم تتوفر ماكينة', 'moka pot', 'موكا بوت']] },
  flat: { name: ['Flat white', 'فلات وايت'], coffee: true, caps: true, buy: BEAN, roast: true, tools: MILK_TOOLS },
  cappuccino: { name: ['Cappuccino', 'كابتشينو'], coffee: true, caps: true, buy: BEAN, roast: true, tools: MILK_TOOLS },
  qahwa: { name: ['Arabic qahwa', 'القهوة العربية'], coffee: true, buy: ['Arabic coffee, lightly roasted', 'قهوة عربية بتحميص خفيف', 'arabic coffee', 'قهوة عربية'],
    tools: [['Dallah, the Arabic coffee pot', 'دلة القهوة العربية', 'dallah arabic coffee pot', 'دلة قهوة'], ['Finjan cups', 'فناجين القهوة العربية', 'arabic coffee cups finjan', 'فناجين قهوة عربية'], ['Cardamom pods', 'هيل', 'cardamom pods', 'هيل حب']] },
  turkish: { name: ['Turkish coffee', 'القهوة التركية'], coffee: true, buy: ['Turkish coffee, ground extra fine', 'قهوة تركية مطحونة ناعمًا', 'turkish coffee', 'قهوة تركية'],
    tools: [['Cezve, the Turkish coffee pot', 'كنكة القهوة التركية', 'cezve turkish coffee pot', 'كنكة قهوة تركية'], ['Extra-fine coffee grinder', 'مطحنة قهوة ناعمة جدًا', 'turkish coffee grinder', 'مطحنة قهوة تركية'], ['Small coffee cups', 'فناجين قهوة صغيرة', 'turkish coffee cups', 'فناجين قهوة تركية']] },
  matcha: { name: ['Matcha', 'ماتشا'], buy: ['Matcha powder', 'مسحوق ماتشا', 'matcha powder', 'مسحوق ماتشا'],
    tools: [['Bamboo whisk (chasen)', 'مضرب خيزران (تشاسن)', 'matcha whisk chasen', 'مضرب ماتشا'], ['Matcha bowl', 'وعاء ماتشا', 'matcha bowl', 'وعاء ماتشا'], ['Fine sieve', 'مصفاة ناعمة', 'fine mesh sieve', 'مصفاة ناعمة']] },
  mate: { name: ['Yerba mate', 'يربا ماتي'], buy: ['Yerba mate', 'يربا ماتي', 'yerba mate', 'يربا ماتي'],
    tools: [['Mate gourd with bombilla', 'كوب ماتي مع بومبيا', 'yerba mate gourd bombilla', 'كوب يربا ماتي بومبيا']] },
  mint: { name: ['Mint tea', 'شاي بالنعناع'], buy: ['Mint tea', 'شاي نعناع', 'mint tea', 'شاي نعناع'],
    tools: [['Glass teapot', 'إبريق شاي زجاجي', 'glass teapot', 'إبريق شاي زجاج'], ['Tea glasses', 'أكواب شاي زجاجية', 'tea glasses set', 'أكواب شاي زجاج']] }
};
const nm = id => DRINK[id].name[isAr() ? 1 : 0];

const MOODS = [
  { id: 'tired', en: 'Tired', ar: 'متعب', d: 'espresso', n: 10, whyEn: 'A short, strong shot for a quick lift.', whyAr: 'جرعة قصيرة وقوية لانتعاش سريع.' },
  { id: 'focus', en: 'Need to focus', ar: 'أحتاج التركيز', d: 'flat', n: 7, whyEn: 'Smooth and steady, with milk to soften the edge.', whyAr: 'ناعمة ومتوازنة، والحليب يخفف حدّتها.' },
  { id: 'calm', en: 'Calm', ar: 'هادئ', d: 'matcha', whyEn: 'Calm and bright, with a softer lift than coffee.', whyAr: 'هادئ ومنعش، بانتعاش أخفّ من القهوة.' },
  { id: 'cozy', en: 'Cozy', ar: 'أرغب بالدفء', d: 'cappuccino', n: 5, whyEn: 'Warm foam for a slow morning.', whyAr: 'رغوة دافئة لصباح بطيء.' },
  { id: 'social', en: 'Hosting', ar: 'عندي ضيوف', d: 'qahwa', n: 4, whyEn: 'Golden qahwa, made to be shared.', whyAr: 'قهوة ذهبية تُقدَّم للضيوف.' },
  { id: 'stress', en: 'Stressed', ar: 'متوتر', d: 'mint', whyEn: 'Fresh mint is caffeine-free and soothing.', whyAr: 'النعناع الطازج خالٍ من الكافيين ومهدّئ.' },
  { id: 'treat', en: 'Treating myself', ar: 'أدلّل نفسي', d: 'turkish', n: 8, whyEn: 'Thick, slow and a little special.', whyAr: 'كثيفة وبطيئة وفيها شيء مميز.' }
];
const LVL = [['Light', 'خفيفة'], ['Medium', 'متوسطة'], ['Strong', 'قوية'], ['Intense', 'مركّزة']];
const ROAST = [
  ['light roast, bright and fruity', 'تحميص فاتح، حيوي بنكهة فاكهية'],
  ['medium roast, balanced and sweet', 'تحميص متوسط، متوازن وحلو'],
  ['medium-dark roast, chocolate and caramel', 'تحميص متوسط الغامق، بنكهة الشوكولاتة والكراميل'],
  ['dark roast, bold and smoky', 'تحميص غامق، قوي بنكهة مدخّنة']
];
const ROAST_TERM = [['light', 'فاتح'], ['medium', 'متوسط'], ['dark', 'غامق'], ['dark', 'غامق']];
const CAPS = ['Nespresso Original', 'Nespresso Vertuo', 'Dolce Gusto'];
const lvl = n => (n <= 3 ? 0 : n <= 6 ? 1 : n <= 9 ? 2 : 3);
const g = v => v + ' ' + x('g', 'غ');
const ml = v => v + ' ' + x('ml', 'مل');
const deg = v => v + ' ' + x('°C', '°م');

function recipe(id, n) {
  const lerp = (lo, hi) => Math.round(lo + (hi - lo) * (n - 1) / 11);
  const ln = (k, ka, v) => [x(k, ka), v];
  if (id === 'espresso') { const c = lerp(14, 20), o = c * 2; return {
    lines: [ln('Coffee', 'القهوة', g(c)), ln('In the cup', 'في الفنجان', '≈ ' + g(o)), ln('Time', 'الوقت', x('25 to 30 seconds', '25 إلى 30 ثانية')), ln('Grind', 'الطحن', x('Fine, like table salt', 'ناعم، كالملح الناعم')), ln('Water', 'الماء', '≈ ' + deg(93))],
    steps: [x('Warm the machine, the portafilter and the cup.', 'سخّن الماكينة والحامل والفنجان.'),
      x('Grind ' + g(c) + ', level it and tamp firmly.', 'اطحن ' + g(c) + '، وسوِّه واضغطه بقوة.'),
      x('Pull the shot: about ' + g(o) + ' in the cup in 25 to 30 seconds.', 'استخرج الشوت: نحو ' + g(o) + ' في الفنجان خلال 25 إلى 30 ثانية.'),
      x('Too sour? Grind finer. Too bitter? Grind coarser.', 'إن كان حامضًا فاطحن أنعم، وإن كان مرًّا فاطحن أخشن.')],
    note: x('No machine? A moka pot makes a close second.', 'لا توجد ماكينة؟ الموكا بوت بديل قريب.') }; }
  if (id === 'flat') { const c = lerp(16, 20), o = c * 2; return {
    lines: [ln('Coffee', 'القهوة', g(c)), ln('Milk', 'الحليب', ml(120)), ln('Cup', 'الكوب', ml(160) + ' – ' + ml(190)), ln('Grind', 'الطحن', x('Fine', 'ناعم'))],
    steps: [x('Warm the cup.', 'سخّن الكوب.'),
      x('Pull a double shot: ' + g(c) + ' in, about ' + g(o) + ' out in 25 to 30 seconds.', 'استخرج شوتًا مزدوجًا: ' + g(c) + ' قهوة، ونحو ' + g(o) + ' ناتجًا خلال 25 إلى 30 ثانية.'),
      x('Steam the milk to about ' + deg(60) + ' with a thin, glossy microfoam.', 'بخّر الحليب حتى نحو ' + deg(60) + ' مع رغوة رقيقة لامعة.'),
      x('Pour low and steady, then lift the jug to draw a heart.', 'اسكب بثبات من الأسفل ثم ارفع الإبريق لترسم قلبًا.')] }; }
  if (id === 'cappuccino') { const c = lerp(14, 18), o = c * 2; return {
    lines: [ln('Coffee', 'القهوة', g(c)), ln('Milk and foam', 'الحليب والرغوة', ml(120)), ln('Grind', 'الطحن', x('Fine', 'ناعم'))],
    steps: [x('Warm the cup.', 'سخّن الكوب.'),
      x('Pull the shot: ' + g(c) + ' in, about ' + g(o) + ' out.', 'استخرج الشوت: ' + g(c) + ' قهوة، ونحو ' + g(o) + ' ناتجًا.'),
      x('Froth the milk until it holds a thick foam, about half milk and half foam.', 'اخفق الحليب حتى تتكوّن رغوة كثيفة، نصف حليب ونصف رغوة.'),
      x('Pour the milk, then spoon the foam on top.', 'اسكب الحليب ثم ضع الرغوة بالملعقة فوقه.')] }; }
  if (id === 'qahwa') { const c = lerp(12, 24); return {
    lines: [ln('Coffee', 'القهوة', g(c)), ln('Water', 'الماء', ml(300)), ln('Cardamom', 'الهيل', x('3 pods, crushed', '3 حبات مدقوقة')), ln('Simmer', 'الغليان الهادئ', x('About 10 minutes', 'نحو 10 دقائق')), ln('Grind', 'الطحن', x('Coarse', 'خشن'))],
    steps: [x('Bring ' + ml(300) + ' of water to a gentle boil in the dallah.', 'اغلِ ' + ml(300) + ' من الماء غليًا هادئًا في الدلة.'),
      x('Add ' + g(c) + ' of coffee, lower the heat and simmer for about 10 minutes without letting it boil over.', 'أضف ' + g(c) + ' من القهوة، وخفّف النار ودعها تغلي بهدوء نحو 10 دقائق دون أن تفور.'),
      x('Add the crushed cardamom for the last 2 minutes. A pinch of saffron is lovely too.', 'أضف الهيل المدقوق في آخر دقيقتين. وقليل من الزعفران يزيدها جمالًا.'),
      x('Rest it for 3 minutes so the grounds settle, then pour a little at a time into small cups.', 'اتركها 3 دقائق لتترسّب الثفلة، ثم اسكبها قليلًا قليلًا في فناجين صغيرة.')],
    note: x('Makes about three small cups.', 'تكفي نحو ثلاثة فناجين صغيرة.') }; }
  if (id === 'turkish') { const c = lerp(6, 10); return {
    lines: [ln('Coffee', 'القهوة', g(c)), ln('Cold water', 'الماء البارد', ml(90)), ln('Time', 'الوقت', x('About 4 minutes', 'نحو 4 دقائق')), ln('Grind', 'الطحن', x('Extra fine, like powder', 'ناعم جدًا كالبودرة'))],
    steps: [x('Put the cold water, ' + g(c) + ' of coffee and sugar, if you take it, in the cezve. Stir once.', 'ضع الماء البارد و' + g(c) + ' من القهوة والسكر إن أردته في الكنكة. حرّك مرة واحدة.'),
      x('Heat on low. When the foam rises, lift it off before it boils.', 'سخّنها على نار هادئة. وحين ترتفع الرغوة ارفعها قبل أن تغلي.'),
      x('Return it to the heat for a second rise, then once more.', 'أعدها إلى النار لارتفاع ثانٍ، ثم مرة أخرى.'),
      x('Pour slowly so the foam lands in the cup, and wait a minute for the grounds to sink.', 'اسكبها ببطء لتنزل الرغوة في الفنجان، وانتظر دقيقة لتترسّب الثفلة.')] }; }
  if (id === 'matcha') return {
    lines: [ln('Matcha', 'الماتشا', x('2 g, about a teaspoon', '2 غ، نحو ملعقة صغيرة')), ln('Water', 'الماء', ml(70) + ' ' + x('at', 'عند') + ' ' + deg(80)), ln('Whisk', 'الخفق', x('15 to 20 seconds', '15 إلى 20 ثانية'))],
    steps: [x('Sift the matcha into a warm bowl.', 'انخل الماتشا في وعاء دافئ.'),
      x('Add a splash of water and stir into a smooth paste.', 'أضف قليلًا من الماء وحرّك حتى تصبح عجينة ناعمة.'),
      x('Add the rest of the water and whisk in a quick zigzag until frothy.', 'أضف بقية الماء واخفق بحركة متعرّجة سريعة حتى تظهر الرغوة.'),
      x('Drink it right away.', 'اشربه فورًا.')] };
  if (id === 'mate') return {
    lines: [ln('Yerba mate', 'يربا ماتي', x('Fill the gourd two thirds', 'املأ الكوب ثلثيه')), ln('Water', 'الماء', x('About', 'نحو') + ' ' + deg(75) + x(', never boiling', '، لا يغلي'))],
    steps: [x('Fill the gourd two thirds full, cover it and tilt it so the leaves bank to one side.', 'املأ الكوب ثلثيه، وغطِّه ومِلْه ليتجمع الورق في جانب واحد.'),
      x('Wet the leaves with a little cool water and let it soak in.', 'بلِّل الورق بقليل من الماء البارد واتركه يتشرّب.'),
      x('Set the bombilla and pour hot water into the empty side.', 'ضع البومبيا واسكب الماء الساخن في الجانب الفارغ.'),
      x('Sip slowly and top up with hot water as you go.', 'ارتشف ببطء وأضف ماء ساخنًا كلما احتجت.')] };
  return {
    lines: [ln('Fresh mint', 'النعناع الطازج', x('A small handful, about 10 leaves', 'حفنة صغيرة، نحو 10 أوراق')), ln('Water', 'الماء', ml(250) + ' ' + x('just boiled', 'مغلي للتو')), ln('Steep', 'النقع', x('4 to 5 minutes', '4 إلى 5 دقائق')), ln('Sweeten', 'التحلية', x('Honey, if you like', 'عسل إن أحببت'))],
    steps: [x('Press the leaves lightly to wake the oils.', 'اضغط الأوراق برفق لتتفتّح زيوتها.'),
      x('Pour the hot water over the mint.', 'اسكب الماء الساخن على النعناع.'),
      x('Steep for 4 to 5 minutes.', 'انقعه 4 إلى 5 دقائق.'),
      x('Strain into a glass and add honey if you like.', 'صفِّه في كوب زجاجي وأضف العسل إن أحببت.')] };
}

/* ---------- state ---------- */
const st = { way: store.get('way', 'make'), n: clamp(+store.get('intensity', 6) || 6, 1, 12), mood: store.get('mood', null), cap: store.get('capsule', CAPS[0]) };
if (['make', 'buy', 'order'].indexOf(st.way) < 0) st.way = 'make';
if (CAPS.indexOf(st.cap) < 0) st.cap = CAPS[0];
let fromMood = false;
function cur() { const b = $('#drinks .drink[aria-pressed="true"]'); const id = b ? b.dataset.id : store.get('drink', 'flat'); return DRINK[id] ? id : 'flat'; }
const levelName = n => LVL[lvl(n)][isAr() ? 1 : 0];

/* ---------- build ---------- */
function build() {
  moodBox.innerHTML = '<p class="cw-label" id="cwMoodLbl">' + x('Or start from your mood', 'أو ابدأ من مزاجك') + '</p>' +
    '<div class="chips" role="group" aria-labelledby="cwMoodLbl">' + MOODS.map(m => '<button type="button" class="chip" data-mood="' + m.id + '" aria-pressed="false">' + (isAr() ? m.ar : m.en) + '</button>').join('') + '</div>' +
    '<p class="cw-why" id="cwWhy" role="status" aria-live="polite"></p>';
  const bars = Array.from({ length: 12 }, (_, i) => '<i style="--c:' + shade(i) + '"></i>').join('');
  root.innerHTML =
    '<div class="cw-int" id="cwInt"><label class="cw-label" for="cwRange">' + x('How strong?', 'ما مدى قوتها؟') + '</label>' +
    '<input id="cwRange" class="cw-range" type="range" min="1" max="12" step="1">' +
    '<div class="cw-bars" aria-hidden="true">' + bars + '</div><p class="cw-read" id="cwRead"></p></div>' +
    '<p class="cw-label" id="cwWayLbl">' + x('How do you want it?', 'كيف تريدها؟') + '</p>' +
    '<div class="chips cw-tabs" role="group" aria-labelledby="cwWayLbl">' +
    '<button type="button" class="chip" data-way="make">' + x('Make it', 'أصنعها') + '</button>' +
    '<button type="button" class="chip" data-way="buy">' + x('Buy it', 'أشتريها') + '</button>' +
    '<button type="button" class="chip" data-way="order">' + x('Order it', 'أطلبها') + '</button></div>' +
    '<div class="cw-panel" id="cwPanel" aria-live="polite"></div>';
  update();
}
function shade(i) { const t = i / 11, A = [230, 188, 115], B = [104, 62, 30]; return 'rgb(' + A.map((v, k) => Math.round(v + (B[k] - v) * t)).join(',') + ')'; }

/* ---------- panels ---------- */
function toolRows(id) {
  return DRINK[id].tools.map(t => {
    const term = x(t[2], t[3]);
    return '<li class="cw-tool"><span>' + x(t[0], t[1]) + '</span><span class="cw-links">' + shopLink(term) + noonLink(term) + '</span></li>';
  }).join('');
}
function makePanel(id) {
  const D = DRINK[id], r = recipe(id, st.n), n = st.n;
  const q = x('how to make ' + D.name[0] + ' at home', 'طريقة عمل ' + D.name[1] + ' في البيت');
  return '<h3 class="cw-h">' + nm(id) + (D.coffee ? ' <span class="cw-sub">' + x('strength', 'الشدّة') + ' <bdi>' + n + '</bdi></span>' : '') + '</h3>' +
    '<ul class="cw-lines">' + r.lines.map(l => '<li><span>' + l[0] + '</span><span class="cw-lead"></span><span class="cw-val"><bdi>' + l[1] + '</bdi></span></li>').join('') + '</ul>' +
    '<ol class="cw-steps">' + r.steps.map(s => '<li>' + s + '</li>').join('') + '</ol>' +
    (r.note ? '<p class="cw-note">' + r.note + '</p>' : '') +
    '<div class="cw-row">' + a(ytUrl(q), x('Watch how it is made', 'شاهد طريقة التحضير'), 'btn btn-ghost sm') +
    '<button type="button" class="btn btn-ghost sm" data-go="buy">' + x('Get the gear', 'جهّز المستلزمات') + '</button></div>';
}
function buyPanel(id) {
  const D = DRINK[id], n = st.n, L = lvl(n), term0 = x(D.buy[2], D.buy[3]);
  const term = D.roast ? term0 + ' ' + x(ROAST_TERM[L][0], ROAST_TERM[L][1]) : term0;
  let h = '<h3 class="cw-h">' + x('Buy ', 'اشترِ ') + nm(id) + '</h3>';
  h += '<div class="cw-block"><h4>' + x(D.buy[0], D.buy[1]) + '</h4>';
  if (D.roast) h += '<p class="cw-note">' + x('For strength ' + n + ' of 12, look for ' + ROAST[L][0] + '.', 'للشدّة ' + n + ' من 12 ابحث عن ' + ROAST[L][1] + '.') + '</p>';
  h += '<div class="cw-links">' + shopLink(term) + noonLink(term) + mapsLink() + '</div></div>';
  if (D.caps) {
    const lo = Math.max(1, n - 1), hi = Math.min(13, n + 1);
    const ct = st.cap + ' ' + x('capsules intensity', 'كبسولات شدة') + ' ' + n;
    h += '<div class="cw-block"><h4>' + x('Capsules', 'الكبسولات') + '</h4><div class="chips cw-caps" role="group" aria-label="' + x('Capsule system', 'نظام الكبسولات') + '">' +
      CAPS.map(c => '<button type="button" class="chip" data-cap="' + c + '" aria-pressed="' + (c === st.cap) + '">' + c + '</button>').join('') + '</div>' +
      '<p class="cw-note">' + x('Look for intensity <bdi>' + lo + '</bdi> to <bdi>' + hi + '</bdi> on the box. Brands scale it a little differently, and most print a number from 1 to 13.', 'ابحث عن شدّة من <bdi>' + lo + '</bdi> إلى <bdi>' + hi + '</bdi> على العلبة. تختلف العلامات قليلًا في المقياس، وأغلبها يطبع رقمًا من 1 إلى 13.') + '</p>' +
      '<div class="cw-links">' + shopLink(ct) + noonLink(ct) + '</div></div>';
  }
  h += '<div class="cw-block"><h4>' + x('Tools you need', 'الأدوات التي تحتاجها') + '</h4><ul class="cw-tools">' + toolRows(id) + '</ul></div>';
  if (!SHOP.live) h += '<p class="cw-note">' + x('The shop links switch on when the coffee range goes live.', 'ستعمل روابط المتجر عند إطلاق مجموعة القهوة.') + '</p>';
  return h;
}
function orderText(id) {
  const D = DRINK[id];
  return D.coffee ? nm(id) + x(', ', '، ') + levelName(st.n).toLowerCase() + ' (' + st.n + ' ' + x('of', 'من') + ' 12)' : nm(id);
}
function orderPanel(id) {
  const D = DRINK[id], c = country(), txt = orderText(id);
  const hs = HUNGER[c] ? a('https://hungerstation.com/', x('Open HungerStation', 'افتح هنقرستيشن'), 'btn btn-primary sm') : '';
  const nt = D.caps ? st.cap + ' ' + x('capsules intensity', 'كبسولات شدة') + ' ' + st.n : x(D.buy[2], D.buy[3]);
  const nn = noonUrl(nt) ? a(noonUrl(nt), x('Have it delivered from Noon', 'يصلك من نون'), 'btn btn-ghost sm') : '';
  let h = '<h3 class="cw-h">' + x('Order ', 'اطلب ') + nm(id) + '</h3>' +
    '<p class="cw-note">' + x('Copy your order, then paste it into the app or tell the café.', 'انسخ طلبك ثم الصقه في التطبيق أو أخبر المقهى به.') + '</p>' +
    '<p class="cw-order" dir="auto">' + txt + '</p>' +
    '<div class="cw-row"><button type="button" class="btn btn-ghost sm" data-copy="1">' + x('Copy my order', 'انسخ طلبي') + '</button>' + hs + nn + mapsLink('btn btn-ghost sm', x('Find a café nearby', 'ابحث عن مقهى قريب')) + '</div>' +
    '<p class="cw-note" id="cwCopied" role="status" aria-live="polite"></p>';
  if (!hs && !nn) h += '<p class="cw-note">' + x('Delivery links are set up for Saudi Arabia, Kuwait, the UAE and Egypt. The map link works anywhere.', 'روابط التوصيل متاحة للسعودية والكويت والإمارات ومصر. أما رابط الخريطة فيعمل في أي مكان.') + '</p>';
  return h;
}

/* ---------- update ---------- */
function update() {
  const id = cur(), D = DRINK[id]; if (!D || !$('#cwPanel')) return;
  const n = st.n, L = lvl(n);
  $('#cwInt').hidden = !D.coffee;
  const r = $('#cwRange'); r.value = n; r.setAttribute('aria-valuetext', n + ' ' + x('of', 'من') + ' 12, ' + levelName(n));
  $$('.cw-bars i', root).forEach((b, i) => b.classList.toggle('on', i < n));
  $('#cwRead').innerHTML = '<span>' + x('Strength', 'الشدّة') + ' <strong><bdi>' + n + '</bdi> ' + x('of', 'من') + ' <bdi>12</bdi></strong></span><span>' + levelName(n) + '</span>';
  $$('[data-mood]', moodBox).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mood === st.mood)));
  const m = MOODS.filter(k => k.id === st.mood)[0];
  $('#cwWhy').textContent = m ? (isAr() ? m.whyAr : m.whyEn) : '';
  $$('[data-way]', root).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.way === st.way)));
  $('#cwPanel').innerHTML = st.way === 'buy' ? buyPanel(id) : st.way === 'order' ? orderPanel(id) : makePanel(id);
}

/* ---------- events ---------- */
moodBox.addEventListener('click', e => {
  const b = e.target.closest('[data-mood]'); if (!b) return;
  const m = MOODS.filter(k => k.id === b.dataset.mood)[0]; if (!m) return;
  const target = $('#drinks .drink[data-id="' + m.d + '"]');
  if (!target || target.disabled) return;
  fromMood = true; target.click(); fromMood = false;
  if (m.n) { st.n = m.n; store.set('intensity', st.n); }
  st.mood = m.id; store.set('mood', st.mood); update();
});
list.addEventListener('click', e => {
  if (!e.target.closest('.drink')) return;
  if (!fromMood) { st.mood = null; store.set('mood', null); }
  update();
});
root.addEventListener('input', e => {
  if (e.target.id !== 'cwRange') return;
  st.n = clamp(+e.target.value || 6, 1, 12); store.set('intensity', st.n); st.mood = null; store.set('mood', null); update();
});
root.addEventListener('click', e => {
  const w = e.target.closest('[data-way]'), go = e.target.closest('[data-go]'), cp = e.target.closest('[data-cap]'), cy = e.target.closest('[data-copy]');
  if (w || go) { st.way = (w || go).dataset.way || (w || go).dataset.go; store.set('way', st.way); update(); if (go) { const t = $('#cwWayLbl'); if (t && t.scrollIntoView) t.scrollIntoView({ block: 'start', behavior: 'smooth' }); } return; }
  if (cp) { st.cap = cp.dataset.cap; store.set('capsule', st.cap); update(); return; }
  if (cy) {
    const txt = orderText(cur()), say = ok => { const p = $('#cwCopied'); if (p) p.textContent = ok ? x('Copied. Paste it into the app.', 'تم النسخ. الصقه في التطبيق.') : x('Copy this: ', 'انسخ هذا: ') + txt; };
    const fallback = () => { try { const t = document.createElement('textarea'); t.value = txt; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); const ok = document.execCommand && document.execCommand('copy'); document.body.removeChild(t); say(!!ok); } catch (err) { say(false); } };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(() => say(true), fallback); else fallback();
  }
});
document.addEventListener('mr:lang', build);
window.addEventListener('hashchange', () => { if (location.hash === '#coffee') update(); });
build();
window.MR_COFFEE = { recipe, update };
})();
