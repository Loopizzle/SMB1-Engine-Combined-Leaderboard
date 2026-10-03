# SMB1 Engine Combined Leaderboard

An unofficial, noncommercial analytics companion for the SMB1 engine speedrunning community. It interprets Loopie's combined-leaderboard model through searchable standings, runner profiles, score audits, historical analysis, realistic planning tools, searchable runs, and head-to-head comparisons.

This project is not a replacement for Speedrun.com and does not accept or verify runs. A run must first be submitted to and accepted by Speedrun.com to appear in the published snapshot. Speedrun.com remains the authoritative source for records, verification status, category rules, and moderator decisions.

## Data status

Automated external refreshes are paused following the Speedrun.com Terms of Use change effective October 1, 2026. The published site uses a preserved pre-change dataset. See [DATA_PROVENANCE.md](DATA_PROVENANCE.md) for attribution, licensing context, provenance, and the refresh policy.

## Development

```bash
pnpm install
pnpm run dev
```

## GitHub Pages

Every push to `main` builds and deploys the static website from the checked-in snapshot. Ordinary deployments do not contact Speedrun.com or refresh external data.

Refresh code is intentionally retained but permission-gated. To run it after written authorization is received:

1. Set the repository variable `SRC_REFRESH_AUTHORIZED` to `true`.
2. Run the deploy workflow manually with `refresh_data` enabled.
3. Supply a written authorization reference in the workflow input.

Removing any one of those conditions keeps the refresh disabled. The intended custom domain is `smb1ecl.loopie.fr`.
