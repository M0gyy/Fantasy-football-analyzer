import React, { useState } from 'react';
import {
  Layers,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Zap,
  Info,
  ChevronRight,
  Sparkles,
  BarChart3,
  Award
} from 'lucide-react';
import { RosterSlot, Player } from '../types';
import { getInjuryBadgeColor } from '../utils/fantasyCalculators';

interface TeamDepthChartProps {
  roster: RosterSlot[];
  onSelectPlayer: (player: Player) => void;
}

interface PositionalBenchmark {
  pos: 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DEF';
  leagueAvgPoints: number;
  minRecommendedDepth: number;
  label: string;
}

const LEAGUE_BENCHMARKS: Record<string, PositionalBenchmark> = {
  QB: { pos: 'QB', leagueAvgPoints: 19.5, minRecommendedDepth: 2, label: 'Quarterbacks' },
  RB: { pos: 'RB', leagueAvgPoints: 32.0, minRecommendedDepth: 4, label: 'Running Backs' },
  WR: { pos: 'WR', leagueAvgPoints: 34.5, minRecommendedDepth: 5, label: 'Wide Receivers' },
  TE: { pos: 'TE', leagueAvgPoints: 10.5, minRecommendedDepth: 2, label: 'Tight Ends' },
  K:  { pos: 'K',  leagueAvgPoints: 8.0,  minRecommendedDepth: 1, label: 'Kickers' },
  DEF:{ pos: 'DEF',leagueAvgPoints: 7.5,  minRecommendedDepth: 1, label: 'Defenses' }
};

