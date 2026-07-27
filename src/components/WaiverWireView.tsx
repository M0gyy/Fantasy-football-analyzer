import React, { useState } from 'react';
import {
  TrendingUp,
  Search,
  DollarSign,
  PlusCircle,
  Sparkles,
  Info
} from 'lucide-react';
import { WaiverTarget, Position, Player } from '../types';

interface WaiverWireViewProps {
  waiverTargets: WaiverTarget[];
  onSelectPlayer: (player: Player) => void;
  onClaimPlayer: (player: Player) => void;
  faabBudget: number;
}

export const WaiverWireView: React.FC<WaiverWireViewProps> = ({
  waiverTargets,
  onSelectPlayer,
  onClaimPlayer,
  faabBudget
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPos, setSelectedPos] = useState<string>('ALL');

  const positions = ['ALL', 'QB', 'RB', 'WR', 'TE', 'K', 'DEF'];

  const filteredTargets = waiverTargets.filter((t) => {
    const matchesSearch = t.player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.player.team.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPos = selectedPos === 'ALL' || t.player.position === selectedPos;
    return matchesSearch && matchesPos;
  });

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>Waiver Wire & Free Agency Hub</span>
              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                FAAB ANALYZER
              </span>
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5 font-mono">
              Identify breakout candidates, recommended FAAB allocation, and schedule projections.
            </p>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded text-right font-mono">
          <span className="text-[9px] text-zinc-500 font-bold uppercase block">REMAINING FAAB</span>
          <span className="text-base font-bold text-emerald-400">${faabBudget}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg">
        {/* Position Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto font-mono">
          {positions.map((pos) => (
            <button
              key={pos}
              onClick={() => setSelectedPos(pos)}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                selectedPos === pos
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64 font-mono">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2" />
          <input
            id="input-waiver-search"
            type="text"
            placeholder="Search player/team..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded pl-8 pr-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* Waiver Player Cards */}
      <div className="space-y-3">
        {filteredTargets.map((target) => {
          const p = target.player;
          return (
            <div
              key={p.id}
              className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 text-indigo-400 font-mono font-bold text-xs flex items-center justify-center">
                    {p.position}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        onClick={() => onSelectPlayer(p)}
                        className="font-bold text-white text-sm hover:text-indigo-400 cursor-pointer transition-colors"
                      >
                        {p.name}
                      </span>
                      <span className="text-[10px] font-mono bg-zinc-900 text-zinc-400 font-bold px-1.5 py-0.5 rounded border border-zinc-800">
                        {p.team} {p.opponent}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 font-mono">
                      Proj: <strong className="text-amber-400">{p.projectedPoints} pts</strong> • Rostered {p.rosteredPercentage}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 font-mono">
                  <div className="text-right">
                    <span className="text-[9px] text-zinc-500 font-bold uppercase block">REC. BID</span>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded inline-block">
                      ${target.recommendedFaabBid}
                    </span>
                  </div>

                  <button
                    onClick={() => onClaimPlayer(p)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs rounded shadow transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>CLAIM</span>
                  </button>
                </div>
              </div>

              {/* Analysis and Schedule */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div className="bg-zinc-900 p-2.5 rounded border border-zinc-800 font-sans">
                  <strong className="text-amber-400 font-mono text-xs block mb-0.5">🚀 Breakout Catalyst:</strong>
                  <span className="text-zinc-300">{target.breakoutReason}</span>
                </div>
                <div className="bg-zinc-900 p-2.5 rounded border border-zinc-800 font-sans">
                  <strong className="text-indigo-400 font-mono text-xs block mb-0.5">📅 Upcoming Outlook:</strong>
                  <span className="text-zinc-300">{target.scheduleOutlook}</span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredTargets.length === 0 && (
          <div className="text-center py-8 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-500 font-mono text-xs">
            No waiver targets matched your filter criteria.
          </div>
        )}
      </div>
    </div>
  );
};
