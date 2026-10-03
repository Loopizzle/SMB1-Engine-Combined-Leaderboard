# Data provenance and use

## Project purpose

The SMB1 Engine Combined Leaderboard is an unofficial, noncommercial analytics project. It studies patterns, trends, prolificness, historical standings, head-to-head results, and potential competitive goals across related Super Mario Bros. speedrunning categories.

The name "Combined Leaderboard" refers only to a community-created cross-game scoring model. The project does not replace Speedrun.com, accept submissions, verify runs, establish records, or override game rules. Runs count only after they have been submitted to and accepted by Speedrun.com. Speedrun.com remains the authoritative record and verification platform.

## Published snapshot

The checked-in leaderboard snapshot and cached profile metadata were acquired before Speedrun.com's revised Terms of Use took effect on October 1, 2026. Speedrun.com's own announcement explains that its previous terms placed leaderboard data under a Creative Commons license and that removal of that blanket permission applies going forward.

The final pre-pause dataset was recovered from the workbook's October 1, 2026 version history and checked against GitHub Actions run 36910892716. The deployment log records 7,182 current runs, 19,851 accepted historical runs, 2,786 ranked runners, 9,583 monthly rows, and 4,476 yearly rows. The preserved archive includes that source workbook and cryptographic hashes so the files can be checked for later alteration.

The pre-change material is preserved and attributed under Creative Commons Attribution-NonCommercial 4.0 International as it applied when the material was acquired:

- Source: [Speedrun.com](https://www.speedrun.com/)
- Terms update: [Speedrun.com Terms of Use Update](https://www.speedrun.com/news/6o56nmvp-terms-of-use-update)
- License: [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)
- Changes: source records are normalized, grouped into derived boards, scored, filtered, compared, and visualized by this project.

Creative Commons licenses cover only rights the licensor was entitled to license. Individual videos, names, trademarks, profile images, privacy/publicity rights, and third-party materials may have separate owners or restrictions. Links to run videos and Speedrun.com profiles identify their external sources; this project does not claim ownership of them.

## Refresh policy

Automated external refreshes are paused. Normal builds use only checked-in data and make no Speedrun.com API or workbook requests.

The refresh implementation is retained so the project can resume if appropriate written authorization is received. The deployment workflow requires all of the following before it can refresh:

1. A manual workflow run with data refresh explicitly selected.
2. The repository variable `SRC_REFRESH_AUTHORIZED=true`.
3. A written authorization reference supplied with that run.

New Speedrun.com data will not be imported without written permission or an independently licensed source with sufficient redistribution rights. Receiving data through another website does not by itself create those rights.

## Attribution and independence

This project is inspired by aaron2u2's Most Prolific NES Runners list and CyanBeast's website using Loopie's combined leaderboard. Sprite accents are credited to Mario Universe and geographic boundary data to Natural Earth.

The project is not affiliated with, sponsored by, or endorsed by Speedrun.com, Elo Entertainment, Nintendo, or the owners of external run videos. All product names and trademarks belong to their respective owners.

## Corrections and removals

Questions about attribution, provenance, corrections, or removal of cached profile presentation data may be raised through the repository's issue tracker. Removing presentation data here does not alter the authoritative record on Speedrun.com.
