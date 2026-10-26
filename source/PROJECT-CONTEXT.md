# Dream Atlas: project context

Last updated 25 Oct 2026 (version 0.33).

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

## What's built (v0.33)

- Capture: text plus voice dictation, which merges Android's cumulative results. The mic sits inside the text box, gold while it's empty. New dreams default to last night.
- Claude tagging with a supernova arrival. The spelling tidy is a setting, with the original always kept.
- **Moments:** short canonical tags for events and states (crying, kissing, dying). Suggestions arrive with their type. Sharper motif rules with a list of common dream motifs.
- Tag editor with a home motif, and gliding re-placement.
- Smart search: synonyms (including kissing and making out, crying, fighting, nakedness), categories, months, years, lucid, feelings, stemming.
- Feeling filter (tap a feeling or a swatch) and the search capsule, bottom left, cleared with its ×.
- Leafing through dreams: swipe on a phone, arrows and arrow keys on desktop. It moves chronologically within whatever is lit; in a reveal it's grouped by thread.
- **The Astronomer** in the search field ("Search or ask"): the answer appears in the panel, the cited dreams light up, and you can leaf through just those. Closing it returns to the full sky.
- **Emerging regions:** when a moment is shared by three dreams, a region call decides whether it becomes a nebula and which dreams move there. Region and new-motif names are 1–3 words, never more than 4 (asked for in the prompts and enforced by `shortName()`).
- **The region tour (v0.30),** whenever new regions form after a re-read or emergence: they form one at a time, largest first, at most three (the rest form quietly). The camera flies close to where the region will be. Its stars wait unlit at their old homes, then glide in, the filaments fade in and the nebula condenses, flares and cools while the name writes in. Titles start at about 14.7px, sized to stay within 80% of the screen. A capsule reads "✦ New regions · 1 of 2"; a tap skips to the next region, the × or Escape skips the rest, and the camera returns afterwards. **Recording a dream that completes a region (v0.31):** the supernova plays first with the region held unformed, then the camera draws back, the other stars glide in, the nebula condenses and the name writes in, and only then does the dream's panel open. A region that emerges while a dream is open reopens that dream after its tour. A region formed by editing tags still gets the in-place ceremony.
- **Re-analyse:** batches of six dreams per call, offered only on evidence (or once for dreams read before moments existed), as a slim capsule: "✦ Your sky has grown. Seek connections anew? [Re-analyse]", then "Weaving new threads… 12 / 29" and "Looking for new regions…". Emergence is checked before the sky changes, so it changes once, in order: gold header, region tour, then the reveal. No Undo.
- **The "new threads" reveal (v0.32: thread by thread):** a gold numeral plus *new threads* header at the top. The panel shows one thread per page ("New thread · 1 of 6"), with every dream that now shares the word and the newly linked ones marked *new*. In the sky those dreams light up, joined dream to dream in date order, framed in the sky the panel leaves clear. Swipe or arrows move between threads. Opening a dream leafs within that thread, gained tags show in gold, and "‹ Crying" goes back. It's a real filter shown as a "✦ New threads" capsule bottom left: tapping the sky only closes the panel, tapping the capsule reopens the list, and its × clears it. Ambient mode never starts during the sequence.
- **Calmer sky (v0.32):** regions remember where they sit (localStorage `dream-atlas.slots`) and each layout starts from there, anchored, so only near neighbours make room for a new region, which forms where its dreams already are. Stars that stay put move a median of about 10 units instead of 135. **The sky only moves when the dreams do (v0.33):** the saved positions carry a fingerprint of everything that shapes the layout, and when it matches, they're used exactly, so reloads are identical. The stand-in sky drawn before your dreams load is never saved. A slow drift between visits, tied to real time, is a possible later idea, to be designed on purpose in a lab.
- **Region birth (v0.32):** a forming nebula rises from nothing to 2.5× brightness as its stars arrive, holds through its name, then eases back to 100%, while the other regions recede to filtered brightness and return (`CER_LOOK`).
- **Recurring (v0.30):** the chips along the bottom are whatever comes back most, of any kind (motif, person, place, thing, moment), ranked by how many dreams share the word, up to 30, each with its count and a dot in its most common feeling. Tapping one lights those dreams (and the nebula, if it's a motif).
- Backup export and import, in How to Read.
- **Opening (v0.31):** the interface is hidden from the first paint until the fly-in begins, so it no longer flashes while three.js downloads. It shows anyway after 8 seconds if the sky never boots.
- Nebulae repaint after phone GPU resets, and the sky holds still under the phone keyboard.
- **Sound (v0.29):** a generative ambient bed (`audio/ambience.js`, inlined into both builds) at master level 0.45. The toggle is a small signal-trace wave (a flat line with a few cycles in the middle), still and dim when off, brighter and gently flowing when on, easing between the two. It sits beside the ambient-mode moon (above Record on phones), with **M** as the key. On by default: browsers block sound until the first interaction, so it fades in at the first tap or key press (on touch, that's when the finger lifts). Turning it off is remembered. It fades out and suspends when the tab is hidden, steps aside while the microphone is listening, uses the larger 'playback' audio buffer so a busy sky doesn't crackle it, and keeps playing in ambient mode.

## Outstanding (as of 25 Oct)

- **Jarred:** live with v0.30 on real dreams. Run Re-analyse and judge the region tour and the reveal on a phone.
- **Threads lab:** claude.ai/artifact/DGZkZkrNRGsRP2RQPtrc65, built from the site with fictional dreams and scripted Claude replies (Re-analyse, Regions 0–3, Flare, Others dim, Start over). Not in the repo. Next up there: more tweaks to how new threads are shown.
- **Existing long names:** regions named before v0.30 (e.g. "Missing a flight or train") keep their names. Renaming needs a rename in the tag editor or a one-off tidy.
- **Jarred:** make sure the API keys pasted in chat early on are revoked. Only the Cloudflare secret should exist.
- **Jarred:** listen to the sound in the app on desktop and phone (v0.29). Tune it in the music thread using `audio/music-brief.md`. When `audio/ambience.js` changes, re-inline it into both builds (the block starts at "Sound: a generative ambient bed").
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
