import { runPerformanceScore, type InsightCareerRun, type InsightPlayer } from './insights';

const TIME_TOLERANCE = 0.0005;
const DAY_MS = 86_400_000;

export type HistoricalImpactEntry = {
  runner: string;
  playerKey: string;
  country: string | null;
  flagUrl: string | null;
  impactScore: number;
  wrMonths: number;
  podiumMonths: number;
  top10Months: number;
  activeMonths: number;
  firstPeriod: string;
  lastPeriod: string;
  peakYear: number;
  peakYearScore: number;
};

export type WrLineageEvent = {
  id: string;
  runner: string;
  playerKey: string;
  date: string;
  seconds: number;
  savedSeconds: number | null;
  survivedDays: number;
  kind: 'record' | 'tie';
  runLink: string | null;
};

function identity(playerKey: string | undefined, runner: string) {
  const key = String(playerKey || '').trim();
  return key ? `key:${key}` : `runner:${String(runner || '').trim().toLocaleLowerCase()}`;
}

function archiveDate(run: InsightCareerRun) {
  const performed = String(run.runDate || '').slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(performed)) return performed;
  const verified = String(run.verifiedAt || '').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(verified) ? verified : '';
}

function archivePeriod(run: InsightCareerRun) {
  return archiveDate(run).slice(0, 7);
}

export function archiveYears(runs: InsightCareerRun[]) {
  const observed = Array.from(new Set(runs.map((run) => Number(archiveDate(run).slice(0, 4))).filter((year) => year >= 1900))).sort((a, b) => a - b);
  if (!observed.length) return [];
  return Array.from({ length: observed.at(-1)! - observed[0] + 1 }, (_, index) => observed[0] + index);
}

export function historicalImpact(runs: InsightCareerRun[], players: InsightPlayer[], startYear: number, endYear: number): HistoricalImpactEntry[] {
  const start = Math.min(startYear, endYear);
  const end = Math.max(startYear, endYear);
  const firstArchiveYear = Math.min(...archiveYears(runs), start);
  const lastPeriod = runs.map(archivePeriod).filter((period) => /^\d{4}-\d{2}$/.test(period)).sort().at(-1) || `${end}-12`;
  const lastArchiveYear = Math.min(end, Number(lastPeriod.slice(0, 4)) || end);
  const periods: string[] = [];
  for (let year = firstArchiveYear; year <= lastArchiveYear; year += 1) {
    const finalMonth = year === Number(lastPeriod.slice(0, 4)) ? Number(lastPeriod.slice(5, 7)) : 12;
    for (let month = 1; month <= finalMonth; month += 1) periods.push(`${year}-${String(month).padStart(2, '0')}`);
  }

  const byPeriod = new Map<string, InsightCareerRun[]>();
  const latestRunByIdentity = new Map<string, InsightCareerRun>();
  for (const run of runs) {
    const period = archivePeriod(run);
    const runner = String(run.runner || '').trim();
    const seconds = Number(run.seconds || 0);
    if (!/^\d{4}-\d{2}$/.test(period) || !runner || !run.boardKey || seconds <= 0) continue;
    const list = byPeriod.get(period) || [];
    list.push(run);
    byPeriod.set(period, list);
    const key = identity(run.playerKey, runner);
    const latest = latestRunByIdentity.get(key);
    if (!latest || archiveDate(latest) <= archiveDate(run)) latestRunByIdentity.set(key, run);
  }

  type BoardStanding = { performance: number; place: number };
  type ImpactState = {
    impactScore: number;
    wrMonths: number;
    podiumMonths: number;
    top10Months: number;
    activeMonths: number;
    firstPeriod: string;
    lastPeriod: string;
    yearly: Map<number, number>;
  };
  const boardRuns = new Map<string, Map<string, InsightCareerRun>>();
  const boardStandings = new Map<string, Map<string, BoardStanding>>();
  const impact = new Map<string, ImpactState>();

  for (const period of periods) {
    const touchedBoards = new Set<string>();
    for (const run of byPeriod.get(period) || []) {
      const key = identity(run.playerKey, run.runner);
      const entries = boardRuns.get(run.boardKey) || new Map<string, InsightCareerRun>();
      const current = entries.get(key);
      if (!current || Number(run.seconds) < Number(current.seconds) - TIME_TOLERANCE) {
        entries.set(key, run);
        boardRuns.set(run.boardKey, entries);
        touchedBoards.add(run.boardKey);
      }
    }

    for (const boardKey of touchedBoards) {
      const ranked = Array.from(boardRuns.get(boardKey) || []).sort((a, b) => Number(a[1].seconds) - Number(b[1].seconds) || a[0].localeCompare(b[0]));
      const standings = new Map<string, BoardStanding>();
      let previousSeconds = -1;
      let previousPlace = 0;
      ranked.forEach(([key, run], index) => {
        const seconds = Number(run.seconds);
        const place = index > 0 && Math.abs(seconds - previousSeconds) <= TIME_TOLERANCE ? previousPlace : index + 1;
        standings.set(key, { performance: runPerformanceScore(place, ranked.length), place });
        previousSeconds = seconds;
        previousPlace = place;
      });
      boardStandings.set(boardKey, standings);
    }

    const year = Number(period.slice(0, 4));
    if (year < start || year > end) continue;
    const activeThisMonth = new Set<string>();
    for (const standings of boardStandings.values()) {
      for (const [key, standing] of standings) {
        const state = impact.get(key) || { impactScore: 0, wrMonths: 0, podiumMonths: 0, top10Months: 0, activeMonths: 0, firstPeriod: period, lastPeriod: period, yearly: new Map<number, number>() };
        const monthlyImpact = standing.performance / 12;
        state.impactScore += monthlyImpact;
        state.wrMonths += standing.place === 1 ? 1 : 0;
        state.podiumMonths += standing.place <= 3 ? 1 : 0;
        state.top10Months += standing.place <= 10 ? 1 : 0;
        state.firstPeriod = state.firstPeriod < period ? state.firstPeriod : period;
        state.lastPeriod = state.lastPeriod > period ? state.lastPeriod : period;
        state.yearly.set(year, (state.yearly.get(year) || 0) + monthlyImpact);
        impact.set(key, state);
        activeThisMonth.add(key);
      }
    }
    for (const key of activeThisMonth) impact.get(key)!.activeMonths += 1;
  }

  const currentByIdentity = new Map(players.map((player) => [identity(player.playerKey, player.Runner), player]));
  return Array.from(impact.entries()).map(([key, state]) => {
    const current = currentByIdentity.get(key);
    const archive = latestRunByIdentity.get(key);
    const peak = Array.from(state.yearly.entries()).sort((a, b) => b[1] - a[1] || a[0] - b[0])[0] || [0, 0];
    return {
      runner: String(current?.Runner || archive?.runner || 'Unknown runner'),
      playerKey: String(current?.playerKey || archive?.playerKey || key),
      country: current?.Country || archive?.country || null,
      flagUrl: current?.['Flag URL'] || null,
      impactScore: state.impactScore,
      wrMonths: state.wrMonths,
      podiumMonths: state.podiumMonths,
      top10Months: state.top10Months,
      activeMonths: state.activeMonths,
      firstPeriod: state.firstPeriod,
      lastPeriod: state.lastPeriod,
      peakYear: Number(peak[0]),
      peakYearScore: Number(peak[1]),
    };
  }).sort((a, b) => b.impactScore - a.impactScore || b.wrMonths - a.wrMonths || b.podiumMonths - a.podiumMonths || a.runner.localeCompare(b.runner));
}

