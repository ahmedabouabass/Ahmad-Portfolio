(() => {
'use strict';
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
function rng(seed) { return function () { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const f0 = v => Number(v).toFixed(0), f1 = v => Number(v).toFixed(1);

/* ============ Extra sound layers (added to the engine in routine.js) ============ */
const layers = {
  city:   { label: 'City streets', scale: 0.9 },
  wind:   { label: 'Wind', scale: 0.8 },
  waves:  { label: 'Ocean waves', scale: 1 },
  birds:  { label: 'Birds and crickets', scale: 0.7 },
  chimes: { label: 'Chimes and water', scale: 0.9 },
  beat:   { label: 'House beat', scale: 0.8 }
};
const builders = {
  buildWind() {
    const c = this.ctx, g = c.createGain(); g.gain.value = 0; g.connect(this.bus); const srcs = [];
    const s = this.loop('pink'); srcs.push(s);
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 550; bp.Q.value = 0.8;
    const vg = c.createGain(); vg.gain.value = 1.1; s.connect(bp); bp.connect(vg); vg.connect(g);
    this.lfo(srcs, 0.07, 260, bp.frequency); this.lfo(srcs, 0.13, 0.45, vg.gain);
    return { gain: g, srcs, tick: () => {} };
  },
  buildWaves() {
    const c = this.ctx, g = c.createGain(); g.gain.value = 0; g.connect(this.bus); const srcs = [];
    const fq = 0.09 + Math.random() * 0.04;
    const b = this.loop('brown'); srcs.push(b);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700;
    const wg = c.createGain(); wg.gain.value = 0.9; b.connect(lp); lp.connect(wg); wg.connect(g); this.lfo(srcs, fq, 0.7, wg.gain);
    const p = this.loop('pink'); srcs.push(p);
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1800;
    const fg = c.createGain(); fg.gain.value = 0.5; p.connect(hp); hp.connect(fg); fg.connect(g); this.lfo(srcs, fq, 0.45, fg.gain);
    return { gain: g, srcs, tick: () => {} };
  },
  buildCity() {
    const c = this.ctx, g = c.createGain(); g.gain.value = 0; g.connect(this.bus); const srcs = [];
    const b = this.loop('brown'); srcs.push(b);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 240;
    const bg = c.createGain(); bg.gain.value = 2.4; b.connect(lp); lp.connect(bg); bg.connect(g);
    const p = this.loop('pink'); srcs.push(p);
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 0.6;
    const pg = c.createGain(); pg.gain.value = 0.28; p.connect(bp); bp.connect(pg); pg.connect(g); this.lfo(srcs, 0.08, 0.12, pg.gain);
    let next = 0, horn = 0;
    const car = t => {
      const s = c.createBufferSource(); s.buffer = this.noise.white;
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2;
      f.frequency.setValueAtTime(260, t); f.frequency.linearRampToValueAtTime(640, t + 1.7); f.frequency.linearRampToValueAtTime(240, t + 3.6);
      const cg = c.createGain(); cg.gain.setValueAtTime(0, t); cg.gain.linearRampToValueAtTime(0.22, t + 1.7); cg.gain.linearRampToValueAtTime(0, t + 3.7);
      s.connect(f); f.connect(cg); cg.connect(g); s.start(t, Math.random() * 5); s.stop(t + 3.8);
    };
    const honk = t => [420, 530].forEach(fr => {
      const o = c.createOscillator(), og = c.createGain(); o.type = 'triangle'; o.frequency.value = fr;
      og.gain.setValueAtTime(0, t); og.gain.linearRampToValueAtTime(0.02, t + 0.03); og.gain.setValueAtTime(0.02, t + 0.25); og.gain.linearRampToValueAtTime(0, t + 0.4);
      o.connect(og); og.connect(g); o.start(t); o.stop(t + 0.45);
    });
    return { gain: g, srcs, tick: (now, ahead) => {
      if (!next) { next = now + 2; horn = now + 40; }
      while (next < ahead) { car(Math.max(next, now)); next += 6 + Math.random() * 10; }
      if (horn < ahead) { honk(Math.max(horn, now)); horn += 50 + Math.random() * 60; }
    } };
  },
  buildBirds() {
    const c = this.ctx, g = c.createGain(); g.gain.value = 0; g.connect(this.bus); let next = 0;
    const chirp = t => {
      const n = 2 + Math.floor(Math.random() * 3), base = 2200 + Math.random() * 2200;
      for (let i = 0; i < n; i++) {
        const tt = t + i * 0.11, o = c.createOscillator(), og = c.createGain(); o.type = 'sine';
        o.frequency.setValueAtTime(base, tt); o.frequency.exponentialRampToValueAtTime(base * 1.5, tt + 0.07);
        og.gain.setValueAtTime(0, tt); og.gain.linearRampToValueAtTime(0.035, tt + 0.01); og.gain.exponentialRampToValueAtTime(0.0001, tt + 0.09);
        o.connect(og); og.connect(g); o.start(tt); o.stop(tt + 0.12);
      }
    };
    const cricket = t => {
      for (let i = 0; i < 4; i++) {
        const tt = t + i * 0.07, o = c.createOscillator(), og = c.createGain(); o.type = 'sine'; o.frequency.value = 4300;
        og.gain.setValueAtTime(0, tt); og.gain.linearRampToValueAtTime(0.012, tt + 0.005); og.gain.exponentialRampToValueAtTime(0.0001, tt + 0.045);
        o.connect(og); og.connect(g); o.start(tt); o.stop(tt + 0.06);
      }
    };
    return { gain: g, srcs: [], tick: (now, ahead) => {
      if (!next) next = now + 0.5 + Math.random() * 2;
      while (next < ahead) { if (this.night) { cricket(Math.max(next, now)); next += 1 + Math.random() * 2; } else { chirp(Math.max(next, now)); next += 1.5 + Math.random() * 5; } }
    } };
  },
  buildChimes() {
    const c = this.ctx, g = c.createGain(); g.gain.value = 0; g.connect(this.bus);
    const scale = [293.66, 329.63, 392, 440, 493.88, 587.33, 659.25]; let nextN = 0, nextD = 0;
    const note = t => {
      const f = scale[Math.floor(Math.random() * scale.length)];
      [[1, 1, 4], [2.01, 0.4, 2.4], [3.9, 0.15, 1.2]].forEach(([r, a, d]) => {
        const o = c.createOscillator(), og = c.createGain(); o.type = 'sine'; o.frequency.value = f * r;
        og.gain.setValueAtTime(0, t); og.gain.linearRampToValueAtTime(0.06 * a, t + 0.01); og.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(og); og.connect(g); o.start(t); o.stop(t + d + 0.1);
      });
    };
    const drip = t => {
      const o = c.createOscillator(), og = c.createGain(); o.type = 'sine';
      o.frequency.setValueAtTime(1100, t); o.frequency.exponentialRampToValueAtTime(420, t + 0.14);
      og.gain.setValueAtTime(0, t); og.gain.linearRampToValueAtTime(0.05, t + 0.005); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(og); og.connect(g); o.start(t); o.stop(t + 0.25);
    };
    return { gain: g, srcs: [], tick: (now, ahead) => {
      if (!nextN) { nextN = now + 1.5; nextD = now + 3; }
      while (nextN < ahead) { note(Math.max(nextN, now)); nextN += 4 + Math.random() * 7; }
      while (nextD < ahead) { drip(Math.max(nextD, now)); nextD += 3 + Math.random() * 5; }
    } };
  },
  buildBeat() {
    const c = this.ctx, g = c.createGain(); g.gain.value = 0; g.connect(this.bus);
    const step = 60 / 118 / 4, bass = [55, 55, 65.41, 49], chord = [220, 261.63, 329.63, 392], pent = [440, 523.25, 587.33, 659.25, 783.99];
    let t = 0, i = 0;
    const env = (node, at, peak, dur) => { node.gain.setValueAtTime(0, at); node.gain.linearRampToValueAtTime(peak, at + 0.004); node.gain.exponentialRampToValueAtTime(0.0001, at + dur); };
    const play = (at, s, bar) => {
      if (s % 4 === 0) { const o = c.createOscillator(), og = c.createGain(); o.frequency.setValueAtTime(160, at); o.frequency.exponentialRampToValueAtTime(45, at + 0.12); env(og, at, 0.9, 0.3); o.connect(og); og.connect(g); o.start(at); o.stop(at + 0.35); }
      if (s % 4 === 2) this.burst(at, g, { freq: 8000, q: 0.8, peak: 0.1, decay: 0.05, type: 'highpass' });
      else if (s % 2 === 1) this.burst(at, g, { freq: 8000, q: 0.8, peak: 0.03, decay: 0.03, type: 'highpass' });
      if (s === 4 || s === 12) { this.burst(at, g, { freq: 1600, q: 0.9, peak: 0.25, decay: 0.13 }); this.burst(at + 0.012, g, { freq: 1800, q: 0.9, peak: 0.15, decay: 0.1 }); }
      if (s % 4 === 2) { const o = c.createOscillator(), lp = c.createBiquadFilter(), og = c.createGain(); o.type = 'sawtooth'; o.frequency.value = bass[bar % 4]; lp.type = 'lowpass'; lp.frequency.value = 280; env(og, at, 0.3, 0.22); o.connect(lp); lp.connect(og); og.connect(g); o.start(at); o.stop(at + 0.26); }
      if (s === 0 || s === 10) chord.forEach(fr => { const o = c.createOscillator(), og = c.createGain(); o.type = 'triangle'; o.frequency.value = fr; env(og, at, 0.05, 0.5); o.connect(og); og.connect(g); o.start(at); o.stop(at + 0.55); });
      if (s % 2 === 0 && Math.random() < 0.55) { const o = c.createOscillator(), og = c.createGain(); o.type = 'sine'; o.frequency.value = pent[Math.floor(Math.random() * pent.length)]; env(og, at, 0.03, 0.18); o.connect(og); og.connect(g); o.start(at); o.stop(at + 0.22); }
    };
    return { gain: g, srcs: [], tick: (now, ahead) => {
      if (!t) t = now + 0.1;
      while (t < ahead) { play(t, i % 16, Math.floor(i / 16) % 4); t += step; i++; }
    } };
  },
  thunder(at) {
    const c = this.ctx, s = this.loop('brown'), lp = c.createBiquadFilter(), g = c.createGain();
    lp.type = 'lowpass'; lp.frequency.value = 200; g.gain.value = 0;
    g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(1.6, at + 0.4); g.gain.exponentialRampToValueAtTime(0.0001, at + 4.5);
    s.connect(lp); lp.connect(g); g.connect(this.bus); s.stop(at + 5);
  }
};

/* ============ Scenes: mixes, palettes ============ */
const SCENES = {
  cafe:     { label: 'Café',     v: { cafe: 0.55, rain: 0.12, pad: 0.2 } },
  city:     { label: 'City',     v: { city: 0.7, pad: 0.22 } },
  mountain: { label: 'Mountain', v: { wind: 0.6, birds: 0.4, pad: 0.28 } },
  beach:    { label: 'Beach',    v: { waves: 0.75, wind: 0.15, birds: 0.25, pad: 0.18 } },
  zen:      { label: 'Zen',      v: { chimes: 0.6, pad: 0.45, wind: 0.1 } },
  party:    { label: 'Party',    v: { beat: 0.7, pad: 0.12 } }
};
const WX_ADD = { sunny: { birds: 0.25 }, cloudy: { wind: 0.1 }, rain: { rain: 0.5 }, storm: { rain: 0.8, wind: 0.2 }, snow: { wind: 0.3, pad: 0.2 } };
const PAL = {
  day:   { sky: ['#2f6aa8', '#6ea6d8', '#d9cfa8'], l1: '#4f7399', l2: '#35567a', l3: '#223a55', glow: '#fff2c2', sea1: '#2f7fb0', sea2: '#1d5b86', sand: '#cdb78a', cloud: '#ffffff', win: 0, star: 0, orb: '#fff6d0', orbg: 'rgba(255,240,180,.35)' },
  dusk:  { sky: ['#2b2a5e', '#b4587a', '#f2a65a'], l1: '#6a4b7a', l2: '#463465', l3: '#2a2250', glow: '#ffd08a', sea1: '#7a4b80', sea2: '#3b2a62', sand: '#8a6a62', cloud: '#f3c1a0', win: 0.55, star: 0.25, orb: '#ffc980', orbg: 'rgba(255,170,90,.35)' },
  night: { sky: ['#060b18', '#0e1a35', '#1b2c52'], l1: '#1b2a47', l2: '#121e37', l3: '#0a1224', glow: '#e8edf7', sea1: '#12274a', sea2: '#0a1630', sand: '#2a2f3d', cloud: '#5b6a8c', win: 0.95, star: 0.85, orb: '#e9eef8', orbg: 'rgba(200,215,255,.25)' }
};
const PARTY = { sky: ['#12062b', '#3b0f5c', '#0d2f66'], l1: '#2a0f4a', l2: '#1c0a38', l3: '#0b0716', glow: '#ff7ae8', sea1: '#12274a', sea2: '#0a1630', sand: '#1c0a38', cloud: '#7a3aa8', win: 0, star: 0, orb: '#ff7ae8', orbg: 'rgba(255,90,230,.3)' };
const WXF = { sunny: 'none', cloudy: 'saturate(.75) brightness(.88)', rain: 'saturate(.6) brightness(.72)', storm: 'saturate(.5) brightness(.55)', snow: 'saturate(.5) brightness(1.08) contrast(.95)' };
const CLOUD_OP = { sunny: 0.16, cloudy: 0.5, rain: 0.7, storm: 0.85, snow: 0.6 };
const ORB_OP = { sunny: 1, cloudy: 0.5, rain: 0.1, storm: 0.05, snow: 0.12 };
const STAR_MUL = { sunny: 1, cloudy: 0.5, rain: 0.12, storm: 0.05, snow: 0.15 };

function mixFor(scene, kind) {
  const m = {}; Object.keys(layers).concat(['rain', 'cafe', 'fire', 'pad']).forEach(k => { m[k] = 0; });
  Object.assign(m, SCENES[scene].v);
  const f = scene === 'party' ? 0.4 : 1, add = WX_ADD[kind] || {};
  Object.keys(add).forEach(k => { if (kind === 'sunny' && (scene === 'cafe' || scene === 'party')) return; m[k] = (m[k] || 0) + add[k] * f; });
  if (kind === 'snow') Object.keys(m).forEach(k => { if (k !== 'wind' && k !== 'pad') m[k] *= 0.75; });
  Object.keys(m).forEach(k => { m[k] = clamp(m[k], 0, 1); });
  return m;
}

/* ============ Scene artwork (SVG, tinted by CSS variables) ============ */
function stars(r) {
  let s = '<g style="opacity:var(--star-op)">';
  for (let i = 0; i < 90; i++) s += '<circle cx="' + f0(r() * 1600) + '" cy="' + f0(r() * 470) + '" r="' + f1(0.6 + r() * 1.4) + '" fill="#fff" opacity="' + (0.4 + r() * 0.6).toFixed(2) + '"/>';
  return s + '</g>';
}
function sceneCity() {
  const r = rng(7); let out = stars(r);
  const layer = (fill, hMin, hMax, wMin, wMax, win, p) => {
    let x = -20, s = '<g style="fill:var(' + fill + ')">', wins = '';
    while (x < 1650) {
      const w = wMin + r() * (wMax - wMin), h = hMin + r() * (hMax - hMin);
      s += '<rect x="' + f0(x) + '" y="' + f0(900 - h) + '" width="' + f0(w) + '" height="' + f0(h) + '"/>';
      if (r() < 0.25) s += '<rect x="' + f0(x + w / 2 - 1.5) + '" y="' + f0(900 - h - 50) + '" width="3" height="50"/>';
      if (win) for (let yy = 900 - h + 14; yy < 880; yy += 22) for (let xx = x + 8; xx < x + w - 10; xx += 16) if (r() < p) wins += '<rect x="' + f0(xx) + '" y="' + f0(yy) + '" width="6" height="9"/>';
      x += w + r() * 6;
    }
    return s + '</g>' + (win ? '<g style="fill:var(--win);opacity:var(--win-op)">' + wins + '</g>' : '');
  };
  return out + layer('--l1', 200, 420, 50, 95, false, 0) + layer('--l2', 160, 520, 45, 100, true, 0.2) + layer('--l3', 90, 300, 60, 120, true, 0.28);
}
function sceneMountain() {
  const r = rng(11);
  const ridge = (base, amp, f1, f2, ph) => {
    let d = 'M-10 900';
    for (let x = -10; x <= 1610; x += 16) {
      const h = 0.6 * (1 - Math.abs(Math.sin(x * f1 + ph))) + 0.25 * (1 - Math.abs(Math.sin(x * f2 + ph * 1.7))) + 0.15 * Math.sin(x * f2 * 3.1);
      d += ' L' + x + ' ' + (base - amp * h).toFixed(1);
    }
    return d + ' L1610 900 Z';
  };
  let out = stars(r);
  out += '<defs><linearGradient id="snowg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef4fb"/><stop offset=".24" stop-color="#eef4fb"/><stop offset=".3" style="stop-color:var(--l1)"/><stop offset="1" style="stop-color:var(--l1)"/></linearGradient></defs>';
  out += '<path d="' + ridge(580, 300, 0.0042, 0.011, 1.1) + '" fill="url(#snowg)"/>';
  out += '<path d="' + ridge(690, 210, 0.0058, 0.015, 2.4) + '" style="fill:var(--l2)"/>';
  out += '<path d="' + ridge(800, 140, 0.0075, 0.02, 4.1) + '" style="fill:var(--l3)"/>';
  out += '<g style="fill:var(--l3)">';
  for (let i = 0; i < 80; i++) {
    const x = r() * 1600, h = 50 + r() * 90, w = h * 0.42, y2 = 905;
    out += '<path d="M' + f0(x - w / 2) + ' ' + y2 + ' L' + f0(x) + ' ' + f0(y2 - h) + ' L' + f0(x + w / 2) + ' ' + y2 + ' Z"/>';
  }
  return out + '</g>';
}
function sceneBeach() {
  const r = rng(3); let out = stars(r);
  out += '<defs><linearGradient id="seag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--sea1)"/><stop offset="1" style="stop-color:var(--sea2)"/></linearGradient></defs>';
  out += '<rect x="0" y="540" width="1600" height="240" fill="url(#seag)"/>';
  out += '<ellipse cx="1100" cy="620" rx="46" ry="80" style="fill:var(--glow);opacity:.3;filter:blur(10px)"/>';
  const wave = (y, amp, op, dur) => {
    let d = 'M-160 ' + y;
    for (let x = -160; x < 1760; x += 160) d += ' q40 -' + amp + ' 80 0 t80 0';
    return '<path class="wv" style="animation-duration:' + dur + 's" d="' + d + '" fill="none" stroke="#fff" stroke-width="2" opacity="' + op + '"/>';
  };
  out += wave(575, 8, 0.2, 9) + wave(610, 10, 0.22, 7) + wave(650, 12, 0.25, 6) + wave(695, 14, 0.3, 5);
  out += '<path d="M0 745 C300 715 700 722 1000 748 S1500 790 1600 770 L1600 900 L0 900Z" style="fill:var(--sand)"/>';
  out += '<path class="foam" d="M0 745 C300 715 700 722 1000 748 S1500 790 1600 770" fill="none" stroke="#fff" stroke-width="5" opacity=".45"/>';
  out += '<g style="stroke:var(--l3);fill:none;stroke-linecap:round"><path d="M1390 910 C1410 780 1420 650 1335 530" stroke-width="18"/>';
  [['M1335 530 C1270 480 1195 500 1150 565', 10], ['M1335 530 C1290 460 1230 440 1160 460', 9], ['M1335 530 C1340 450 1390 410 1450 405', 9], ['M1335 530 C1400 480 1470 500 1510 560', 10], ['M1335 530 C1255 540 1225 590 1215 640', 8], ['M1335 530 C1410 545 1445 600 1450 650', 8]]
    .forEach(([d, w]) => { out += '<path d="' + d + '" stroke-width="' + w + '"/>'; });
  return out + '</g>';
}
function sceneZen() {
  const r = rng(5); let out = stars(r);
  out += '<circle cx="1180" cy="300" r="190" style="fill:var(--glow);opacity:.18;filter:blur(24px)"/><circle cx="1180" cy="300" r="118" style="fill:var(--glow);opacity:.9"/>';
  const hill = (base, amp, f, ph, op, fill) => {
    let d = 'M-10 900';
    for (let x = -10; x <= 1610; x += 20) d += ' L' + x + ' ' + (base - amp * (0.5 + 0.5 * Math.sin(x * f + ph))).toFixed(1);
    return '<path d="' + d + ' L1610 900 Z" style="fill:var(' + fill + ');opacity:' + op + '"/>';
  };
  out += hill(600, 90, 0.004, 0.5, 0.75, '--l1') + hill(650, 70, 0.006, 2.2, 0.9, '--l2');
  out += '<defs><linearGradient id="mistg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect x="0" y="560" width="1600" height="120" fill="url(#mistg)"/>';
  out += '<rect x="0" y="690" width="1600" height="220" style="fill:var(--sand);opacity:.92"/>';
  out += '<g stroke="#fff" stroke-opacity=".1" stroke-width="2" fill="none">';
  for (let y = 705; y < 900; y += 15) out += '<path d="M0 ' + y + ' Q400 ' + (y - 6) + ' 800 ' + y + ' T1600 ' + y + '"/>';
  out += '</g>';
  const stones = [[430, 800, 64, 34], [575, 830, 40, 22], [1040, 808, 52, 28]];
  stones.forEach(([x, y, rx, ry]) => {
    out += '<g stroke="#fff" stroke-opacity=".2" stroke-width="2.5" fill="none">';
    for (let k = 1; k <= 5; k++) out += '<ellipse cx="' + x + '" cy="' + y + '" rx="' + (rx + k * 26) + '" ry="' + (ry + k * 9) + '"/>';
    out += '</g><ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" style="fill:var(--l3)"/><ellipse cx="' + (x - rx * 0.3) + '" cy="' + (y - ry * 0.4) + '" rx="' + rx * 0.45 + '" ry="' + ry * 0.3 + '" fill="#fff" opacity=".12"/>';
  });
  out += '<g class="sway" style="fill:var(--l3);transform-origin:1420px 900px">';
  for (let i = 0; i < 6; i++) {
    const x = 1330 + i * 34, w = 13;
    out += '<rect x="' + x + '" y="-20" width="' + w + '" height="940"/>';
    for (let y = 80 + (i % 3) * 40; y < 880; y += 130) out += '<rect x="' + (x - 1) + '" y="' + y + '" width="' + (w + 2) + '" height="5" fill="#000" opacity=".25"/>';
    for (let k = 0; k < 3; k++) { const ly = 140 + k * 190 + i * 22, dir = (i + k) % 2 ? 1 : -1; out += '<path d="M' + (x + 6) + ' ' + ly + ' q' + 55 * dir + ' -16 ' + 100 * dir + ' 14 q' + -50 * dir + ' 0 ' + -100 * dir + ' -14Z"/>'; }
  }
  return out + '</g>';
}
function sceneParty() {
  const r = rng(9);
  let out = '<defs><linearGradient id="bm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><radialGradient id="ballg" cx=".35" cy=".3"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#b9b6d6"/><stop offset="1" stop-color="#4a4670"/></radialGradient><linearGradient id="eqg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff3df0"/><stop offset="1" stop-color="#38e8ff"/></linearGradient></defs>';
  const cols = ['#ff3df0', '#38e8ff', '#ffd23d', '#ff3df0', '#38e8ff', '#9d6bff'];
  for (let i = 0; i < 6; i++) {
    const x = 160 + i * 270, a = 14 + r() * 14, dir = i % 2 ? -1 : 1;
    out += '<g class="beam" style="--a:' + f0(a * dir) + 'deg;animation-duration:' + f1(4 + r() * 4) + 's;animation-delay:-' + f1(r() * 6) + 's;transform-origin:' + x + 'px 0px;mix-blend-mode:screen"><polygon points="' + (x - 14) + ',0 ' + (x + 14) + ',0 ' + (x + 150) + ',900 ' + (x - 150) + ',900" style="fill:' + cols[i] + '" opacity=".22"/><polygon points="' + (x - 14) + ',0 ' + (x + 14) + ',0 ' + (x + 150) + ',900 ' + (x - 150) + ',900" fill="url(#bm)" opacity=".5"/></g>';
  }
  out += '<line x1="800" y1="0" x2="800" y2="70" stroke="#fff" stroke-opacity=".5"/><circle cx="800" cy="126" r="56" fill="url(#ballg)"/><g stroke="#fff" stroke-opacity=".35" fill="none">';
  for (let k = -2; k <= 2; k++) out += '<ellipse cx="800" cy="126" rx="56" ry="' + (Math.abs(k) * 12 + 6) + '" transform="translate(0 ' + k * 14 + ')" clip-path="none"/>';
  for (let k = 1; k <= 4; k++) out += '<ellipse cx="800" cy="126" rx="' + k * 13 + '" ry="56"/>';
  out += '</g>';
  for (let i = 0; i < 16; i++) out += '<path class="spark" style="animation-delay:-' + f1(r() * 3) + 's" d="M' + f0(60 + r() * 1480) + ' ' + f0(60 + r() * 600) + ' m-8 0 h16 m-8 -8 v16" stroke="#fff" stroke-width="2" opacity=".8"/>';
  out += '<g class="eq">';
  for (let i = 0; i < 40; i++) out += '<rect x="' + (i * 40 + 8) + '" y="640" width="24" height="170" rx="4" fill="url(#eqg)" opacity=".5" style="animation-duration:' + f1(0.5 + r() * 0.7) + 's;animation-delay:-' + f1(r() * 1) + 's"/>';
  out += '</g><g style="fill:#0b0716">';
  for (let x = 10; x < 1620; x += 30) {
    const hy = 840 - r() * 40;
    out += '<circle cx="' + f0(x) + '" cy="' + f0(hy) + '" r="14"/><rect x="' + f0(x - 15) + '" y="' + f0(hy + 12) + '" width="30" height="' + f0(900 - hy) + '" rx="12"/>';
    if (r() < 0.35) out += '<rect x="' + f0(x + 8) + '" y="' + f0(hy - 38) + '" width="6" height="40" rx="3" transform="rotate(14 ' + f0(x + 11) + ' ' + f0(hy) + ')"/>';
  }
  return out + '</g>';
}
function sceneCafe() {
  const r = rng(13);
  let out = '<defs><radialGradient id="bk1"><stop offset="0" stop-color="#ffd08a" stop-opacity=".9"/><stop offset="1" stop-color="#ffd08a" stop-opacity="0"/></radialGradient><radialGradient id="bk2"><stop offset="0" stop-color="#ff9f5a" stop-opacity=".9"/><stop offset="1" stop-color="#ff9f5a" stop-opacity="0"/></radialGradient><radialGradient id="bk3"><stop offset="0" stop-color="#fff1cf" stop-opacity=".9"/><stop offset="1" stop-color="#fff1cf" stop-opacity="0"/></radialGradient></defs>';
  out += '<g style="filter:blur(4px)">';
  for (let i = 0; i < 30; i++) out += '<circle class="bk" style="animation-delay:-' + f1(r() * 12) + 's;animation-duration:' + f1(10 + r() * 10) + 's" cx="' + f0(r() * 1600) + '" cy="' + f0(200 + r() * 560) + '" r="' + f0(18 + r() * 52) + '" fill="url(#bk' + (1 + Math.floor(r() * 3)) + ')" opacity="' + (0.25 + r() * 0.5).toFixed(2) + '"/>';
  out += '</g><g stroke="#fff" stroke-opacity=".08" stroke-width="16"><path d="M530 0V900M1070 0V900M0 380H1600"/></g>';
  out += '<rect x="0" y="810" width="1600" height="100" fill="#1a1008" opacity=".6"/><rect x="0" y="808" width="1600" height="3" fill="#ffd08a" opacity=".25"/>';
  return out;
}
const GEN = { cafe: sceneCafe, city: sceneCity, mountain: sceneMountain, beach: sceneBeach, zen: sceneZen, party: sceneParty };
const svg = id => '<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" width="100%" height="100%" focusable="false">' + GEN[id]() + '</svg>';

/* ============ Weather ============ */
const kindFromCode = c => c <= 1 ? 'sunny' : c <= 3 || c === 45 || c === 48 ? 'cloudy' : (c >= 51 && c <= 67) || (c >= 80 && c <= 82) ? 'rain' : (c >= 71 && c <= 77) || c === 85 || c === 86 ? 'snow' : c >= 95 ? 'storm' : 'cloudy';
const labelFromCode = c => ({ 0: 'Clear', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog', 48: 'Fog', 51: 'Drizzle', 53: 'Drizzle', 55: 'Drizzle', 56: 'Freezing drizzle', 57: 'Freezing drizzle', 61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 66: 'Freezing rain', 67: 'Freezing rain', 71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains', 80: 'Showers', 81: 'Showers', 82: 'Heavy showers', 85: 'Snow showers', 86: 'Snow showers', 95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm' }[c] || 'Cloudy');
const ICON = {
  sunny: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/></svg>',
  cloudy: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 18a4 4 0 0 1-.5-8A5.5 5.5 0 0 1 17 8.5 4.8 4.8 0 0 1 17 18Z"/></svg>',
  rain: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 15a4 4 0 0 1-.5-8A5.5 5.5 0 0 1 17 5.5 4.8 4.8 0 0 1 17 15"/><path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3"/></svg>',
  snow: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7"/></svg>',
  storm: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 14a4 4 0 0 1-.5-8A5.5 5.5 0 0 1 17 4.5 4.8 4.8 0 0 1 17 14"/><path d="M12 12l-3 5h4l-2 5"/></svg>'
};

/* ============ Controller ============ */
let A = null, fxr = null;
const st = { scene: 'cafe', wx: 'live', tod: 'auto', units: 'c', place: { name: 'Riyadh', lat: 24.7136, lon: 46.6753 }, live: null, err: false };
let lastMixKey = '', flashTimer = 0;
const $ = (s, r = document) => r.querySelector(s);
const WXLIST = [['live', 'Live'], ['sunny', 'Sunny'], ['cloudy', 'Cloudy'], ['rain', 'Rain'], ['snow', 'Snow'], ['storm', 'Storm']];
const TODLIST = [['auto', 'Auto'], ['day', 'Day'], ['dusk', 'Dusk'], ['night', 'Night']];

const effKind = () => st.wx === 'live' ? (st.live ? st.live.kind : 'sunny') : st.wx;
function hourAt(tz) { try { return +new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hour12: false, timeZone: tz || undefined }).format(new Date()) % 24; } catch (e) { return new Date().getHours(); } }
function effTod() {
  if (st.tod !== 'auto') return st.tod;
  const h = hourAt(st.live && st.live.tz);
  if (st.live) return !st.live.isDay ? 'night' : (h < 8 || h >= 17 ? 'dusk' : 'day');
  return h < 5 || h >= 19 ? 'night' : (h < 8 || h >= 17 ? 'dusk' : 'day');
}
const tempText = () => { if (!st.live) return '--'; const c = st.live.temp, v = st.units === 'f' ? c * 9 / 5 + 32 : c; return Math.round(v) + '°' + (st.units === 'f' ? 'F' : 'C'); };
const timeText = () => { try { return new Intl.DateTimeFormat([], { hour: '2-digit', minute: '2-digit', timeZone: (st.live && st.live.tz) || undefined }).format(new Date()); } catch (e) { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } };

function save() { A.store.set('atm', { scene: st.scene, wx: st.wx, tod: st.tod, units: st.units, place: st.place }); }

function paint() {
  const kind = effKind(), tod = effTod(), sc = $('#scene'), P = st.scene === 'party' ? PARTY : PAL[tod];
  const set = (k, v) => sc.style.setProperty(k, v);
  set('--sky1', P.sky[0]); set('--sky2', P.sky[1]); set('--sky3', P.sky[2]); set('--l1', P.l1); set('--l2', P.l2); set('--l3', P.l3);
  set('--glow', P.glow); set('--sea1', P.sea1); set('--sea2', P.sea2); set('--sand', P.sand); set('--cloud', P.cloud); set('--win', '#ffd88a'); set('--win-op', P.win);
  set('--orb', P.orb); set('--orbg', P.orbg);
  set('--star-op', String(st.scene === 'party' ? 0 : P.star * STAR_MUL[kind]));
  set('--cloud-op', String(CLOUD_OP[kind] * (tod === 'night' ? 0.6 : 1)));
  set('--orb-op', String(st.scene === 'party' || st.scene === 'zen' ? 0 : ORB_OP[kind]));
  set('--wxf', WXF[kind]);
  sc.dataset.scene = st.scene; sc.dataset.tod = tod; sc.dataset.wx = kind;
  A.audio.night = tod === 'night'; A.audio.weather = kind;
  fxr.setKind(kind); lightning(kind);
  const chip = $('#wxChip'); $('#wxIcon').innerHTML = ICON[kind]; $('#wxTemp').textContent = tempText();
  const label = st.live ? st.live.label.toLowerCase() : 'weather unavailable';
  chip.setAttribute('aria-label', 'Time and weather: ' + timeText() + ', ' + tempText() + ', ' + label + '. Open scene settings.');
  const now = $('#nowLine');
  if (now) now.textContent = st.place.name + ', ' + timeText() + '. ' + (st.live ? tempText() + ' and ' + label + '.' : 'Weather is unavailable right now.') + (st.wx !== 'live' ? ' Showing ' + st.wx + '.' : '');
  const lv = $('#wxLive'); if (lv) lv.textContent = st.live ? 'Live now in ' + st.place.name + ': ' + label + ', ' + tempText() + '.' : (st.err ? 'Live weather is unavailable. Check your connection.' : 'Loading live weather…');
  const key = st.scene + '|' + kind;
  if (A.sound.auto && key !== lastMixKey) { lastMixKey = key; A.applyMix(mixFor(st.scene, kind)); }
}
function clock() { const t = $('#wxTime'); if (t) t.textContent = timeText(); }

async function fetchWeather() {
  const p = st.place, ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 9000);
  try {
    const r = await fetch('https://api.open-meteo.com/v1/forecast?latitude=' + p.lat + '&longitude=' + p.lon + '&current=temperature_2m,weather_code,is_day&timezone=auto', { signal: ctl.signal });
    if (!r.ok) throw new Error('bad');
    const j = await r.json(), c = j.current;
    st.live = { temp: c.temperature_2m, code: c.weather_code, isDay: !!c.is_day, tz: j.timezone, kind: kindFromCode(c.weather_code), label: labelFromCode(c.weather_code) }; st.err = false;
  } catch (e) { st.live = null; st.err = true; }
  clearTimeout(to); paint(); clock();
}

/* weather particles */
function makeFx() {
  const o = { cv: $('#fx'), kind: 'sunny', parts: [], raf: 0, last: 0, w: 0, h: 0 };
  o.cx = o.cv.getContext('2d');
  o.resize = function () { const dpr = Math.min(window.devicePixelRatio || 1, 1.5); this.w = innerWidth; this.h = innerHeight; this.cv.width = this.w * dpr; this.cv.height = this.h * dpr; this.cx.setTransform(dpr, 0, 0, dpr, 0, 0); this.seed(); this.run(); };
  o.make = function (init) {
    if (this.kind === 'snow') return { x: Math.random() * this.w, y: init ? Math.random() * this.h : -10, r: 1 + Math.random() * 2.6, vy: 25 + Math.random() * 50, f: 0.5 + Math.random() * 1.5, ph: Math.random() * 6.28, sw: 12 + Math.random() * 22, a: 0.4 + Math.random() * 0.5 };
    const sp = this.kind === 'storm' ? 1.35 : 1;
    return { x: Math.random() * (this.w + 200) - 100, y: init ? Math.random() * this.h : -30, l: 12 + Math.random() * 18, vy: (700 + Math.random() * 500) * sp, vx: -120 * sp, a: 0.18 + Math.random() * 0.3 };
  };
  o.seed = function () {
    const a = this.w * this.h, k = this.kind; let n = 0;
    if (k === 'rain') n = clamp(a / 7000, 80, 380); else if (k === 'storm') n = clamp(a / 4500, 140, 560); else if (k === 'snow') n = clamp(a / 11000, 60, 240);
    this.parts = []; for (let i = 0; i < n; i++) this.parts.push(this.make(true));
  };
  o.frame = function (t) {
    const dt = Math.min(0.05, Math.max(0, (t - this.last) / 1000)); this.last = t; const cx = this.cx; cx.clearRect(0, 0, this.w, this.h);
    if (this.kind === 'snow') {
      cx.fillStyle = '#fff';
      this.parts.forEach(p => { p.y += p.vy * dt; p.x += Math.sin(t / 1000 * p.f + p.ph) * p.sw * dt; if (p.y > this.h + 10) { p.y = -10; p.x = Math.random() * this.w; } cx.globalAlpha = p.a; cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 6.283); cx.fill(); });
      cx.globalAlpha = 1;
    } else {
      cx.lineWidth = 1.2; cx.lineCap = 'round';
      this.parts.forEach(p => { p.y += p.vy * dt; p.x += p.vx * dt; if (p.y > this.h + 30) { p.y = -30; p.x = Math.random() * (this.w + 200) - 100; } cx.strokeStyle = 'rgba(205,222,255,' + p.a + ')'; cx.beginPath(); cx.moveTo(p.x, p.y); cx.lineTo(p.x + p.vx * 0.022, p.y - p.l); cx.stroke(); });
    }
  };
  o.run = function () {
    cancelAnimationFrame(this.raf); this.cx.clearRect(0, 0, this.w, this.h);
    if (!this.parts.length) return;
    this.last = performance.now();
    if (A.reduce) { this.frame(this.last); return; }
    const loop = t => { this.frame(t); this.raf = requestAnimationFrame(loop); }; this.raf = requestAnimationFrame(loop);
  };
  o.setKind = function (k) { if (k === this.kind) return; this.kind = k; this.seed(); this.run(); };
  return o;
}
function lightning(kind) {
  clearTimeout(flashTimer); if (kind !== 'storm' || A.reduce) return;
  const go = () => {
    const f = $('#flash'); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
    const au = A.audio; if (au.playing && au.ctx && au.layers.rain && au.thunder) au.thunder(au.ctx.currentTime + 0.6 + Math.random() * 1.5);
    flashTimer = setTimeout(go, 6000 + Math.random() * 9000);
  };
  flashTimer = setTimeout(go, 3000 + Math.random() * 4000);
}

function drawScene() {
  const box = $('#lands'), old = Array.from(box.children), el = document.createElement('div');
  el.className = 'land'; el.innerHTML = svg(st.scene); box.appendChild(el);
  setTimeout(() => el.classList.add('in'), 40);
  old.forEach(o => { o.classList.remove('in'); setTimeout(() => o.remove(), 1400); });
}

/* panel controls */
function chipRow(id, list, get, set) {
  const box = $('#' + id); box.innerHTML = '';
  list.forEach(([v, label]) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.dataset.v = v; b.textContent = label; b.addEventListener('click', () => { set(v); syncChips(); }); box.appendChild(b); });
  box._get = get;
}
function syncChips() {
  [['sceneChips'], ['wxChips'], ['todChips']].forEach(([id]) => { const box = $('#' + id); Array.from(box.children).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === box._get()))); });
  $('#placeLabel').textContent = st.place.name; $('#unitBtn').textContent = st.units === 'c' ? 'Show °F' : 'Show °C';
}
async function searchCity(q) {
  const ul = $('#cityResults'), msg = $('#placeMsg'); ul.innerHTML = ''; msg.textContent = 'Searching…';
  try {
    const r = await fetch('https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(q) + '&count=5&language=en&format=json'); const j = await r.json();
    if (!j.results || !j.results.length) { msg.textContent = 'No city found. Check the spelling or try a larger nearby city.'; return; }
    msg.textContent = '';
    j.results.forEach(x => { const li = document.createElement('li'), b = document.createElement('button'); b.type = 'button'; b.textContent = [x.name, x.admin1, x.country].filter(Boolean).join(', ');
      b.addEventListener('click', () => { st.place = { name: x.name, lat: x.latitude, lon: x.longitude }; st.live = null; ul.innerHTML = ''; $('#cityInput').value = ''; save(); syncChips(); paint(); fetchWeather(); }); li.appendChild(b); ul.appendChild(li); });
  } catch (e) { msg.textContent = 'Search is unavailable. Check your connection and try again.'; }
}
function useLocation() {
  const msg = $('#placeMsg');
  if (!navigator.geolocation) { msg.textContent = 'This browser can\'t share your location. Search for a city instead.'; return; }
  msg.textContent = 'Asking for your location…';
  navigator.geolocation.getCurrentPosition(pos => { st.place = { name: 'My location', lat: +pos.coords.latitude.toFixed(3), lon: +pos.coords.longitude.toFixed(3) }; st.live = null; msg.textContent = ''; save(); syncChips(); paint(); fetchWeather(); },
    () => { msg.textContent = 'Location was not shared. Search for a city instead.'; }, { timeout: 10000, maximumAge: 600000 });
}

function init(api) {
  A = api; Object.assign(st, A.store.get('atm', {}));
  if (!SCENES[st.scene]) st.scene = 'cafe'; if (!WXLIST.some(x => x[0] === st.wx)) st.wx = 'live'; if (!TODLIST.some(x => x[0] === st.tod)) st.tod = 'auto';
  fxr = makeFx();
  chipRow('sceneChips', Object.entries(SCENES).map(([k, v]) => [k, v.label]), () => st.scene, v => { st.scene = v; save(); drawScene(); paint(); });
  chipRow('wxChips', WXLIST, () => st.wx, v => { st.wx = v; save(); paint(); });
  chipRow('todChips', TODLIST, () => st.tod, v => { st.tod = v; save(); paint(); });
  $('#cityForm').addEventListener('submit', e => { e.preventDefault(); const q = $('#cityInput').value.trim(); if (q) searchCity(q); });
  $('#geoBtn').addEventListener('click', useLocation);
  $('#unitBtn').addEventListener('click', () => { st.units = st.units === 'c' ? 'f' : 'c'; save(); syncChips(); paint(); });
  $('#wxChip').addEventListener('click', () => A.toggleSheet('scene'));
  const ha = $('#hubAtmo'); if (ha) ha.addEventListener('click', () => A.toggleSheet('scene'));
  $('#autoBtn').addEventListener('click', () => { A.sound.auto = true; lastMixKey = ''; paint(); A.syncSoundUI(); A.saveSound(); });
  drawScene(); syncChips(); fxr.resize(); paint(); clock(); fetchWeather();
  setInterval(clock, 1000); setInterval(fetchWeather, 15 * 60 * 1000); setInterval(paint, 60000);
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => fxr.resize(), 200); });
}
window.MR_EXT = { layers, builders, init, applyAuto() { lastMixKey = ''; if (A) paint(); }, _svg: svg, _mixFor: mixFor, _scenes: Object.keys(GEN) };
})();
