export type InsightPlayer = {
  Rank: number;
  Runner: string;
  playerKey?: string;
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
  platform: string | null;
  hardware: string | null;
  verifiedAt?: string | null;
};

export type InsightCareerRun = {
  id?: string;
  runner: string;
  playerKey: string;
  boardKey: string;
  gameAbbr: string;
  gameToggle: string;
  category: string;
  level: string | null;
  subcategory: string | null;
  seconds: number;
  runDate: string | null;
  country?: string | null;
  verifiedAt?: string | null;
  time?: string;
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
  setupKey: string;
  setupLabel: string;
  setupSample: number;
  cadenceFps: number | null;
  cadenceLabel: string;
  benchmarkRunner: string;
  difficulty: string;
  effort: number;
  routeValue: number;
  recordTieCount: number;
  framesToFind: number | null;
};

export type InsightSetup = {
  key: string;
  platform: string;
  hardware: string | null;
  label: string;
  sample: number;
  fps: number | null;
  cadenceLabel: string;
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

export type DynastySeason = {
  year: number;
  rank: number;
  leaderShare: number;
  performanceScore: number;
};

export type DynastyCareer = {
  runner: string;
  country: string | null;
  titles: number;
  podiums: number;
  top10s: number;
  appearances: number;
  bestYear: number;
  bestRank: number;
  averageLeaderShare: number;
  seasons: Map<number, DynastySeason>;
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
  newRuns: InsightCareerRun[];
};

export type RaceMetric = 'score' | 'performance' | 'runs' | 'games';

export type CareerRacePoint = CareerSnapshot & {
  fieldRank: number;
};

export type CareerRaceSeries = {
  runner: string;
  country: string | null;
  flagUrl: string | null;
  points: CareerRacePoint[];
};

export type RankChaseStep = {
  target: Target;
  gain: number;
  projectedScore: number;
  projectedRank: number;
};

export type RankChasePlan = {
  targetRank: number;
  targetScore: number;
  requiredGain: number;
  projectedScore: number;
  projectedRank: number;
  remainingGap: number;
  reached: boolean;
  steps: RankChaseStep[];
};

export type MomentumEntry = {
  runner: string;
  country: string | null;
  flagUrl: string | null;
  rank: number;
  totalScore: number;
  scoreGain: number;
  performanceGain: number;
  volumeGain: number;
  varietyGain: number;
  recentRuns: number;
  recentBoards: number;
  recentGames: number;
  rankBefore: number;
  rankShift: number;
  latestDate: string | null;
  undatedRuns: number;
};

export type MomentumReport = {
  days: number;
  asOf: string | null;
  entries: MomentumEntry[];
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

export const NES_NTSC_FPS = 39375000 / 655171;
const TIME_TOLERANCE = 0.00075;

function boardText(board: Pick<InsightBoard, 'category' | 'level' | 'subcategory'> | Pick<InsightRun, 'category' | 'level' | 'subcategory'>) {
  return [board.category, board.level, board.subcategory].filter(Boolean).join(' ');
}

function boardRegion(board: Pick<InsightBoard, 'category' | 'level' | 'subcategory'> | Pick<InsightRun, 'category' | 'level' | 'subcategory'>) {
  const text = boardText(board);
  if (/\bPAL\b/i.test(text)) return 'PAL';
  if (/\bNTSC\b/i.test(text)) return 'NTSC';
  return 'Any';
}

export function setupKey(platform: string | null | undefined, hardware: string | null | undefined) {
  return `${String(platform || 'Unknown platform')}|||${String(hardware || '')}`;
}

function cadenceFor(platform: string, board: Pick<InsightBoard, 'category' | 'level' | 'subcategory'>) {
  const normalized = platform.toLocaleLowerCase();
  if (boardRegion(board) === 'PAL') return { fps: 50, label: '50 Hz PAL' };
  if (normalized.includes('switch')) return { fps: 60, label: '60 Hz Switch' };
  if (normalized.includes('wii virtual console') || normalized.includes('wii u virtual console')) return { fps: 60000 / 1001, label: '59.94 Hz Virtual Console' };
  if (normalized.includes('game boy advance')) return { fps: 59.7275, label: '59.73 Hz GBA' };
  if (normalized.includes('3ds virtual console')) return { fps: 60, label: '60 Hz 3DS VC' };
  if (/nintendo entertainment system|famicom disk system|mister|nes classic|analogue nt|retrousb avs|super nintendo|snes classic|analogue super nt|arcade/.test(normalized)) {
    return { fps: NES_NTSC_FPS, label: '60.099 Hz NTSC' };
  }
  return { fps: null, label: 'Accepted-time cadence' };
}

export function quantizeRunTime(seconds: number, setup: Pick<InsightSetup, 'fps'> | null | undefined) {
  if (!Number.isFinite(seconds) || seconds <= 0 || !setup?.fps) return seconds;
  return Math.max(1 / setup.fps, Math.round(seconds * setup.fps) / setup.fps);
}

function sameRegionPath(target: InsightBoard, setup: InsightSetup, ownRuns: InsightRun[]) {
  const region = boardRegion(target);
  if (region === 'Any') return true;
  return ownRuns.some((run) => setupKey(run.platform, run.hardware) === setup.key && boardRegion(run) === region);
}

export function eligibleSetupsForRunner(runner: string, board: InsightBoard, runs: InsightRun[]): InsightSetup[] {
  const ownRuns = runs.filter((run) => run.runner === runner);
  const ownSetupKeys = new Set(ownRuns.map((run) => setupKey(run.platform, run.hardware)));
  const boardRuns = runs.filter((run) => run.boardKey === board.boardKey && run.platform);
  const grouped = new Map<string, { platform: string; hardware: string | null; sample: number }>();
  for (const run of boardRuns) {
    const key = setupKey(run.platform, run.hardware);
    const current = grouped.get(key) || { platform: String(run.platform), hardware: run.hardware, sample: 0 };
    current.sample += 1;
    grouped.set(key, current);
  }
  return Array.from(grouped.entries()).map(([key, value]) => {
    const cadence = cadenceFor(value.platform, board);
    return { key, ...value, label: [value.platform, value.hardware].filter(Boolean).join(' · '), fps: cadence.fps, cadenceLabel: cadence.label };
  }).filter((candidate) => ownSetupKeys.has(candidate.key) && sameRegionPath(board, candidate, ownRuns)).sort((a, b) => b.sample - a.sample || a.label.localeCompare(b.label));
}

export function eligibleBoardsForRunner(runner: string, boards: InsightBoard[], runs: InsightRun[]) {
  const ownBoards = new Set(runs.filter((run) => run.runner === runner).map((run) => run.boardKey));
  return boards.filter((board) => ownBoards.has(board.boardKey) || eligibleSetupsForRunner(runner, board, runs).length > 0);
}

export function setupForScenario(runner: string, board: InsightBoard, requestedKey: string | undefined, runs: InsightRun[]) {
  const setups = eligibleSetupsForRunner(runner, board, runs);
  return setups.find((setup) => setup.key === requestedKey) || setups[0] || null;
}

export function scenarioSeconds(runner: string, board: InsightBoard, requestedKey: string | undefined, seconds: number, runs: InsightRun[]) {
  return quantizeRunTime(seconds, setupForScenario(runner, board, requestedKey, runs));
}

export function projectedPlaceForTime(runner: string, boardKey: string, seconds: number, runs: InsightRun[]) {
  if (!boardKey || !Number.isFinite(seconds) || seconds <= 0) return 0;
  return 1 + runs.filter((run) => run.boardKey === boardKey && run.runner !== runner && Number(run.seconds || 0) > 0 && Number(run.seconds) < seconds - TIME_TOLERANCE).length;
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

function targetPlaceFor(currentPlace: number) {
  const milestones = [1, 3, 5, 10, 15, 20, 25, 35, 50, 75, 100, 150, 200, 300, 500, 750, 1000];
  const next = [...milestones].reverse().find((place) => place < currentPlace);
  return next || Math.max(1, currentPlace - Math.max(1, Math.round(currentPlace * 0.1)));
}

function targetLabel(currentPlace: number | null, proposedPlace: number, recordTieCount: number) {
  if (!currentPlace && proposedPlace === 1 && recordTieCount > 1) return 'New category, record floor';
  if (!currentPlace && proposedPlace === 1) return 'New-category WR benchmark';
  if (!currentPlace) return 'New-category benchmark';
  if (proposedPlace === 1 && recordTieCount > 1) return 'Match the record floor';
  if (proposedPlace === 1) return 'World-record benchmark';
  if (proposedPlace <= 3) return 'Podium push';
  if (proposedPlace <= 10) return 'Top-10 push';
  if (proposedPlace <= 25) return 'Top-25 push';
  return `Move up ${currentPlace - proposedPlace} places`;
}

export function targetInstruction(target: Pick<Target, 'goalTime' | 'proposedPlace' | 'recordTieCount'>) {
  return target.proposedPlace === 1 && target.recordTieCount > 1 ? `Match ${target.goalTime}` : `${target.goalTime} or faster`;
}

function difficultyFor(place: number, size: number, recordTieCount: number) {
  if (place === 1 && recordTieCount > 1) return 'Solved record';
  const percentile = (place - 1) / Math.max(1, size - 1);
  if (place <= 3) return 'Elite';
  if (place <= 10 || percentile <= 0.05) return 'Very hard';
  if (percentile <= 0.15) return 'Hard';
  if (percentile <= 0.35) return 'Competitive';
  return 'Baseline';
}

function chooseBenchmark(runner: string, board: InsightBoard, setup: InsightSetup, desiredPlace: number, existing: InsightRun | undefined, runs: InsightRun[]) {
  const setupRuns = runs.filter((run) => run.boardKey === board.boardKey && setupKey(run.platform, run.hardware) === setup.key && run.runner !== runner && Number(run.seconds || 0) > 0);
  if (!existing && setupRuns.length < 3) return null;
  const candidates = existing ? setupRuns.filter((run) => Number(run.seconds) < Number(existing.seconds) - TIME_TOLERANCE) : setupRuns;
  const lowerBound = desiredPlace <= 5 ? 1 : Math.max(1, Math.floor(desiredPlace * 0.6));
  const bounded = candidates.filter((run) => Number(run.place) >= lowerBound);
  const fps = setup.fps;
  const oneFrameLeap = existing && fps ? candidates.filter((run) => (Number(existing.seconds) - Number(run.seconds)) * fps <= 2.25) : [];
  const pool = [...new Map([...bounded, ...oneFrameLeap].map((run) => [`${run.runner}|${run.seconds}`, run])).values()];
  return pool.sort((a, b) => Math.abs(Number(a.place) - desiredPlace) - Math.abs(Number(b.place) - desiredPlace) || Number(b.place) - Number(a.place) || Number(b.seconds) - Number(a.seconds))[0] || null;
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
    if (existing && Number(existing.place) <= 1) continue;
    const size = Math.max(1, Number(board.runCount || 0) + (existing ? 0 : 1));
    const desiredPlace = existing ? targetPlaceFor(Number(existing.place)) : Math.max(1, Math.min(size, Math.round(size * typicalPercentile)));
    if (existing && desiredPlace >= Number(existing.place)) continue;
    const boardRuns = runs.filter((run) => run.boardKey === board.boardKey && Number(run.seconds || 0) > 0);
    const recordTime = Math.min(...boardRuns.map((run) => Number(run.seconds)));
    const recordTieCount = boardRuns.filter((run) => Math.abs(Number(run.seconds) - recordTime) <= TIME_TOLERANCE).length;
    const setupTargets: Target[] = [];
    for (const setup of eligibleSetupsForRunner(player.Runner, board, runs)) {
      const benchmark = chooseBenchmark(player.Runner, board, setup, desiredPlace, existing, runs);
      if (!benchmark) continue;
      const goalSeconds = quantizeRunTime(Number(benchmark.seconds), setup);
      const estimatedPlace = projectedPlaceForTime(player.Runner, board.boardKey, goalSeconds, runs);
      if (existing && estimatedPlace >= Number(existing.place)) continue;
      const performanceGain = Math.max(0, runPerformanceScore(estimatedPlace, size) - Number(existing?.performancePoints || 0));
      const newGames = new Set(games);
      newGames.add(baseGameKey(board.gameAbbr));
      const volumeGain = existing ? 0 : Math.sqrt(Number(player['Prolific Score'] || 0) + 1) * 8 - oldVolume;
      const varietyGain = Math.max(0, newGames.size - 1) * 10 - oldVariety;
      const estimatedGain = performanceGain + volumeGain + varietyGain;
      if (estimatedGain <= 0.05) continue;
      const percentile = (estimatedPlace - 1) / Math.max(1, size - 1);
      const movement = existing ? Math.max(0, (Number(existing.place) - estimatedPlace) / Math.max(1, Number(existing.place))) : 0.2;
      let effort = 1 + (1 - percentile) * 3 + movement * 2 + (setup.sample < 10 ? 0.75 : 0);
      if (estimatedPlace === 1 && recordTieCount > 1) effort = Math.max(effort, 3);
      const sameSetup = existing && setupKey(existing.platform, existing.hardware) === setup.key;
      const framesToFind = sameSetup && setup.fps ? Math.max(1, Math.round((Number(existing.seconds) - goalSeconds) * setup.fps)) : null;
      setupTargets.push({
        board,
        currentPlace: existing ? Number(existing.place) : null,
        proposedPlace: estimatedPlace,
        performanceGain,
        estimatedGain,
        missing: !existing,
        currentSeconds: existing ? Number(existing.seconds || 0) : null,
        goalSeconds,
        goalTime: formatRunTime(goalSeconds),
        goalLabel: targetLabel(existing ? Number(existing.place) : null, estimatedPlace, recordTieCount),
        setupKey: setup.key,
        setupLabel: setup.label,
        setupSample: setup.sample,
        cadenceFps: setup.fps,
        cadenceLabel: setup.cadenceLabel,
        benchmarkRunner: benchmark.runner,
        difficulty: difficultyFor(estimatedPlace, size, recordTieCount),
        effort,
        routeValue: estimatedGain / effort,
        recordTieCount,
        framesToFind,
      });
    }
    const rankedSetups = setupTargets.sort((a, b) => b.routeValue - a.routeValue || b.estimatedGain - a.estimatedGain || a.effort - b.effort);
    const currentSetupKey = existing ? setupKey(existing.platform, existing.hardware) : '';
    const best = (existing ? rankedSetups.find((target) => target.setupKey === currentSetupKey) : null) || rankedSetups[0];
    if (best) targets.push(best);
  }
  return targets.sort((a, b) => b.routeValue - a.routeValue || b.estimatedGain - a.estimatedGain || b.board.runCount - a.board.runCount).slice(0, limit);
}

export function simulateRunnerScore(player: InsightPlayer, runs: InsightRun[], boards: InsightBoard[], scenarios: Array<{ boardKey: string; seconds: number; setupKey?: string }>) {
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
    const adjustedSeconds = scenarioSeconds(player.Runner, board, scenario.setupKey, scenario.seconds, runs);
    const place = projectedPlaceForTime(player.Runner, scenario.boardKey, adjustedSeconds, runs);
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

export function rankChasePlan(player: InsightPlayer, players: InsightPlayer[], runs: InsightRun[], boards: InsightBoard[], requestedRank: number, maxGoals = 8): RankChasePlan {
  const targetRank = Math.max(1, Math.min(Number(player.Rank || 1), Math.floor(Number(requestedRank || 1))));
  const otherScores = players.filter((item) => item.Runner !== player.Runner).map((item) => Number(item['Total Score'] || 0)).sort((a, b) => b - a);
  const targetScore = targetRank >= player.Rank ? Number(player['Total Score'] || 0) : Number(otherScores[Math.max(0, targetRank - 1)] || 0) + 0.01;
  const requiredGain = Math.max(0, targetScore - Number(player['Total Score'] || 0));
  const candidates = nextTargets(player, runs, boards, Math.max(boards.length, maxGoals)).slice(0, 48);
  const chosen: Target[] = [];
  const steps: RankChaseStep[] = [];
  let projection = simulateRunnerScore(player, runs, boards, []);

  while (projection.score < targetScore && chosen.length < maxGoals) {
    let best: { target: Target; projection: ReturnType<typeof simulateRunnerScore> } | null = null;
    for (const target of candidates) {
      if (chosen.some((item) => item.board.boardKey === target.board.boardKey)) continue;
      const trialTargets = [...chosen, target];
      const trial = simulateRunnerScore(player, runs, boards, trialTargets.map((item) => ({ boardKey: item.board.boardKey, seconds: item.goalSeconds, setupKey: item.setupKey })));
      const gain = trial.score - projection.score;
      const bestGain = best ? best.projection.score - projection.score : 0;
      if (!best || gain / Math.max(1, target.effort) > bestGain / Math.max(1, best.target.effort)) best = { target, projection: trial };
    }
    if (!best || best.projection.score <= projection.score + 0.001) break;
    const gain = best.projection.score - projection.score;
    chosen.push(best.target);
    projection = best.projection;
    steps.push({ target: best.target, gain, projectedScore: projection.score, projectedRank: projectedRank(players, player.Runner, projection.score) });
  }

  return {
    targetRank,
    targetScore,
    requiredGain,
    projectedScore: projection.score,
    projectedRank: projectedRank(players, player.Runner, projection.score),
    remainingGap: Math.max(0, targetScore - projection.score),
    reached: projection.score >= targetScore,
    steps,
  };
}

function activityMillis(run: InsightRun) {
  const value = run.verifiedAt || run.runDate;
  const parsed = value ? Date.parse(value) : NaN;
  return Number.isFinite(parsed) ? parsed : 0;
}

function portfolioParts(runs: InsightRun[]) {
  const games = new Set(runs.map((run) => baseGameKey(run.gameToggle || run.gameAbbr)));
  const performance = runs.reduce((sum, run) => sum + Number(run.performancePoints || 0), 0);
  const volume = Math.sqrt(runs.length) * 8;
  const variety = Math.max(0, games.size - 1) * 10;
  return { performance, volume, variety, total: performance + volume + variety, games };
}

export function momentumReport(players: InsightPlayer[], runs: InsightRun[], days = 90, now?: Date): MomentumReport {
  const datedRuns = runs.map((run) => ({ run, millis: activityMillis(run) })).filter((item) => item.millis > 0);
  const latestMillis = now?.getTime() || Math.max(...datedRuns.map((item) => item.millis), 0);
  const runsByRunner = new Map<string, InsightRun[]>();
  for (const run of runs) {
    const runnerRuns = runsByRunner.get(run.runner) || [];
    runnerRuns.push(run);
    runsByRunner.set(run.runner, runnerRuns);
  }
  if (!latestMillis) return { days, asOf: null, entries: players.map((player) => ({ runner: player.Runner, country: player.Country, flagUrl: player['Flag URL'], rank: Number(player.Rank || 0), totalScore: Number(player['Total Score'] || 0), scoreGain: 0, performanceGain: 0, volumeGain: 0, varietyGain: 0, recentRuns: 0, recentBoards: 0, recentGames: 0, rankBefore: Number(player.Rank || 0), rankShift: 0, latestDate: null, undatedRuns: (runsByRunner.get(player.Runner) || []).length })) };
  const cutoff = latestMillis - Math.max(1, days) * 86400000;
  const allEntries = players.map((player) => {
    const ownRuns = runsByRunner.get(player.Runner) || [];
    const dated = ownRuns.map((run) => ({ run, millis: activityMillis(run) })).filter((item) => item.millis > 0);
    const recent = dated.filter((item) => item.millis >= cutoff).map((item) => item.run);
    const before = dated.filter((item) => item.millis < cutoff).map((item) => item.run);
    const beforeParts = portfolioParts(before);
    const currentParts = portfolioParts(dated.map((item) => item.run));
    const recentParts = portfolioParts(recent);
    const recentBoards = new Set(recent.map((run) => run.boardKey));
    const beforeBoards = new Set(before.map((run) => run.boardKey));
    const latestDate = dated.reduce((latest, item) => item.millis > latest ? item.millis : latest, 0);
    const scoreGain = currentParts.total - beforeParts.total;
    return {
      runner: player.Runner,
      country: player.Country,
      flagUrl: player['Flag URL'],
      rank: Number(player.Rank || 0),
      totalScore: Number(player['Total Score'] || 0),
      scoreGain,
      performanceGain: currentParts.performance - beforeParts.performance,
      volumeGain: currentParts.volume - beforeParts.volume,
      varietyGain: currentParts.variety - beforeParts.variety,
      recentRuns: recent.length,
      recentBoards: Array.from(recentBoards).filter((board) => !beforeBoards.has(board)).length,
      recentGames: Array.from(recentParts.games).filter((game) => !beforeParts.games.has(game)).length,
      rankBefore: 0,
      rankShift: 0,
      latestDate: latestDate ? new Date(latestDate).toISOString() : null,
      undatedRuns: ownRuns.length - dated.length,
    };
  });
  const baselineOrder = allEntries.map((entry, index) => ({ index, score: portfolioParts((runsByRunner.get(entry.runner) || []).filter((run) => activityMillis(run) > 0 && activityMillis(run) < cutoff)).total, runner: entry.runner })).sort((a, b) => b.score - a.score || a.runner.localeCompare(b.runner));
  baselineOrder.forEach((item, index) => { allEntries[item.index].rankBefore = index + 1; allEntries[item.index].rankShift = allEntries[item.index].rankBefore - allEntries[item.index].rank; });
  return { days: Math.max(1, days), asOf: new Date(latestMillis).toISOString(), entries: allEntries.sort((a, b) => b.scoreGain - a.scoreGain || b.recentRuns - a.recentRuns || a.rank - b.rank || a.runner.localeCompare(b.runner)) };
}

export function dynastyTable(rows: InsightHistoryRow[], startYear: number, endYear: number): DynastyCareer[] {
  const peakByYear = new Map<number, number>();
  for (const row of rows) {
    const year = Number(row.year || 0);
    if (year < startYear || year > endYear) continue;
    peakByYear.set(year, Math.max(peakByYear.get(year) || 0, Number(row.performanceScore || 0)));
  }
  const groups = new Map<string, { country: string | null; seasons: Map<number, DynastySeason> }>();
  for (const row of rows) {
    const year = Number(row.year || 0);
    const peak = peakByYear.get(year) || 0;
    if (year < startYear || year > endYear || !peak) continue;
    const current = groups.get(row.runner) || { country: row.country, seasons: new Map<number, DynastySeason>() };
    current.seasons.set(year, { year, rank: Number(row.rank || 0), leaderShare: Number(row.performanceScore || 0) / peak * 100, performanceScore: Number(row.performanceScore || 0) });
    groups.set(row.runner, current);
  }
  return Array.from(groups.entries()).map(([runner, data]) => {
    const seasons = Array.from(data.seasons.values());
    const best = [...seasons].sort((a, b) => a.rank - b.rank || b.leaderShare - a.leaderShare)[0];
    return {
      runner,
      country: data.country,
      titles: seasons.filter((season) => season.rank === 1).length,
      podiums: seasons.filter((season) => season.rank <= 3).length,
      top10s: seasons.filter((season) => season.rank <= 10).length,
      appearances: seasons.length,
      bestYear: best?.year || 0,
      bestRank: best?.rank || 0,
      averageLeaderShare: seasons.reduce((sum, season) => sum + season.leaderShare, 0) / Math.max(1, seasons.length),
      seasons: data.seasons,
    };
  }).sort((a, b) => b.titles - a.titles || b.podiums - a.podiums || b.top10s - a.top10s || b.averageLeaderShare - a.averageLeaderShare || a.runner.localeCompare(b.runner));
}

const SEASON_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

export function engineSeason(runs: InsightRun[], players: InsightPlayer[], year: number): SeasonStanding[] {
  const countryByRunner = new Map(players.map((player) => [player.Runner, player.Country]));
  const monthGroups = new Map<string, Map<string, InsightRun[]>>();
  for (const run of runs) {
    const runner = String(run.runner || '').trim();
    const period = String(run.runDate || '').slice(0, 7);
    if (!runner || !/^\d{4}-\d{2}$/.test(period) || Number(period.slice(0, 4)) !== year) continue;
    const runners = monthGroups.get(period) || new Map<string, InsightRun[]>();
    const runnerRuns = runners.get(runner) || [];
    runnerRuns.push(run);
    runners.set(runner, runnerRuns);
    monthGroups.set(period, runners);
  }
  const groups = new Map<string, { country: string | null; points: number; wins: number; podiums: number; ranks: number[] }>();
  for (const runners of monthGroups.values()) {
    const monthly = Array.from(runners.entries()).map(([runner, runnerRuns]) => {
      const performance = runnerRuns.reduce((sum, run) => sum + Number(run.performancePoints || 0), 0);
      const games = new Set(runnerRuns.map((run) => baseGameKey(run.gameToggle || run.gameAbbr))).size;
      return { runner, score: performance + Math.sqrt(runnerRuns.length) * 8 + Math.max(0, games - 1) * 10 };
    }).sort((a, b) => b.score - a.score || String(a.runner).localeCompare(String(b.runner)));
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

function careerIdentity(playerKey: string | undefined, runner: string) {
  const key = String(playerKey || '').trim();
  return key ? `key:${key}` : `runner:${String(runner || '').trim().toLocaleLowerCase()}`;
}

export function careerRace(players: InsightPlayer[], runs: InsightCareerRun[], selectedRunners: string[], startYear = 2015, now = new Date()): { periods: string[]; series: CareerRaceSeries[] } {
  const periods: string[] = [];
  for (let year = startYear; year <= now.getUTCFullYear(); year += 1) {
    const finalMonth = year === now.getUTCFullYear() ? now.getUTCMonth() + 1 : 12;
    for (let month = 1; month <= finalMonth; month += 1) periods.push(`${year}-${String(month).padStart(2, '0')}`);
  }

  const periodSet = new Set(periods);
  const playerByName = new Map(players.map((player) => [String(player.Runner), player]));
  const playerByIdentity = new Map(players.map((player) => [careerIdentity(player.playerKey, String(player.Runner)), player]));
  const selected = selectedRunners.map((runner) => {
    const player = playerByName.get(String(runner));
    return { runner: String(runner), player, identity: careerIdentity(player?.playerKey, String(runner)) };
  });
  const byPeriod = new Map<string, InsightCareerRun[]>();
  for (const run of runs) {
    const runner = String(run.runner || '').trim();
    const period = String(run.runDate || '').slice(0, 7);
    if (!runner || !periodSet.has(period) || !run.boardKey || Number(run.seconds || 0) <= 0) continue;
    const list = byPeriod.get(period) || [];
    list.push({ ...run, runner, playerKey: String(run.playerKey || '') });
    byPeriod.set(period, list);
  }

  type MutableCareer = { runner: string; performance: number; runs: Map<string, InsightCareerRun>; games: Set<string>; wrs: number };
  type BoardScore = { performance: number; wr: number };
  const states = new Map<string, MutableCareer>();
  const boardRuns = new Map<string, Map<string, InsightCareerRun>>();
  const boardScores = new Map<string, Map<string, BoardScore>>();
  const pointsByRunner = new Map(selected.map((item) => [item.runner, [] as CareerRacePoint[]]));
  const previousScore = new Map<string, number>();

  function stateFor(identity: string, run: InsightCareerRun) {
    const current = states.get(identity);
    if (current) return current;
    const player = playerByIdentity.get(identity);
    const created = { runner: String(player?.Runner || run.runner), performance: 0, runs: new Map<string, InsightCareerRun>(), games: new Set<string>(), wrs: 0 };
    states.set(identity, created);
    return created;
  }

  for (const period of periods) {
    const additions = byPeriod.get(period) || [];
    const touchedBoards = new Set<string>();
    for (const run of additions) {
      const identity = careerIdentity(run.playerKey, run.runner);
      const state = stateFor(identity, run);
      const entries = boardRuns.get(run.boardKey) || new Map<string, InsightCareerRun>();
      const existing = entries.get(identity);
      if (!existing || Number(run.seconds) < Number(existing.seconds) - 0.0005) {
        entries.set(identity, run);
        boardRuns.set(run.boardKey, entries);
        state.runs.set(run.boardKey, run);
        state.games.add(baseGameKey(run.gameToggle || run.gameAbbr));
        touchedBoards.add(run.boardKey);
      }
    }

    for (const boardKey of touchedBoards) {
      for (const [identity, oldScore] of boardScores.get(boardKey) || []) {
        const state = states.get(identity);
        if (!state) continue;
        state.performance = Math.max(0, state.performance - oldScore.performance);
        state.wrs = Math.max(0, state.wrs - oldScore.wr);
      }
      const ranked = Array.from(boardRuns.get(boardKey) || []).sort((a, b) => Number(a[1].seconds) - Number(b[1].seconds) || a[0].localeCompare(b[0]));
      const scores = new Map<string, BoardScore>();
      let previousSeconds = -1;
      let previousPlace = 0;
      ranked.forEach(([identity, run], index) => {
        const seconds = Number(run.seconds);
        const place = index > 0 && Math.abs(seconds - previousSeconds) <= 0.0005 ? previousPlace : index + 1;
        const score = { performance: runPerformanceScore(place, ranked.length), wr: place === 1 ? 1 : 0 };
        const state = states.get(identity)!;
        state.performance += score.performance;
        state.wrs += score.wr;
        scores.set(identity, score);
        previousSeconds = seconds;
        previousPlace = place;
      });
      boardScores.set(boardKey, scores);
    }

    const scoreByRunner = Array.from(states.entries()).map(([identity, state]) => ({ identity, runner: state.runner, score: state.performance + Math.sqrt(state.runs.size) * 8 + Math.max(0, state.games.size - 1) * 10 })).sort((a, b) => b.score - a.score || a.runner.localeCompare(b.runner));
    const rankByRunner = new Map(scoreByRunner.map((item, index) => [item.identity, index + 1]));
    for (const item of selected) {
      const state = states.get(item.identity);
      const performance = state?.performance || 0;
      const runCount = state?.runs.size || 0;
      const games = state?.games.size || 0;
      const volume = Math.sqrt(runCount) * 8;
      const variety = Math.max(0, games - 1) * 10;
      const score = performance + volume + variety;
      const newRuns = additions.filter((run) => careerIdentity(run.playerKey, run.runner) === item.identity).sort((a, b) => String(a.runDate || '').localeCompare(String(b.runDate || '')) || String(a.id || '').localeCompare(String(b.id || '')));
      const list = pointsByRunner.get(item.runner)!;
      list.push({ period, score, scoreGain: score - (previousScore.get(item.runner) || 0), performance, volume, variety, runs: runCount, boards: runCount, games, wrs: state?.wrs || 0, newRuns, fieldRank: rankByRunner.get(item.identity) || 0 });
      previousScore.set(item.runner, score);
    }
  }

  return {
    periods,
    series: selected.map(({ runner, player }) => ({ runner, country: player?.Country || null, flagUrl: player?.['Flag URL'] || null, points: pointsByRunner.get(runner) || [] })),
  };
}
