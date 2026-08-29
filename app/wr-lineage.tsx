'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Crown, ExternalLink, Pause, Play, RotateCcw, TimerReset } from 'lucide-react';
import { formatRunTime, insightBoardLabel, type InsightBoard, type InsightCareerRun } from './insights';
import { wrLineage } from './history-analytics';

const GAME_ORDER = ['smb1', 'smbtll', 'annsmb', 'vssmb', 'smbce', 'smbtllce'];

function displayDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
}

function longevity(days: number) {
  if (days < 31) return `${days} day${days === 1 ? '' : 's'}`;
  if (days < 365) {
    const months = Math.round(days / 30.44);
    return `${months} month${months === 1 ? '' : 's'}`;
  }
  const years = days / 365.2425;
  return `${years.toFixed(years >= 10 ? 1 : 2)} year${years < 1.5 ? '' : 's'}`;
}

function safeRunLink(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && (url.hostname === 'speedrun.com' || url.hostname.endsWith('.speedrun.com')) ? url.toString() : null;
  } catch {
    return null;
  }
}

export default function WrLineage({ runs, boards, gameNames }: { runs: InsightCareerRun[]; boards: InsightBoard[]; gameNames: Record<string, string> }) {
  const availableBoardKeys = useMemo(() => new Set(runs.map((run) => run.boardKey)), [runs]);
  const games = useMemo(() => GAME_ORDER.filter((game) => boards.some((board) => board.gameAbbr === game && availableBoardKeys.has(board.boardKey))), [availableBoardKeys, boards]);
  const [game, setGame] = useState('smb1');
  const [boardKey, setBoardKey] = useState('');
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const activeGame = games.includes(game) ? game : games[0] || '';
  const gameBoards = useMemo(() => boards.filter((board) => board.gameAbbr === activeGame && availableBoardKeys.has(board.boardKey)).sort((a, b) => insightBoardLabel(a).localeCompare(insightBoardLabel(b))), [activeGame, availableBoardKeys, boards]);
  const preferredBoard = gameBoards.find((board) => board.category === 'Any%' && String(board.subcategory || '').includes('NTSC')) || gameBoards.find((board) => board.category === 'Any%') || gameBoards[0];
  const selectedBoard = gameBoards.find((board) => board.boardKey === boardKey) || preferredBoard;
  const events = useMemo(() => selectedBoard ? wrLineage(runs, selectedBoard.boardKey) : [], [runs, selectedBoard]);
  const activeIndex = Math.min(index, Math.max(0, events.length - 1));
  const event = events[activeIndex];
  const crownHolders = useMemo(() => {
    if (!event) return [];
    let lastRecord = activeIndex;
    while (lastRecord > 0 && events[lastRecord].kind !== 'record') lastRecord -= 1;
    return Array.from(new Set(events.slice(lastRecord, activeIndex + 1).map((item) => item.runner)));
  }, [activeIndex, event, events]);

  useEffect(() => {
    setBoardKey('');
    setIndex(0);
    setPlaying(false);
  }, [activeGame]);

  useEffect(() => {
    setIndex(0);
    setPlaying(false);
  }, [selectedBoard?.boardKey]);

  useEffect(() => {
    if (!playing || events.length < 2) return;
    if (activeIndex >= events.length - 1) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setIndex((current) => current + 1), 950);
    return () => window.clearTimeout(timer);
  }, [activeIndex, events.length, playing]);

  function togglePlayback() {
    if (activeIndex >= events.length - 1) setIndex(0);
    setPlaying((current) => !current || activeIndex >= events.length - 1);
  }

  return <section className="view-section lineage-view">
    <div className="page-heading"><div><p className="eyebrow">Every crown change in the accepted archive</p><h2>WR Lineage</h2></div><Crown size={28} /></div>
    <section className="lineage-controls" aria-label="WR Lineage filters">
      <label><span>Game</span><select value={activeGame} onChange={(change) => setGame(change.target.value)}>{games.map((item) => <option value={item} key={item}>{gameNames[item] || item}</option>)}</select></label>
      <label><span>Category and subcategory</span><select value={selectedBoard?.boardKey || ''} onChange={(change) => setBoardKey(change.target.value)}>{gameBoards.map((board) => <option value={board.boardKey} key={board.boardKey}>{insightBoardLabel(board)}</option>)}</select></label>
      <div className="lineage-archive-note"><CalendarDays size={17} /><span><strong>{events.length} crown events</strong>Performed date first, verification date only as fallback</span></div>
    </section>
    {event && selectedBoard ? <div className="lineage-layout">
      <section className="lineage-stage" aria-live="polite">
        <div className="lineage-stage-heading"><div><span>{gameNames[selectedBoard.gameAbbr] || selectedBoard.gameAbbr}</span><h3>{insightBoardLabel(selectedBoard)}</h3></div><em>{activeIndex + 1} / {events.length}</em></div>
        <div className="lineage-crown">
          <Crown size={31} />
          <span>{event.kind === 'tie' ? 'Shared crown' : crownHolders.length > 1 ? 'Shared world record' : 'World record holder'}</span>
          <strong>{crownHolders.join(' + ')}</strong>
          <b>{formatRunTime(event.seconds)}</b>
          <small>{displayDate(event.date)}</small>
        </div>
        <div className="lineage-stats">
          <div><span>Time saved</span><strong>{event.savedSeconds === null ? 'First mark' : event.savedSeconds === 0 ? 'Tied' : `-${formatRunTime(event.savedSeconds)}`}</strong></div>
          <div><span>Crown survived</span><strong>{longevity(event.survivedDays)}</strong></div>
          <div><span>Runner</span><strong>{event.runner}</strong></div>
        </div>
        <div className="lineage-playback">
          <button onClick={togglePlayback} disabled={events.length < 2}>{playing ? <Pause size={16} /> : <Play size={16} />}{playing ? 'Pause' : activeIndex >= events.length - 1 ? 'Replay' : 'Play history'}</button>
          <input type="range" min={0} max={Math.max(0, events.length - 1)} value={activeIndex} aria-label="WR Lineage position" onChange={(change) => { setPlaying(false); setIndex(Number(change.target.value)); }} />
          <button className="lineage-reset" title="Restart lineage" aria-label="Restart lineage" onClick={() => { setPlaying(false); setIndex(0); }}><RotateCcw size={16} /></button>
        </div>
      </section>
      <section className="lineage-timeline">
        <div className="lineage-timeline-heading"><div><span>Record progression</span><h3>Who took the crown, and for how long</h3></div><TimerReset size={22} /></div>
        <div className="lineage-event-list">{events.map((item, itemIndex) => {
          const link = safeRunLink(item.runLink);
          return <div className={`lineage-event-row ${itemIndex === activeIndex ? 'active' : ''} ${itemIndex < activeIndex ? 'past' : ''}`} key={item.id}><button onClick={() => { setPlaying(false); setIndex(itemIndex); }}>
              <span className="lineage-event-number">{itemIndex + 1}</span>
              <span className="lineage-event-runner"><strong>{item.runner}</strong><small>{displayDate(item.date)} · {item.kind === 'tie' ? 'Joined the crown' : item.savedSeconds === null ? 'Opened the lineage' : `${formatRunTime(item.savedSeconds || 0)} saved`}</small></span>
              <b>{formatRunTime(item.seconds)}</b>
              <em>{longevity(item.survivedDays)}</em>
            </button>{link ? <a href={link} target="_blank" rel="noopener noreferrer" aria-label={`Open ${item.runner}'s run`}><ExternalLink size={15} /></a> : <span />}</div>;
        })}</div>
      </section>
    </div> : <div className="lineage-empty"><Crown size={28} /><strong>No dated runs for this board</strong><span>Choose another game or category.</span></div>}
  </section>;
}
