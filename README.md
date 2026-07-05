# The Market Making Book

A book about market making — from trading fundamentals to optimal quoting math, venue guides (Kalshi, Polymarket, Hyperliquid, Binance, IBKR/Alpaca), algorithm catalogs, and risk operations — published as a documentation site built with [Fumadocs](https://fumadocs.dev) and Next.js.

Monorepo scaffolded with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack) (Turborepo + Bun + Biome/Ultracite).

## Features

- **20 book chapters** written in MDX (`apps/docs/content/docs/`)
- **AI chat ("Ask AI")** — chat with the book via OpenRouter, grounded by full-text search over the chapters
- **Docs search**, OG image generation per chapter, and `llms.txt` / `llms-full.txt` / per-page `content.md` endpoints for LLM consumption
- **Custom book theme** with a theme customizer (light/dark via next-themes)

## Getting Started

Install dependencies:

```bash
bun install
```

Set up the AI chat (optional — the site works without it):

```bash
# apps/docs/.env.local
OPENROUTER_API_KEY=your-key
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet   # optional, this is the default
```

Run the development server:

```bash
bun run dev
```

The book is served at [http://localhost:4000](http://localhost:4000) (docs live under `/docs`).

## Project Structure

```
market-making-book/
├── apps/
│   └── docs/                  # The book site (Next.js + Fumadocs)
│       ├── content/docs/      # Book chapters (MDX)
│       └── src/
│           ├── app/           # Routes: docs, api/chat, api/search, og, llms.txt
│           ├── components/    # MDX components, AI chat UI, book figures, theme customizer
│           └── lib/           # Content source loader, shared config (site name, routes)
└── packages/
    └── config/                # Shared workspace config
```

## Available Scripts

- `bun run dev` — start all apps in development mode (docs on port 4000)
- `bun run build` — build all apps
- `bun run check-types` — typecheck all apps (also regenerates MDX and route types)
- `bun run check` — run Biome/Ultracite linting
- `bun run fix` — auto-fix lint and formatting issues
- `make vibe` — open the project in a zellij session

## Notes

- The site name (and the AI chat bot's display name) is set in `apps/docs/src/lib/shared.ts` (`appName`).
- The chat model is selected in `apps/docs/src/app/api/chat/route.ts` via `OPENROUTER_MODEL`.
