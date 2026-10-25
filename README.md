# Dream Atlas

A dream journal drawn as a living night sky. The site is live at https://astrosomnia.github.io/dream-atlas/

## What's in here

- `index.html`: the public site. GitHub Pages serves it as is.
- `og.jpg`: the link preview image.
- `source/worker.js`: the Cloudflare Worker that tags dreams and answers the Astronomer. Paste it into the Cloudflare editor to deploy. The Anthropic API key lives only as the Cloudflare secret `ANTHROPIC_API_KEY`, never in this repo.
- `source/dream-atlas-claude.html`: the claude.ai version, the same app using claude.ai's built-in Claude access and private storage.
- `source/PROJECT-CONTEXT.md`: where the project is up to: decisions, data model, what's built and what's next.
- `labs/`: standalone test pages for single components.
- `audio/`: the generative ambience (`ambience.js`), its brief, and a rendered preview.

Every change goes into both `index.html` and `source/dream-atlas-claude.html`; they differ only in how they reach Claude and where they store dreams. Demo dreams are fictional. Real dreams are never committed.
