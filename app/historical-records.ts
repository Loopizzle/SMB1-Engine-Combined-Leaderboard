import type { InsightCareerRun } from './insights';

const SMB1_ANY_NTSC_BOARD = 'om1m3625||w20p0zkn|realtime|onvvdymn=013zwgxq';
const SMB1_WR_GUIDE = 'https://www.speedrun.com/smb1/guides/jdxw8';

// Documented records absent from the accepted-run archive; never add these to current or Extreme Mode runs.
const EARLY_SMB1_ANY_RECORDS = [
  ['2007-04-10', 300.355],
  ['2010-12-24', 299.690],
  ['2011-12-15', 298.874],
  ['2013-01-15', 298.791],
  ['2013-01-19', 298.575],
  ['2013-03-21', 298.525],
  ['2013-05-19', 298.359],
  ['2013-07-01', 298.159],
  ['2013-10-07', 298.142],
  ['2014-03-25', 298.092],
] as const;

export function withDocumentedWrHistory(runs: InsightCareerRun[], availableRuns = runs, asOf = ''): InsightCareerRun[] {
  if (!availableRuns.some((run) => run.boardKey === SMB1_ANY_NTSC_BOARD)) return runs;
  const andrew = availableRuns.find((run) => String(run.runner).toLocaleLowerCase() === 'andrewg');
  const documented = EARLY_SMB1_ANY_RECORDS.filter(([date]) => !asOf || date <= asOf).map(([date, seconds], index) => ({
    id: `documented-smb1-any-${index}`,
    runner: 'AndrewG',
    playerKey: String(andrew?.playerKey || 'andrewg'),
    boardKey: SMB1_ANY_NTSC_BOARD,
    gameAbbr: 'smb1',
    gameToggle: 'smb1',
    category: 'Any%',
    level: null,
    subcategory: 'Version: NTSC',
    seconds,
    runDate: date,
    country: andrew?.country || null,
    profile: andrew?.profile || '',
    runLink: SMB1_WR_GUIDE,
  } satisfies InsightCareerRun));
  return documented.length ? [...runs, ...documented] : runs;
}
