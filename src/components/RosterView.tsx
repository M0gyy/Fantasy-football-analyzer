import React, { useState } from 'react';
import {
  Users,
  Sparkles,
  ArrowUpDown,
  Info,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { RosterSlot, Player } from '../types';
import { getInjuryBadgeColor, getMatchupBadgeColor } from '../utils/fantasyCalculators';
import { TeamDepthChart } from './TeamDepthChart';

interface RosterViewProps {
  roster: RosterSlot[];
  onSwapPlayers: (slotIdA: string, slotIdB: string) => void;
  onOptimizeRoster: () => void;
  onSelectPlayer: (player: Player) => void;
}

export const RosterView: React.FC<RosterViewProps> = ({
  roster,
  onSwapPlayers,
  onOptimizeRoster,
  onSelectPlayer
}) => {
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const starterSlots = roster.filter(s => s.slotName !== 'BENCH' && s.slotName !== 'IR');
  const benchSlots = roster.filter(s => s.slotName === 'BENCH');
  const irSlot = roster.find(s => s.slotName === 'IR');

  const totalStarterProj = starterSlots.reduce((sum, s) => sum + (s.player?.projectedPoints || 0), 0);

  const handleSlotClick = (slotId: string) => {
    if (!selectedSlotId) {
      // First click: select slot
      setSelectedSlotId(slotId);
    } else if (selectedSlotId === slotId) {
      // Clicked same slot: deselect
      setSelectedSlotId(null);
    } else {
      // Second click: swap!
      onSwapPlayers(selectedSlotId, slotId);
      setSelectedSlotId(null);
    }
  };

  const selectedSlot = roster.find(s => s.slotId === selectedSlotId);

  return (
    <div className="space-y-4">
      {/* Top Banner: Roster Score & Actions */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-sm">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>Active Roster Inspector</span>
              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                SWAP MATRIX
              </span>
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5 font-mono">
              Select a position slot to activate swap mode across starters & bench.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-right">
            <span className="text-[10px] text-zinc-500 font-mono uppercase block">LINEUP FLOOR PROJ</span>
            <div className="text-xl font-mono font-bold text-indigo-400">{totalStarterProj.toFixed(1)} PPG</div>
          </div>

          <button
            id="btn-optimize-roster"
            onClick={onOptimizeRoster}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs rounded transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>AUTO-OPTIMIZE</span>
          </button>
        </div>
      </div>

      {/* Swap Helper Notice */}
      {selectedSlot && (
        <div className="bg-indigo-950/60 border border-indigo-500/40 rounded p-2.5 flex items-center justify-between text-indigo-300 text-xs font-mono animate-fadeIn">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-indigo-400 animate-bounce" />
            <span>
              SELECTED <strong className="text-white">{selectedSlot.slotName}: {selectedSlot.player?.name || 'Empty'}</strong>. Click target slot to swap.
            </span>
          </div>
          <button
            onClick={() => setSelectedSlotId(null)}
            className="text-indigo-400 underline hover:text-indigo-200 font-bold text-xs cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Main Roster Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Starters Section */}
        <div className="lg:col-span-8 space-y-2">
          <div className="flex items-center justify-between px-1 pb-1 border-b border-zinc-800">
            <h2 className="text-xs font-bold font-mono uppercase tracking-widest text-zinc-400">
              Starting Lineup ({starterSlots.length} Slots)
            </h2>
            <span className="text-[11px] font-mono text-indigo-400 font-bold">Total Proj: {totalStarterProj.toFixed(1)} pts</span>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded overflow-hidden divide-y divide-zinc-800/80">
            {starterSlots.map((slot) => {
              const p = slot.player;
              const isSelected = slot.slotId === selectedSlotId;

              return (
                <div
                  key={slot.slotId}
                  onClick={() => handleSlotClick(slot.slotId)}
                  className={`p-2.5 flex items-center justify-between transition-colors cursor-pointer select-none ${
                    isSelected
                      ? 'bg-indigo-600/20 border-l-4 border-indigo-500'
                      : 'hover:bg-zinc-900/70'
                  }`}
                >
                  {/* Left Slot Tag & Player Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 text-indigo-400 font-mono font-bold text-xs flex items-center justify-center flex-shrink-0">
                      {slot.slotName}
                    </span>

                    {p ? (
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectPlayer(p);
                            }}
                            className="font-bold text-zinc-100 text-xs hover:text-indigo-400 transition-colors truncate"
                          >
                            {p.name}
                          </span>

                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${getInjuryBadgeColor(p.injuryStatus)}`}>
                            {p.injuryStatus}
                          </span>

                          <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${getMatchupBadgeColor(p.matchupDifficulty)}`}>
                            Def #{p.defenseVsPositionRank} vs {p.position}
                          </span>
                        </div>

                        <p className="text-[11px] font-mono text-zinc-500 mt-0.5 flex items-center gap-2">
                          <span>{p.position} • {p.team}</span>
                          <span>{p.opponent}</span>
                          {p.targetShare && <span className="text-zinc-600">({p.targetShare}% share)</span>}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <span className="text-xs font-mono font-semibold text-rose-400 italic">Empty Slot</span>
                        <p className="text-[10px] font-mono text-zinc-600">Allowed: {slot.allowedPositions.join(', ')}</p>
                      </div>
                    )}
                  </div>

                  {/* Right Proj Points & Detail Action */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-indigo-400">
                        {p ? p.projectedPoints.toFixed(1) : '0.0'} <span className="text-[10px] text-zinc-500 font-normal">pts</span>
                      </div>
                      {p && <div className="text-[10px] font-mono text-zinc-500">Avg: {p.avgPoints}</div>}
                    </div>

                    {p && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPlayer(p);
                        }}
                        className="p-1 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                        title="View Player Stats"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bench & IR Section */}
        <div className="lg:col-span-4 space-y-2">
          <div className="flex items-center justify-between px-1 pb-1 border-b border-zinc-800">
            <h2 className="text-xs font-bold font-mono uppercase tracking-widest text-zinc-400">
              Bench Reserves ({benchSlots.length})
            </h2>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded overflow-hidden divide-y divide-zinc-800/80">
            {benchSlots.map((slot) => {
              const p = slot.player;
              const isSelected = slot.slotId === selectedSlotId;

              return (
                <div
                  key={slot.slotId}
                  onClick={() => handleSlotClick(slot.slotId)}
                  className={`p-2.5 flex items-center justify-between transition-colors cursor-pointer select-none ${
                    isSelected
                      ? 'bg-indigo-600/20 border-l-4 border-indigo-500'
                      : 'hover:bg-zinc-900/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-7 h-7 rounded bg-zinc-900 border border-zinc-800 text-zinc-500 font-mono font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                      BN
                    </span>

                    {p ? (
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectPlayer(p);
                            }}
                            className="font-bold text-zinc-200 text-xs hover:text-indigo-400 transition-colors truncate"
                          >
                            {p.name}
                          </span>
                          <span className={`text-[9px] font-mono font-bold px-1 py-0.2 rounded border ${getInjuryBadgeColor(p.injuryStatus)}`}>
                            {p.injuryStatus}
                          </span>
                        </div>
                        <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                          {p.position} • {p.team} {p.opponent}
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs font-mono text-zinc-600 italic">Empty Bench</span>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0 font-mono">
                    <span className="text-xs font-bold text-zinc-300">
                      {p ? p.projectedPoints.toFixed(1) : '0.0'} <span className="text-[10px] text-zinc-500 font-normal">pts</span>
                    </span>
                  </div>
                </div>
              );
            })}

            {/* IR Slot if available */}
            {irSlot && (
              <div
                onClick={() => handleSlotClick(irSlot.slotId)}
                className={`p-2.5 bg-rose-950/20 flex items-center justify-between transition-colors cursor-pointer select-none ${
                  irSlot.slotId === selectedSlotId ? 'bg-indigo-600/20 border-l-4 border-indigo-500' : 'hover:bg-zinc-900/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded bg-rose-500/10 text-rose-400 font-mono font-extrabold text-[10px] flex items-center justify-center border border-rose-500/20">
                    IR
                  </span>
                  <div>
                    <span className="font-bold text-zinc-300 text-xs font-mono">
                      {irSlot.player ? irSlot.player.name : 'Injured Reserve (Empty)'}
                    </span>
                    <p className="text-[10px] font-mono text-zinc-500">Designated IR slot</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Team Positional Depth Chart & Benchmark Matrix */}
      <TeamDepthChart roster={roster} onSelectPlayer={onSelectPlayer} />
    </div>
  );
};
