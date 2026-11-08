(() => {
'use strict';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const store = {
  get(k, d) { try { const v = localStorage.getItem('mr.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('mr.' + k, JSON.stringify(v)); } catch (e) {} }
};
const today = () => new Date().toLocaleDateString('en-CA');
let toastTimer;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 3800);
}

/* ============ Sound engine (all sound is generated here, nothing is downloaded) ============ */
const LAYERS = {
  rain: { label: 'Rain on glass', scale: 0.9 },
  cafe: { label: 'Café murmur', scale: 1 },
  fire: { label: 'Fireplace', scale: 0.8 },
  pad:  { label: 'Soft pad', scale: 0.5 }
};
const EXT = window.MR_EXT || null;
if (EXT) Object.assign(LAYERS, EXT.layers);

class Engine {
  constructor() {
    this.ctx = null; this.layers = {}; this.noise = {}; this.bowls = [];
    this.vols = {}; this.master = 0.7; this.night = false; this.weather = 'sunny';
    this.playing = false; this.timer = null;
  }
  ensure() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return this.ctx; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    const c = this.ctx = new AC();
    this.comp = c.createDynamicsCompressor();
    this.comp.threshold.value = -20; this.comp.knee.value = 20; this.comp.ratio.value = 3;
    this.comp.connect(c.destination);
    this.bus = c.createGain(); this.bus.gain.value = 0; this.bus.connect(this.comp);
    this.bellBus = c.createGain(); this.bellBus.gain.value = 0.9; this.bellBus.connect(this.comp);
    ['white', 'pink', 'brown'].forEach(k => { this.noise[k] = this.makeNoise(k); });
    return c;
  }
  makeNoise(kind) {
    const c = this.ctx, sr = c.sampleRate, len = Math.floor(sr * 6), X = Math.floor(sr * 0.25);
    const raw = new Float32Array(len + X);
    if (kind === 'white') { for (let i = 0; i < raw.length; i++) raw[i] = Math.random() * 2 - 1; }
    else if (kind === 'brown') { let last = 0; for (let i = 0; i < raw.length; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; raw[i] = last * 3.5; } }
    else { let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < raw.length; i++) { const w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
        raw[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926; } }
    const buf = c.createBuffer(1, len, sr), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) { if (i < X) { const f = i / X; d[i] = raw[i] * f + raw[len + i] * (1 - f); } else d[i] = raw[i]; }
    return buf;
  }
  loop(kind) { const s = this.ctx.createBufferSource(); s.buffer = this.noise[kind]; s.loop = true; s.start(0, Math.random() * 5); return s; }
  lfo(srcs, freq, depth, param) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.frequency.value = freq; g.gain.value = depth; o.connect(g); g.connect(param); o.start(); srcs.push(o);
  }
  burst(t, dest, { freq, q = 1, peak, decay, type = 'bandpass' }) {
    const c = this.ctx, s = c.createBufferSource(); s.buffer = this.noise.white;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    s.connect(f); f.connect(g); g.connect(dest); s.start(t, Math.random() * 5); s.stop(t + decay + 0.05);
  }
  buildRain() {
    const c = this.ctx, g = c.createGain(); g.gain.value = 0; g.connect(this.bus); const srcs = [];
    const a = this.loop('pink'); srcs.push(a);
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 500;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 6500;
    const ag = c.createGain(); ag.gain.value = 0.8; a.connect(hp); hp.connect(lp); lp.connect(ag); ag.connect(g);
    const b = this.loop('brown'); srcs.push(b);
    const lp2 = c.createBiquadFilter(); lp2.type = 'lowpass'; lp2.frequency.value = 900;
    const bg = c.createGain(); bg.gain.value = 1.4; b.connect(lp2); lp2.connect(bg); bg.connect(g);
    let next = 0;
    return { gain: g, srcs, tick: (now, ahead) => {
      if (next < now) next = now;
      while (next < ahead) { this.burst(next, g, { freq: 2500 + Math.random() * 3500, q: 4, peak: 0.06 + Math.random() * 0.12, decay: 0.03 + Math.random() * 0.03 }); next += 0.02 + Math.random() * 0.09; }
    } };
  }
  buildCafe() {
    const c = this.ctx, g = c.createGain(); g.gain.value = 0; g.connect(this.bus); const srcs = [];
    [[420, 1.0, 0.11, 0], [1100, 0.7, 0.17, 3.7], [2300, 0.4, 0.23, 5.3]].forEach(([f, a, lf, am]) => {
      const s = this.loop('brown'); srcs.push(s);
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = 1.3;
      const vg = c.createGain(); vg.gain.value = a * 1.6; s.connect(bp); bp.connect(vg); vg.connect(g);
      this.lfo(srcs, lf, a * 0.8, vg.gain);
      if (am) this.lfo(srcs, am, a * 0.3, vg.gain);
    });
    let next = 0, hiss = 0;
    const clink = (t) => {
      const f = 2800 + Math.random() * 1800, peak = 0.025 + Math.random() * 0.04;
      [1, 1.504].forEach((m, i) => {
        const o = c.createOscillator(), og = c.createGain(); o.type = 'sine'; o.frequency.value = f * m;
        og.gain.setValueAtTime(0, t); og.gain.linearRampToValueAtTime(peak / (i + 1), t + 0.002); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
        o.connect(og); og.connect(g); o.start(t); o.stop(t + 0.25);
      });
    };
    return { gain: g, srcs, tick: (now, ahead) => {
      if (!next) { next = now + 1; hiss = now + 12; }
      while (next < ahead) { clink(Math.max(next, now)); next += 2 + Math.random() * 5; }
      if (hiss < ahead) { this.burst(Math.max(hiss, now), g, { freq: 4500, q: 0.7, peak: 0.05, decay: 1.4, type: 'highpass' }); hiss += 22 + Math.random() * 20; }
    } };
  }
  buildFire() {
    const c = this.ctx, g = c.createGain(); g.gain.value = 0; g.connect(this.bus); const srcs = [];
    const b = this.loop('brown'); srcs.push(b);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
    const bg = c.createGain(); bg.gain.value = 3; b.connect(lp); lp.connect(bg); bg.connect(g);
    this.lfo(srcs, 0.13, 0.9, bg.gain);
    let next = 0;
    return { gain: g, srcs, tick: (now, ahead) => {
      if (next < now) next = now;
      while (next < ahead) {
        const big = Math.random() < 0.12;
        this.burst(next, g, { freq: big ? 700 : 1200 + Math.random() * 3300, q: 1, peak: big ? 0.5 : 0.08 + Math.random() * 0.22, decay: big ? 0.07 : 0.02 + Math.random() * 0.04, type: big ? 'lowpass' : 'bandpass' });
        next += 0.03 + Math.pow(Math.random(), 2) * 0.55;
      }
    } };
  }
  buildPad() {
    const c = this.ctx, g = c.createGain(); g.gain.value = 0; g.connect(this.bus); const srcs = [];
    const chords = [[110, 164.81, 220, 277.18], [87.31, 130.81, 174.61, 220], [98, 146.83, 196, 246.94], [110, 164.81, 207.65, 246.94]];
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1000; lp.Q.value = 0.6; lp.connect(g);
    this.lfo(srcs, 0.05, 350, lp.frequency);
    const oscs = [];
    chords[0].forEach((f, i) => {
      [['sine', -4], ['triangle', 4]].forEach(([type, det]) => {
        const o = c.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = det;
        const vg = c.createGain(); vg.gain.value = type === 'sine' ? 0.12 : 0.05; o.connect(vg); vg.connect(lp); o.start(); srcs.push(o); oscs.push({ o, i });
      });
    });
    let nextChord = 0, idx = 0;
    return { gain: g, srcs, tick: (now) => {
      if (!nextChord) nextChord = now + 18;
      if (now >= nextChord) { idx = (idx + 1) % chords.length; oscs.forEach(({ o, i }) => o.frequency.setTargetAtTime(chords[idx][i], now, 3)); nextChord = now + 18 + Math.random() * 8; }
    } };
  }
  busLevel() { return Math.pow(this.master, 1.6) * 0.9; }
  syncLayers() {
    const c = this.ctx; if (!c) return;
    Object.keys(LAYERS).forEach(k => {
      const v = this.vols[k]; let L = this.layers[k];
      if (v > 0.001 && !L && this.playing) { L = this.layers[k] = this['build' + k[0].toUpperCase() + k.slice(1)](); }
      if (L) {
        L.gain.gain.setTargetAtTime(v * LAYERS[k].scale, c.currentTime, 0.4);
        if (v <= 0.001) setTimeout(() => { if (this.vols[k] <= 0.001 && this.layers[k] === L) this.dispose(k); }, 1600);
      }
    });
  }
  dispose(k) {
    const L = this.layers[k]; if (!L) return;
    L.srcs.forEach(s => { try { s.stop(); } catch (e) {} });
    try { L.gain.disconnect(); } catch (e) {}
    delete this.layers[k];
  }
  start() {
    if (!this.ensure()) return false;
    const c = this.ctx; this.playing = true; this.syncLayers();
    this.bus.gain.cancelScheduledValues(c.currentTime); this.bus.gain.setTargetAtTime(this.busLevel(), c.currentTime, 0.5);
    if (!this.timer) this.timer = setInterval(() => {
      const n = c.currentTime; Object.keys(this.layers).forEach(k => { const L = this.layers[k]; if (L && L.tick) L.tick(n, n + 0.4); });
    }, 80);
    return true;
  }
  stop() {
    if (!this.ctx || !this.playing) return;
    this.playing = false; const c = this.ctx;
    this.bus.gain.cancelScheduledValues(c.currentTime); this.bus.gain.setTargetAtTime(0, c.currentTime, 0.3);
    setTimeout(() => { if (!this.playing) { Object.keys(this.layers).forEach(k => this.dispose(k)); clearInterval(this.timer); this.timer = null; } }, 1800);
  }
  setVol(k, v) { this.vols[k] = v; if (this.playing) this.syncLayers(); }
  setMaster(v) { this.master = v; if (this.ctx && this.playing) this.bus.gain.setTargetAtTime(this.busLevel(), this.ctx.currentTime, 0.1); }
  bowl(at, strength = 1, root = 196) {
    const c = this.ctx; if (!c) return null;
    const g = c.createGain(); g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(0.55 * strength, at + 0.012); g.connect(this.bellBus);
    const oscs = [], parts = [[1, 1, 7], [2.76, 0.5, 5], [5.4, 0.28, 3], [8.93, 0.12, 1.8]];
    parts.forEach(([r, a, d]) => [-1.5, 1.5].forEach(det => {
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = root * r; o.detune.value = det * (r > 1 ? 2 : 1);
      const pg = c.createGain(); pg.gain.setValueAtTime(a * 0.5, at); pg.gain.exponentialRampToValueAtTime(0.0005, at + d);
      o.connect(pg); pg.connect(g); o.start(at); o.stop(at + d + 0.1); oscs.push(o);
    }));
    const h = { g, oscs };
    oscs[0].onended = () => { this.bowls = this.bowls.filter(x => x !== h); try { g.disconnect(); } catch (e) {} };
    this.bowls.push(h); return h;
  }
  ding() { if (this.ensure()) this.bowl(this.ctx.currentTime + 0.05, 0.35, 523.25); }
  cancelBowls() {
    if (!this.ctx) return; const now = this.ctx.currentTime;
    this.bowls.forEach(h => { try { h.g.gain.cancelScheduledValues(now); h.g.gain.setTargetAtTime(0, now, 0.05); h.oscs.forEach(o => { try { o.stop(now + 0.4); } catch (e) {} }); } catch (e) {} });
    this.bowls = [];
  }
}
const audio = new Engine();
if (EXT) Object.assign(Engine.prototype, EXT.builders);
Object.keys(LAYERS).forEach(k => { audio.vols[k] = 0; });

