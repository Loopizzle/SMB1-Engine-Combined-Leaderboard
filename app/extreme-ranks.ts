import { formatRunTime, runPerformanceScore, type InsightCareerRun } from './insights';

export type ExtremeSourcePlayer = {
  Runner: string;
  Country: string | null;
  'Flag URL': string | null;
  Profile?: string;
  playerKey?: string;
};

export type ExtremePlayer = {
  Rank: number;
  Runner: string;
  Country: string | null;
  'Flag URL': string | null;
  'Total Score': number;
  'Performance Score': number;
  'Volume Bonus': number;
  'Variety Bonus': number;
  'Prolific Score': number;
  'Unique Boards': number;
  'Unique Games': number;
  WRs: number;
  'Top 3s': number;
  'Top 10s': number;
  'Medal Score': number;
  'Depth Score': number;
  'Average Place': number;
  Profile?: string;
  playerKey: string;
};

export type ExtremeScoredRun = {
  id: string;
  included: boolean;
  gameAbbr: string;
  game: string;
  scope: string;
  category: string;
  level: string | null;
  subcategory: string | null;
  place: number;
  boardSize: number;
  runner: string;
  country: string | null;
  time: string;
  seconds: number;
  platform: null;
  hardware: null;
  runDate: string | null;
  verifiedAt: string | null;
  runLink: string;
  playerKey: string;
  profile: string;
  performancePoints: number;
  medalPoints: number;
  depthPoints: number;
  wrCredit: number;
  top3Credit: number;
  top10Credit: number;
  boardKey: string;
  gameToggle: string;
};

type ExtremeGroup = {
  runner: string;
  country: string | null;
  flagUrl: string | null;
  profile: string;
  performance: number;
  runs: number;
  boards: Set<string>;
  games: Set<string>;
  wrs: number;
  top3s: number;
  top10s: number;
  medal: number;
  depth: number;
  places: number[];
};

function baseGame(value: string) {
  return String(value || '').replace(' (Luigi)', '');
}

function eventDate(run: InsightCareerRun) {
  return String(run.runDate || run.verifiedAt || '');
}

export function buildExtremeRanks(careerRuns: InsightCareerRun[], currentPlayers: ExtremeSourcePlayer[]) {
  const currentByKey = new Map(currentPlayers.filter((player) => player.playerKey).map((player) => [String(player.playerKey), player]));
  const latestByKey = new Map<string, InsightCareerRun>();
  const byBoard = new Map<string, InsightCareerRun[]>();

  careerRuns.forEach((run) => {
    const previous = latestByKey.get(run.playerKey);
    if (!previous || eventDate(run) >= eventDate(previous)) latestByKey.set(run.playerKey, run);
    const boardRuns = byBoard.get(run.boardKey) || [];
    boardRuns.push(run);
    byBoard.set(run.boardKey, boardRuns);
  });

  const scoredRuns: ExtremeScoredRun[] = [];
  byBoard.forEach((boardRuns) => {
    boardRuns.sort((a, b) => Number(a.seconds) - Number(b.seconds) || eventDate(a).localeCompare(eventDate(b)) || String(a.id || '').localeCompare(String(b.id || '')));
    let place = 1;
    let previousSeconds: number | null = null;
    boardRuns.forEach((run, index) => {
      const seconds = Number(run.seconds || 0);
      if (previousSeconds !== null && Math.abs(seconds - previousSeconds) > 0.0005) place = index + 1;
      previousSeconds = seconds;
      const current = currentByKey.get(run.playerKey);
      const latest = latestByKey.get(run.playerKey) || run;
      const runner = String(current?.Runner || latest.runner || run.runner || run.playerKey);
      const country = current?.Country || latest.country || run.country || null;
      const profile = String(current?.Profile || latest.profile || run.profile || '');
      const performancePoints = runPerformanceScore(place, boardRuns.length);
      const medalPoints = place === 1 ? 3 : place === 2 ? 2 : place === 3 ? 1 : 0;
      scoredRuns.push({
        id: String(run.id || `${run.boardKey}-${run.playerKey}-${index}`), included: true,
        gameAbbr: run.gameAbbr, game: String(run.game || run.gameAbbr), scope: String(run.scope || 'Full Game'),
        category: run.category, level: run.level, subcategory: run.subcategory, place, boardSize: boardRuns.length,
        runner, country, time: run.time || formatRunTime(seconds), seconds, platform: null, hardware: null,
        runDate: run.runDate, verifiedAt: run.verifiedAt || null, runLink: String(run.runLink || ''), playerKey: run.playerKey,
        profile, performancePoints, medalPoints, depthPoints: performancePoints, wrCredit: place === 1 ? 1 : 0,
        top3Credit: place <= 3 ? 1 : 0, top10Credit: place <= 10 ? 1 : 0, boardKey: run.boardKey, gameToggle: run.gameToggle,
      });
    });
  });

  const groups = new Map<string, ExtremeGroup>();
  scoredRuns.forEach((run) => {
    const current = currentByKey.get(run.playerKey);
    const group = groups.get(run.playerKey) || {
      runner: run.runner, country: run.country, flagUrl: current?.['Flag URL'] || null, profile: run.profile,
      performance: 0, runs: 0, boards: new Set<string>(), games: new Set<string>(), wrs: 0, top3s: 0,
      top10s: 0, medal: 0, depth: 0, places: [],
    };
    group.performance += run.performancePoints;
    group.runs += 1;
    group.boards.add(run.boardKey);
    group.games.add(baseGame(run.gameToggle));
    group.wrs += run.wrCredit;
    group.top3s += run.top3Credit;
    group.top10s += run.top10Credit;
    group.medal += run.medalPoints;
    group.depth += run.depthPoints;
    group.places.push(run.place);
    groups.set(run.playerKey, group);
  });

  const players = Array.from(groups.entries()).map(([playerKey, group]) => {
    const volume = Math.sqrt(group.runs) * 8;
    const variety = Math.max(0, group.games.size - 1) * 10;
    return {
      Rank: 0, Runner: group.runner, Country: group.country, 'Flag URL': group.flagUrl,
      'Total Score': group.performance + volume + variety, 'Performance Score': group.performance,
      'Volume Bonus': volume, 'Variety Bonus': variety, 'Prolific Score': group.runs,
      'Unique Boards': group.boards.size, 'Unique Games': group.games.size, WRs: group.wrs,
      'Top 3s': group.top3s, 'Top 10s': group.top10s, 'Medal Score': group.medal, 'Depth Score': group.depth,
      'Average Place': group.places.reduce((sum, value) => sum + value, 0) / group.places.length,
      Profile: group.profile, playerKey,
    } satisfies ExtremePlayer;
  }).sort((a, b) => b['Total Score'] - a['Total Score'] || b['Performance Score'] - a['Performance Score'] || a.Runner.localeCompare(b.Runner));

  return { players: players.map((player, index) => ({ ...player, Rank: index + 1 })), runs: scoredRuns };
}
