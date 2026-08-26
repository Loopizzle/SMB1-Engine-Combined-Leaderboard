export type InsightPlayer = {
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
  'Average Place': number;
};

export type InsightRun = {
  runner: string;
  playerKey: string;
  boardKey: string;
  gameAbbr: string;
  gameToggle: string;
  category: string;
  level: string | null;
  subcategory: string | null;
  place: number;
  boardSize: number;
  performancePoints: number;
  wrCredit: number;
  seconds: number;
  time: string;
  runDate: string | null;
  country: string | null;
};

export type InsightBoard = {
  boardKey: string;
  gameAbbr: string;
  game: string;
  category: string;
  level: string | null;
  subcategory: string | null;
  runCount: number;
};

export type InsightHistoryRow = {
  month?: string;
  year?: number;
  rank: number;
  runner: string;
  country: string | null;
  totalScore: number;
  performanceScore: number;
  runs: number;
  uniqueBoards: number;
  uniqueGames: number;
};

export type Target = {
  board: InsightBoard;
  currentPlace: number | null;
  proposedPlace: number;
  performanceGain: number;
  estimatedGain: number;
  missing: boolean;
  currentSeconds: number | null;
  goalSeconds: number;
  goalTime: string;
  goalLabel: string;
};

export type Rivalry = {
  runner: string;
  rank: number;
  flagUrl: string | null;
  shared: number;
  close: number;
  wins: number;
  losses: number;
  score: number;
};

export type EraCareer = {
  runner: string;
  country: string | null;
  rating: number;
  bestIndex: number;
  bestYear: number;
  bestRank: number;
  seasons: number;
  primeIndex: number;
};

export type SeasonStanding = {
  runner: string;
  country: string | null;
  points: number;
  wins: number;
  podiums: number;
  appearances: number;
  averageRank: number;
  bestRank: number;
};

export type CareerSnapshot = {
  period: string;
  score: number;
  scoreGain: number;
  performance: number;
  volume: number;
  variety: number;
  runs: number;
  boards: number;
  games: number;
  wrs: number;
  newRuns: InsightRun[];
};

export function baseGameKey(value: string) {
  return String(value || '').replace(' (Luigi)', '');
}

export function insightBoardLabel(board: Pick<InsightBoard, 'category' | 'level' | 'subcategory'>) {
  return [board.category, board.level, board.subcategory].filter(Boolean).join(' - ');
}

export function runPerformanceScore(place: number, boardSize: number) {
  const numericPlace = Number(place || 0);
  const size = Number(boardSize || 0);
  if (numericPlace <= 0 || size <= 0) return 0;
  const placementStrength = size === 1 ? (numericPlace === 1 ? 1 : 0) : Math.max(0, 1 - ((numericPlace - 1) / Math.max(1, size - 1)));
  if (placementStrength <= 0) return 0;
  const boardWeight = Math.pow(Math.log2(size + 1), 1.35);
  let score = Math.pow(placementStrength, 1.7) * boardWeight * 10;
  if (numericPlace === 1) score += boardWeight * 6;
  else if (numericPlace === 2) score += boardWeight * 3.5;
  else if (numericPlace === 3) score += boardWeight * 2;
  else if (numericPlace <= 10) score += boardWeight * 0.5;
  return score;
}

export function formatRunTime(seconds: number) {
  const totalMs = Math.max(0, Math.round(Number(seconds || 0) * 1000));
  const hours = Math.floor(totalMs / 3600000);
  const minutes = Math.floor((totalMs % 3600000) / 60000);
  const wholeSeconds = Math.floor((totalMs % 60000) / 1000);
  const milliseconds = String(totalMs % 1000).padStart(3, '0');
  if (hours) return `${hours}:${String(minutes).padStart(2, '0')}:${String(wholeSeconds).padStart(2, '0')}.${milliseconds}`;
  return `${minutes}:${String(wholeSeconds).padStart(2, '0')}.${milliseconds}`;
}