/* ---- spoken cues (browser speech) ---- */
const canSpeak = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
let voice = null;
function pickVoice() {
  if (!canSpeak) return;
  const arabic = !!(window.MR_I18N && MR_I18N.lang === 'ar');
  const vs = speechSynthesis.getVoices().filter(v => (arabic ? /^ar/i : /^en/i).test(v.lang));
  voice = arabic ? (vs.find(v => /ar[-_]SA/i.test(v.lang)) || vs[0] || null) : (vs.find(v => /Samantha|Daniel|Serena|Google UK English Female|Natural|Online/i.test(v.name)) || vs.find(v => /en-GB/i.test(v.lang)) || vs[0] || null);
}
if (canSpeak) { pickVoice(); speechSynthesis.addEventListener && speechSynthesis.addEventListener('voiceschanged', pickVoice); document.addEventListener('mr:lang', pickVoice); }
function speak(text) {
  if (!canSpeak) return;
  try { speechSynthesis.cancel(); const arabic = !!(window.MR_I18N && MR_I18N.lang === 'ar'), u = new SpeechSynthesisUtterance(arabic ? MR_I18N.tr(text) : text); u.rate = 0.86; u.pitch = 0.95; u.volume = 0.9; if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = arabic ? 'ar-SA' : 'en-GB'; speechSynthesis.speak(u); } catch (e) {}
}

