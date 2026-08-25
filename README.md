# SMB1 Engine Combined Leaderboard

An interactive interpretation of Loopie's SMB1 Engine Combined Leaderboard Google Sheet, with live category filtering, runner profiles, score audits, historical standings, searchable runs, and head-to-head comparisons.

## Development

```bash
pnpm install
pnpm run dev
```

## GitHub Pages

Every push to `main` builds and deploys the static website through GitHub Actions. A scheduled workflow also downloads the public Google Sheet and redeploys fresh data every day at 07:30 UTC.

The intended custom domain is `smb1ecl.loopie.fr`.

The scheduled build runs `scripts/refresh-site-data.py`, validates the workbook, and splits the generated JSON into deployable chunks. If the workbook cannot be downloaded or fails validation, the workflow stops and leaves the existing live deployment untouched.
