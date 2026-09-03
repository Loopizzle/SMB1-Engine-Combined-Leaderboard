'use client';

import { useState } from 'react';
import { Activity, ArrowDown, ArrowUp, Award, ExternalLink, Medal, Sparkles, UserPlus, X } from 'lucide-react';

export type UpdatePlayer = { key: string; runner: string; rank: number; previousRank?: number; rankDelta?: number; totalScore: number; scoreDelta?: number; runs: number; runDelta?: number; boards: number; wrs: number; wrDelta?: number; country: string | null };
export type UpdateRun = { id: string; runner: string; playerKey: string; gameAbbr: string; category: string; level: string | null; subcategory: string | null; place: number; time: string; verifiedAt: string | null; runDate: string | null; runLink: string | null; performancePoints: number; wrCredit: number };
export type ActivityData = {
  status: 'baseline' | 'ready'; fromGeneratedAt: string | null; toGeneratedAt: string | null; checkedAt: string | null; unchanged: boolean;
  summary: { newRuns: number; newRunners: number; rankMovers: number; scoreGainers: number; newWrs: number };
  newRuns: UpdateRun[]; newWrs: UpdateRun[]; newRunners: UpdatePlayer[]; rankMovers: UpdatePlayer[]; scoreGains: UpdatePlayer[];
};

type FeedTab = 'overview' | 'runs' | 'movers';

function formatNumber(value: number, decimals = 0) { return new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(Number(value || 0)); }
function dateLabel(value: string | null) { if (!value) return 'Awaiting first comparison'; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date); }
function safeRunUrl(value: string | null) { try { const url = new URL(value || ''); return url.protocol === 'https:' && (url.hostname === 'speedrun.com' || url.hostname.endsWith('.speedrun.com')) ? url.href : null; } catch { return null; } }
function boardName(run: UpdateRun, gameNames: Record<string, string>) { return `${gameNames[run.gameAbbr] || run.gameAbbr} · ${[run.category, run.level, run.subcategory].filter(Boolean).join(' · ')}`; }