export function parseRunTime(value: string) {
  const parts = String(value || '').trim().split(':');
  if (!parts.length || parts.length > 3 || parts.some((part) => part.trim() === '' || !Number.isFinite(Number(part)))) return 0;
  const numbers = parts.map(Number);
  if (numbers.some((number) => number < 0)) return 0;
  if (numbers.length === 1) return numbers[0];
  if (numbers.length === 2) return numbers[0] * 60 + numbers[1];
  return numbers[0] * 3600 + numbers[1] * 60 + numbers[2];
}

export function projectedPlaceForTime(runner: string, boardKey: string, seconds: number, runs: InsightRun[]) {
  if (!boardKey || !Number.isFinite(seconds) || seconds <= 0) return 0;
  return 1 + runs.filter((run) => run.boardKey === boardKey && run.runner !== runner && Number(run.seconds || 0) > 0 && Number(run.seconds) < seconds - 0.0005).length;
}

export function runnerArchetype(player: InsightPlayer) {
  const runs = Math.max(1, Number(player['Prolific Score'] || 0));
  const wrRate = Number(player.WRs || 0) / runs;
  const podiumRate = Number(player['Top 3s'] || 0) / runs;
  const traits: string[] = [];
  let name = 'Engine Explorer';
  let detail = 'Builds a varied resume across the engine.';

  if (Number(player.WRs || 0) >= 3 && wrRate >= 0.18) {
    name = 'WR Hunter';
    detail = `${Math.round(wrRate * 100)}% of current runs are world records.`;
  } else if (Number(player['Unique Games'] || 0) >= 5 && Number(player['Unique Boards'] || 0) >= 25) {
    name = 'All-Rounder';
    detail = `Active across ${player['Unique Games']} games and ${player['Unique Boards']} boards.`;
  } else if (Number(player['Unique Boards'] || 0) >= 55 && Number(player['Unique Boards'] || 0) / runs >= 0.85) {
    name = 'Completionist';
    detail = 'A large, low-duplication board portfolio.';
  } else if (Number(player['Unique Games'] || 0) <= 2 && Number(player['Performance Score'] || 0) / runs >= 55) {
    name = 'Specialist';
    detail = 'Concentrated, high-value results in a narrow part of the engine.';
  } else if (Number(player['Top 3s'] || 0) >= 5 && podiumRate >= 0.35) {
    name = 'Podium Machine';
    detail = `${Math.round(podiumRate * 100)}% of current runs are top-three finishes.`;
  }

  if (Number(player['Unique Games'] || 0) >= 5) traits.push('Wide engine coverage');
  if (Number(player.WRs || 0) >= 5) traits.push('Elite peak');
  if (Number(player['Unique Boards'] || 0) >= 40) traits.push('Deep portfolio');
  if (Number(player['Average Place'] || 99) <= 10) traits.push('Top-10 average');
  if (!traits.length) traits.push('Building momentum');
  return { name, detail, traits: traits.slice(0, 3) };
}

export function runnerRivalries(player: InsightPlayer, runs: InsightRun[], players: InsightPlayer[], limit = 5): Rivalry[] {
  const ownRuns = new Map(runs.filter((run) => run.runner === player.Runner).map((run) => [run.boardKey, run]));
  const playerMap = new Map(players.map((item) => [item.Runner, item]));
  const groups = new Map<string, { boards: Set<string>; close: number; wins: number; losses: number }>();
  for (const run of runs) {
    if (run.runner === player.Runner || !ownRuns.has(run.boardKey)) continue;
    const own = ownRuns.get(run.boardKey)!;
    const current = groups.get(run.runner) || { boards: new Set<string>(), close: 0, wins: 0, losses: 0 };
    if (current.boards.has(run.boardKey)) continue;
    current.boards.add(run.boardKey);
    if (Math.abs(Number(own.place) - Number(run.place)) <= 3) current.close += 1;
    if (Number(own.place) < Number(run.place)) current.wins += 1;
    else if (Number(run.place) < Number(own.place)) current.losses += 1;
    groups.set(run.runner, current);
  }
  return Array.from(groups.entries()).map(([runner, stats]) => {
    const rival = playerMap.get(runner);
    const gap = Math.abs(Number(player['Total Score']) - Number(rival?.['Total Score'] || 0));
    const proximity = Math.max(0, 1 - gap / Math.max(1, Number(player['Total Score']))) * 12;
    return { runner, rank: rival?.Rank || 0, flagUrl: rival?.['Flag URL'] || null, shared: stats.boards.size, close: stats.close, wins: stats.wins, losses: stats.losses, score: stats.boards.size * 2 + stats.close * 5 + Math.min(stats.wins, stats.losses) * 1.5 + proximity };
  }).sort((a, b) => b.score - a.score || b.shared - a.shared).slice(0, limit);
}

