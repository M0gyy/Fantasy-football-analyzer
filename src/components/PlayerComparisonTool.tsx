import React, { useState } from 'react';
import {
  ArrowRightLeft,
  Award,
  TrendingUp,
  Zap,
  Target,
  Shield,
  Clock,
  PieChart,
  Activity,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { Player } from '../types';
import { getAdvancedStatsForPlayer } from '../utils/advancedMetrics';
import { getInjuryBadgeColor } from '../utils/fantasyCalculators';

interface PlayerComparisonToolProps {
  playerA: Player;
  allPlayers: Player[];
  onSelectPlayerB?: (player: Player) => void;
}

export const PlayerComparisonTool: React.FC<PlayerComparisonToolProps> = ({
  playerA,
  allPlayers
}) => {
  // Available candidates for comparison (exclude playerA)
  const availableCandidates = allPlayers.filter(p => p.id !== playerA.id);

  // Default playerB: same position first, or top player in list
  const defaultPlayerB = availableCandidates.find(p => p.position === playerA.position) || availableCandidates[0];
  const [selectedPlayerBId, setSelectedPlayerBId] = useState<string>(defaultPlayerB?.id || '');

  const playerB = availableCandidates.find(p => p.id === selectedPlayerBId) || defaultPlayerB;

  if (!playerB) return null;

  const statsA = getAdvancedStatsForPlayer(playerA);
  const statsB = getAdvancedStatsForPlayer(playerB);

  // Helper to determine metric winner
  const compareMetrics = (valA?: number, valB?: number, higherIsBetter = true) => {
    if (valA === undefined || valB === undefined) return 'N/A';
    if (valA === valB) return 'EQUAL';
    if (higherIsBetter) {
      return valA > valB ? 'PLAYER_A' : 'PLAYER_B';
    } else {
      return valA < valB ? 'PLAYER_A' : 'PLAYER_B';
    }
  };

  // Helper to parse numerical DVOA e.g. "+18.5%" -> 18.5
  const parseDvoa = (dvoaStr: string | number) => {
    if (typeof dvoaStr === 'number') return dvoaStr;
    const cleaned = dvoaStr.replace('%', '').replace('+', '');
    return parseFloat(cleaned) || 0;
  };

  const dvoaA = parseDvoa(statsA.dvoa);
  const dvoaB = parseDvoa(statsB.dvoa);

  // Metrics Table Configuration
  const metricRows = [
    {
      label: 'PFF Overall Grade',
      valA: `${statsA.pffGrade}`,
      valB: `${statsB.pffGrade}`,
      winner: compareMetrics(statsA.pffGrade, statsB.pffGrade),
      category: 'PFF'
    },
    {
      label: 'Expected Points Added (EPA/Play)',
      valA: statsA.epaPerPlay >= 0 ? `+${statsA.epaPerPlay}` : `${statsA.epaPerPlay}`,
      valB: statsB.epaPerPlay >= 0 ? `+${statsB.epaPerPlay}` : `${statsB.epaPerPlay}`,
      winner: compareMetrics(statsA.epaPerPlay, statsB.epaPerPlay),
      category: 'NFLfastr'
    },
    {
      label: 'DVOA (Football Outsiders)',
      valA: `${statsA.dvoa}`,
      valB: `${statsB.dvoa}`,
      winner: compareMetrics(dvoaA, dvoaB),
      category: 'FO'
    },
    {
      label: 'DYAR (Yards Above Replacement)',
      valA: statsA.dyar !== undefined ? `+${statsA.dyar}` : 'N/A',
      valB: statsB.dyar !== undefined ? `+${statsB.dyar}` : 'N/A',
      winner: compareMetrics(statsA.dyar, statsB.dyar),
      category: 'FO'
    },
    {
      label: 'Success Rate %',
      valA: `${statsA.successRate}%`,
      valB: `${statsB.successRate}%`,
      winner: compareMetrics(statsA.successRate, statsB.successRate),
      category: 'NFLfastr'
    },
    ...(statsA.yprr !== undefined || statsB.yprr !== undefined
      ? [
          {
            label: 'Yards Per Route Run (YPRR)',
            valA: statsA.yprr !== undefined ? `${statsA.yprr} yds` : 'N/A',
            valB: statsB.yprr !== undefined ? `${statsB.yprr} yds` : 'N/A',
            winner: compareMetrics(statsA.yprr, statsB.yprr),
            category: 'Efficiency'
          }
        ]
      : []),
    ...(statsA.cpoe !== undefined || statsB.cpoe !== undefined
      ? [
          {
            label: 'Completion % Over Expected (CPOE)',
            valA: statsA.cpoe !== undefined ? (statsA.cpoe >= 0 ? `+${statsA.cpoe}%` : `${statsA.cpoe}%`) : 'N/A',
            valB: statsB.cpoe !== undefined ? (statsB.cpoe >= 0 ? `+${statsB.cpoe}%` : `${statsB.cpoe}%`) : 'N/A',
            winner: compareMetrics(statsA.cpoe, statsB.cpoe),
            category: 'Passing'
          }
        ]
      : []),
    ...(statsA.anyA !== undefined || statsB.anyA !== undefined
      ? [
          {
            label: 'Adjusted Net Yds / Attempt (ANY/A)',
            valA: statsA.anyA !== undefined ? `${statsA.anyA}` : 'N/A',
            valB: statsB.anyA !== undefined ? `${statsB.anyA}` : 'N/A',
            winner: compareMetrics(statsA.anyA, statsB.anyA),
            category: 'Passing'
          }
        ]
      : []),
    ...(statsA.yacoe !== undefined || statsB.yacoe !== undefined
      ? [
          {
            label: 'YAC Over Expected (YACOE)',
            valA: statsA.yacoe !== undefined ? `+${statsA.yacoe} yds` : 'N/A',
            valB: statsB.yacoe !== undefined ? `+${statsB.yacoe} yds` : 'N/A',
            winner: compareMetrics(statsA.yacoe, statsB.yacoe),
            category: 'Receiving'
          }
        ]
      : []),
    ...(statsA.targetShare !== undefined || statsB.targetShare !== undefined
      ? [
          {
            label: 'Target Share %',
            valA: statsA.targetShare !== undefined ? `${statsA.targetShare}%` : 'N/A',
            valB: statsB.targetShare !== undefined ? `${statsB.targetShare}%` : 'N/A',
            winner: compareMetrics(statsA.targetShare, statsB.targetShare),
            category: 'Volume'
          }
        ]
      : []),
    ...(statsA.aDot !== undefined || statsB.aDot !== undefined
      ? [
          {
            label: 'Average Depth of Target (aDOT)',
            valA: statsA.aDot !== undefined ? `${statsA.aDot} yds` : 'N/A',
            valB: statsB.aDot !== undefined ? `${statsB.aDot} yds` : 'N/A',
            winner: compareMetrics(statsA.aDot, statsB.aDot),
            category: 'Opportunity'
          }
        ]
      : []),
    ...(statsA.passBlockWinRate !== undefined || statsB.passBlockWinRate !== undefined
      ? [
          {
            label: 'Pass Block Win Rate (PBWR)',
            valA: statsA.passBlockWinRate !== undefined ? `${statsA.passBlockWinRate}%` : 'N/A',
            valB: statsB.passBlockWinRate !== undefined ? `${statsB.passBlockWinRate}%` : 'N/A',
            winner: compareMetrics(statsA.passBlockWinRate, statsB.passBlockWinRate),
            category: 'Blocking'
          }
        ]
      : [])
  ];

  // Calculate score tally
  let winsA = 0;
  let winsB = 0;
  metricRows.forEach(r => {
    if (r.winner === 'PLAYER_A') winsA++;
    if (r.winner === 'PLAYER_B') winsB++;
  });

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3.5 space-y-3 font-mono shadow-2xl">
      {/* Tool Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
            <ArrowRightLeft className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-tight">
              ADVANCED METRICS SIDE-BY-SIDE COMPARISON
            </h3>
            <p className="text-[10px] text-zinc-400 font-sans">
              Head-to-head evaluation of PFF, Football Outsiders (DVOA/DYAR) & NFLfastr efficiency.
            </p>
          </div>
        </div>

        {/* Player B Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500 font-bold uppercase">Compare Vs:</span>
          <select
            value={selectedPlayerBId}
            onChange={(e) => setSelectedPlayerBId(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 text-white text-xs rounded px-2.5 py-1 focus:outline-none focus:border-purple-500 cursor-pointer font-sans"
          >
            {availableCandidates.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.position} - {p.team})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Side-by-Side Player Cards Header */}
      <div className="grid grid-cols-2 gap-2 text-xs font-sans">
        {/* Player A Card */}
        <div className="bg-zinc-900/90 border border-indigo-500/40 rounded p-2.5 space-y-1.5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.2 rounded">
              PLAYER A
            </span>
            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${getInjuryBadgeColor(playerA.injuryStatus)}`}>
              {playerA.injuryStatus}
            </span>
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">{playerA.name}</h4>
            <p className="text-[11px] font-mono text-zinc-400">{playerA.position} • {playerA.team} {playerA.opponent}</p>
          </div>
          <div className="flex items-center justify-between text-xs font-mono pt-1 border-t border-zinc-800">
            <span className="text-zinc-400">Proj: <strong className="text-amber-400">{playerA.projectedPoints} pts</strong></span>
            <span className="text-indigo-400 font-bold">Wins: {winsA}</span>
          </div>
        </div>

        {/* Player B Card */}
        <div className="bg-zinc-900/90 border border-purple-500/40 rounded p-2.5 space-y-1.5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded">
              PLAYER B
            </span>
            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${getInjuryBadgeColor(playerB.injuryStatus)}`}>
              {playerB.injuryStatus}
            </span>
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">{playerB.name}</h4>
            <p className="text-[11px] font-mono text-zinc-400">{playerB.position} • {playerB.team} {playerB.opponent}</p>
          </div>
          <div className="flex items-center justify-between text-xs font-mono pt-1 border-t border-zinc-800">
            <span className="text-zinc-400">Proj: <strong className="text-amber-400">{playerB.projectedPoints} pts</strong></span>
            <span className="text-purple-400 font-bold">Wins: {winsB}</span>
          </div>
        </div>
      </div>

      {/* Metrics Comparative Table */}
      <div className="border border-zinc-800 rounded overflow-hidden">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="bg-zinc-900 border-b border-zinc-800 text-[10px] text-zinc-400 uppercase">
              <th className="p-2 pl-3">Metric</th>
              <th className="p-2 text-center text-indigo-300 w-28">{playerA.name.split(' ')[1] || playerA.name}</th>
              <th className="p-2 text-center text-purple-300 w-28">{playerB.name.split(' ')[1] || playerB.name}</th>
              <th className="p-2 text-center w-24">Advantage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/80">
            {metricRows.map((row, idx) => {
              const isWinnerA = row.winner === 'PLAYER_A';
              const isWinnerB = row.winner === 'PLAYER_B';

              return (
                <tr key={idx} className="hover:bg-zinc-900/50 transition-colors">
                  <td className="p-2 pl-3 text-zinc-300 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span>{row.label}</span>
                      <span className="text-[8px] px-1 py-0.2 rounded bg-zinc-800 text-zinc-500 border border-zinc-700 font-sans">
                        {row.category}
                      </span>
                    </div>
                  </td>
                  <td className={`p-2 text-center font-bold ${isWinnerA ? 'bg-indigo-500/10 text-emerald-400 border-l border-r border-indigo-500/30' : 'text-zinc-400'}`}>
                    {row.valA}
                  </td>
                  <td className={`p-2 text-center font-bold ${isWinnerB ? 'bg-purple-500/10 text-emerald-400 border-l border-r border-purple-500/30' : 'text-zinc-400'}`}>
                    {row.valB}
                  </td>
                  <td className="p-2 text-center text-[10px] font-bold">
                    {isWinnerA && (
                      <span className="text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-1.5 py-0.5 rounded">
                        {playerA.name.split(' ')[1] || 'A'}
                      </span>
                    )}
                    {isWinnerB && (
                      <span className="text-purple-400 bg-purple-500/10 border border-purple-500/30 px-1.5 py-0.5 rounded">
                        {playerB.name.split(' ')[1] || 'B'}
                      </span>
                    )}
                    {row.winner === 'EQUAL' && (
                      <span className="text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                        Equal
                      </span>
                    )}
                    {row.winner === 'N/A' && (
                      <span className="text-zinc-600">--</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edge Conclusion Card */}
      <div className="p-2.5 bg-zinc-900/90 border border-zinc-800 rounded flex items-center justify-between text-xs font-sans">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-zinc-300 text-[11px]">
            Analytics Edge:{' '}
            <strong className="text-white">
              {winsA > winsB
                ? `${playerA.name} (+${winsA - winsB} categories)`
                : winsB > winsA
                ? `${playerB.name} (+${winsB - winsA} categories)`
                : 'Balanced Profile Across Advanced Categories'}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
};