export const TeamDepthChart: React.FC<TeamDepthChartProps> = ({
  roster,
  onSelectPlayer
}) => {
  const [activeTab, setActiveTab] = useState<'CHART' | 'HEATMAP'>('CHART');
  const [selectedPosFilter, setSelectedPosFilter] = useState<string>('ALL');

  // Gather all rostered players
  const allRosteredPlayers: { player: Player; slotName: string; isStarter: boolean }[] = [];
  roster.forEach(slot => {
    if (slot.player) {
      allRosteredPlayers.push({
        player: slot.player,
        slotName: slot.slotName,
        isStarter: slot.slotName !== 'BENCH' && slot.slotName !== 'IR'
      });
    }
  });

  const positions = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'] as const;

  // Group players by position
  const depthByPosition = positions.map(pos => {
    const list = allRosteredPlayers.filter(item => item.player.position === pos);
    // Sort starters first, then highest projected points
    list.sort((a, b) => {
      if (a.isStarter !== b.isStarter) return a.isStarter ? -1 : 1;
      return b.player.projectedPoints - a.player.projectedPoints;
    });

    const starters = list.filter(i => i.isStarter);
    const starterPoints = starters.reduce((acc, i) => acc + i.player.projectedPoints, 0);

    const benchmark = LEAGUE_BENCHMARKS[pos];
    const totalPosPoints = starterPoints > 0 ? starterPoints : (list[0]?.player.projectedPoints || 0);
    const diffPct = Math.round(((totalPosPoints - benchmark.leagueAvgPoints) / benchmark.leagueAvgPoints) * 100);

    let ratingStatus: 'ELITE' | 'STRENGTH' | 'AVERAGE' | 'NEED' | 'WEAKNESS';
    let ratingColor: string;
    let badgeBg: string;

    if (diffPct >= 15) {
      ratingStatus = 'ELITE';
      ratingColor = 'text-emerald-400';
      badgeBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    } else if (diffPct >= 5) {
      ratingStatus = 'STRENGTH';
      ratingColor = 'text-indigo-400';
      badgeBg = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
    } else if (diffPct >= -5) {
      ratingStatus = 'AVERAGE';
      ratingColor = 'text-zinc-300';
      badgeBg = 'bg-zinc-800 text-zinc-300 border-zinc-700';
    } else if (diffPct >= -15) {
      ratingStatus = 'NEED';
      ratingColor = 'text-amber-400';
      badgeBg = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    } else {
      ratingStatus = 'WEAKNESS';
      ratingColor = 'text-rose-400';
      badgeBg = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }

    return {
      pos,
      benchmark,
      players: list,
      startersCount: starters.length,
      totalCount: list.length,
      starterPoints,
      diffPct,
      ratingStatus,
      ratingColor,
      badgeBg
    };
  });

  const filteredPositions = depthByPosition.filter(item => {
    if (selectedPosFilter === 'ALL') return true;
    return item.pos === selectedPosFilter;
  });

  // Calculate overall roster balance score
  const totalStartersScore = depthByPosition.reduce((acc, item) => acc + item.starterPoints, 0);
  const totalBenchmarkScore = depthByPosition.reduce((acc, item) => acc + item.benchmark.leagueAvgPoints, 0);
  const totalRosterDiffPct = Math.round(((totalStartersScore - totalBenchmarkScore) / totalBenchmarkScore) * 100);

  const keyStrengths = depthByPosition.filter(p => p.ratingStatus === 'ELITE' || p.ratingStatus === 'STRENGTH');
  const keyWeaknesses = depthByPosition.filter(p => p.ratingStatus === 'NEED' || p.ratingStatus === 'WEAKNESS');

  return (
    <div id="team-depth-chart-container" className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-4 font-mono shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">TEAM POSITIONAL DEPTH CHART</h2>
              <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800/80 px-2 py-0.5 rounded font-mono">
                League Benchmark
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
              Roster depth hierarchy & positional power ratings compared against 12-team league baseline averages.
            </p>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded border border-zinc-800 text-xs self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('CHART')}
            className={`px-3 py-1 rounded font-bold transition-all cursor-pointer ${
              activeTab === 'CHART' ? 'bg-purple-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Visual Depth
          </button>
          <button
            onClick={() => setActiveTab('HEATMAP')}
            className={`px-3 py-1 rounded font-bold transition-all cursor-pointer ${
              activeTab === 'HEATMAP' ? 'bg-purple-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Power Matrix
          </button>
        </div>
      </div>

      {/* Roster Power Rating Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg font-sans">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-indigo-400 shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase block">ROSTER OVERALL POWER</span>
            <div className="text-sm font-bold font-mono text-white flex items-center gap-2">
              <span>{totalStartersScore.toFixed(1)} PPG</span>
              <span className={`text-xs px-1.5 py-0.2 rounded border font-mono ${
                totalRosterDiffPct >= 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}>
                {totalRosterDiffPct >= 0 ? `+${totalRosterDiffPct}% vs Avg` : `${totalRosterDiffPct}% vs Avg`}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 border-t md:border-t-0 md:border-l border-zinc-800 pt-2 md:pt-0 md:pl-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-zinc-300 block">KEY STRENGTHS</span>
            <span className="text-zinc-400 text-[11px]">
              {keyStrengths.length > 0
                ? keyStrengths.map(s => s.pos).join(', ') + ' group above league expectations'
                : 'Balanced positional distribution'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 border-t md:border-t-0 md:border-l border-zinc-800 pt-2 md:pt-0 md:pl-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-zinc-300 block">TRADE / WAIVER NEEDS</span>
            <span className="text-zinc-400 text-[11px]">
              {keyWeaknesses.length > 0
                ? keyWeaknesses.map(w => w.pos).join(', ') + ' targeted for depth upgrade'
                : 'No urgent positional deficits detected'}
            </span>
          </div>
        </div>
      </div>

      {/* Position Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider mr-1">Filter:</span>
        {['ALL', 'QB', 'RB', 'WR', 'TE', 'K', 'DEF'].map(p => (
          <button
            key={p}
            onClick={() => setSelectedPosFilter(p)}
            className={`px-2.5 py-1 rounded font-bold transition-colors cursor-pointer ${
              selectedPosFilter === p
                ? 'bg-zinc-800 text-white border border-zinc-700'
                : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* View Mode 1: VISUAL DEPTH CHART GRID */}
      {activeTab === 'CHART' && (
        <div className="space-y-3">
          {filteredPositions.map(posData => (
            <div
              key={posData.pos}
              className="bg-zinc-900/90 border border-zinc-800/90 rounded-lg p-3 space-y-3 hover:border-zinc-700/80 transition-all"
            >
              {/* Positional Row Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-800/80">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded bg-purple-600/20 border border-purple-500/40 text-purple-300 font-bold text-xs flex items-center justify-center font-mono">
                    {posData.pos}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs font-sans">
                        {posData.benchmark.label}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${posData.badgeBg}`}>
                        {posData.ratingStatus}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {posData.totalCount} Rostered ({posData.startersCount} Starters) • Min Rec: {posData.benchmark.minRecommendedDepth}
                    </span>
                  </div>
                </div>

                {/* Score vs Benchmark Meter */}
                <div className="flex items-center gap-3 text-xs">
                  <div className="text-right font-mono">
                    <span className="text-[10px] text-zinc-500 block">STARTER PROJ</span>
                    <span className="font-bold text-indigo-400">{posData.starterPoints.toFixed(1)} pts</span>
                  </div>

                  <div className="text-right font-mono border-l border-zinc-800 pl-3">
                    <span className="text-[10px] text-zinc-500 block">LEAGUE AVG</span>
                    <span className="text-zinc-400">{posData.benchmark.leagueAvgPoints.toFixed(1)} pts</span>
                  </div>

                  <div className="text-right font-mono border-l border-zinc-800 pl-3">
                    <span className="text-[10px] text-zinc-500 block">DELTA</span>
                    <span className={`font-bold ${posData.ratingColor}`}>
                      {posData.diffPct >= 0 ? `+${posData.diffPct}%` : `${posData.diffPct}%`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Player Depth Cards Horizontal Hierarchy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {posData.players.length === 0 ? (
                  <div className="col-span-full py-3 text-center text-xs text-zinc-600 bg-zinc-950/40 rounded border border-zinc-800/40 italic">
                    No active {posData.pos} rostered. Consider waiver wire claim.
                  </div>
                ) : (
                  posData.players.map((item, idx) => {
                    const p = item.player;
                    const depthLabel = item.isStarter ? `${posData.pos}${idx + 1} (Starter)` : `BN${idx + 1} (Backup)`;

                    return (
                      <div
                        key={p.id}
                        onClick={() => onSelectPlayer(p)}
                        className={`p-2.5 rounded-lg border transition-all cursor-pointer font-sans space-y-1.5 ${
                          item.isStarter
                            ? 'bg-zinc-950 border-indigo-500/40 hover:border-indigo-400 shadow-sm'
                            : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                            item.isStarter ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}>
                            {depthLabel}
                          </span>
                          <span className={`text-[9px] font-mono font-bold px-1 py-0.2 rounded border ${getInjuryBadgeColor(p.injuryStatus)}`}>
                            {p.injuryStatus}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-xs text-zinc-100 hover:text-indigo-400 transition-colors truncate">
                            {p.name}
                          </h4>
                          <p className="text-[10px] font-mono text-zinc-500">
                            {p.team} {p.opponent}
                          </p>
                        </div>

                        <div className="pt-1 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono">
                          <span className="text-zinc-400">Proj: <strong className="text-amber-400">{p.projectedPoints.toFixed(1)}</strong></span>
                          <span className="text-zinc-500">Avg: {p.avgPoints}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Mode 2: HEATMAP POWER MATRIX */}
      {activeTab === 'HEATMAP' && (
        <div className="space-y-3 font-sans">
          <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-lg space-y-2">
            <h3 className="text-xs font-bold font-mono text-zinc-300 uppercase tracking-wider">
              Positional Power Matrix & League Benchmark Deviation
            </h3>

            <div className="space-y-2.5 pt-1">
              {depthByPosition.map(pData => (
                <div key={pData.pos} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-white w-12">{pData.pos}</span>
                    <span className="text-zinc-400 text-[11px] flex-1 px-2">
                      {pData.totalCount} Rostered ({pData.starterPoints.toFixed(1)} vs {pData.benchmark.leagueAvgPoints.toFixed(1)} Avg)
                    </span>
                    <span className={`font-bold ${pData.ratingColor}`}>
                      {pData.diffPct >= 0 ? `+${pData.diffPct}%` : `${pData.diffPct}%`} ({pData.ratingStatus})
                    </span>
                  </div>

                  {/* Relative bar meter */}
                  <div className="w-full bg-zinc-950 rounded-full h-2.5 overflow-hidden border border-zinc-800 flex">
                    <div
                      className={`h-full transition-all duration-500 ${
                        pData.diffPct >= 15
                          ? 'bg-emerald-500'
                          : pData.diffPct >= 5
                          ? 'bg-indigo-500'
                          : pData.diffPct >= -5
                          ? 'bg-zinc-400'
                          : pData.diffPct >= -15
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(15, 50 + pData.diffPct))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