/* ============ Scene + sound panel ============ */
const sound = Object.assign({ auto: true, vols: {}, master: 0.7 }, store.get('sound', {}));
Object.assign(audio.vols, sound.vols); audio.master = sound.master;
const sheet = $('#soundSheet'), soundBtn = $('#soundBtn'), wxBtn = $('#wxChip');
let activeTab = 'scene';
function saveSound() { store.set('sound', { auto: sound.auto, vols: audio.vols, master: audio.master }); }
function buildSoundUI() {
  const mx = $('#mixer'); mx.innerHTML = '';
  Object.entries(LAYERS).forEach(([k, l]) => {
    const lab = document.createElement('label'); lab.className = 'slider';
    lab.innerHTML = '<span>' + l.label + '</span><input type="range" min="0" max="100" data-layer="' + k + '">';
    const inp = $('input', lab); inp.value = Math.round((audio.vols[k] || 0) * 100);
    inp.addEventListener('input', () => { audio.setVol(k, inp.value / 100); sound.auto = false; syncSoundUI(); saveSound(); });
    mx.appendChild(lab);
  });
  const mm = $('#masterMix'); mm.innerHTML = '';
  const lab = document.createElement('label'); lab.className = 'slider';
  lab.innerHTML = '<span>Overall volume</span><input type="range" min="0" max="100" id="masterVol">';
  const mv = $('input', lab); mv.value = Math.round(audio.master * 100);
  mv.addEventListener('input', () => { audio.setMaster(mv.value / 100); saveSound(); });
  mm.appendChild(lab);
  const tr = $('#tracks'); tr.innerHTML = '';
  TRACKS.forEach(t => { const li = document.createElement('li'); const b = document.createElement('button'); b.type = 'button'; b.textContent = t.title; b.addEventListener('click', () => playYT(t.id)); li.appendChild(b); tr.appendChild(li); });
}
function syncSoundUI() {
  $$('#mixer input[data-layer]').forEach(i => { i.value = Math.round((audio.vols[i.dataset.layer] || 0) * 100); });
  const t = $('#soundToggle'); t.setAttribute('aria-pressed', String(audio.playing)); t.textContent = audio.playing ? 'Pause ambience' : 'Play ambience';
  $('#autoText').textContent = sound.auto ? 'The music follows your scene and the weather.' : 'You set the mix by hand.';
  $('#autoBtn').hidden = sound.auto;
  document.body.classList.toggle('is-playing', audio.playing || ytPlaying);
}
function applyMix(m) {
  Object.keys(LAYERS).forEach(k => { audio.vols[k] = m[k] || 0; });
  if (audio.playing) audio.syncLayers();
  syncSoundUI(); saveSound();
}
function toggleSound() {
  if (audio.playing) { audio.stop(); } else { if (!audio.start()) { toast('This browser can\'t play generated sound.'); } }
  syncSoundUI();
}
function setTab(name, focus) {
  activeTab = name;
  ['scene', 'sound'].forEach(n => {
    const on = n === name, tb = $('#tab-' + n);
    tb.setAttribute('aria-selected', String(on)); tb.tabIndex = on ? 0 : -1; $('#panel-' + n).hidden = !on;
    if (on && focus) tb.focus({ preventScroll: true });
  });
}
function openSheet(open, tab) {
  sheet.hidden = !open;
  [soundBtn, wxBtn].forEach(b => b.setAttribute('aria-expanded', String(open)));
  if (open) { setTab(tab || activeTab, true); }
  else { (activeTab === 'scene' ? wxBtn : soundBtn).focus({ preventScroll: true }); }
}
function toggleSheet(tab) {
  if (sheet.hidden) openSheet(true, tab);
  else if (activeTab === tab) openSheet(false);
  else setTab(tab, true);
}
soundBtn.addEventListener('click', () => toggleSheet('sound'));
$('#soundClose').addEventListener('click', () => openSheet(false));
$('#soundToggle').addEventListener('click', toggleSound);
['scene', 'sound'].forEach(n => {
  const tb = $('#tab-' + n);
  tb.addEventListener('click', () => setTab(n, false));
  tb.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); setTab(n === 'scene' ? 'sound' : 'scene', true); } });
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !sheet.hidden) openSheet(false); });

/* ============ YouTube (official player) ============ */
const TRACKS = [{ id: 'ZIfMRu6ldDo', title: 'Ahmad\'s pick' }];
let yt = { player: null, api: null }, ytPlaying = false;
function ytId(s) {
  s = (s || '').trim(); const m = s.match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([\w-]{11})/);
  if (m) return m[1]; return /^[\w-]{11}$/.test(s) ? s : null;
}
function loadYT() {
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (!yt.api) yt.api = new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; s.onerror = () => rej(new Error('blocked'));
    window.onYouTubeIframeAPIReady = res; document.head.appendChild(s); setTimeout(() => rej(new Error('timeout')), 12000);
  });
  return yt.api;
}
function ytMsg(html) { $('#ytMsg').innerHTML = html; }
async function playYT(id, list) {
  ytMsg('Loading the player…');
  try { await loadYT(); } catch (e) { yt.api = null; ytMsg('The YouTube player could not load. Check your connection or any blocker, then try again.'); return; }
  $('#ytWrap').hidden = false; ytMsg('');
  yt.cur = { id, list };
  const openLink = c => c.list ? '<a href="https://music.youtube.com/playlist?list=' + c.list + '" target="_blank" rel="noopener">Open it in YouTube Music</a>' : '<a href="https://www.youtube.com/watch?v=' + c.id + '" target="_blank" rel="noopener">Open it on YouTube</a>';
  if (!yt.player) {
    const opts = {
      width: '360', height: '203',
      playerVars: Object.assign({ playsinline: 1, rel: 0, modestbranding: 1, origin: location.origin }, list ? { listType: 'playlist', list } : {}),
      events: {
        onReady: e => { e.target.setVolume(+$('#ytVol').value); e.target.playVideo(); },
        onError: e => { ytPlaying = false; syncSoundUI(); ytMsg(([101, 150].includes(e.data) ? 'The owner doesn\'t allow this to play here. ' : 'This ' + (yt.cur.list ? 'playlist' : 'video') + ' can\'t be played here. ') + openLink(yt.cur) + '.'); },
        onStateChange: e => { ytPlaying = e.data === 1; syncSoundUI(); }
      }
    };
    if (!list) opts.videoId = id;
    yt.player = new YT.Player('ytPlayer', opts);
  } else { if (list) yt.player.loadPlaylist({ listType: 'playlist', list }); else yt.player.loadVideoById(id); yt.player.setVolume(+$('#ytVol').value); }
}
$('#ytForm').addEventListener('submit', e => {
  e.preventDefault(); const id = ytId($('#ytInput').value);
  if (!id) { ytMsg('That doesn\'t look like a YouTube link. Paste the full video address.'); return; }
  playYT(id);
});
$('#ytVol').addEventListener('input', () => { yt.player && yt.player.setVolume && yt.player.setVolume(+$('#ytVol').value); });
$('#ytStop').addEventListener('click', () => { if (yt.player && yt.player.stopVideo) yt.player.stopVideo(); ytPlaying = false; $('#ytWrap').hidden = true; ytMsg(''); syncSoundUI(); });