export function wrLineage(runs: InsightCareerRun[], boardKey: string, asOf = new Date()): WrLineageEvent[] {
  const dated = runs.filter((run) => run.boardKey === boardKey && Number(run.seconds || 0) > 0 && archiveDate(run)).sort((a, b) => archiveDate(a).localeCompare(archiveDate(b)) || Number(a.seconds) - Number(b.seconds) || String(a.id || '').localeCompare(String(b.id || '')));
  const events: WrLineageEvent[] = [];
  let recordSeconds = Number.POSITIVE_INFINITY;
  let holders = new Set<string>();
  for (const run of dated) {
    const seconds = Number(run.seconds);
    const key = identity(run.playerKey, run.runner);
    const isRecord = seconds < recordSeconds - TIME_TOLERANCE;
    const isTie = Number.isFinite(recordSeconds) && Math.abs(seconds - recordSeconds) <= TIME_TOLERANCE && !holders.has(key);
    if (!isRecord && !isTie) continue;
    const previousRecord = recordSeconds;
    if (isRecord) {
      recordSeconds = seconds;
      holders = new Set([key]);
    } else {
      holders.add(key);
    }
    events.push({
      id: String(run.id || `${boardKey}-${archiveDate(run)}-${key}-${seconds}`),
      runner: String(run.runner || 'Unknown runner'),
      playerKey: String(run.playerKey || key),
      date: archiveDate(run),
      seconds,
      savedSeconds: isRecord && Number.isFinite(previousRecord) ? previousRecord - seconds : isTie ? 0 : null,
      survivedDays: 0,
      kind: isTie ? 'tie' : 'record',
      runLink: run.runLink ? String(run.runLink) : null,
    });
  }

  const finalDate = Math.max(asOf.getTime(), ...dated.map((run) => Date.parse(archiveDate(run))).filter(Number.isFinite));
  for (let index = 0; index < events.length; index += 1) {
    const nextRecord = events.slice(index + 1).find((event) => event.kind === 'record');
    const end = nextRecord ? Date.parse(nextRecord.date) : finalDate;
    events[index].survivedDays = Math.max(0, Math.round((end - Date.parse(events[index].date)) / DAY_MS));
  }
  return events;
}
