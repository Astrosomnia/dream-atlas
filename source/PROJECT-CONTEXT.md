# Dream Atlas: project context

Last updated 25 Oct 2026 (version 0.23).

## What it is

A personal dream journal drawn as a living, explorable night sky. Each dream is a star:
- **colour** is the feeling;
- **brightness** is vividness;
- **diffraction spikes** mean the dream was lucid.

Dreams that share recurring motifs gather into soft nebulae. Recent dreams sit near the core and older regions drift outward. It's personal first, with possibly wider sharing later. The owner is Jarred (GitHub: Astrosomnia).

The guiding principles:
- **Effortless:** capture in under 30 seconds, half-asleep.
- **Alive:** the sky reorganises itself.
- **Perceptive:** it notices patterns, always shows its evidence, and never interprets.

"Emergent, not administered": changes apply on their own and glide into place, with no approval screens.

## Where things live

- **Claude version:** the artifact at claude.ai/artifact/S289baJBxSCzvqjqb2ywyW. Capabilities: sample, db, user, downloads. Storage is private per user, with localStorage as a fallback.
- **Public site:** astrosomnia.github.io/dream-atlas (repo Astrosomnia/dream-atlas, `index.html` plus `og.jpg`). Dreams stay in the visitor's browser. No login.
- **Relay:** a Cloudflare Worker at dream-atlas.jarredpowell88.workers.dev (`worker.js`).
  - It tags dreams with `claude-haiku-5-5` and answers Astronomer questions with `claude-sonnet-5-5`.
  - It builds prompts server-side, only accepts requests from the GitHub Pages origin, and keeps the API key only as the Cloudflare secret `ANTHROPIC_API_KEY`.
  - Jarred pastes updates in by hand. The latest version (Astronomer ask mode, the new tagging rules, max_tokens 4000 with a retry) needed pasting as of 24 Oct.
- **Roadmap doc:** claude.ai/artifact/Mh45DGRcRymq1hs2zrz54Q. Five phases, 16 features.
- **Claude Code handoff folder:** CLAUDE.md, KICKOFF.md, brief v1.2, the prototype, and demo data. The port to a proper codebase is still to come.
- **Labs:** standalone test pages for single components, kept in the chat and never pushed live. The first is `region-title-lab.html`.

## Source of truth: the GitHub repo

Everything a new chat needs is in `Astrosomnia/dream-atlas`. Clone it first.

- `index.html`: the public site, served by GitHub Pages.
- `source/dream-atlas-claude.html`: the Claude version. Publish it to the artifact URL above, and read the live artifact first in case it's newer.
- `source/worker.js`: the Cloudflare Worker. Keep it in step with what's deployed. Jarred pastes it in by hand.
- `source/PROJECT-CONTEXT.md`: a copy of this doc.
- `labs/`: component test pages. `audio/`: `ambience.js`, the music brief and a preview render.

After each batch, commit both builds and the worker together, and update this doc in both the project and the repo.

## The two builds

The Claude version and `index.html` are the same code with a few differences. The Claude version uses claude.ai's `sample` and `db`. The public site uses `useCap()` returning null, `callTagger` and `askClaude` posting to the worker, and OG meta tags. `tagDream()` and `askClaude()` hide the difference from the rest of the code. Every change is applied to both. The version string sits in the How to Read panel ("Version 0.xx · date").

## Data model (one dream)

- **Core:** id, date (the night of), createdAt, text (always the original), tidied (optional spelling-only copy).
- **Reading:** title, feel, vivid (1–5), lucid.
- **Tags:** motifs (the first is the home and decides placement), motifLabels, motifNear, people, places, objects, details, themes, suggested.
- **Provenance:** tagger (claude / claude+you / you / none), editedAt, analysedAt.

The rules that govern placement and links:
- Only motifs decide where a star sits.
- People, places and things create the visible connections.
- Anonymous people and everyday scenery (guy, someone, hill, trees…) never create links.

## Feelings (colour)

Wonder `#74d7cf` · Joy `#f3e08f` · Longing `#df9fb2` · Sadness `#7f9fe0` · Calm `#a3d4a0` · Unease `#e5935c` · Fear `#9c8be2`.

The feeling is the dream's overall tone. Calm doubles as "peaceful or ordinary". Recurring dream mechanics, like legs that won't run, belong in motifs rather than the feeling.

## What's built (v0.23)