/* ============ Cup illustration ============ */
function cupSVG(uid) {
  return '<svg class="cup" viewBox="0 0 300 270" aria-hidden="true" focusable="false">' +
  '<defs><linearGradient id="cg' + uid + '" x1="0" x2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".6" stop-color="#F3EBDD"/><stop offset="1" stop-color="#D2C6AE"/></linearGradient>' +
  '<radialGradient id="sh' + uid + '"><stop offset="0" stop-color="#000" stop-opacity=".5"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs>' +
  '<ellipse cx="150" cy="238" rx="130" ry="20" fill="url(#sh' + uid + ')"/>' +
  '<ellipse cx="150" cy="224" rx="120" ry="20" fill="#E4D8C0"/><ellipse cx="150" cy="220" rx="102" ry="15" fill="#F3EBDD"/>' +
  '<path d="M236 128c42-6 44 52-4 58" fill="none" stroke="url(#cg' + uid + ')" stroke-width="13" stroke-linecap="round"/>' +
  '<path d="M62 112h176v38c0 44-34 70-88 70s-88-26-88-70z" fill="url(#cg' + uid + ')"/>' +
  '<ellipse cx="150" cy="112" rx="88" ry="17" fill="#E9DFCB"/>' +
  '<g class="liquid"><ellipse cx="150" cy="113" rx="78" ry="13.5" fill="var(--liquid)"/><ellipse cx="150" cy="113" rx="64" ry="10.5" fill="var(--foam)"/></g>' +
  '<path class="art art-heart" fill="#F8ECD7" transform="translate(0 113) scale(1 .42) translate(0 -106.5)" d="M150 119c-10-6-17-11-17-17 0-5 4-8 8-8 4 0 7 2 9 6 2-4 5-6 9-6 4 0 8 3 8 8 0 6-7 11-17 17z"/>' +
  '<g class="art art-ring" fill="none" stroke="#F8ECD7" stroke-width="2"><ellipse cx="150" cy="113" rx="42" ry="6.6"/><ellipse cx="150" cy="113" rx="22" ry="3.5"/></g>' +
  '<g class="steam"><path d="M122 92c-12-14 12-24 0-42"/><path d="M150 88c-12-16 12-26 0-46"/><path d="M178 92c-12-14 12-24 0-42"/></g></svg>';
}
const DRINKS = [
  { id: 'espresso', name: 'Espresso', note: 'Short, dark and quick', liquid: '#2b1810', foam: '#8a5a36', art: 'none', preset: 'dawn', steps: ['Grinding the beans', 'Pulling the shot', 'Letting the crema settle'] },
  { id: 'flat', name: 'Flat white', note: 'Velvety milk over a double shot', liquid: '#9a6a42', foam: '#ecd9bf', art: 'heart', preset: 'rainy', steps: ['Grinding the beans', 'Steaming the milk', 'Pouring a heart'] },
  { id: 'cappuccino', name: 'Cappuccino', note: 'Deep foam for slow sips', liquid: '#946440', foam: '#f3e8d5', art: 'ring', preset: 'fireside', steps: ['Grinding the beans', 'Frothing the milk', 'Spooning the foam'] },
  { id: 'qahwa', name: 'Arabic qahwa', note: 'Golden and scented with cardamom', liquid: '#c9a24f', foam: '#d8b866', art: 'none', preset: 'fireside', steps: ['Warming the dallah', 'Adding cardamom', 'Pouring a small cup'] },
  { id: 'turkish', name: 'Turkish coffee', note: 'Thick, unfiltered, with foam', liquid: '#2a190f', foam: '#7b5232', art: 'none', preset: 'dawn', steps: ['Grinding extra fine', 'Bringing it to the boil', 'Pouring slowly'] },
  { id: 'matcha', name: 'Matcha', note: 'Whisked green tea, calm and bright', liquid: '#7f9f4f', foam: '#c6d98a', art: 'none', steps: ['Sifting the matcha', 'Whisking until frothy', 'Pouring into the cup'] },
  { id: 'mate', name: 'Yerba mate', note: 'Earthy and smooth, sipped slowly', liquid: '#6d7b38', foam: '#a8b468', art: 'none', steps: ['Filling the gourd', 'Adding hot water', 'Setting the bombilla'] },
  { id: 'mint', name: 'Mint tea', note: 'Fresh mint, light and clear', liquid: '#b8a64a', foam: '#d6cb77', art: 'none', preset: 'rainy', steps: ['Warming the pot', 'Pressing the mint', 'Pouring from a height'] }
];
$('#hubCup').innerHTML = cupSVG('h'); $('#brewCup').innerHTML = cupSVG('b');
const hubCup = $('#hubCup .cup'), cup = $('#brewCup .cup');
function paintCup(el, d) { el.style.setProperty('--liquid', d.liquid); el.style.setProperty('--foam', d.foam); el.dataset.art = d.art; }
paintCup(hubCup, DRINKS[1]); hubCup.style.setProperty('--fill', 1); hubCup.classList.add('steaming');