function median(values: number[]) {
  if (!values.length) return 0.5;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function goalTimeForPlace(runner: string, boardKey: string, place: number, runs: InsightRun[]) {
  const otherTimes = runs.filter((run) => run.boardKey === boardKey && run.runner !== runner && Number(run.seconds || 0) > 0).map((run) => Number(run.seconds)).sort((a, b) => a - b);
  if (!otherTimes.length) return 0;
  const threshold = otherTimes[Math.min(otherTimes.length - 1, Math.max(0, place - 1))];
  return Math.max(0.001, threshold - 0.001);
}

function targetPlaceFor(currentPlace: number) {
  if (currentPlace > 50) return Math.max(25, Math.floor(currentPlace * 0.75));
  if (currentPlace > 25) return 25;
  if (currentPlace > 10) return 10;
  if (currentPlace > 3) return 3;
  return Math.max(1, currentPlace - 1);
}

function targetLabel(currentPlace: number | null, proposedPlace: number) {
  if (proposedPlace === 1) return 'World-record push';
  if (proposedPlace <= 3) return 'Podium push';
  if (proposedPlace <= 10) return 'Top-10 push';
  if (proposedPlace <= 25) return 'Top-25 push';
  if (currentPlace) return `Move up ${currentPlace - proposedPlace} places`;
  return 'New-board benchmark';
}

export function nextTargets(player: InsightPlayer, runs: InsightRun[], boards: InsightBoard[], limit = 8): Target[] {
  const ownRuns = runs.filter((run) => run.runner === player.Runner);
  const ownByBoard = new Map(ownRuns.map((run) => [run.boardKey, run]));
  const typicalPercentile = Math.min(0.8, Math.max(0.02, median(ownRuns.filter((run) => run.boardSize > 0).map((run) => run.place / run.boardSize))));
  const games = new Set(ownRuns.map((run) => baseGameKey(run.gameToggle || run.gameAbbr)));
  const oldVolume = Math.sqrt(Number(player['Prolific Score'] || 0)) * 8;
  const oldVariety = Math.max(0, games.size - 1) * 10;
  const targets: Target[] = [];
  for (const board of boards) {
    const existing = ownByBoard.get(board.boardKey);
    const size = Math.max(1, Number(board.runCount || 0) + (existing ? 0 : 1));
    const proposedPlace = existing ? targetPlaceFor(Number(existing.place)) : Math.max(1, Math.min(size, Math.round(size * typicalPercentile)));
    if (existing && proposedPlace >= Number(existing.place)) continue;
    const goalSeconds = goalTimeForPlace(player.Runner, board.boardKey, proposedPlace, runs);
    if (!goalSeconds) continue;
    const estimatedPlace = projectedPlaceForTime(player.Runner, board.boardKey, goalSeconds, runs);
    const performanceGain = Math.max(0, runPerformanceScore(estimatedPlace, size) - Number(existing?.performancePoints || 0));
    const newGames = new Set(games);
    newGames.add(baseGameKey(board.gameAbbr));
    const volumeGain = existing ? 0 : Math.sqrt(Number(player['Prolific Score'] || 0) + 1) * 8 - oldVolume;
    const varietyGain = Math.max(0, newGames.size - 1) * 10 - oldVariety;
    const estimatedGain = performanceGain + volumeGain + varietyGain;
    if (estimatedGain > 0.05) targets.push({ board, currentPlace: existing ? Number(existing.place) : null, proposedPlace: estimatedPlace, performanceGain, estimatedGain, missing: !existing, currentSeconds: existing ? Number(existing.seconds || 0) : null, goalSeconds, goalTime: formatRunTime(goalSeconds), goalLabel: targetLabel(existing ? Number(existing.place) : null, estimatedPlace) });
  }
  return targets.sort((a, b) => b.estimatedGain - a.estimatedGain || b.board.runCount - a.board.runCount).slice(0, limit);
}

export function simulateRunnerScore(player: InsightPlayer, runs: InsightRun[], boards: InsightBoard[], scenarios: Array<{ boardKey: string; seconds: number }>) {
  const ownRuns = runs.filter((run) => run.runner === player.Runner);
  const ownByBoard = new Map(ownRuns.map((run) => [run.boardKey, run]));
  const boardMap = new Map(boards.map((board) => [board.boardKey, board]));
  const unique = new Map(scenarios.filter((scenario) => scenario.boardKey && scenario.seconds > 0).map((scenario) => [scenario.boardKey, scenario]));
  let performanceDelta = 0;
  let addedRuns = 0;
  const games = new Set(ownRuns.map((run) => baseGameKey(run.gameToggle || run.gameAbbr)));
  for (const scenario of unique.values()) {
    const board = boardMap.get(scenario.boardKey);
    if (!board) continue;
    const existing = ownByBoard.get(scenario.boardKey);
    const size = Math.max(1, Number(board.runCount || 0) + (existing ? 0 : 1));
    const place = projectedPlaceForTime(player.Runner, scenario.boardKey, scenario.seconds, runs);
    performanceDelta += runPerformanceScore(Math.min(size, place), size) - Number(existing?.performancePoints || 0);
    if (!existing) addedRuns += 1;
    games.add(baseGameKey(board.gameAbbr));
  }
  const oldRuns = Number(player['Prolific Score'] || 0);
  const volumeDelta = Math.sqrt(oldRuns + addedRuns) * 8 - Math.sqrt(oldRuns) * 8;
  const projectedVariety = Math.max(0, games.size - 1) * 10;
  const varietyDelta = projectedVariety - Number(player['Variety Bonus'] || 0);
  const delta = performanceDelta + volumeDelta + varietyDelta;
  return { score: Number(player['Total Score'] || 0) + delta, delta, performanceDelta, volumeDelta, varietyDelta, addedRuns };
}

export function projectedRank(players: InsightPlayer[], runner: string, score: number) {
  return 1 + players.filter((player) => player.Runner !== runner && Number(player['Total Score']) > score).length;
}

export function eraHallOfFame(rows: InsightHistoryRow[]): EraCareer[] {
  const peakByYear = new Map<number, number>();
  for (const row of rows) {
    const year = Number(row.year || 0);
    peakByYear.set(year, Math.max(peakByYear.get(year) || 0, Number(row.performanceScore || 0)));
  }
  const groups = new Map<string, Array<{ index: number; year: number; rank: number; country: string | null }>>();
  for (const row of rows) {
    const year = Number(row.year || 0);
    const peak = peakByYear.get(year) || 0;
    if (!year || !peak) continue;
    const list = groups.get(row.runner) || [];
    list.push({ index: Number(row.performanceScore || 0) / peak * 100, year, rank: Number(row.rank || 0), country: row.country });
    groups.set(row.runner, list);
  }
  return Array.from(groups.entries()).map(([runner, seasons]) => {
    seasons.sort((a, b) => b.index - a.index);
    const top = seasons.slice(0, 3);
    const weights = [0.5, 0.3, 0.2];
    const usedWeight = top.reduce((sum, _, index) => sum + weights[index], 0);
    const primeIndex = top.reduce((sum, season, index) => sum + season.index * weights[index], 0) / Math.max(usedWeight, 1);
    const longevityFactor = 0.85 + 0.15 * Math.min(1, seasons.length / 5);
    const rating = Math.min(100, primeIndex * longevityFactor);
    return { runner, country: seasons[0]?.country || null, rating, bestIndex: seasons[0]?.index || 0, bestYear: seasons[0]?.year || 0, bestRank: seasons[0]?.rank || 0, seasons: seasons.length, primeIndex };
  }).sort((a, b) => b.rating - a.rating || b.bestIndex - a.bestIndex);
}

const SEASON_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

export function engineSeason(runs: InsightRun[], players: InsightPlayer[], year: number): SeasonStanding[] {
  const countryByRunner = new Map(players.map((player) => [player.Runner, player.Country]));
  const monthGroups = new Map<string, Map<string, InsightRun[]>>();
  for (const run of runs) {
    const period = String(run.runDate || '').slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(period) || Number(period.slice(0, 4)) !== year) continue;
    const runners = monthGroups.get(period) || new Map<string, InsightRun[]>();
    const runnerRuns = runners.get(run.runner) || [];
    runnerRuns.push(run);
    runners.set(run.runner, runnerRuns);
    monthGroups.set(period, runners);
  }
  const groups = new Map<string, { country: string | null; points: number; wins: number; podiums: number; ranks: number[] }>();
  for (const runners of monthGroups.values()) {
    const monthly = Array.from(runners.entries()).map(([runner, runnerRuns]) => {
      const performance = runnerRuns.reduce((sum, run) => sum + Number(run.performancePoints || 0), 0);
      const games = new Set(runnerRuns.map((run) => baseGameKey(run.gameToggle || run.gameAbbr))).size;
      return { runner, score: performance + Math.sqrt(runnerRuns.length) * 8 + Math.max(0, games - 1) * 10 };
    }).sort((a, b) => b.score - a.score || a.runner.localeCompare(b.runner));
    monthly.forEach((row, index) => {
      const rank = index + 1;
      const current = groups.get(row.runner) || { country: countryByRunner.get(row.runner) || null, points: 0, wins: 0, podiums: 0, ranks: [] };
      current.points += SEASON_POINTS[index] || 0;
      current.wins += rank === 1 ? 1 : 0;
      current.podiums += rank <= 3 ? 1 : 0;
      current.ranks.push(rank);
      groups.set(row.runner, current);
    });
  }
  return Array.from(groups.entries()).map(([runner, stats]) => ({ runner, country: stats.country, points: stats.points, wins: stats.wins, podiums: stats.podiums, appearances: stats.ranks.length, averageRank: stats.ranks.reduce((sum, rank) => sum + rank, 0) / stats.ranks.length, bestRank: Math.min(...stats.ranks) })).sort((a, b) => b.points - a.points || b.wins - a.wins || a.averageRank - b.averageRank);
}

