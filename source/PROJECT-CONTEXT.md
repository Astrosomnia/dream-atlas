# Dream Atlas: project context

Last updated 25 Oct 2026 (version 0.26).

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
  - Modes: single tag and `tagBatch` (Re-analyse) use `claude-haiku-5-5`; `region` (should a shared moment become a nebula?) and `ask` (the Astronomer) use `claude-sonnet-5-5`.
  - It builds prompts server-side, only accepts requests from the GitHub Pages origin, and keeps the API key only as the Cloudflare secret `ANTHROPIC_API_KEY`.
  - **Deploys automatically:** pushing a change to `source/worker.js` (or `wrangler.toml`) on main runs the GitHub Action "Deploy worker", which publishes it to Cloudflare with Wrangler. The Cloudflare token and account ID are GitHub repo secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`). The token expires Oct 2027. No more manual pastes.
- **Roadmap doc:** claude.ai/artifact/Mh45DGRcRymq1hs2zrz54Q. Five phases, 16 features.
- **Claude Code handoff folder:** CLAUDE.md, KICKOFF.md, brief v1.2, the prototype, and demo data. The port to a proper codebase is still to come.
- **Labs:** standalone test pages for single components, in the repo's `labs/` folder and served at astrosomnia.github.io/dream-atlas/labs/<name>.html (unlinked). The first is `region-title-lab.html`.

## Source of truth: the GitHub repo

Everything a new chat needs is in `Astrosomnia/dream-atlas`. Clone it first.

- `index.html`: the public site, served by GitHub Pages.
- `source/dream-atlas-claude.html`: the Claude version. Publish it to the artifact URL above, and read the live artifact first in case it's newer.
- `source/worker.js`: the Cloudflare Worker. Pushing it deploys it (see `wrangler.toml` and `.github/workflows/deploy-worker.yml`).
- `source/PROJECT-CONTEXT.md`: a copy of this doc.
- `labs/`: component test pages. `audio/`: `ambience.js`, the music brief and a preview render.

After each batch, commit both builds and the worker together, and update this doc in both the project and the repo.

## The two builds

The Claude version and `index.html` are the same code with a few differences. The Claude version uses claude.ai's `sample` and `db`. The public site uses `useCap()` returning null, posts to the worker, and has OG meta tags. `tagDream()`, `tagBatch()`, `regionCall()` and `askClaude()` hide the difference from the rest of the code. The prompt builders (`tagRules`, `tagPrompt`, `batchPrompt`, `regionPrompt`) are identical in the page and the worker. Every change is applied to both. The version string sits in the How to Read panel ("Version 0.xx · date").

## Data model (one dream)

- **Core:** id, date (the night of), createdAt, text (always the original), tidied (optional spelling-only copy).
- **Reading:** title, feel, vivid (1–5), lucid.
- **Tags:** motifs (the first is the home and decides placement), motifLabels, motifNear, people, places, objects, moments, suggested plus suggestedKinds. Older dreams may still carry details and themes, which are only used by search.
- **Provenance:** tagger (claude / claude+you / you / none), editedAt, analysedAt, homeByHand, claimedBy (a new region claimed it), homeLocked (moved back after a claim: never moves again).

The rules that govern placement and links:
- Only motifs decide where a star sits.
- People, places, things and moments create the visible connections, matched on the word whatever its type (a "flying" motif links to a "flying" moment).
- Each word lives in one place per dream.
- Anonymous people and everyday scenery (guy, someone, a child, hill, trees…) never create links.
- A nebula forms whenever a motif has 2+ dreams with at least one homed there.

## Feelings (colour)

Wonder `#74d7cf` · Joy `#f3e08f` · Longing `#df9fb2` · Sadness `#7f9fe0` · Calm `#a3d4a0` · Unease `#e5935c` · Fear `#9c8be2`.

The feeling is the dream's overall tone. Calm doubles as "peaceful or ordinary". Recurring dream mechanics, like legs that won't run, belong in motifs rather than the feeling.

## What's built (v0.26)

- Capture: text plus voice dictation, which merges Android's cumulative results. The mic sits inside the text box, gold while it's empty. New dreams default to last night.
- Claude tagging with a supernova arrival. The spelling tidy is a setting, with the original always kept.
- **Moments:** short canonical tags for events and states (crying, kissing, dying). Suggestions arrive with their type. Sharper motif rules with a list of common dream motifs.
- Tag editor with a home motif, and gliding re-placement.
- Smart search: synonyms (including kissing and making out, crying, fighting, nakedness), categories, months, years, lucid, feelings, stemming.
- Feeling filter (tap a feeling or a swatch) and the search capsule, bottom left, cleared with its ×.
- Leafing through dreams: swipe on a phone, arrows and arrow keys on desktop. It moves chronologically within whatever is lit; in a reveal it's grouped by thread.
- **The Astronomer** in the search field ("Search or ask"): the answer appears in the panel, the cited dreams light up, and you can leaf through just those. Closing it returns to the full sky.
- **Emerging regions:** when a moment is shared by three dreams, a region call decides whether it becomes a nebula and which dreams move there.
- **Region arrival ceremony,** whenever any new nebula forms: the nebula flares and cools, the stars glide together, and the name writes in place as glowing, wide-spaced mono caps before drawing together into a normal label. It's non-cartographic, at the slow 0.5× pace, staggered so each title starts halfway through the one before. Any tap skips it, and the camera only moves if the region is off-screen.
- **Re-analyse:** batches of six dreams per call, offered only on evidence (or once for dreams read before moments existed), as a slim capsule: "✦ Your sky has grown. Seek connections anew? [Re-analyse]", then "Weaving new threads…". No Undo.
- **The "new threads" reveal:** a gold numeral plus *new threads* header at the top. Gained tags show in gold until it's cleared, leafing is grouped by thread, and two taps on the sky clear it.
- Backup export and import, in How to Read.
- Nebulae repaint after phone GPU resets, and the sky holds still under the phone keyboard.
- **Sound (v0.26):** a generative ambient bed (`audio/ambience.js`, inlined into both builds) at master level 0.45. The toggle is a small wave icon, still and dim when off, brighter and gently flowing when on, easing between the two. It sits beside the ambient-mode moon (beside Record on phones), with **M** as the key. Off by default. The choice is remembered, and a remembered "on" starts at the first tap or key press. It fades out and suspends when the tab is hidden, steps aside while the microphone is listening, and keeps playing in ambient mode.

## Outstanding (as of 25 Oct)

- **Jarred:** live with v0.24 on real dreams. Run Re-analyse, judge the moments and any regions that form, and check the arrival ceremony's timing on a phone (it hasn't been seen in motion).
- **Jarred:** make sure the API keys pasted in chat early on are revoked. Only the Cloudflare secret should exist.
- **Jarred:** listen to the sound in the app on desktop and phone (v0.26). Tune it in the music thread using `audio/music-brief.md`. When `audio/ambience.js` changes, re-inline it into both builds (the block starts at "Sound: a generative ambient bed").
- **Roadmap doc:** refresh it. It predates the Astronomer, backup, leafing and live regions shipping.
- **Claude Code folder:** its prototype copy is v0.10. Replace it with the current build before any port.
- **Data:** clean up the old details and themes once everything has been re-analysed.
- **Ideas:** tune the moment prompts and the region threshold (3) after real use; small mic visibility tweaks.

## Later and roadmap

- Music: maybe let it respond to the sky (the mix of feelings) or to ambient mode, only if it stays subtle.
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