/* ============ Coffee ============ */
let drink = DRINKS.find(d => d.id === store.get('drink', 'flat')) || DRINKS[1], brewing = false;
function renderDrinks() {
  const ul = $('#drinks'); ul.innerHTML = '';
  DRINKS.forEach(d => {
    const li = document.createElement('li'); const b = document.createElement('button'); b.type = 'button'; b.className = 'drink'; b.dataset.id = d.id;
    b.innerHTML = '<span class="d-name">' + d.name + '</span><span class="d-note">' + d.note + '</span>';
    b.addEventListener('click', () => selectDrink(d)); li.appendChild(b); ul.appendChild(li);
  });
  selectDrink(drink, true);
}
function selectDrink(d, silent) {
  if (brewing) return; drink = d; store.set('drink', d.id);
  $$('#drinks .drink').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.id === d.id)));
  cup.classList.remove('ready'); paintCup(cup, d); cup.style.setProperty('--fill', 0.001);
  $('#brewStatus').textContent = 'Pick a drink and place your order.';
  $('#coffeeNext').hidden = true; $('#orderBtn').textContent = 'Place order';
}
function order() {
  if (brewing) return; brewing = true;
  const btn = $('#orderBtn'); btn.disabled = true; cup.classList.remove('ready'); cup.style.setProperty('--fill', 0.001); $('#coffeeNext').hidden = true;
  $$('#drinks .drink').forEach(b => b.disabled = true);
  if ($('#orderSound').checked && !audio.playing) { if (!audio.start()) toast('This browser can\'t play generated sound.'); syncSoundUI(); }
  else audio.ensure();
  const dur = reduce ? 1200 : 5200, t0 = Date.now(); let last = -1;
  const status = $('#brewStatus');
  const iv = setInterval(() => {
    const f = clamp((Date.now() - t0) / dur, 0, 1), e = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
    cup.style.setProperty('--fill', Math.max(0.001, e));
    const i = Math.min(2, Math.floor(f * 3)); if (i !== last) { last = i; status.textContent = drink.steps[i] + '…'; }
    if (f >= 1) { clearInterval(iv); done(); }
  }, 50);
  function done() {
    cup.classList.add('ready'); status.textContent = 'Your ' + drink.name.toLowerCase() + ' is ready. Take your time.';
    audio.ding(); store.set('coffeeDay', today());
    btn.disabled = false; btn.textContent = 'Order something else'; $$('#drinks .drink').forEach(b => b.disabled = false);
    $('#coffeeNext').hidden = false; brewing = false;
  }
}
$('#orderBtn').addEventListener('click', order);

/* ============ Mindfulness session ============ */
const PATTERNS = { off: null, calm: [4, 0, 6, 0], box: [4, 4, 4, 4], relax: [4, 7, 8, 0] };
const PHASE = ['Breathe in', 'Hold', 'Breathe out', 'Rest'];
const CUES = {
  open: ['Rest in open awareness.', 'Let sounds come and go.', 'Notice what is here, without fixing it.', 'Let thoughts pass like clouds.', 'Feel the body sitting.'],
  noting: ['Notice what is here. Name it softly.', 'Hearing.', 'Thinking.', 'Feeling.', 'Seeing. Then let it go.']
};
const ease = x => 0.5 - 0.5 * Math.cos(Math.PI * x);
function breathAt(sec, p) {
  const L = p.reduce((a, b) => a + b, 0); let t = sec % L, i = 0;
  for (; i < 4; i++) { if (p[i] === 0) continue; if (t < p[i]) break; t -= p[i]; }
  if (i > 3) { i = 3; t = 0; }
  const f = p[i] ? t / p[i] : 0; let scale = 0.5;
  if (i === 0) scale = 0.5 + 0.5 * ease(f); else if (i === 1) scale = 1; else if (i === 2) scale = 1 - 0.5 * ease(f);
  return { i, scale, left: Math.max(1, Math.ceil(p[i] - t)) };
}
const prefs = Object.assign({ mins: 10, every: 5, style: 'bowl', guide: 'calm' }, store.get('prefs', {}));
if (!canSpeak && prefs.style !== 'bowl') prefs.style = 'bowl';
const marksFor = (totalMs, everyMin) => { const m = []; if (!everyMin) return m; for (let t = everyMin * 60000; t < totalMs - 20000; t += everyMin * 60000) m.push(t); return m; };
function syncSetup() {
  $$('#chipsMins .chip').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.v === prefs.mins)));
  const ci = $('#customMins'); if (![3, 5, 10, 15, 20].includes(prefs.mins)) ci.value = prefs.mins; else if (document.activeElement !== ci) ci.value = '';
  $$('#chipsEvery .chip').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.v === prefs.every)));
  $$('#chipsStyle .chip').forEach(b => { b.setAttribute('aria-pressed', String(b.dataset.v === prefs.style)); if (!canSpeak && b.dataset.v !== 'bowl') b.disabled = true; });
  $('#voiceHint').hidden = canSpeak;
  $$('#chipsGuide .chip').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === prefs.guide)));
  const marks = marksFor(prefs.mins * 60000, prefs.every), what = { bowl: 'a bowl', voice: 'a spoken cue', both: 'a bowl and a spoken cue' }[prefs.style];
  let s = prefs.mins + ' minutes. ';
  s += prefs.style === 'voice' ? 'A closing bowl at the end' : 'An opening bowl, then a closing bowl at the end';
  s += marks.length ? ', with ' + what + ' at ' + marks.map(m => m / 60000).join(', ') + ' minutes.' : (prefs.every ? '. This session is too short for chimes every ' + prefs.every + ' minutes.' : '.');
  $('#summary').textContent = s; store.set('prefs', prefs);
}
function bindChips(id, key, num) {
  $('#' + id).addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b || b.disabled) return; prefs[key] = num ? +b.dataset.v : b.dataset.v; syncSetup(); });
}
bindChips('chipsMins', 'mins', true); bindChips('chipsEvery', 'every', true); bindChips('chipsStyle', 'style', false); bindChips('chipsGuide', 'guide', false);
$('#customMins').addEventListener('input', e => { const v = parseInt(e.target.value, 10); if (v >= 1 && v <= 60) { prefs.mins = v; syncSetup(); } });

