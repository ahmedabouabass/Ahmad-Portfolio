/* Morning Ritual: Arabic and English. Text stays in English in the page; this file translates it
   in place and keeps the original so the language can be switched back at any time. */
(() => {
'use strict';
const KEY = 'mr.lang';
let saved = null; try { saved = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
let lang = saved === 'ar' || saved === 'en' ? saved : (/^ar/i.test(navigator.language || '') ? 'ar' : 'en');

const mins = n => n === 1 ? 'دقيقة واحدة' : n === 2 ? 'دقيقتان' : (n >= 3 && n <= 10) ? n + ' دقائق' : n + ' دقيقة';
const PH = { 'Breathe in': 'شهيق', 'Hold': 'احبس', 'Breathe out': 'زفير', 'Rest': 'استرح' };
const WHAT = { 'a bowl': 'جرس', 'a spoken cue': 'تنبيه منطوق', 'a bowl and a spoken cue': 'جرس وتنبيه منطوق' };

const D = {
  /* page and header */
  'Morning Ritual': 'طقس الصباح', 'Morning Ritual | Ahmad Abou Abass': 'طقس الصباح | أحمد أبو عباس',
  'Skip to content': 'تخطَّ إلى المحتوى', 'Portfolio': 'الملف المهني', 'Sound': 'الصوت',
  'Time and weather. Open scene settings.': 'الوقت والطقس. افتح إعدادات المشهد.',
  'This page needs JavaScript to play sound and run the timer.': 'تحتاج هذه الصفحة إلى جافاسكربت لتشغيل الصوت والمؤقّت.',
  /* hub */
  'Slow mornings, done well.': 'صباحات هادئة، على أكمل وجه.',
  'Coffee, a few minutes of breathing, then breakfast. About fifteen minutes, one step at a time.': 'قهوة، ثم دقائق من التنفّس، ثم الفطور. نحو خمس عشرة دقيقة، خطوة بعد خطوة.',
  'Start my morning': 'ابدأ صباحي', 'Order your coffee': 'اطلب قهوتك', 'Continue to breathing': 'تابع إلى التنفّس', 'Continue to breakfast': 'تابع إلى الفطور', 'Sit again': 'اجلس مجددًا',
  'Checking the weather…': 'نتحقق من الطقس…', 'Change the scene': 'غيّر المشهد', 'Or go straight to one thing': 'أو انتقل مباشرةً إلى خطوة واحدة',
  'Sit and breathe': 'اجلس وتنفّس', 'Build your breakfast': 'جهّز فطورك', 'Choose your music': 'اختر موسيقاك', 'Pick something to read': 'اختر ما تقرؤه',
  'Your calendar': 'تقويمك', 'Dress your avatar': 'ألبِس شخصيتك',
  'Start': 'ابدأ', 'Open': 'افتح', 'Coming soon': 'قريبًا', 'Done today': 'أُنجز اليوم', 'Back to the ritual': 'العودة إلى الطقس',
  /* calendar view (static parts) */
  'Public holidays, weekends and the Hijri date for the country you are in.': 'العطل الرسمية وأيام نهاية الأسبوع والتاريخ الهجري للبلد الذي أنت فيه.',
  /* coffee */
  'Your cup, filling as the drink is made': 'كوبك وهو يمتلئ أثناء تحضير المشروب', 'Pick a drink and place your order.': 'اختر مشروبًا وأرسل طلبك.',
  'What are you having?': 'ماذا تشرب؟', 'Play soft ambience with my order': 'شغّل أجواءً هادئة مع طلبي', 'Place order': 'أرسل الطلب', 'Order something else': 'اطلب شيئًا آخر',
  'Espresso': 'إسبريسو', 'Short, dark and quick': 'قصير وداكن وسريع',
  'Flat white': 'فلات وايت', 'Velvety milk over a double shot': 'حليب مخملي فوق جرعة مزدوجة',
  'Cappuccino': 'كابتشينو', 'Deep foam for slow sips': 'رغوة كثيفة لرشفات بطيئة',
  'Arabic qahwa': 'قهوة عربية', 'Golden and scented with cardamom': 'ذهبية بعبق الهيل',
  'Turkish coffee': 'قهوة تركية', 'Thick, unfiltered, with foam': 'كثيفة غير مصفّاة وبرغوة',
  'Matcha': 'ماتشا', 'Whisked green tea, calm and bright': 'شاي أخضر مخفوق، هادئ ومنعش',
  'Yerba mate': 'يربا ماتي', 'Earthy and smooth, sipped slowly': 'ترابي ناعم، يُرتشف ببطء',
  'Mint tea': 'شاي بالنعناع', 'Fresh mint, light and clear': 'نعناع طازج، خفيف وصافٍ',
  'Grinding the beans': 'طحن حبوب البن', 'Pulling the shot': 'استخراج الجرعة', 'Letting the crema settle': 'ترك الكريما تستقر',
  'Steaming the milk': 'تبخير الحليب', 'Pouring a heart': 'سكب قلب', 'Frothing the milk': 'رغوة الحليب', 'Spooning the foam': 'غرف الرغوة',
  'Warming the dallah': 'تسخين الدلّة', 'Adding cardamom': 'إضافة الهيل', 'Pouring a small cup': 'صبّ فنجان صغير',
  'Grinding extra fine': 'الطحن ناعمًا جدًا', 'Bringing it to the boil': 'رفعها إلى الغليان', 'Pouring slowly': 'الصبّ ببطء',
  'Sifting the matcha': 'غربلة الماتشا', 'Whisking until frothy': 'الخفق حتى تتكوّن الرغوة', 'Pouring into the cup': 'الصبّ في الكوب',
  'Filling the gourd': 'ملء القرعة', 'Adding hot water': 'إضافة الماء الساخن', 'Setting the bombilla': 'تثبيت المصّاصة',
  'Warming the pot': 'تسخين الإبريق', 'Pressing the mint': 'هرس النعناع', 'Pouring from a height': 'الصبّ من علوّ',
  /* breathe */
  'Set the length, choose how you want to be nudged, then begin. A bowl rings to start and to finish.': 'حدّد المدة، واختر كيف تريد أن يُنبَّهك التطبيق، ثم ابدأ. يرنّ جرس عند البداية وعند النهاية.',
  'Length': 'المدة', 'Other': 'أخرى', '1 to 60': 'من 1 إلى 60', 'Custom length in minutes': 'مدة مخصصة بالدقائق',
  'Chime during the session': 'رنين أثناء الجلسة', 'Off': 'إيقاف', 'Every minute': 'كل دقيقة',
  'Chime style': 'نمط الرنين', 'Singing bowl': 'جرس التأمل', 'Spoken minutes': 'الدقائق بصوت منطوق', 'Bowl and voice': 'جرس وصوت',
  "Spoken minutes need a browser that supports speech. Your device doesn't, so the bowl will be used.": 'الدقائق المنطوقة تحتاج متصفحًا يدعم النطق. جهازك لا يدعمه، لذا سيُستخدم الجرس.',
  'Breathing guide': 'دليل التنفّس', 'None': 'بدون', 'Calm: in 4, out 6': 'هدوء: شهيق 4، زفير 6', 'Box: 4, 4, 4, 4': 'المربّع: 4، 4، 4، 4',
  'Relax: in 4, hold 7, out 8': 'استرخاء: شهيق 4، حبس 7، زفير 8', 'Open awareness': 'الوعي المفتوح', 'Noting': 'التسمية الذهنية',
  'Begin session': 'ابدأ الجلسة', 'Pause': 'إيقاف مؤقت', 'Resume': 'استئناف', 'End session': 'أنهِ الجلسة', 'Tap again to end': 'المس مرة أخرى للإنهاء',
  'Session started.': 'بدأت الجلسة.', 'Paused.': 'أُوقفت مؤقتًا.', 'Resumed.': 'استؤنفت الجلسة.', 'Paused': 'متوقفة مؤقتًا',
  'Session complete': 'اكتملت الجلسة', 'Session complete.': 'اكتملت الجلسة.', 'How do you feel?': 'كيف تشعر؟',
  'Calm': 'هادئ', 'Clear': 'صافي الذهن', 'Light': 'خفيف', 'About the same': 'كما كنت تقريبًا',
  'Saved only on this device.': 'يُحفظ على هذا الجهاز فقط.', 'Saved on this device.': 'حُفظ على هذا الجهاز.',
  'Finish or end your session first.': 'أنهِ جلستك أولًا.',
  'Rest in open awareness.': 'استرح في وعيٍ مفتوح.', 'Let sounds come and go.': 'دع الأصوات تأتي وتذهب.',
  'Notice what is here, without fixing it.': 'لاحظ ما هو موجود، دون أن تحاول إصلاحه.', 'Let thoughts pass like clouds.': 'دع الأفكار تمرّ كالغيوم.',
  'Feel the body sitting.': 'اشعر بجسدك جالسًا.', 'Notice what is here. Name it softly.': 'لاحظ ما هو موجود. سمِّه بهدوء.',
  'Hearing.': 'سمع.', 'Thinking.': 'تفكير.', 'Feeling.': 'شعور.', 'Seeing. Then let it go.': 'رؤية. ثم دعها تمرّ.',
  /* breakfast */
  'Pick what goes on your plate and watch the protein and calories add up. Values are approximate for common foods, so check your own labels.': 'اختر ما يوضع في طبقك وراقب تراكم البروتين والسعرات. القيم تقريبية للأطعمة الشائعة، فراجع ملصقات منتجاتك.',
  'Start from a plate': 'ابدأ من طبق جاهز', 'Protein goal for this meal': 'هدف البروتين لهذه الوجبة',
  'Power oats': 'شوفان القوة', 'Egg and foul plate': 'طبق البيض والفول', 'Yogurt bowl': 'وعاء الزبادي',
  'Protein': 'البروتين', 'Carbs': 'الكربوهيدرات', 'Extras and drinks': 'إضافات ومشروبات',
  'Eggs': 'بيض', '2 large': '2 كبيرة', 'Plain Greek yogurt': 'زبادي يوناني سادة', 'Plant protein powder': 'بروتين نباتي بودرة', '1 scoop, 30 g': 'مغرفة واحدة، 30 غ',
  'Foul medames': 'فول مدمّس', '½ cup': '½ كوب', 'Labneh': 'لبنة', '2 tbsp': '2 ملعقة كبيرة',
  'Rolled oats': 'شوفان مجروش', '40 g dry': '40 غ جاف', 'Whole-wheat toast': 'توست القمح الكامل', '1 slice': 'شريحة واحدة',
  'Banana': 'موز', '1 medium': 'حبة متوسطة', 'Berries': 'توت', 'Medjool dates': 'تمر مجدول', '2 dates': 'تمرتان',
  'Peanut butter': 'زبدة الفول السوداني', '1 tbsp': 'ملعقة كبيرة', 'Almonds': 'لوز', 'Chia seeds': 'بذور الشيا', 'Ground flaxseed': 'بذور الكتان المطحونة',
  'Unsweetened soy milk': 'حليب الصويا غير المحلّى', '1 cup': 'كوب', 'Whole milk': 'حليب كامل الدسم',
  'Your plate': 'طبقك', 'g protein': 'غ بروتين', 'Progress toward your protein goal': 'التقدّم نحو هدف البروتين',
  'Calories': 'السعرات', 'Fat': 'الدهون', "Save as today's breakfast": 'احفظ كفطور اليوم', 'Clear plate': 'أفرغ الطبق',
  'A planning aid, not medical or dietary advice.': 'أداة تخطيط، وليست نصيحة طبية أو غذائية.', 'Add something to your plate to begin.': 'أضف شيئًا إلى طبقك لتبدأ.',
  "Saved as today's breakfast, on this device.": 'حُفظ كفطور اليوم، على هذا الجهاز.',
  /* music */
  'Playlists I keep on YouTube Music. Some play right here. The rest are blocked from playing on other sites by their music labels, so they open in YouTube Music.': 'قوائم تشغيل أحتفظ بها في يوتيوب ميوزك. بعضها يعمل هنا مباشرة، أما البقية فتمنعها شركات الإنتاج من العمل في المواقع الأخرى، لذا تُفتح في يوتيوب ميوزك.',
  'Arabic voices': 'أصوات عربية', 'Calm and classical': 'هادئ وكلاسيكي', 'More energy': 'طاقة أكثر',
  'Fairuz': 'فيروز', 'Majida El Roumi': 'ماجدة الرومي', 'Wael Kfouri': 'وائل كفوري', 'Nancy Ajram': 'نانسي عجرم', 'Elissa': 'إليسا',
  'Piano': 'بيانو', 'Classical': 'كلاسيكي', 'Opera': 'أوبرا', 'Rap': 'راب', 'Techno': 'تكنو',
  'The classic Lebanese morning.': 'الصباح اللبناني الكلاسيكي.', 'Warm, powerful Lebanese songs.': 'أغانٍ لبنانية دافئة وقوية.',
  'Lebanese pop with a gentle pace.': 'بوب لبناني بإيقاع هادئ.', 'Bright Arabic pop for an easy start.': 'بوب عربي مشرق لبداية سلسة.',
  'Arabic pop and ballads.': 'بوب عربي وأغانٍ عاطفية.', 'Solo piano for focus and calm.': 'بيانو منفرد للتركيز والهدوء.',
  'Classical pieces for a slow start.': 'مقطوعات كلاسيكية لبداية بطيئة.', 'Big voices for a bigger morning.': 'أصوات كبيرة لصباح أكبر.',
  'When the morning needs a push.': 'حين يحتاج الصباح إلى دفعة.', 'Steady beats for getting things done.': 'إيقاعات ثابتة لإنجاز المهام.',
  'Play here': 'شغّل هنا', 'Open in YouTube Music': 'افتح في يوتيوب ميوزك',
  /* reading */
  'A short shelf for slow mornings. Each link searches Audible, where you can listen or read a sample.': 'رفّ صغير لصباحات هادئة. كل رابط يبحث في أودبل، حيث يمكنك الاستماع أو قراءة مقتطف.',
  'Find on Audible': 'ابحث في أودبل',
  'The classic starting point for everyday mindfulness.': 'نقطة الانطلاق الكلاسيكية لليقظة الذهنية اليومية.',
  'Self-compassion, with meditation woven through it.': 'تعاطف مع الذات، والتأمل منسوج في ثناياه.',
  'A calmer way to think about time and its limits.': 'طريقة أهدأ للتفكير في الوقت وحدوده.',
  'A short, hard-won book on finding meaning in difficulty.': 'كتاب قصير وُلد من تجربة قاسية عن إيجاد المعنى وسط الصعوبة.',
  'Why chasing certainty keeps us restless, and what to do instead.': 'لماذا تُبقينا مطاردة اليقين قلقين، وماذا نفعل بدلًا من ذلك.',
  'Slow down at the table. A good companion to breakfast.': 'أبطئ على المائدة. رفيق جيد للفطور.',
  /* footer */
  'Everything you choose stays on your device. Weather comes from Open-Meteo. This is a relaxation tool, not medical advice.': 'كل ما تختاره يبقى على جهازك. يأتي الطقس من Open-Meteo. هذه أداة للاسترخاء وليست نصيحة طبية.',
  'Back to the portfolio': 'العودة إلى الملف المهني',
  /* sheet */
  'Scene and sound': 'المشهد والصوت', 'Panel': 'اللوحة', 'Scene': 'المشهد', 'Close panel': 'أغلق اللوحة', 'Close': 'إغلاق',
  'Play ambience': 'شغّل الأجواء', 'Pause ambience': 'أوقف الأجواء مؤقتًا',
  'The music follows your scene and the weather.': 'تتبع الموسيقى مشهدك والطقس.', 'You set the mix by hand.': 'أنت تضبط المزيج يدويًا.', 'Match the scene again': 'طابِق المشهد مجددًا',
  'Background': 'الخلفية', 'Café': 'مقهى', 'City': 'مدينة', 'Mountain': 'جبل', 'Beach': 'شاطئ', 'Zen': 'زِن', 'Party': 'حفلة',
  'Weather': 'الطقس', 'Live': 'مباشر', 'Sunny': 'مشمس', 'Cloudy': 'غائم', 'Rain': 'مطر', 'Snow': 'ثلج', 'Storm': 'عاصفة',
  'Time of day': 'وقت اليوم', 'Auto': 'تلقائي', 'Day': 'نهار', 'Dusk': 'غروب', 'Night': 'ليل',
  'Place:': 'المكان:', 'Riyadh': 'الرياض', 'My location': 'موقعي', 'Search for a city': 'ابحث عن مدينة', 'Search': 'بحث',
  'Use my location': 'استخدم موقعي', 'Show °F': 'اعرض °F', 'Show °C': 'اعرض °C',
  'Searching…': 'جارٍ البحث…', 'No city found. Check the spelling or try a larger nearby city.': 'لم نجد مدينة بهذا الاسم. تحقق من الإملاء أو جرّب مدينة أكبر قريبة.',
  'Search is unavailable. Check your connection and try again.': 'البحث غير متاح. تحقق من اتصالك وحاول مجددًا.',
  "This browser can't share your location. Search for a city instead.": 'لا يستطيع هذا المتصفح مشاركة موقعك. ابحث عن مدينة بدلًا من ذلك.',
  'Asking for your location…': 'نطلب موقعك…', 'Location was not shared. Search for a city instead.': 'لم تتم مشاركة الموقع. ابحث عن مدينة بدلًا من ذلك.',
  'Live weather is unavailable. Check your connection.': 'الطقس المباشر غير متاح. تحقق من اتصالك.', 'Loading live weather…': 'جارٍ تحميل الطقس المباشر…',
  'Overall volume': 'مستوى الصوت العام', 'Fine-tune the mix': 'اضبط المزيج بدقة',
  'Rain on glass': 'مطر على الزجاج', 'Café murmur': 'همهمة المقهى', 'Fireplace': 'المدفأة', 'Soft pad': 'نغمة ناعمة', 'City streets': 'شوارع المدينة',
  'Wind': 'رياح', 'Ocean waves': 'أمواج المحيط', 'Birds and crickets': 'طيور وصراصير', 'Chimes and water': 'أجراس وماء', 'House beat': 'إيقاع هاوس',
  'Play a video instead': 'شغّل فيديو بدلًا من ذلك', "Plays through YouTube's own player. Some videos block playback outside YouTube.": 'يعمل عبر مشغّل يوتيوب نفسه. تمنع بعض الفيديوهات التشغيل خارج يوتيوب.',
  "Ahmad's pick": 'اختيار أحمد', 'YouTube link': 'رابط يوتيوب', 'Paste a YouTube link': 'الصق رابط يوتيوب', 'Play': 'شغّل',
  'Video volume': 'مستوى صوت الفيديو', 'Stop video': 'أوقف الفيديو',
  'Loading the player…': 'جارٍ تحميل المشغّل…', 'The YouTube player could not load. Check your connection or any blocker, then try again.': 'تعذّر تحميل مشغّل يوتيوب. تحقق من اتصالك أو من أي مانع إعلانات ثم حاول مجددًا.',
  "The owner doesn't allow this to play here.": 'صاحب المحتوى لا يسمح بتشغيله هنا.', "This playlist can't be played here.": 'لا يمكن تشغيل هذه القائمة هنا.', "This video can't be played here.": 'لا يمكن تشغيل هذا الفيديو هنا.',
  'Open it in YouTube Music': 'افتحها في يوتيوب ميوزك', 'Open it on YouTube': 'افتحه على يوتيوب',
  "That doesn't look like a YouTube link. Paste the full video address.": 'لا يبدو هذا رابط يوتيوب. الصق عنوان الفيديو كاملًا.',
  "This browser can't play generated sound.": 'لا يستطيع هذا المتصفح تشغيل الصوت المولَّد.',
  /* weather words */
  'Clear': 'صافٍ', 'Mostly clear': 'صافٍ في الغالب', 'Partly cloudy': 'غائم جزئيًا', 'Overcast': 'ملبّد بالغيوم', 'Fog': 'ضباب', 'Drizzle': 'رذاذ',
  'Freezing drizzle': 'رذاذ متجمّد', 'Light rain': 'مطر خفيف', 'Heavy rain': 'مطر غزير', 'Freezing rain': 'مطر متجمّد', 'Light snow': 'ثلج خفيف',
  'Heavy snow': 'ثلج كثيف', 'Snow grains': 'حبيبات ثلج', 'Showers': 'زخّات', 'Heavy showers': 'زخّات غزيرة', 'Snow showers': 'زخّات ثلجية', 'Thunderstorm': 'عاصفة رعدية',
  'Weather unavailable': 'الطقس غير متاح', 'wx:Clear': 'صافٍ'
};
/* "Calm" and "Clear" are both a mood chip and a weather word; the mood wins, the weather label is translated by the page itself */
D['Clear'] = 'صافي الذهن';
const LC = {}; Object.keys(D).forEach(k => { LC[k.toLowerCase()] = D[k]; });

const RULES = [
  [/^(\d+) min$/, n => n + ' د'],
  [/^(\d+) g$/, n => n + ' غ'],
  [/^Every (\d+) minutes$/, n => 'كل ' + mins(+n)],
  [/^(\d+) minutes?\.$/, n => mins(+n) + '.'],
  [/^(\d+) minutes\. (A closing bowl at the end|An opening bowl, then a closing bowl at the end)(, with (a bowl|a spoken cue|a bowl and a spoken cue) at ([\d, ]+) minutes\.|\. This session is too short for chimes every (\d+) minutes\.|\.)$/,
    (n, ph, tail, what, list, ev) => mins(+n) + '. ' + (ph.indexOf('A closing') === 0 ? 'جرس ختامي عند النهاية' : 'جرس افتتاحي ثم جرس ختامي عند النهاية') +
      (what ? '، مع ' + WHAT[what] + ' عند الدقائق ' + list.split(/,\s*/).join('، ') + '.' : ev ? '. هذه الجلسة أقصر من أن تتضمن رنينًا كل ' + mins(+ev) + '.' : '.')],
  [/^Next chime at (\d\d:\d\d) left$/, t => 'الرنين التالي عند بقاء ' + t],
  [/^(Breathe in|Hold|Breathe out|Rest) (\d+)$/, (p, n) => PH[p] + ' ' + n],
  [/^You sat for (\d+) minutes?\. Take a moment before you move on\.$/, n => 'جلستَ ' + mins(+n) + '. خذ لحظة قبل أن تنتقل.'],
  [/^Session saved: (\d+) min\.$/, n => 'حُفظت الجلسة: ' + n + ' د.'],
  [/^(\d+) sessions?, (\d+) minutes(?:, (\d+) days in a row)?\.$/, (n, m, s) => 'الجلسات: ' + n + '، الدقائق: ' + m + (s ? '، أيام متتالية: ' + s : '') + '.'],
  [/^(\d\d:\d\d) · Morning Ritual$/, t => t + ' · طقس الصباح'],
  [/^Your (.+) is ready\. Take your time\.$/, d => 'تفضّل، مشروبك جاهز: ' + T(d) + '. خذ وقتك.'],
  [/^(.+): (\d+) kcal, (\d+) g protein$/, (s, k, p) => T(s) + ': ' + k + ' سعرة، ' + p + ' غ بروتين'],
  [/^Goal reached: (\d+) g of (\d+) g\.$/, (a, b) => 'تحقق الهدف: ' + a + ' غ من ' + b + ' غ.'],
  [/^(\d+) g of protein to go\.$/, n => 'متبقٍ ' + n + ' غ من البروتين.'],
  [/^(\d+) × (.+)$/, (n, f) => n + ' × ' + T(f)],
  [/^(.+) servings$/, f => 'حصص ' + T(f)],
  [/^Fewer (.+)$/, f => 'إنقاص ' + T(f)],
  [/^More (.+)$/, f => 'زيادة ' + T(f)],
  [/^Play the (.+) playlist here$/, p => 'شغّل قائمة ' + T(p) + ' هنا'],
  [/^Open the (.+) playlist in YouTube Music, opens in a new tab$/, p => 'افتح قائمة ' + T(p) + ' في يوتيوب ميوزك، تُفتح في علامة تبويب جديدة'],
  [/^Find (.+) on Audible, opens in a new tab$/, b => 'ابحث عن ' + b + ' في أودبل، يُفتح في علامة تبويب جديدة'],
  [/^(.+)…$/, a => { const t = T(a); return t !== a ? t + '…' : null; }]
];

function T(s) {
  if (!/[A-Za-z]/.test(s)) return s;
  if (s.slice(0, 3) === 'wx:') return Object.prototype.hasOwnProperty.call(D, s) ? D[s] : T(s.slice(3));
  if (Object.prototype.hasOwnProperty.call(D, s)) return D[s];
  const l = s.toLowerCase(); if (Object.prototype.hasOwnProperty.call(LC, l)) return LC[l];
  for (const [re, fn] of RULES) { const m = s.match(re); if (m) { const r = fn.apply(null, m.slice(1)); if (r != null) return r; } }
  return s;
}
function tr(raw) {
  if (lang !== 'ar' || !raw || !/[A-Za-z]/.test(raw)) return raw;
  const m = raw.match(/^(\s*)([\s\S]*?)(\s*)$/); if (!m[2]) return raw;
  const out = T(m[2]); return out === m[2] ? raw : m[1] + out + m[3];
}

/* ---- apply to the page ---- */
const ATTRS = ['aria-label', 'placeholder', 'title', 'alt'];
const lastT = new WeakMap(), origT = new WeakMap(), attrRec = new WeakMap();
const skip = el => !el || (el.closest && el.closest('[data-no-i18n],svg,script,style,canvas,noscript'));
function doText(n) {
  const p = n.parentElement; if (!p || skip(p)) return;
  const cur = n.data; if (lastT.has(n) && lastT.get(n) === cur) return;
  origT.set(n, cur); const t = tr(cur);
  if (t !== cur) { lastT.set(n, t); n.data = t; } else lastT.delete(n);
}
function doAttr(el, a) {
  if (skip(el)) return; const v = el.getAttribute(a); if (v == null) return;
  let rec = attrRec.get(el); if (!rec) { rec = {}; attrRec.set(el, rec); }
  if (rec[a] && rec[a].l === v) return;
  rec[a] = { o: v, l: null }; const t = tr(v);
  if (t !== v) { rec[a].l = t; el.setAttribute(a, t); }
}
function sweep(node) {
  if (node.nodeType === 3) { doText(node); return; }
  if (node.nodeType !== 1) return;
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let n = node;
  do { if (n.nodeType === 3) doText(n); else { ATTRS.forEach(a => { if (n.hasAttribute(a)) doAttr(n, a); }); } } while ((n = walker.nextNode()));
}
function revert(node) {
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let n = node;
  do {
    if (n.nodeType === 3) { if (lastT.has(n) && n.data === lastT.get(n)) { n.data = origT.get(n); } lastT.delete(n); }
    else { const rec = attrRec.get(n); if (rec) Object.keys(rec).forEach(a => { if (rec[a].l != null && n.getAttribute(a) === rec[a].l) n.setAttribute(a, rec[a].o); }); attrRec.delete(n); }
  } while ((n = walker.nextNode()));
}
const mo = new MutationObserver(list => {
  for (const m of list) {
    if (m.type === 'characterData') doText(m.target);
    else if (m.type === 'attributes') doAttr(m.target, m.attributeName);
    else m.addedNodes.forEach(sweep);
  }
});
const watch = () => mo.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });

function apply() {
  const ar = lang === 'ar', root = document.documentElement;
  root.lang = lang; root.dir = ar ? 'rtl' : 'ltr'; document.body.classList.toggle('ar', ar);
  mo.disconnect();
  if (ar) { sweep(root); watch(); } else revert(root);
  const b = document.getElementById('langBtn');
  if (b) { b.textContent = ar ? 'English' : 'العربية'; b.lang = ar ? 'en' : 'ar'; b.setAttribute('aria-label', ar ? 'Switch to English' : 'التبديل إلى العربية'); }
}
function setLang(l) {
  if (l !== 'ar' && l !== 'en') return; lang = l;
  try { localStorage.setItem(KEY, JSON.stringify(l)); } catch (e) {}
  apply(); document.dispatchEvent(new CustomEvent('mr:lang', { detail: l }));
}
window.MR_I18N = { tr, set: setLang, mins, get lang() { return lang; } };
const b = document.getElementById('langBtn'); if (b) b.addEventListener('click', () => setLang(lang === 'ar' ? 'en' : 'ar'));
apply();
if (lang === 'ar') document.dispatchEvent(new CustomEvent('mr:lang', { detail: 'ar' }));
})();
