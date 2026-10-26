# Dream Atlas: ambient sound brief

Paste this into a new chat and attach `ambience.js` (and `ambience-preview.m4a` if you like).

## What Dream Atlas is

A personal dream journal drawn as a living night sky. Each dream is a star: colour is the feeling, brightness is how vivid it was, and dreams with shared recurring motifs gather into soft nebulae. It's a single HTML page using three.js. Look and feel: painterly, slow, generous darkness, "a fireplace, not an app". It avoids neon, sci-fi HUDs and anything gamey. There's an ambient mode that works like a screensaver.

## The goal

A super-subtle ambient bed: present, but easy to forget. Something you could meditate to, or that helps you recall the dream you're writing down. "Not quite song": a soft harmonic bed, with far-off bells that sometimes sing a short, remembered melody, like a childhood memory of looking at a rainbow. Comfortable for hours, never loops audibly, no sound effects.

## What exists: `ambience.js` (v8, 25 Oct 2026)

Generative Web Audio. No audio files, nothing to download.

- **Pad:** open chords, each a bass root plus four upper voices. Every chord is re-voiced to sit as close as possible to the last one, so a change feels like a slow turn rather than a swap. Each note is a sine/triangle pair with only a touch of detune (lots of detune read as warble).
- **Harmony:** weighted chord moves rather than random picks (e.g. Asus2 usually goes home to Dmaj9), and it avoids rocking straight back to the chord before last.
  - Home key is **D** (Dmaj9, Bm11, Gmaj7#11, Asus2, Em9). Every 2–3 min it drifts for 4–7 chords to **shade** (B minor, darker) or **lift** (A major, a little brighter), then comes home.
  - The drone fades out and back in on the new key's root.
- **Timing:** chords last 12–17 s, sometimes a quicker 9.5–11.5 s turn. Long holds of 19 s and up were cut because they got warbly. Attack and overlap stretch to fit.
- **Filter:** pad low-pass at about 820 Hz, breathing ±210 Hz on a 32 s cycle.
- **Air:** pink noise through a wandering band-pass. Kept very low (0.009, halved again after hearing it in the app).
- **Bells (the melody):** a far-off three-partial sine bell, set well back (mostly reverb, very little direct sound), like stars flickering on in the distance. They follow a small songbook in a loose form:
  - single bells, and the two-note **sighs** (a note that leans, then lets go). Jarred likes these most: keep them common.
  - the home motif F#–G–A→D ("the look up") and a variant that starts a sixth below;
  - an answer that leans in from above and settles;
  - "arc" (a wide arpeggio up, drifting down), "lullaby" (repeated notes), falling thirds, a small ornament, an open octave, and a ten-note "long line" with a breath in the middle;
  - rests.
  - Each slot in the form picks from a few options. Phrases shift up or down the scale to fit whatever chord they land on (a melodic sequence), so they always sit in the harmony and follow the key into minor or major. The last few notes of each phrase slow slightly.
  - One cycle of the form takes several minutes. Phrases are spaced 8–15 s apart, with longer rests.
- **Chimes:** a closer, brighter two-note chime still exists in the code but is **off** (`chimes: true` turns it on). The bells carry the melody now.
- **Reverb:** a generated 7 s dark hall. It's built from a fixed seed (`roomSeed`, default 5) so the room sounds and sits the same on every load. An unseeded room varied up to 7 dB between loads. The reverb send is high-passed at 140 Hz so the bass stays dry and even.
- **Levels:** master 0.45 (lowered from 0.6 once heard in the app), about −30 dB RMS, peaks around −14 dB. Nothing above 3 kHz.
- **API:** `makeAmbience(ctx, { seed, level, out, offline, roomSeed, chimes, log })` returns `{ start(fade), stop(fade), master }`. `offline` (seconds) schedules everything up front for rendering with an `OfflineAudioContext`. `log(kind, time, detail)` reports chords, phrases, notes and key changes, which helps line up feedback with timestamps.

## What was tried and dropped

- **Eno-style phrase loops** (v5): four soft-piano phrases on loops of unequal length (21, 27, 33, 39 s) drifting in and out of phase. Jarred preferred the v4 space without them.
- **The first six-note phrases** were too stepwise ("do-re-mi", staircasey). The current songbook leans on leaps, leaning notes, repeated notes and rhythm instead.

## How previews are made

Render 2–3 min with an `OfflineAudioContext` in headless Chromium (Playwright), save the PCM, and check it numerically (clipping, clicks, RMS per 15 s, spectral centroid, energy above 3 kHz). Then encode to m4a with ffmpeg. The assistant can't hear the result, so Jarred listens and describes what he hears by timestamp. Use the `log` hook to map timestamps to phrases.

## Planned in-app behaviour (not built yet)

- A tiny waveform toggle in the toolbar: five thin bars that sit as flat dots when off and ripple slowly when on.
- Off by default, since browsers need a tap before playing audio. It remembers the choice, keeps playing in ambient mode, and fades out when the tab is hidden.
- Later, maybe: harmony or texture that responds to the sky (the mix of feelings in your dreams), or to ambient mode. Only if it stays subtle.