const S = { state: 'idle', total: 0, endAt: 0, remain: 0, marks: [], spoken: new Set(), tick: null, raf: 0, wake: null, confirmEnd: false };
const remaining = () => S.state === 'running' ? Math.max(0, S.endAt - Date.now()) : S.remain;
const elapsed = () => S.total - remaining();
const fmt = ms => { const s = Math.ceil(ms / 1000), m = Math.floor(s / 60); return String(m).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
const showPanel = id => ['bSetup', 'bRun', 'bDone'].forEach(p => { $('#' + p).hidden = p !== id; });
const useBowl = () => prefs.style !== 'voice', useVoice = () => prefs.style !== 'bowl' && canSpeak;

function scheduleBowls(opening) {
  audio.cancelBowls(); const c = audio.ctx; if (!c) return;
  const now = c.currentTime, el = elapsed(), left = (S.total - el) / 1000;
  if (opening && useBowl()) audio.bowl(now + 0.2, 1);
  if (useBowl()) S.marks.forEach(m => { if (m > el + 300) audio.bowl(now + (m - el) / 1000, 0.75); });
  audio.bowl(now + left, 1); if (useBowl()) { audio.bowl(now + left + 3.6, 0.8); audio.bowl(now + left + 7.2, 0.6); }
}
function begin() {
  audio.ensure();
  S.total = prefs.mins * 60000; S.remain = S.total; S.endAt = Date.now() + S.total; S.state = 'running'; S.confirmEnd = false;
  S.marks = marksFor(S.total, prefs.every); S.spoken = new Set(); S.pattern = PATTERNS[prefs.guide];
  $('#orb').style.display = S.pattern ? '' : 'none'; $('#pauseBtn').textContent = 'Pause'; $('#endBtn').textContent = 'End session';
  showPanel('bRun'); scheduleBowls(true); loops(); requestWake(); render();
  $('#runStatus').textContent = 'Session started.'; $('#bRun').scrollIntoView({ block: 'center' });
}
function loops() { clearInterval(S.tick); cancelAnimationFrame(S.raf); S.tick = setInterval(logic, 250); (function f() { if (S.state !== 'running') return; render(); S.raf = requestAnimationFrame(f); })(); }
function logic() {
  if (S.state !== 'running') return; const el = elapsed();
  S.marks.forEach(m => { if (el >= m && !S.spoken.has(m)) { S.spoken.add(m); if (useVoice() && el - m < 8000) { const n = m / 60000; speak(n + (n === 1 ? ' minute.' : ' minutes.')); } } });
  document.title = fmt(remaining()) + ' · Morning Ritual';
  if (remaining() <= 0) finish();
}
function render() {
  const rem = remaining(), f = S.total ? rem / S.total : 0;
  $('#time').textContent = fmt(rem); $('#ringBar').style.strokeDashoffset = String(854.5 * (1 - f));
  const nx = S.marks.find(m => m > elapsed() + 500);
  $('#nextChime').textContent = S.state === 'paused' ? 'Paused' : (nx && prefs.every ? 'Next chime at ' + fmt(S.total - nx) + ' left' : '');
  if (S.pattern && S.state === 'running') {
    const b = breathAt(elapsed() / 1000, S.pattern);
    $('#orb').style.transform = reduce ? 'scale(.8)' : 'scale(' + b.scale.toFixed(3) + ')';
    $('#cue').textContent = PHASE[b.i] + ' ' + b.left;
  } else if (!S.pattern) { const c = CUES[prefs.guide]; $('#cue').textContent = c && S.state === 'running' ? c[Math.floor(elapsed() / 30000) % c.length] : ''; }
}
function pauseResume() {
  if (S.state === 'running') {
    S.remain = remaining(); S.state = 'paused'; audio.cancelBowls(); canSpeak && speechSynthesis.cancel();
    clearInterval(S.tick); cancelAnimationFrame(S.raf); releaseWake(); $('#pauseBtn').textContent = 'Resume'; $('#cue').textContent = ''; render(); $('#runStatus').textContent = 'Paused.';
  } else if (S.state === 'paused') {
    S.endAt = Date.now() + S.remain; S.state = 'running'; scheduleBowls(false); loops(); requestWake(); $('#pauseBtn').textContent = 'Pause'; $('#runStatus').textContent = 'Resumed.';
  }
}
function endEarly() {
  if (!S.confirmEnd) { S.confirmEnd = true; $('#endBtn').textContent = 'Tap again to end'; setTimeout(() => { S.confirmEnd = false; if (S.state !== 'idle') $('#endBtn').textContent = 'End session'; }, 3500); return; }
  const el = elapsed(); stopAll(); if (el >= 60000) { logSession(Math.round(el / 60000), true); toast('Session saved: ' + Math.round(el / 60000) + ' min.'); }
  S.state = 'idle'; showPanel('bSetup'); syncSetup();
}
function stopAll() { clearInterval(S.tick); cancelAnimationFrame(S.raf); audio.cancelBowls(); canSpeak && speechSynthesis.cancel(); releaseWake(); document.title = 'Morning Ritual | Ahmad Abou Abass'; }
function finish() {
  S.state = 'done'; clearInterval(S.tick); cancelAnimationFrame(S.raf); releaseWake(); document.title = 'Morning Ritual | Ahmad Abou Abass';
  if (useVoice()) setTimeout(() => speak('Session complete.'), 1500);
  const mins = Math.round(S.total / 60000); logSession(mins, false);
  $('#doneText').textContent = 'You sat for ' + mins + (mins === 1 ? ' minute.' : ' minutes.') + ' Take a moment before you move on.';
  $$('#chipsMood .chip').forEach(b => b.setAttribute('aria-pressed', 'false'));
  showPanel('bDone'); $('#doneTitle').focus({ preventScroll: true }); store.set('breatheDay', today());
}
async function requestWake() { try { if ('wakeLock' in navigator && S.state === 'running') S.wake = await navigator.wakeLock.request('screen'); } catch (e) {} }
function releaseWake() { try { S.wake && S.wake.release(); } catch (e) {} S.wake = null; }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && S.state === 'running') { requestWake(); loops(); } });
window.addEventListener('beforeunload', e => { if (S.state === 'running' || S.state === 'paused') { e.preventDefault(); e.returnValue = ''; } });
$('#beginBtn').addEventListener('click', begin);
$('#pauseBtn').addEventListener('click', pauseResume);
$('#endBtn').addEventListener('click', endEarly);
$('#againBtn').addEventListener('click', () => { S.state = 'idle'; showPanel('bSetup'); syncSetup(); });
$('#chipsMood').addEventListener('click', e => {
  const b = e.target.closest('.chip'); if (!b) return; $$('#chipsMood .chip').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  const log = store.get('sessions', []); if (log.length) { log[log.length - 1].mood = b.dataset.v; store.set('sessions', log); } toast('Saved on this device.');
});
function logSession(m, partial) { const log = store.get('sessions', []); log.push({ d: today(), m, partial: !!partial }); store.set('sessions', log.slice(-400)); }
function stats() {
  const log = store.get('sessions', []); if (!log.length) return null;
  const days = new Set(log.map(x => x.d)); let streak = 0; const cur = new Date();
  if (!days.has(cur.toLocaleDateString('en-CA'))) cur.setDate(cur.getDate() - 1);
  while (days.has(cur.toLocaleDateString('en-CA'))) { streak++; cur.setDate(cur.getDate() - 1); }
  return { n: log.length, mins: log.reduce((a, b) => a + b.m, 0), streak };
}