export function runnerCareerSnapshots(player: InsightPlayer, runs: InsightRun[]): CareerSnapshot[] {
  const ownRuns = runs.filter((run) => run.runner === player.Runner && /^\d{4}-\d{2}/.test(String(run.runDate || ''))).sort((a, b) => String(a.runDate).localeCompare(String(b.runDate)) || b.performancePoints - a.performancePoints);
  const periods = Array.from(new Set(ownRuns.map((run) => String(run.runDate).slice(0, 7)))).sort();
  let previousScore = 0;
  return periods.map((period) => {
    const included = ownRuns.filter((run) => String(run.runDate).slice(0, 7) <= period);
    const newRuns = ownRuns.filter((run) => String(run.runDate).slice(0, 7) === period).sort((a, b) => b.performancePoints - a.performancePoints);
    const performance = included.reduce((sum, run) => sum + Number(run.performancePoints || 0), 0);
    const games = new Set(included.map((run) => baseGameKey(run.gameToggle || run.gameAbbr))).size;
    const volume = Math.sqrt(included.length) * 8;
    const variety = Math.max(0, games - 1) * 10;
    const score = performance + volume + variety;
    const snapshot = { period, score, scoreGain: score - previousScore, performance, volume, variety, runs: included.length, boards: new Set(included.map((run) => run.boardKey)).size, games, wrs: included.reduce((sum, run) => sum + Number(run.wrCredit || 0), 0), newRuns };
    previousScore = score;
    return snapshot;
  });
}
