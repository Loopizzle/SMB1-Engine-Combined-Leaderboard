# Data provenance and use

## Project purpose

The SMB1 Engine Combined Leaderboard is an unofficial, noncommercial analytics project. It studies patterns, trends, prolificness, historical standings, head-to-head results, and potential competitive goals across related Super Mario Bros. speedrunning categories.

The name "Combined Leaderboard" refers only to a community-created cross-game scoring model. The project does not replace Speedrun.com, accept submissions, verify runs, establish records, or override game rules. Runs count only after they have been submitted to and accepted by Speedrun.com. Speedrun.com remains the authoritative record and verification platform.

## Historical snapshot

The project preserves a historical workbook snapshot from before Speedrun.com's revised Terms of Use took effect on October 1, 2026. Speedrun.com's own announcement explains that its previous terms placed leaderboard data under a Creative Commons license and that removal of that blanket permission applies going forward.

The final pre-change dataset was recovered directly from the original workbook's September 30, 2026 version history. An independently timestamped GitHub Actions deployment on September 30 confirms that the workbook was processed and published before the Terms update. The preserved source workbook and cryptographic hash provide an immutable fallback and provenance record.

The pre-change material is preserved and attributed under Creative Commons Attribution-NonCommercial 4.0 International as it applied when the material was acquired:

- Source: [Speedrun.com](https://www.speedrun.com/)
- Terms update: [Speedrun.com Terms of Use Update](https://www.speedrun.com/news/6o56nmvp-terms-of-use-update)
- License: [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)
- Changes: source records are normalized, grouped into derived boards, scored, filtered, compared, and visualized by this project.

Creative Commons licenses cover only rights the licensor was entitled to license. Individual videos, names, trademarks, profile images, privacy/publicity rights, and third-party materials may have separate owners or restrictions. Links to run videos and Speedrun.com profiles identify their external sources; this project does not claim ownership of them.

## Refresh policy

Speedrun.com provided written permission for this specific community analytics project on October 5, 2026. The authorization confirms that the project is safe to continue and recognizes it as a community tool rather than a replacement for Speedrun.com. The private correspondence is retained by the project owner.

The deployment workflow therefore refreshes the public workbook data once per day while the repository variable `SRC_REFRESH_AUTHORIZED` is explicitly set to `true`. Scheduled refreshes are deliberately low-frequency to avoid unnecessary load. Manual refreshes remain available when an additional update is needed.

Push-triggered builds use the checked-in data and do not perform an external refresh. Changing or removing `SRC_REFRESH_AUTHORIZED` immediately disables external refreshes. If permission is withdrawn or the project's purpose materially changes, automated refreshes should be paused and reviewed again.

## Attribution and independence

This project is inspired by aaron2u2's Most Prolific NES Runners list and CyanBeast's website using Loopie's combined leaderboard. Sprite accents are credited to Mario Universe and geographic boundary data to Natural Earth.

The project is not affiliated with, sponsored by, or endorsed by Speedrun.com, Elo Entertainment, Nintendo, or the owners of external run videos. All product names and trademarks belong to their respective owners.

## Corrections and removals

Questions about attribution, provenance, corrections, or removal of cached profile presentation data may be raised through the repository's issue tracker. Removing presentation data here does not alter the authoritative record on Speedrun.com.
