/* Dream Atlas ambience: generative, no audio files. A slow pad that drifts between open chords,
   a low drone, a breath of filtered air, and the occasional far-off bell. Never loops audibly. */
function makeAmbience(ctx, opts = {}) {
  const seed = opts.seed ?? 7;
  let s = seed >>> 0;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

  const master = ctx.createGain(); master.gain.value = 0;
  master.connect(opts.out || ctx.destination);

  // reverb: a long, dark, generated hall
  const rev = ctx.createConvolver();
  {
    const len = Math.floor(ctx.sampleRate * 7), b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch); let lp = 0;
      for (let i = 0; i < len; i++) { const t = i / len; lp += (Math.random() * 2 - 1 - lp) * (0.22 - 0.17 * t); d[i] = lp * Math.pow(1 - t, 2.6); }
    }
    rev.buffer = b;
  }
  const revOut = ctx.createGain(); revOut.gain.value = 0.9; rev.connect(revOut).connect(master);

  // pad bus with a slowly breathing low-pass
  const padBus = ctx.createGain(); padBus.gain.value = 1;
  const padLP = ctx.createBiquadFilter(); padLP.type = 'lowpass'; padLP.frequency.value = 820; padLP.Q.value = 0.4;
  const lfo = ctx.createOscillator(); lfo.frequency.value = 0.031;
  const lfoAmt = ctx.createGain(); lfoAmt.gain.value = 320; lfo.connect(lfoAmt).connect(padLP.frequency);
  padBus.connect(padLP);
  const padDry = ctx.createGain(); padDry.gain.value = 0.55; padLP.connect(padDry).connect(master);
  const padWet = ctx.createGain(); padWet.gain.value = 0.7; padLP.connect(padWet).connect(rev);

  // drone
  const drone = ctx.createOscillator(); drone.type = 'sine'; drone.frequency.value = mtof(38);
  const droneG = ctx.createGain(); droneG.gain.value = 0.05;
  const droneLfo = ctx.createOscillator(); droneLfo.frequency.value = 0.017;
  const droneLfoAmt = ctx.createGain(); droneLfoAmt.gain.value = 0.02; droneLfo.connect(droneLfoAmt).connect(droneG.gain);
  drone.connect(droneG); droneG.connect(master); droneG.connect(rev);

  // air: pink noise through a wandering band-pass, panned slowly
  const nb = ctx.createBuffer(2, ctx.sampleRate * 6, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = nb.getChannelData(ch); let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; b0 = 0.99765 * b0 + w * 0.099; b1 = 0.963 * b1 + w * 0.2965; b2 = 0.57 * b2 + w * 1.0526; d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.18; }
  }
  const air = ctx.createBufferSource(); air.buffer = nb; air.loop = true;
  const airBP = ctx.createBiquadFilter(); airBP.type = 'bandpass'; airBP.frequency.value = 520; airBP.Q.value = 0.6;
  const airLfo = ctx.createOscillator(); airLfo.frequency.value = 0.023;
  const airLfoAmt = ctx.createGain(); airLfoAmt.gain.value = 300; airLfo.connect(airLfoAmt).connect(airBP.frequency);
  const airG = ctx.createGain(); airG.gain.value = 0.05;
  const pan = ctx.createStereoPanner(); const panLfo = ctx.createOscillator(); panLfo.frequency.value = 0.011;
  const panAmt = ctx.createGain(); panAmt.gain.value = 0.5; panLfo.connect(panAmt).connect(pan.pan);
  air.connect(airBP).connect(airG).connect(pan); pan.connect(master); pan.connect(rev);

  // open, unresolved chords (D lydian-ish), wandered between without repeating
  const CHORDS = [
    [50, 57, 64, 66, 73],  // Dmaj9
    [47, 54, 57, 62, 64],  // Bm11
    [43, 50, 54, 57, 61],  // Gmaj7#11
    [45, 52, 57, 59, 64],  // Asus2 add11
    [40, 47, 54, 57, 62],  // Em9 (open)
  ];
  const BELLS = [74, 76, 78, 81, 83, 86];
  const CH_LEN = 19, CH_STEP = 14, ATT = 6.5, REL = 8;
  let nextChordAt = 0, lastChord = -1, nextBellAt = 0;

  function playChord(notes, t0) {
    notes.forEach((m, i) => {
      [-1, 1].forEach(side => {
        const o = ctx.createOscillator(); o.type = i === 0 ? 'sine' : 'triangle';
        o.frequency.value = mtof(m); o.detune.value = side * (4 + rnd() * 5);
        const g = ctx.createGain(); const peak = (i === 0 ? 0.05 : 0.026) * (0.8 + rnd() * 0.4);
        g.gain.setValueAtTime(0, t0);
        g.gain.linearRampToValueAtTime(peak, t0 + ATT + rnd() * 2);
        g.gain.setValueAtTime(peak, t0 + CH_LEN - REL);
        g.gain.linearRampToValueAtTime(0, t0 + CH_LEN);
        const p = ctx.createStereoPanner(); p.pan.value = side * (0.15 + 0.12 * i);
        o.connect(g).connect(p).connect(padBus);
        o.start(t0); o.stop(t0 + CH_LEN + 0.1);
      });
    });
  }
  function bell(t0) {
    const m = BELLS[Math.floor(rnd() * BELLS.length)];
    [1, 2.0, 3.01].forEach((ratio, k) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = mtof(m) * ratio;
      const g = ctx.createGain(); const peak = [0.018, 0.006, 0.0025][k];
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(peak, t0 + 0.06);
      g.gain.exponentialRampToValueAtTime(0.00001, t0 + 5 - k);
      const p = ctx.createStereoPanner(); p.pan.value = rnd() * 1.4 - 0.7;
      const dry = ctx.createGain(); dry.gain.value = 0.25;
      o.connect(g).connect(p); p.connect(rev); p.connect(dry).connect(master);
      o.start(t0); o.stop(t0 + 5.2);
    });
  }
  function scheduleUntil(t) {
    while (nextChordAt < t) {
      let c; do { c = Math.floor(rnd() * CHORDS.length); } while (c === lastChord);
      lastChord = c; playChord(CHORDS[c], nextChordAt); nextChordAt += CH_STEP;
    }
    while (nextBellAt < t) { bell(nextBellAt); nextBellAt += 16 + rnd() * 26; }
  }

  let timer = null, started = false;
  return {
    master,
    start(fade = 5) {
      const t = ctx.currentTime;
      if (!started) {
        started = true; nextChordAt = t + 0.05; nextBellAt = t + 9 + rnd() * 8;
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
