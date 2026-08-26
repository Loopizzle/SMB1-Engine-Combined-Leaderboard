'use client';

import { Network, Sparkles, Target } from 'lucide-react';
import { nextTargets, runnerArchetype, runnerRivalries, type InsightBoard, type InsightPlayer, type InsightRun } from './insights';

function fmt(value: number) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value || 0));
}

export default function RunnerInsights({ player, players, runs, boards, gameNames, openProfile }: { player: InsightPlayer; players: InsightPlayer[]; runs: InsightRun[]; boards: InsightBoard[]; gameNames: Record<string, string>; openProfile: (runner: string) => void }) {
  const archetype = runnerArchetype(player);
  const rivals = runnerRivalries(player, runs, players, 3);
  const targets = nextTargets(player, runs, boards, 4);
  return <section className="profile-section profile-intelligence"><h4>Runner intelligence</h4><div className="profile-archetype"><Sparkles size={18} /><span><small>Archetype</small><strong>{archetype.name}</strong><em>{archetype.detail}</em></span></div><div className="profile-insight-block"><h5><Network size={15} /> Closest rivals</h5>{rivals.map((rival) => <button key={rival.runner} onClick={() => openProfile(rival.runner)}><span><strong>{rival.runner}</strong><small>{rival.shared} shared boards, {rival.close} close finishes</small></span><em>{rival.wins}-{rival.losses}</em></button>)}</div><div className="profile-insight-block"><h5><Target size={15} /> Next score targets</h5>{targets.map((target) => <div key={target.board.boardKey}><span><strong>{gameNames[target.board.gameAbbr] || target.board.gameAbbr} - {target.board.category}</strong><small>{target.missing ? 'New board' : `Improve from #${target.currentPlace}`} to projected #{target.proposedPlace}</small></span><em>+{fmt(target.estimatedGain)}</em></div>)}</div></section>;
}