/* ============ Breakfast ============ */
const FOODS = [
  { g: 'Protein', items: [
    { id: 'eggs', n: 'Eggs', s: '2 large', k: 143, p: 13, c: 1, f: 10 },
    { id: 'yogurt', n: 'Plain Greek yogurt', s: '170 g', k: 100, p: 17, c: 6, f: 1 },
    { id: 'powder', n: 'Plant protein powder', s: '1 scoop, 30 g', k: 120, p: 20, c: 4, f: 2 },
    { id: 'foul', n: 'Foul medames', s: '½ cup', k: 100, p: 7, c: 17, f: 1 },
    { id: 'labneh', n: 'Labneh', s: '2 tbsp', k: 60, p: 3, c: 2, f: 5 }
  ] },
  { g: 'Carbs', items: [
    { id: 'oats', n: 'Rolled oats', s: '40 g dry', k: 150, p: 5, c: 27, f: 3 },
    { id: 'toast', n: 'Whole-wheat toast', s: '1 slice', k: 80, p: 4, c: 14, f: 1 },
    { id: 'banana', n: 'Banana', s: '1 medium', k: 105, p: 1, c: 27, f: 0 },
    { id: 'berries', n: 'Berries', s: '½ cup', k: 40, p: 1, c: 10, f: 0 },
    { id: 'dates', n: 'Medjool dates', s: '2 dates', k: 133, p: 1, c: 36, f: 0 }
  ] },
  { g: 'Extras and drinks', items: [
    { id: 'pb', n: 'Peanut butter', s: '1 tbsp', k: 95, p: 4, c: 3, f: 8 },
    { id: 'almonds', n: 'Almonds', s: '28 g', k: 165, p: 6, c: 6, f: 14 },
    { id: 'chia', n: 'Chia seeds', s: '1 tbsp', k: 58, p: 2, c: 5, f: 4 },
    { id: 'flax', n: 'Ground flaxseed', s: '1 tbsp', k: 37, p: 1, c: 2, f: 3 },
    { id: 'soy', n: 'Unsweetened soy milk', s: '1 cup', k: 80, p: 7, c: 4, f: 4 },
    { id: 'milk', n: 'Whole milk', s: '1 cup', k: 150, p: 8, c: 12, f: 8 }
  ] }
];
const FOOD = {}; FOODS.forEach(g => g.items.forEach(i => { FOOD[i.id] = i; }));
const PLATES = [
  { n: 'Power oats', v: { oats: 1, powder: 1, soy: 1, banana: 1, chia: 1 } },
  { n: 'Egg and foul plate', v: { eggs: 1, foul: 1, toast: 2, labneh: 1 } },
  { n: 'Yogurt bowl', v: { yogurt: 1, berries: 1, almonds: 1, chia: 1, flax: 1 } }
];
const MAXQ = 6;
const bf = Object.assign({ goal: 30, plate: {} }, store.get('plate', {}));
Object.keys(bf.plate).forEach(k => { if (!FOOD[k]) delete bf.plate[k]; });
function buildFoods() {
  const box = $('#foods'); box.innerHTML = '';
  FOODS.forEach(grp => {
    const sec = document.createElement('div'); sec.className = 'foods-group';
    sec.innerHTML = '<h3>' + grp.g + '</h3>';
    const ul = document.createElement('ul');
    grp.items.forEach(i => {
      const li = document.createElement('li'); li.className = 'food';
      li.innerHTML = '<span><span class="food-name">' + i.n + '</span><span class="food-meta">' + i.s + ': ' + i.k + ' kcal, ' + i.p + ' g protein</span></span>' +
        '<span class="step" role="group" aria-label="' + i.n + ' servings"><button type="button" data-f="' + i.id + '" data-d="-1" aria-label="Fewer ' + i.n.toLowerCase() + '">−</button><output id="q-' + i.id + '" aria-live="polite">0</output><button type="button" data-f="' + i.id + '" data-d="1" aria-label="More ' + i.n.toLowerCase() + '">+</button></span>';
      ul.appendChild(li);
    });
    sec.appendChild(ul); box.appendChild(sec);
  });
  const pl = $('#plates'); pl.innerHTML = '';
  PLATES.forEach((p, idx) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = p.n; b.addEventListener('click', () => { bf.plate = Object.assign({}, p.v); syncBreakfast(); }); pl.appendChild(b); });
}
function syncBreakfast() {
  let k = 0, p = 0, c = 0, f = 0; const lines = [];
  Object.keys(FOOD).forEach(id => {
    const q = bf.plate[id] || 0, i = FOOD[id]; $('#q-' + id).textContent = q;
    $$('button[data-f="' + id + '"]').forEach(b => { b.disabled = (+b.dataset.d < 0 && q <= 0) || (+b.dataset.d > 0 && q >= MAXQ); });
    if (q > 0) { k += i.k * q; p += i.p * q; c += i.c * q; f += i.f * q; lines.push(q + ' × ' + i.n.toLowerCase()); }
  });
  $('#tProtein').textContent = Math.round(p); $('#tKcal').textContent = Math.round(k); $('#tCarb').textContent = Math.round(c) + ' g'; $('#tFat').textContent = Math.round(f) + ' g';
  const pct = Math.min(100, Math.round(p / bf.goal * 100));
  $('#goalFill').style.width = pct + '%'; $('#goalBar').setAttribute('aria-valuenow', String(pct));
  $('#goalText').textContent = !lines.length ? 'Add something to your plate to begin.' : (p >= bf.goal ? 'Goal reached: ' + Math.round(p) + ' g of ' + bf.goal + ' g.' : Math.ceil(bf.goal - p) + ' g of protein to go.');
  const pl = $('#plateList'); pl.innerHTML = ''; lines.forEach(t => { const li = document.createElement('li'); li.textContent = t; pl.appendChild(li); });
  $$('#goalChips .chip').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.v === bf.goal)));
  $$('#plates .chip').forEach((b, idx) => { const v = PLATES[idx].v, same = Object.keys(v).length === lines.length && Object.keys(v).every(id => bf.plate[id] === v[id]); b.setAttribute('aria-pressed', String(same)); });
  $('#saveBreakfast').disabled = !lines.length;
  store.set('plate', { goal: bf.goal, plate: bf.plate });
}
$('#foods').addEventListener('click', e => {
  const b = e.target.closest('button[data-f]'); if (!b || b.disabled) return;
  const id = b.dataset.f, q = clamp((bf.plate[id] || 0) + +b.dataset.d, 0, MAXQ); if (q) bf.plate[id] = q; else delete bf.plate[id]; syncBreakfast();
});
$('#goalChips').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; bf.goal = +b.dataset.v; syncBreakfast(); });
$('#clearPlate').addEventListener('click', () => { bf.plate = {}; syncBreakfast(); });
$('#saveBreakfast').addEventListener('click', () => { store.set('breakfastDay', today()); toast('Saved as today\'s breakfast, on this device.'); });
buildFoods(); syncBreakfast();

