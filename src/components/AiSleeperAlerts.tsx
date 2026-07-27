import React, { useState, useEffect } from 'react';
import {
  Zap,
  Sparkles,
  TrendingUp,
  Flame,
  Target,
  UserCheck,
  RefreshCw,
  Eye,
  CheckCircle2,
  ChevronRight,
  Filter,
  BarChart2,
  Activity
} from 'lucide-react';
import { Player, LeagueSettings } from '../types';
import { MOCK_PLAYERS } from '../data/mockData';

interface AiSleeperAlertsProps {
  allPlayers?: Player[];
  leagueSettings?: LeagueSettings;
  onSelectPlayer?: (player: Player) => void;
}

export interface SleeperCandidate {
  playerId: string;
  playerName: string;
  position: 'QB' | 'RB' | 'WR' | 'TE';
  team: string;
  upsideTier: string;
  upsideScore: number;
  tag: string;
  snapTrend: number[]; // e.g. [42, 65, 81] %
  targetShareTrend: number[]; // e.g. [11, 18, 25] %
  routeParticipation: number; // e.g. 84 %
  rosteredPct: number;
  ownerStatus: string; // e.g. "On Your Bench", "Free Agent", "League Bench"
  reasoning: string;
}

const DEFAULT_SLEEPERS: SleeperCandidate[] = [
  {
    playerId: "p-wr-3",
    playerName: "Xavier Worthy",
    position: "WR",
    team: "KC",
    upsideTier: "Elite Breakout Surge",
    upsideScore: 94,
    tag: "🔥 +33% Snap Spike",
    snapTrend: [48, 62, 81],
    targetShareTrend: [12, 19, 27],
    routeParticipation: 86,
    rosteredPct: 82.4,
    ownerStatus: "On Your Bench",
    reasoning: "Snap share rocketed from 48% to 81% over the last 3 games with a 27% target share spike following offense formation shifts. Elite deep threat ceiling."
  },
  {
    playerId: "p-rb-3",
    playerName: "Chase Brown",
    position: "RB",
    team: "CIN",
    upsideTier: "High-Volume RB Flex",
    upsideScore: 91,
    tag: "⚡ Touches Surge (+28%)",
    snapTrend: [38, 54, 72],
    targetShareTrend: [8, 14, 21],
    routeParticipation: 68,
    rosteredPct: 76.8,
    ownerStatus: "Free Agent / Waiver",
    reasoning: "Out-snapped backfield committee 72% to 28% in Week 8 with 6 red-zone touches and a 21% target share. Clear breakout RB1 volume profile."
  },
  {
    playerId: "p-wr-2",
    playerName: "Brian Thomas Jr.",
    position: "WR",
    team: "JAX",
    upsideTier: "Air Yard Target Monster",
    upsideScore: 89,
    tag: "🎯 Target Share Boom (28.5%)",
    snapTrend: [72, 84, 89],
    targetShareTrend: [18, 22, 28.5],
    routeParticipation: 92,
    rosteredPct: 88.5,
    ownerStatus: "On Your Bench",
    reasoning: "Route participation sits at 92% with an astronomical 28.5% target share over the last 2 weeks. Leading team in deep target air yards."
  },
  {
    playerId: "p-te-2",
    playerName: "Brock Bowers",
    position: "TE",
    team: "LV",
    upsideTier: "Pass Game Focal Point",
    upsideScore: 93,
    tag: "📈 Route Share Alpha (88%)",
    snapTrend: [68, 81, 88],
    targetShareTrend: [22, 26, 31],
    routeParticipation: 88,
    rosteredPct: 91.2,
    ownerStatus: "Free Agent / Waiver",
    reasoning: "Averaging 31% target share as the primary target driver in Las Vegas. 88% route participation leads all rookie TEs in NFL history."
  }
];

