/* Dream Atlas ambience: generative, no audio files. A slow pad that drifts between open chords,
   a low drone, a breath of filtered air, a far-off bell and the odd closer chime. Never loops audibly.
   v3: weighted chord moves, nearest-voicing voice leading, a home key that wanders, uneven chord lengths.
   v6: the far bell sings: a small songbook of phrases grown from one rising motif, set loosely in a form.
   v7: a less stepwise songbook: leaps, leaning notes, repeated notes, falling thirds, a longer breathing line.
   v8: sparser, more two-note sighs, and every bell set further back, like stars flickering on far off. */
function makeAmbience(ctx, opts = {}) {
  const seed = opts.seed ?? 7;
  let s = seed >>> 0;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  for (let i = 0; i < 4; i++) rnd(); // let the generator settle so nearby seeds diverge
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const log = opts.log || (() => {});

  // the room and the air use their own fixed seed, so the space sounds (and sits) the same on every load
  let rs = (opts.roomSeed ?? 5) >>> 0;   // room 5: the most even of the ones tried
  const rrnd = () => { rs = (rs * 1664525 + 1013904223) >>> 0; return rs / 4294967296; };
  const master = ctx.createGain(); master.gain.value = 0;
  master.connect(opts.out || ctx.destination);

  // reverb: a long, dark, generated hall
  const revConv = ctx.createConvolver();
  {
    const len = Math.floor(ctx.sampleRate * 7), b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch); let lp = 0;
      for (let i = 0; i < len; i++) { const t = i / len; lp += (rrnd() * 2 - 1 - lp) * (0.22 - 0.17 * t); d[i] = lp * Math.pow(1 - t, 2.6); }
    }
    revConv.buffer = b;
  }
  // everything sends to 'rev', which keeps the bass out of the hall: lows stay dry and even
  const rev = ctx.createBiquadFilter(); rev.type = 'highpass'; rev.frequency.value = 140; rev.Q.value = 0.5;
  rev.connect(revConv);
  const revOut = ctx.createGain(); revOut.gain.value = 0.9; revConv.connect(revOut).connect(master);

  // pad bus with a slowly breathing low-pass
  const padBus = ctx.createGain(); padBus.gain.value = 1;
  const padLP = ctx.createBiquadFilter(); padLP.type = 'lowpass'; padLP.frequency.value = 820; padLP.Q.value = 0.4;
  const lfo = ctx.createOscillator(); lfo.frequency.value = 0.031;
  const lfoAmt = ctx.createGain(); lfoAmt.gain.value = 210; lfo.connect(lfoAmt).connect(padLP.frequency);
  padBus.connect(padLP);
  const padDry = ctx.createGain(); padDry.gain.value = 0.55; padLP.connect(padDry).connect(master);
  const padWet = ctx.createGain(); padWet.gain.value = 0.7; padLP.connect(padWet).connect(rev);

  // drone: follows the current key centre, dipping out and back in when the key moves
  const drone = ctx.createOscillator(); drone.type = 'sine'; drone.frequency.value = mtof(38);
  const droneG = ctx.createGain(); droneG.gain.value = 0.05;
  const droneLfo = ctx.createOscillator(); droneLfo.frequency.value = 0.017;
  const droneLfoAmt = ctx.createGain(); droneLfoAmt.gain.value = 0.02; droneLfo.connect(droneLfoAmt).connect(droneG.gain);
  const droneFade = ctx.createGain(); droneFade.gain.value = 1;
  drone.connect(droneG).connect(droneFade); droneFade.connect(master); droneFade.connect(rev);
  function moveDrone(m, t0) {
    droneFade.gain.setValueAtTime(1, t0);
    droneFade.gain.linearRampToValueAtTime(0, t0 + 6);
    drone.frequency.setValueAtTime(mtof(m), t0 + 6.1);
    droneFade.gain.linearRampToValueAtTime(1, t0 + 16);
  }

  // air: pink noise through a wandering band-pass, panned slowly
  const nb = ctx.createBuffer(2, ctx.sampleRate * 6, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = nb.getChannelData(ch); let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < d.length; i++) { const w = rrnd() * 2 - 1; b0 = 0.99765 * b0 + w * 0.099; b1 = 0.963 * b1 + w * 0.2965; b2 = 0.57 * b2 + w * 1.0526; d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.18; }
  }
  const air = ctx.createBufferSource(); air.buffer = nb; air.loop = true;
  const airBP = ctx.createBiquadFilter(); airBP.type = 'bandpass'; airBP.frequency.value = 520; airBP.Q.value = 0.6;
  const airLfo = ctx.createOscillator(); airLfo.frequency.value = 0.023;
  const airLfoAmt = ctx.createGain(); airLfoAmt.gain.value = 300; airLfo.connect(airLfoAmt).connect(airBP.frequency);
  const airG = ctx.createGain(); airG.gain.value = 0.018;
  const pan = ctx.createStereoPanner(); const panLfo = ctx.createOscillator(); panLfo.frequency.value = 0.011;
  const panAmt = ctx.createGain(); panAmt.gain.value = 0.5; panLfo.connect(panAmt).connect(pan.pan);
  air.connect(airBP).connect(airG).connect(pan); pan.connect(master); pan.connect(rev);

  // ---- harmony -------------------------------------------------------------------------------
  // Chords are a bass root plus four upper pitch classes (0 = C). Upper voices are re-voiced each
  // time to sit as close as possible to the last chord, so changes feel like a slow turn.
  // Each region has weighted moves; home is D, and the music drifts away for a while and back.
  const pc = n => ({ C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 })[n];
  const C = (root, ...upper) => ({ root: pc(root), upper: upper.map(pc) });
  const REGIONS = {
    home: { drone: 38, bellTonic: 74, scale: [0, 2, 4, 5, 7, 9, 11], stay: [8, 14], enter: 'Dmaj9', chords: {   // D, open and lydian-ish
      'Dmaj9':     [C('D', 'A', 'E', 'F#', 'C#'), { 'Gmaj7#11': 3, 'Bm11': 3, 'Asus2': 1, 'Em9': 1 }],
      'Bm11':      [C('B', 'F#', 'A', 'D', 'E'),  { 'Gmaj7#11': 3, 'Em9': 2, 'Dmaj9': 2 }],
      'Gmaj7#11':  [C('G', 'D', 'F#', 'A', 'C#'), { 'Dmaj9': 3, 'Asus2': 2, 'Bm11': 1, 'Em9': 1 }],
      'Asus2':     [C('A', 'E', 'A', 'B', 'D'),   { 'Dmaj9': 4, 'Bm11': 1, 'Gmaj7#11': 1 }],
      'Em9':       [C('E', 'B', 'F#', 'A', 'D'),  { 'Asus2': 3, 'Gmaj7#11': 2, 'Dmaj9': 1 }],
    } },
    shade: { drone: 35, bellTonic: 71, scale: [0, 2, 3, 5, 7, 8, 10], stay: [4, 7], enter: 'Bm9', chords: {     // B minor: the darker stretch
      'Bm9':       [C('B', 'D', 'F#', 'A', 'C#'), { 'Em11': 3, 'Gmaj9': 3, 'F#m11': 1 }],
      'Em11':      [C('E', 'G', 'B', 'D', 'A'),   { 'Bm9': 3, 'F#m11': 2, 'Gmaj9': 1 }],
      'Gmaj9':     [C('G', 'B', 'D', 'F#', 'A'),  { 'Bm9': 3, 'Em11': 2, 'F#m11': 1 }],
      'F#m11':     [C('F#', 'A', 'C#', 'E', 'B'), { 'Bm9': 3, 'Gmaj9': 2 }],
    } },
    lift: { drone: 33, bellTonic: 69, scale: [0, 2, 4, 5, 7, 9, 11], stay: [4, 7], enter: 'Amaj9', chords: {    // A major: a little more light
      'Amaj9':     [C('A', 'C#', 'E', 'G#', 'B'), { 'Dmaj7#11': 3, 'F#m9': 3, 'Esus': 1 }],
      'Dmaj7#11':  [C('D', 'F#', 'A', 'C#', 'G#'),{ 'Amaj9': 3, 'Esus': 2, 'F#m9': 1 }],
      'F#m9':      [C('F#', 'A', 'C#', 'E', 'G#'),{ 'Dmaj7#11': 3, 'Amaj9': 2 }],
      'Esus':      [C('E', 'A', 'B', 'F#', 'C#'), { 'Amaj9': 3, 'Dmaj7#11': 1 }],
    } },
  };
  const pickWeighted = w => { const e = Object.entries(w); let r = rnd() * e.reduce((a, [, v]) => a + v, 0); for (const [k, v] of e) if ((r -= v) < 0) return k; return e[0][0]; };
  const randInt = ([a, b]) => a + Math.floor(rnd() * (b - a + 1));

  let region = 'home', regionLeft = randInt(REGIONS.home.stay), lastAway = rnd() < 0.5 ? 'lift' : 'shade';
  let chordName = null, beforeLast = null, prevUpper = [57, 64, 66, 73];

  // all four-note voicings of the upper pitch classes in 52..76, scored by movement from the last
  function voice(upperPcs) {
    const opts = upperPcs.map(p => { const o = []; for (let m = 52; m <= 76; m++) if (m % 12 === p) o.push(m); return o; });
    let best = null, bestCost = Infinity;
    const walk = (i, acc) => {
      if (i === opts.length) {
        const v = [...acc].sort((a, b) => a - b);
        for (let k = 1; k < v.length; k++) if (v[k] - v[k - 1] < 2) return;           // no semitone rubs, no unisons
        if (v[v.length - 1] - v[0] > 21) return;                                       // keep it a hand's span-ish
        const centre = v.reduce((a, b) => a + b, 0) / v.length;
        const cost = v.reduce((a, m, k) => a + Math.abs(m - prevUpper[k]), 0) + Math.abs(centre - 64) * 0.6 + rnd() * 1.5;
        if (cost < bestCost) { bestCost = cost; best = v; }
        return;
      }
      for (const m of opts[i]) walk(i + 1, [...acc, m]);
    };
    walk(0, []);
    return best;
  }
  function nextChord(t0) {
    if (regionLeft <= 0) {
      const to = region === 'home' ? (lastAway = lastAway === 'lift' ? (rnd() < 0.7 ? 'shade' : 'lift') : (rnd() < 0.7 ? 'lift' : 'shade')) : 'home';
      region = to; regionLeft = randInt(REGIONS[to].stay); beforeLast = null; chordName = REGIONS[to].enter;
      moveDrone(REGIONS[to].drone, t0); log('region', t0, to);
    } else {
      // weighted move, but going straight back to the chord before last is discouraged (no ping-pong)
      if (!chordName) { chordName = REGIONS[region].enter; } else {
      const w = { ...REGIONS[region].chords[chordName][1] };
      if (beforeLast in w && Object.keys(w).length > 1) w[beforeLast] *= 0.25;
      const prev = chordName; chordName = pickWeighted(w); beforeLast = prev; }
    }
    regionLeft--;
    const ch = REGIONS[region].chords[chordName][0];
    const upper = voice(ch.upper);
    const bass = 40 + ((ch.root - 4) % 12 + 12) % 12;                                  // root in E2..D#3, above the drone
    prevUpper = upper;
    return { name: chordName, notes: [bass, ...upper] };
  }

  // uneven chord lengths: mostly a slow 12-17 s, sometimes a quicker turn, now and then a long hold
  function chordStep() {
    return rnd() < 0.2 ? 9.5 + rnd() * 2 : 12 + rnd() * 5;   // mostly 12-17 s, sometimes a quicker turn
  }

    let nextChordAt = 0, nextBellAt = 0, lastFigureAt = -99;
  const farBellTimes = [];

  function playChord(notes, t0, step) {
    const len = step + 5 + rnd() * 2, att = Math.min(6.5, step * 0.5), rel = Math.min(8, len - att - 1);
    notes.forEach((m, i) => {
      [-1, 1].forEach(side => {
        const o = ctx.createOscillator(); o.type = i === 0 || side > 0 ? 'sine' : 'triangle';
        o.frequency.value = mtof(m); o.detune.value = side * (1 + rnd() * 1.5);
        const g = ctx.createGain(); const peak = (i === 0 ? 0.05 : 0.026) * (0.8 + rnd() * 0.4);
        g.gain.setValueAtTime(0, t0);
        g.gain.linearRampToValueAtTime(peak, t0 + att + rnd() * 2);
        g.gain.setValueAtTime(peak, t0 + len - rel);
        g.gain.linearRampToValueAtTime(0, t0 + len);
        const p = ctx.createStereoPanner(); p.pan.value = side * (0.15 + 0.12 * i);
        o.connect(g).connect(p).connect(padBus);
        o.start(t0); o.stop(t0 + len + 0.1);
      });
    });
    return att;
  }
  function bell(t0, m, lvl = 1) {
    [1, 2.0, 3.01].forEach((ratio, k) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = mtof(m) * ratio;
      const g = ctx.createGain(); const peak = [0.009, 0.0028, 0.0008][k] * lvl;
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(peak, t0 + 0.06);
      g.gain.exponentialRampToValueAtTime(0.00001, t0 + 5 - k);
      const p = ctx.createStereoPanner(); p.pan.value = rnd() * 1.4 - 0.7;
      const dry = ctx.createGain(); dry.gain.value = 0.12;
      o.connect(g).connect(p); p.connect(rev); p.connect(dry).connect(master);
      o.start(t0); o.stop(t0 + 5.2);
    });
  }
  // far bell: one note, or a short phrase of two or three — rising, falling, or up-and-back.
  // Notes come from the chord that's sounding, so phrases always sit in the harmony.
  function farBell(t0, notes) {
    const pcs = new Set(notes.map(m => m % 12));
    const pool = []; for (let m = 72; m <= 88; m++) if (pcs.has(m % 12)) pool.push(m);
    const r = rnd(), n = r < 0.45 ? 1 : r < 0.8 ? 2 : 3;
    const shapes = n === 1 ? [[0]] : n === 2 ? [[0, 1], [0, -1], [0, 2], [0, -2]] : [[0, 1, 2], [0, -1, -2], [0, 2, 1], [0, 1, -1], [0, -1, 1]];
    const shape = shapes[Math.floor(rnd() * shapes.length)];
    const lo = -Math.min(...shape), hi = pool.length - 1 - Math.max(...shape);
    const base = lo + Math.floor(rnd() * Math.max(1, hi - lo + 1));
    let t = t0;
    shape.forEach((d, k) => {
      bell(t, pool[Math.max(0, Math.min(pool.length - 1, base + d))], 1 - k * 0.15);
      t += 1.0 + rnd() * 0.7;
    });
    return n;
  }
  // a closer, brighter chime: quick strike, short ring, a little sparkle in the upper partials
  function chime(t0, m, peak, dur, panPos) {
    [[1, 1], [2.0, 0.32], [3.0, 0.12], [4.07, 0.05]].forEach(([ratio, amt], k) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = mtof(m) * ratio;
      o.detune.value = (rnd() - 0.5) * 4;
      const g = ctx.createGain(); const pk = peak * amt; const d = dur / (1 + k * 0.7);
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(pk, t0 + 0.008);
      g.gain.exponentialRampToValueAtTime(0.00001, t0 + d);
      const p = ctx.createStereoPanner(); p.pan.value = panPos;
      const dry = ctx.createGain(); dry.gain.value = 0.5;
      o.connect(g).connect(p); p.connect(rev); p.connect(dry).connect(master);
      o.start(t0); o.stop(t0 + d + 0.1);
    });
  }
  // two (sometimes three) notes from the chord that's sounding, an octave or two up.
  // The first rings on under the second.
  function figure(notes, t0) {
    const pcs = new Set(notes.map(m => m % 12));
    const pool = []; for (let m = 74; m <= 91; m++) if (pcs.has(m % 12)) pool.push(m);
    if (pool.length < 2) return;
    let i = 1 + Math.floor(rnd() * (pool.length - 2));
    const n = rnd() < 0.25 ? 3 : 2, dir = rnd() < 0.6 ? -1 : 1;
    let t = t0, pan = rnd() * 0.8 - 0.4;
    for (let k = 0; k < n; k++) {
      chime(t, pool[i], 0.011 * (k === 0 ? 1 : 0.8), k === 0 ? 4.2 : 2.8, pan);
      i = Math.max(0, Math.min(pool.length - 1, i + dir * (1 + (rnd() < 0.3 ? 1 : 0))));
      t += 0.45 + rnd() * 0.4; pan += dir * 0.15;
    }
  }
  // ---- the bell's songbook ----------------------------------------------------------------------
  // Scale steps from the key's tonic (0 = D5 in the home key; negatives dip below): [step, beats to next].
  // Written to sing rather than climb: leaps of a sixth or octave, notes that lean and resolve,
  // repeated notes, falling thirds, long-short rhythms, and one longer line with a breath in it.
  const PHRASES = {
    A:       [[2, 1], [3, 1], [4, 1.4], [7, 0]],                                        // the look up (kept)
    A_wide:  [[-3, 0.6], [2, 1.3], [4, 1.5], [7, 1.7], [6, 0.45], [7, 0]],              // a sixth up from below, then the reach
    B:       [[8, 1.6], [7, 0.9], [4, 1.0], [5, 1.7], [4, 0]],                          // leans in from above, settles
    arc:     [[0, 0.7], [4, 0.7], [9, 1.9], [8, 0.55], [7, 1.2], [4, 0]],               // the rainbow: wide arpeggio up, drifting down
    thirds:  [[9, 0.95], [7, 0.95], [8, 0.95], [6, 0.95], [7, 1.7], [4, 0]],            // falling thirds, like bells in a tower
    lullaby: [[4, 0.55], [4, 0.6], [5, 1.5], [4, 0.9], [2, 1.7], [1, 0.55], [2, 0]],    // repeated note, a rock, a little dip
    longline:[[2, 0.9], [4, 0.5], [7, 1.9], [6, 0.6], [5, 0.6], [4, 2.6],               // ...a breath...
              [2, 0.5], [1, 0.5], [-1, 1.4], [0, 0]],                                   // then a low, home-going tail
    turn:    [[5, 0.35], [4, 0.35], [5, 1.6], [9, 1.3], [7, 0]],                        // a small ornament, then up a fifth
    octave:  [[0, 1.7], [7, 0]],                                                        // plain octave, wide open
    sigh:    [[5, 1.9], [4, 0]],                                                        // a note that leans, then lets go
    sigh_hi: [[8, 2.0], [7, 0]],                                                        // the same, higher (E to D)
    sigh_lo: [[3, 1.9], [2, 0]],                                                        // and lower (G to F#)
  };
  // a loose form; each slot picks one of its options. 'one' = a single far bell, 'rest' = silence
  const FORM = [['one'], ['sigh', 'sigh_hi'], ['A', 'A_wide'], ['rest'], ['sigh_lo', 'octave'], ['B'], ['rest'],
                ['one', 'sigh_hi'], ['arc', 'lullaby'], ['rest'], ['sigh', 'sigh_lo'], ['rest'], ['A', 'thirds'],
                ['sigh_hi', 'one'], ['rest'], ['longline', 'turn'], ['rest'], ['sigh', 'sigh_lo', 'sigh_hi']];
  let formPos = 0, nextPhraseAt = 0;
  function degToMidi(R, d) { return R.bellTonic + R.scale[((d % 7) + 7) % 7] + 12 * Math.floor(d / 7); }
  function realise(phrase, ch) {
    const R = REGIONS[ch.region], tones = new Set(ch.notes.map(n => n % 12)), root = ch.notes[0] % 12;
    const isTone = m => tones.has(m % 12);
    const rubs = m => !isTone(m) && [...tones].some(q => { const d = ((m - q) % 12 + 12) % 12; return d === 1 || d === 11; });
    // try diatonic shifts so the phrase sits on this chord (a melodic sequence), prefer staying put
    let best = null, bestScore = -1e9;
    for (let sh = -3; sh <= 3; sh++) {
      const ms = phrase.map(([d]) => degToMidi(R, d + sh));
      if (Math.min(...ms) < 66 || Math.max(...ms) > 90) continue;
      const last = ms[ms.length - 1];
      let score = -1.3 * Math.abs(sh) + (isTone(last) ? 3 : -3) + ((last - root) % 12 === 0 ? 1 : 0);
      ms.forEach((m, i) => { if (rubs(m)) { const passing = i > 0 && i < ms.length - 1 && phrase[i][1] <= 1.1; score -= passing ? 0.5 : 2.5; } });
      score += rnd() * 0.8;
      if (score > bestScore) { bestScore = score; best = ms; }
    }
    if (!best) best = phrase.map(([d]) => degToMidi(R, d));
    // tidy anything still rubbing that isn't a quick passing note
    return best.map((m, i) => {
      const passing = i > 0 && i < best.length - 1 && phrase[i][1] <= 1.1;
      if (!rubs(m) || passing) return m;
      for (const dx of [1, -1, 2, -2, 3, -3]) if (isTone(m + dx)) return m + dx;
      return m;
    });
  }
  function singPhrase(name, t0, ch) {
    const phrase = PHRASES[name], ms = realise(phrase, ch), beat = 0.85 + rnd() * 0.2;
    const hi = Math.max(...ms), lo = Math.min(...ms);
    let t = t0;
    ms.forEach((m, i) => {
      const lift = hi === lo ? 1 : 0.8 + 0.3 * (m - lo) / (hi - lo);      // a little louder at the top of the line
      bell(t + (rnd() - 0.5) * 0.08, m, lift * (i === ms.length - 1 ? 0.9 : 1));
      log('note', t, m);
      t += phrase[i][1] * beat * (i >= ms.length - 3 ? 1.12 : 1);
    });
    return t - t0;
  }
  function phraseLen(name) { return PHRASES[name].reduce((a, [, b]) => a + b, 0) * 0.95; }
  function scheduleMelody(ch, step) {
    if (nextPhraseAt > ch.t + step - 4) return;
    const opts_ = FORM[formPos % FORM.length], name = opts_[Math.floor(rnd() * opts_.length)];
    formPos++;
    if (name === 'rest') { nextPhraseAt = ch.t + step + 6 + rnd() * 8; log('rest', ch.t); return; }
    const len = name === 'one' ? 0 : phraseLen(name);
    const t0 = Math.max(nextPhraseAt, Math.min(ch.t + 2 + rnd() * 2, ch.t + step - len + 1.5));
    if (name === 'one') {
      const R = REGIONS[ch.region], pool = [];
      for (let m = 72; m <= 88; m++) if (ch.notes.some(n => n % 12 === m % 12)) pool.push(m);
      bell(t0, pool[Math.floor(rnd() * pool.length)], 1); log('note', t0, -1);
      nextPhraseAt = t0 + 9 + rnd() * 7;
    } else {
      const dur = singPhrase(name, t0, ch); log('phrase', t0, name);
      nextPhraseAt = t0 + dur + 8 + rnd() * 7;
    }
    farBellTimes.push(t0);
  }
  function scheduleUntil(t) {
    while (nextChordAt < t) {
      const step = chordStep(), c = nextChord(nextChordAt);
      const att = playChord(c.notes, nextChordAt, step);
      log('chord', nextChordAt, c.name + ' ' + c.notes.join(','));
      scheduleMelody({ t: nextChordAt, notes: c.notes, region }, step);
      // once the chord has bloomed, maybe let a chime answer it; never near the far bell or another chime
      const ft = nextChordAt + att + 0.5 + rnd() * Math.max(0.5, Math.min(3, step - att - 1.5));
      const clear = farBellTimes.every(b => Math.abs(b - ft) > 5);
      if ((opts.chimes ?? false) && rnd() < 0.4 && clear && ft - lastFigureAt > 24) { figure(c.notes, ft); lastFigureAt = ft; log('chime', ft); }
      nextChordAt += step;
    }
  }

  let timer = null, started = false;
  return {
    master,
    start(fade = 5) {
      const t = ctx.currentTime;
      if (!started) {
        started = true; nextChordAt = t + 0.05; nextPhraseAt = t + 6 + rnd() * 4;
        [lfo, drone, droneLfo, air, airLfo, panLfo].forEach(n => n.start(t));
      }
      master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(opts.level ?? 0.6, t + fade);
      if (opts.offline) scheduleUntil(opts.offline);
      else { scheduleUntil(t + 20); clearInterval(timer); timer = setInterval(() => scheduleUntil(ctx.currentTime + 20), 2000); }
    },
    stop(fade = 2.5) {
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(0, t + fade);
    },
  };
}