export default function UpdateFeed({ activity, gameNames, myRunner, openProfile, close }: { activity: ActivityData | null; gameNames: Record<string, string>; myRunner: string; openProfile: (runner: string) => void; close: () => void }) {
  const [tab, setTab] = useState<FeedTab>('overview');
  const summary = activity?.summary || { newRuns: 0, newRunners: 0, rankMovers: 0, scoreGainers: 0, newWrs: 0 };
  const myGain = activity?.scoreGains.find((player) => player.runner === myRunner);
  const myMove = activity?.rankMovers.find((player) => player.runner === myRunner);
  const myRuns = activity?.newRuns.filter((run) => run.runner === myRunner) || [];
  const openRunner = (runner: string) => { close(); openProfile(runner); };

  return <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && close()}><aside className="drawer update-drawer" role="dialog" aria-modal="true" aria-label="Latest leaderboard update">
    <div className="drawer-header update-header"><div><p className="eyebrow">Since last data change</p><h3>Latest Update</h3><span>{dateLabel(activity?.fromGeneratedAt || null)} to {dateLabel(activity?.toGeneratedAt || null)}</span></div><button className="icon-button" aria-label="Close latest update" onClick={close}><X size={18} /></button></div>
    <div className="update-summary"><div><Activity size={16} /><strong>{formatNumber(summary.newRuns)}</strong><span>New runs</span></div><div><Award size={16} /><strong>{formatNumber(summary.newWrs)}</strong><span>New WRs</span></div><div><ArrowUp size={16} /><strong>{formatNumber(summary.rankMovers)}</strong><span>Rank moves</span></div><div><UserPlus size={16} /><strong>{formatNumber(summary.newRunners)}</strong><span>New runners</span></div></div>
    <nav className="update-tabs" aria-label="Latest update sections"><button className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>Overview</button><button className={tab === 'runs' ? 'active' : ''} onClick={() => setTab('runs')}>Runs <span>{summary.newRuns}</span></button><button className={tab === 'movers' ? 'active' : ''} onClick={() => setTab('movers')}>Movers</button></nav>
    <div className="update-body">
      {!activity || activity.status === 'baseline' ? <div className="update-empty"><Activity size={25} /><strong>Comparison baseline established</strong><p>The next successful data refresh will show new runs, rank movement and score changes here.</p></div> : <>
        {activity.unchanged && <p className="update-carry">The latest check found no additional leaderboard changes, so this is the most recent active update.</p>}
        {tab === 'overview' && <>
          {myRunner && <section className="my-update"><span>YOUR UPDATE</span><strong>{myRunner}</strong><div><b>{myRuns.length ? `+${myRuns.length} run${myRuns.length === 1 ? '' : 's'}` : 'No new runs'}</b><b>{myGain ? `+${formatNumber(myGain.scoreDelta || 0, 2)} points` : 'Score held'}</b><b>{myMove ? `${(myMove.rankDelta || 0) > 0 ? 'Up' : 'Down'} ${Math.abs(myMove.rankDelta || 0)} rank${Math.abs(myMove.rankDelta || 0) === 1 ? '' : 's'}` : 'Rank held'}</b></div></section>}
          <UpdateSection title="Biggest score gains" icon={<Sparkles size={16} />} empty="No positive score changes in this update.">{activity.scoreGains.slice(0, 10).map((player) => <button className="update-player-row" onClick={() => openRunner(player.runner)} key={player.key}><span className="update-rank">#{player.rank}</span><strong>{player.runner}<small>{player.runDelta ? `+${player.runDelta} current run${player.runDelta === 1 ? '' : 's'}` : 'Existing runs changed value'}</small></strong><em>+{formatNumber(player.scoreDelta || 0, 2)}</em></button>)}</UpdateSection>
          <UpdateSection title="New world records" icon={<Medal size={16} />} empty="No new current WRs in this update.">{activity.newWrs.slice(0, 10).map((run) => <RunRow run={run} gameNames={gameNames} openRunner={openRunner} key={`${run.id}-${run.playerKey}`} />)}</UpdateSection>
          <UpdateSection title="New runners" icon={<UserPlus size={16} />} empty="No runners entered the current ranks in this update.">{activity.newRunners.slice(0, 10).map((player) => <button className="update-player-row" onClick={() => openRunner(player.runner)} key={player.key}><span className="update-rank">#{player.rank}</span><strong>{player.runner}<small>{player.country || 'Unlisted country'} · {player.runs} current run{player.runs === 1 ? '' : 's'}</small></strong><em>{formatNumber(player.totalScore, 2)}</em></button>)}</UpdateSection>
        </>}
        {tab === 'runs' && <UpdateSection title="New and improved current runs" icon={<Activity size={16} />} empty="No new current runs in this update.">{activity.newRuns.map((run) => <RunRow run={run} gameNames={gameNames} openRunner={openRunner} key={`${run.id}-${run.playerKey}`} />)}</UpdateSection>}
        {tab === 'movers' && <>
          <UpdateSection title="Rank climbers" icon={<ArrowUp size={16} />} empty="No rank movement in this update.">{activity.rankMovers.filter((player) => (player.rankDelta || 0) > 0).slice(0, 30).map((player) => <MoverRow player={player} openRunner={openRunner} key={player.key} />)}</UpdateSection>
          <UpdateSection title="Rank drops" icon={<ArrowDown size={16} />} empty="No runners moved down in this update.">{activity.rankMovers.filter((player) => (player.rankDelta || 0) < 0).sort((a, b) => (a.rankDelta || 0) - (b.rankDelta || 0)).slice(0, 20).map((player) => <MoverRow player={player} openRunner={openRunner} key={player.key} />)}</UpdateSection>
        </>}
      </>}
    </div>
  </aside></div>;
}

function UpdateSection({ title, icon, empty, children }: { title: string; icon: React.ReactNode; empty: string; children: React.ReactNode }) { const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children); return <section className="update-section"><h4>{icon}{title}</h4>{hasChildren ? children : <p className="update-section-empty">{empty}</p>}</section>; }
function MoverRow({ player, openRunner }: { player: UpdatePlayer; openRunner: (runner: string) => void }) { const delta = player.rankDelta || 0; return <button className="update-player-row" onClick={() => openRunner(player.runner)}><span className="update-rank">#{player.rank}</span><strong>{player.runner}<small>Previously #{player.previousRank}</small></strong><em className={delta > 0 ? 'positive' : 'negative'}>{delta > 0 ? '+' : ''}{delta}</em></button>; }
function RunRow({ run, gameNames, openRunner }: { run: UpdateRun; gameNames: Record<string, string>; openRunner: (runner: string) => void }) { const link = safeRunUrl(run.runLink); return <div className="update-run-row"><button onClick={() => openRunner(run.runner)}><strong>{run.runner}<small>{boardName(run, gameNames)}</small></strong></button><span><b>#{run.place}</b><em>{run.time}</em></span>{link ? <a href={link} target="_blank" rel="noopener noreferrer" aria-label={`Open ${run.runner}'s run`}><ExternalLink size={14} /></a> : <i />}</div>; }
