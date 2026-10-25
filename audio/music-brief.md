# Dream Atlas: ambient sound brief

Paste this into a new chat and attach `ambience.js` (and `dream-atlas-ambience-preview.m4a` if you like).

## What Dream Atlas is

A personal dream journal drawn as a living night sky. Each dream is a star: colour is the feeling, brightness is how vivid it was, and dreams with shared recurring motifs gather into soft nebulae. It's a single HTML page using three.js. Look and feel: painterly, slow, generous darkness, "a fireplace, not an app". It avoids neon, sci-fi HUDs and anything gamey. There's an ambient mode that works like a screensaver.

## The goal

A super-subtle ambient bed to round out the space: a music bed plus some atmosphere, with no sound effects for now. It should be comfortable for hours, never loop audibly, and stay quiet enough to sit under everything.

## What exists so far: `ambience.js`

Generative audio built with the browser's Web Audio API. No audio files, and nothing extra to download.

- **Pad:** open, unresolved chords in D (Dmaj9, Bm11, Gmaj7#11, Asus2add11, Em9). A new chord comes in every 14 s and lasts 19 s, with a 6.5 s attack and an 8 s release, so they always overlap. Each note is two detuned oscillators (sine for the root, triangle above), panned slightly apart.
- **Filter:** the pad runs through a low-pass at about 820 Hz that breathes ±320 Hz on a 32-second cycle.
- **Drone:** a low D (MIDI 38) sine at very low level, with a slow volume swell.
- **Air:** pink noise through a wandering band-pass (about 520 Hz ±300) that pans slowly. It reads as wind or space.
- **Bell:** an occasional far-off bell, every 16 to 42 s, from a D-major pentatonic set. Three sine partials, strongly reverbed.
- **Reverb:** a generated 7-second dark impulse response.
- **Levels:** master level 0.6, which renders at about −28 dB RMS. It's dark and quiet; nearly no energy above 3 kHz.
- **API:** `makeAmbience(ctx, { seed, level, out, offline })` returns `{ start(fade), stop(fade), master }`. In `offline` mode it schedules everything up front, so it can be rendered with an `OfflineAudioContext` to a WAV for listening.

## How previews are made

Render 60–90 s with an OfflineAudioContext in headless Chromium (Playwright), save it as a WAV, check it numerically (clipping, clicks, spectral centroid, energy above 3 kHz, RMS per 10 s), then encode to m4a with ffmpeg. The assistant can't hear the result, so Jarred listens and describes what he hears; plain words like "too new-age", "colder", "more distant" or "warmer like tape" get translated into settings.

## Planned in-app behaviour (not built yet)

- A tiny waveform toggle in the toolbar: five thin bars that sit as flat dots when off and ripple slowly when on.
- Off by default, since browsers need a tap before playing audio. It remembers the choice, keeps playing in ambient mode, and fades out when the tab is hidden.
- Later, maybe: harmony or texture that responds to the sky, like the mix of feelings in your dreams, or ambient mode. Only if it stays subtle.

## Where it's at

The first preview hasn't had feedback yet. Start by listening to it, then iterate on tone, harmony, density and space. A real instrument (a few stretched piano or cello samples) is an option if pure synthesis tops out.
