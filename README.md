# darts-game

A text-based darts career game where you watch or sim the matches. Design: [`DARTS-GAME-DESIGN.md`](DARTS-GAME-DESIGN.md).

**Play it:** https://evanstom273.github.io/darts-game/ (deployed from `main` by GitHub Actions).

## Commands

```sh
npm install        # once
npm run dev        # local dev server
npm test           # unit tests (Vitest): the board, checkouts, rules, matches, batches, CSV
npm run test:e2e   # browser test (Playwright) at the Fold's outer and inner screen sizes
npm run typecheck
npm run build      # production build into dist/
```

On a new machine, `npx playwright install chromium` fetches the browser the e2e test needs.

## Tuning

Every number the simulation uses is in `src/engine/tuning.ts`. Tap **Simulate** in the game to run a batch
(up to 100,000 matches) and download it as CSV; any row can be pasted back in to replay that exact match.