/* ============ Music shelf (YouTube Music playlists) ============ */
const SHELF = [
  { g: 'Arabic voices', items: [
    { id: 'PLD0FDD0433302B55E', t: 'Fairuz', w: 'The classic Lebanese morning.' },
    { id: 'PL593D6E149E9F19BB', t: 'Majida El Roumi', w: 'Warm, powerful Lebanese songs.' },
    { id: 'PLDFF2BA60D5D101EC', t: 'Wael Kfouri', w: 'Lebanese pop with a gentle pace.' },
    { id: 'PLCA01F1BD737763F4', t: 'Nancy Ajram', w: 'Bright Arabic pop for an easy start.' },
    { id: 'PL06766E323078842A', t: 'Elissa', w: 'Arabic pop and ballads.' }
  ] },
  { g: 'Calm and classical', items: [
    { e: 1, id: 'PL12F15AC67A9554B7', t: 'Piano', w: 'Solo piano for focus and calm.' },
    { id: 'PLADE8DCCC561F51A0', t: 'Classical', w: 'Classical pieces for a slow start.' },
    { e: 1, id: 'PL10EA23B126FEA2EF', t: 'Opera', w: 'Big voices for a bigger morning.' }
  ] },
  { g: 'More energy', items: [
    { e: 1, id: 'PL0B60066BDB924631', t: 'Rap', w: 'When the morning needs a push.' },
    { e: 1, id: 'PL9C1D4DF7B2DE1AD1', t: 'Techno', w: 'Steady beats for getting things done.' }
  ] }
];
SHELF.forEach(grp => {
  const sec = document.createElement('div'); sec.className = 'shelf-group';
  const h2 = document.createElement('h2'); h2.textContent = grp.g; sec.appendChild(h2);
  const ul = document.createElement('ul'); ul.className = 'books';
  grp.items.forEach(p => {
    const li = document.createElement('li'); li.className = 'book';
    li.innerHTML = '<span><span class="book-title"></span><p class="book-why"></p></span><span class="book-actions">' + (p.e ? '<button class="btn btn-ghost sm" type="button">Play here</button>' : '') + '<a target="_blank" rel="noopener noreferrer">Open in YouTube Music</a></span>';
    $('.book-title', li).textContent = p.t; $('.book-why', li).textContent = p.w;
    const btn = $('button', li); if (btn) { btn.setAttribute('aria-label', 'Play the ' + p.t + ' playlist here'); btn.addEventListener('click', () => { openSheet(true, 'sound'); playYT(null, p.id); }); }
    const a = $('a', li); a.href = 'https://music.youtube.com/playlist?list=' + p.id; a.setAttribute('aria-label', 'Open the ' + p.t + ' playlist in YouTube Music, opens in a new tab');
    ul.appendChild(li);
  });
  sec.appendChild(ul); $('#shelf').appendChild(sec);
});

/* ============ Reading ============ */
const BOOKS = [
  { t: 'Wherever You Go, There You Are', a: 'Jon Kabat-Zinn', w: 'The classic starting point for everyday mindfulness.' },
  { t: 'Radical Acceptance', a: 'Tara Brach', w: 'Self-compassion, with meditation woven through it.' },
  { t: 'Four Thousand Weeks', a: 'Oliver Burkeman', w: 'A calmer way to think about time and its limits.' },
  { t: 'Man\'s Search for Meaning', a: 'Viktor Frankl', w: 'A short, hard-won book on finding meaning in difficulty.' },
  { t: 'The Wisdom of Insecurity', a: 'Alan Watts', w: 'Why chasing certainty keeps us restless, and what to do instead.' },
  { t: 'Mindful Eating', a: 'Jan Chozen Bays', w: 'Slow down at the table. A good companion to breakfast.' }
];
BOOKS.forEach(b => {
  const li = document.createElement('li'); li.className = 'book';
  const url = 'https://www.audible.com/search?keywords=' + encodeURIComponent(b.t + ' ' + b.a);
  li.innerHTML = '<span><span class="book-title"></span><span class="book-by"></span><p class="book-why"></p></span><a target="_blank" rel="noopener noreferrer"></a>';
  $('.book-title', li).textContent = b.t; $('.book-by', li).textContent = b.a; $('.book-why', li).textContent = b.w;
  const a = $('a', li); a.href = url; a.textContent = 'Find on Audible'; a.setAttribute('aria-label', 'Find ' + b.t + ' on Audible, opens in a new tab');
  $('#books').appendChild(li);
});

/* ============ Hub and routing ============ */
function refreshHub() {
  const t = today();
  $('[data-tag="coffee"]').textContent = store.get('coffeeDay', '') === t ? 'Done today' : 'Start';
  $('[data-tag="breathe"]').textContent = store.get('breatheDay', '') === t ? 'Done today' : 'Start';
  $('[data-tag="breakfast"]').textContent = store.get('breakfastDay', '') === t ? 'Done today' : 'Start';
  const s = stats(), el = $('#stats');
  if (s) { el.hidden = false; el.textContent = s.n + (s.n === 1 ? ' session' : ' sessions') + ', ' + s.mins + ' minutes' + (s.streak > 1 ? ', ' + s.streak + ' days in a row.' : '.'); } else el.hidden = true;
  const cta = $('#hubCta'), cDone = store.get('coffeeDay', '') === t, bDone = store.get('breatheDay', '') === t, fDone = store.get('breakfastDay', '') === t;
  const started = cDone || bDone || fDone;
  const next = !cDone ? [started ? 'Order your coffee' : 'Start my morning', '#coffee'] : !bDone ? ['Continue to breathing', '#breathe'] : !fDone ? ['Continue to breakfast', '#breakfast'] : ['Sit again', '#breathe'];
  cta.textContent = next[0]; cta.href = next[1];
}
const VIEWS = ['hub', 'coffee', 'breathe', 'breakfast', 'music', 'reading', 'calendar', 'future'];
function route() {
  let h = location.hash.slice(1); if (!VIEWS.includes(h)) h = 'hub';
  if ((S.state === 'running' || S.state === 'paused') && h !== 'breathe') { toast('Finish or end your session first.'); location.hash = '#breathe'; return; }
  VIEWS.forEach(v => { $('#view-' + v).hidden = v !== h; }); document.body.dataset.view = h; if (window.MR_CAL) MR_CAL.onRoute(h);
  if (h === 'hub') refreshHub(); if (h === 'breathe' && S.state === 'idle') { showPanel('bSetup'); syncSetup(); }
  const t = $('#view-' + h + ' h1'); if (t) t.focus({ preventScroll: true }); window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);

buildSoundUI(); syncSoundUI(); renderDrinks(); syncSetup(); route();
if (EXT) EXT.init({ audio, store, sound, applyMix, toggleSheet, syncSoundUI, saveSound, reduce });
})();
