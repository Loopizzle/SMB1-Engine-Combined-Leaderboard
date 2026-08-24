# SMB1 Engine Combined Leaderboard

An interactive interpretation of Loopie's SMB1 Engine Combined Leaderboard Google Sheet, with live category filtering, runner profiles, score audits, historical standings, searchable runs, and head-to-head comparisons.

## Development

```bash
pnpm install
pnpm run dev
```

## GitHub Pages

Every push to `main` builds and deploys the static website through GitHub Actions.

The intended custom domain is `smb1ecl.loopie.fr`.

When replacing `public/site-data.json`, run `pnpm run data:split` before committing so the deployable data chunks are refreshed.