export const AiSleeperAlerts: React.FC<AiSleeperAlertsProps> = ({
  allPlayers = MOCK_PLAYERS,
  leagueSettings,
  onSelectPlayer
}) => {
  const [sleepers, setSleepers] = useState<SleeperCandidate[]>(DEFAULT_SLEEPERS);
  const [executiveSummary, setExecutiveSummary] = useState<string>(
    "AI algorithm identified 4 high-upside bench & waiver players experiencing dramatic 3-week snap share spikes (>25%) and target share acceleration."
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [filterPos, setFilterPos] = useState<string>('ALL');
  const [filterOwner, setFilterOwner] = useState<string>('ALL');

  const fetchAiSleeperAlerts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/sleeper-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          players: allPlayers,
          leagueSettings
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.sleepers && data.sleepers.length > 0) {
          setSleepers(data.sleepers);
          if (data.executiveSummary) setExecutiveSummary(data.executiveSummary);
        }
      }
    } catch (err) {
      console.warn('Fallback to local default sleeper alerts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSleepers = sleepers.filter((s) => {
    if (filterPos !== 'ALL' && s.position !== filterPos) return false;
    if (filterOwner === 'BENCH' && !s.ownerStatus.toLowerCase().includes('bench')) return false;
    if (filterOwner === 'WAIVER' && !s.ownerStatus.toLowerCase().includes('free') && !s.ownerStatus.toLowerCase().includes('waiver')) return false;
    return true;
  });

  const handleCardClick = (candidate: SleeperCandidate) => {
    if (!onSelectPlayer) return;
    const found = allPlayers.find(
      (p) => p.id === candidate.playerId || p.name.toLowerCase() === candidate.playerName.toLowerCase()
    );
    if (found) {
      onSelectPlayer(found);
    }
  };

  return (
    <div id="ai-sleeper-alerts-card" className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-4 font-mono shadow-xl">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Zap className="w-4 h-4 fill-amber-400/20" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-white tracking-widest uppercase">
                AI Sleeper Alert Engine
              </h2>
              <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.5 rounded font-normal flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-amber-400" /> Snap & Target Spike Detector
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
              Identifies high-upside bench & waiver players with accelerating 3-week snap counts & target shares.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchAiSleeperAlerts}
            disabled={isLoading}
            className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-xs font-sans px-3 py-1.5 rounded flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            <span>{isLoading ? 'Scanning Snap Trends...' : 'AI Re-Scan Sleepers'}</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-900/90 p-2.5 rounded border border-zinc-800 text-xs font-sans">
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-zinc-400 font-mono text-[11px] font-bold uppercase">Filter:</span>
          {['ALL', 'WR', 'RB', 'TE', 'QB'].map((pos) => (
            <button
              key={pos}
              onClick={() => setFilterPos(pos)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all cursor-pointer ${
                filterPos === pos ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white bg-zinc-800/80'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-zinc-400 font-mono text-[11px] font-bold uppercase">Status:</span>
          <button
            onClick={() => setFilterOwner('ALL')}
            className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all cursor-pointer ${
              filterOwner === 'ALL' ? 'bg-indigo-600 text-white font-bold' : 'text-zinc-400 hover:text-white bg-zinc-800/80'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterOwner('BENCH')}
            className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all cursor-pointer ${
              filterOwner === 'BENCH' ? 'bg-indigo-600 text-white font-bold' : 'text-zinc-400 hover:text-white bg-zinc-800/80'
            }`}
          >
            On Bench
          </button>
          <button
            onClick={() => setFilterOwner('WAIVER')}
            className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all cursor-pointer ${
              filterOwner === 'WAIVER' ? 'bg-indigo-600 text-white font-bold' : 'text-zinc-400 hover:text-white bg-zinc-800/80'
            }`}
          >
            Waiver / Free Agent
          </button>
        </div>
      </div>

      {/* Sleeper Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredSleepers.map((sleeper, idx) => {
          const snapStart = sleeper.snapTrend[0] || 0;
          const snapEnd = sleeper.snapTrend[sleeper.snapTrend.length - 1] || 0;
          const snapDiff = snapEnd - snapStart;

          const targetStart = sleeper.targetShareTrend[0] || 0;
          const targetEnd = sleeper.targetShareTrend[sleeper.targetShareTrend.length - 1] || 0;

          return (
            <div
              key={idx}
              onClick={() => handleCardClick(sleeper)}
              className="bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/50 rounded-lg p-3 space-y-2.5 transition-all cursor-pointer group relative overflow-hidden"
            >
              {/* Top Tag & Status Header */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                  {sleeper.tag}
                </span>

                <span className="text-[10px] text-zinc-400 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded font-sans">
                  {sleeper.ownerStatus}
                </span>
              </div>

              {/* Player Name & Upside Score */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                    <span>{sleeper.playerName}</span>
                    <span className="text-xs text-zinc-400 font-mono font-normal">
                      ({sleeper.position} - {sleeper.team})
                    </span>
                  </h3>
                  <span className="text-[11px] text-purple-400 font-sans font-medium">
                    {sleeper.upsideTier}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[9px] text-zinc-500 block uppercase font-mono">Upside Score</span>
                  <span className="text-base font-bold text-emerald-400 font-mono">{sleeper.upsideScore} <span className="text-xs text-zinc-500">/100</span></span>
                </div>
              </div>

              {/* Metrics Sparkline Visualizer Row */}
              <div className="grid grid-cols-3 gap-2 bg-zinc-950 p-2 rounded border border-zinc-800/80 text-xs font-mono">
                <div>
                  <span className="text-[9px] text-zinc-500 block uppercase">Snap Trend (3 Wks)</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-zinc-300 text-[11px] font-bold">
                      {snapStart}% → <strong className="text-amber-400">{snapEnd}%</strong>
                    </span>
                    <span className="text-[9px] text-emerald-400 font-bold">
                      (+{snapDiff}%)
                    </span>
                  </div>
                  {/* Mini Visual Bars */}
                  <div className="flex items-end gap-1 h-3 mt-1">
                    {sleeper.snapTrend.map((val, i) => (
                      <div
                        key={i}
                        className={`w-full rounded-t ${i === sleeper.snapTrend.length - 1 ? 'bg-amber-400' : 'bg-zinc-700'}`}
                        style={{ height: `${Math.max(15, val)}%` }}
                      />
                    ))}
                  </div>
                </div>

                <div className="border-x border-zinc-800 px-1">
                  <span className="text-[9px] text-zinc-500 block uppercase">Target Share</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-zinc-300 text-[11px] font-bold">
                      {targetStart}% → <strong className="text-emerald-400">{targetEnd}%</strong>
                    </span>
                  </div>
                  {/* Mini Visual Bars */}
                  <div className="flex items-end gap-1 h-3 mt-1">
                    {sleeper.targetShareTrend.map((val, i) => (
                      <div
                        key={i}
                        className={`w-full rounded-t ${i === sleeper.targetShareTrend.length - 1 ? 'bg-emerald-400' : 'bg-zinc-700'}`}
                        style={{ height: `${Math.min(100, val * 3)}%` }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[9px] text-zinc-500 block uppercase">Route Participation</span>
                  <span className="text-sm font-bold text-indigo-400 block mt-0.5">
                    {sleeper.routeParticipation}%
                  </span>
                  <span className="text-[9px] text-zinc-500 font-sans block">Rostered: {sleeper.rosteredPct}%</span>
                </div>
              </div>

              {/* AI Reasoning */}
              <p className="text-xs text-zinc-300 leading-relaxed font-sans pt-1 border-t border-zinc-800/60">
                {sleeper.reasoning}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