- Capture: text plus voice dictation, which merges Android's cumulative results. The mic sits inside the text box, gold while it's empty.
- Claude tagging with a supernova arrival. The spelling tidy is a setting, with the original always kept.
- Tag editor with a home motif, and gliding re-placement.
- Smart search: synonyms, categories, months, years, lucid, feelings, stemming.
- Feeling filter: tap the feeling under a dream's title, or a swatch.
- Search capsule, bottom left, cleared with its ×.
- Leafing through dreams: swipe on a phone, arrows and arrow keys on desktop. It moves chronologically within whatever is lit.
- **The Astronomer, in the search field ("Search or ask").** Questions get a "✦ Ask the Astronomer ↵" hint. The answer shows in the panel and lights up the cited dreams, and you can leaf through just those. Closing it returns to the full sky.
- Re-analyse card and backup export and import, in How to Read.
- Nebulae repaint after phone GPU resets, and the sky holds still under the phone keyboard.

## Agreed next build (not started)

1. **Moments replace details, themes and noticed.**
   - Short canonical lowercase tags for significant events and states: crying, dying, drowning, kissing, nakedness.
   - They link dreams but don't place stars. Claude reuses the existing list.
   - Each word appears in exactly one place per dream, and connections match on the word whatever its type.
   - Suggestions arrive with their type (person, place, thing or moment), not always "thing".
2. **Sharper motif rules.**
   - Recurring situations at the level likely to repeat, preferring situations over settings. One-off images aren't motifs.
   - A list of common dream motifs to prefer when they fit: falling, flying, being chased, death and dying, drowning, nakedness in public, teeth, lost, late, exams, water, houses, vehicles out of control, people who've died.
   - Add child, baby and kid to the anonymous-people list.
3. **Live nebulae.**
   - When a moment reaches three dreams, a small Claude call decides on a new region, its name and its members.
   - The arrival happens every time a nebula forms, however it forms. It lasts about three seconds and any tap skips it:
     - the nebula flares bright, like a mini supernova, then cools;
     - the stars glide together;
     - the label writes in place as large, wide-spaced, glowing mono caps, then draws together into a normal label;
     - the camera eases out only if the nebula is off-screen.
   - Still to decide, in the lab: the cartographic hairline rules on or off, and queued versus simultaneous arrivals.
   - Related regions sit together naturally (drowning beside water).
4. **Hand-set homes.** Re-analysing existing regions never moves them. A newly formed region can claim one. If Jarred moves it back, that sticks for good.
5. **Re-analyse.**
   - Batches of six to eight dreams per call (from about a minute to about 15 seconds).
   - Offered only on evidence: tags added since the last run that older dreams mention in their text without being tagged.
   - Uses the slim capsule (design B) with a stroked button. The copy is "Your sky has grown. Seek connections anew?", with "Weaving new threads…" while it runs.
   - No Undo anywhere.
6. **The "new threads" reveal**, after Re-analyse or a new region.
   - A header at the top: a large gold numeral with *new threads* centred against it, smaller than the first mock-up, with no box and no note.
   - The changed dreams are lit, and the tags they gained are gold until the reveal is cleared.
   - Leafing is grouped by shared thread, larger groups first and chronological within each group. That's the only exception to date order.
   - The first tap on the sky closes the panel; the second clears the reveal.
7. **Search:** wider synonyms ("kissing" finds "making out").
8. **Housekeeping:** one worker paste for all of it, and update the brief's "quiet record and undo" line to match "no undo".

## Later and roadmap

- Music and ambience, in its own thread. There's a brief plus `ambience.js`, a generative Web Audio pad, drone, air and bell. The toggle will be a waveform icon.
- A readable journal export.
- Remove the demo dreams once real dreams are in. That also fixes demo stars gliding on reload.
- Port to Claude Code: TypeScript, Vite, three, IndexedDB, plus the screenshot-verification loop.
- Phone capture as a home-screen app, hubs, the full survey, ambient and screensaver polish, morning ritual, dream signs, sky prints, accounts and sync.
- Encryption is deferred: it's a hobby and proof of concept for now.

## How Jarred works

- Terse, fast feedback. Show results rather than describe them, using mock-ups and labs for visual decisions.
- Discuss before building when he says so. Present options with a recommendation.
- Human-sounding copy, with Australian spelling in the app ("analyse", "recognise").
- Visual language: painterly, calm, generous darkness. Gold accents, mono caps for labels, an italic serif for display. No neon, no HUDs, nothing gamey.

## Rules that never bend

- No API keys in chat or in files. They live only in Cloudflare secrets.
- Real dreams are never committed or bundled into a public build. The demo stays fictional.
- Never invent dream content or insights. The original text is always kept.
- The Astronomer cites its dreams, never interprets symbols, never diagnoses, and says when it isn't sure.

## Push workflow (for Claude)

1. In the repo clone: `git fetch origin main && git reset --hard origin/main`.
2. Copy in the site's `index.html` and commit as "Claude", with the session's attribution trailer.
3. `git push origin HEAD:main`.
4. Publish the artifact from the same source. Bump the version string each release.
