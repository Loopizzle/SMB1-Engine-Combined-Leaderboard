# SMB1 Engine Combined Leaderboard

An unofficial, noncommercial analytics companion for the SMB1 engine speedrunning community. It interprets Loopie's combined-leaderboard model through searchable standings, runner profiles, score audits, historical analysis, realistic planning tools, searchable runs, and head-to-head comparisons.

This project is not a replacement for Speedrun.com and does not accept or verify runs. A run must first be submitted to and accepted by Speedrun.com to appear in the published snapshot. Speedrun.com remains the authoritative source for records, verification status, category rules, and moderator decisions.

## Data status

The published data refreshes once per day from the project's public Google Sheets workbook. Speedrun.com provided written permission for this community analytics project on October 5, 2026. See [DATA_PROVENANCE.md](DATA_PROVENANCE.md) for attribution, permission context, and the refresh policy.

## Development

```bash
pnpm install
pnpm run dev
```

## GitHub Pages

Every push to `main` builds and deploys the static website from the checked-in data. When the repository variable `SRC_REFRESH_AUTHORIZED` is `true`, a scheduled workflow refreshes the public workbook data once per day at approximately 07:30 UTC; GitHub Actions schedules are best-effort.

To request an additional refresh:

1. Run the deploy workflow manually.
2. Leave `refresh_data` enabled.
3. Keep the repository variable `SRC_REFRESH_AUTHORIZED` set to `true`.

A push deployment does not refresh external data. Setting `SRC_REFRESH_AUTHORIZED` to any value other than `true` immediately disables both scheduled and manual refreshes. The intended custom domain is `smb1ecl.loopie.fr`.
