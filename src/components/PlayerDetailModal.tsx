import React, { useState } from 'react';
import {
  X,
  TrendingUp,
  Target,
  ShieldAlert,
  Calendar,
  Activity,
  Award,
  ArrowRightLeft
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { Player } from '../types';
import { MOCK_PLAYERS } from '../data/mockData';
import { getInjuryBadgeColor, getMatchupBadgeColor } from '../utils/fantasyCalculators';
import { AdvancedAnalyticsCard } from './AdvancedAnalyticsCard';
import { PlayerComparisonTool } from './PlayerComparisonTool';

interface PlayerDetailModalProps {
  player: Player | null;
  allPlayers?: Player[];
  onClose: () => void;
}

export const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({
  player,
  allPlayers = MOCK_PLAYERS,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'COMPARE'>('OVERVIEW');

  if (!player) return null;

  const chartData = player.gameLogs.map((log) => ({
    week: `Wk ${log.week}`,
    points: log.points,
    projected: log.projectedPoints
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl p-4 space-y-4 font-mono">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-zinc-900 border border-zinc-800 text-indigo-400 font-bold text-xs flex items-center justify-center">
              {player.position}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-sans">{player.name}</h2>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${getInjuryBadgeColor(player.injuryStatus)}`}>
                  {player.injuryStatus}
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                {player.team} • {player.opponent} • ADP: {player.adp} • Bye Wk {player.byeWeek || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded border border-zinc-800 text-xs">
              <button
                onClick={() => setActiveTab('OVERVIEW')}
                className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                  activeTab === 'OVERVIEW' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('COMPARE')}
                className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'COMPARE' ? 'bg-purple-600 text-white shadow-sm' : 'text-purple-400 hover:text-purple-300'
                }`}
              >
                <ArrowRightLeft className="w-3 h-3" />
                Compare Mode
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab 1: OVERVIEW */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-4">
            {/* Advanced Metrics & PFF / Football Outsiders Card */}
            <AdvancedAnalyticsCard player={player} />

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-zinc-900 p-2.5 rounded border border-zinc-800">
                <span className="text-[9px] text-zinc-500 font-bold uppercase block">Weekly Proj</span>
                <span className="text-sm font-bold text-amber-400">{player.projectedPoints} pts</span>
              </div>

              <div className="bg-zinc-900 p-2.5 rounded border border-zinc-800">
                <span className="text-[9px] text-zinc-500 font-bold uppercase block">Avg PPG</span>
                <span className="text-sm font-bold text-zinc-200">{player.avgPoints} pts</span>
              </div>

              <div className="bg-zinc-900 p-2.5 rounded border border-zinc-800">
                <span className="text-[9px] text-zinc-500 font-bold uppercase block">Matchup Def</span>
                <span className={`text-xs font-bold block mt-0.5 ${getMatchupBadgeColor(player.matchupDifficulty)}`}>
                  Rank #{player.defenseVsPositionRank} vs {player.position}
                </span>
              </div>

              <div className="bg-zinc-900 p-2.5 rounded border border-zinc-800">
                <span className="text-[9px] text-zinc-500 font-bold uppercase block">Target Share</span>
                <span className="text-sm font-bold text-emerald-400">
                  {player.targetShare ? `${player.targetShare}%` : 'N/A'}
                </span>
              </div>
            </div>

            {/* Performance Trend Chart (Recharts) */}
            <div className="bg-zinc-900 p-3 rounded border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  Performance Log (Actual vs Proj)
                </h3>
                <span className="text-[10px] text-indigo-400 font-bold">POINTS TREND</span>
              </div>

              <div className="h-44 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="week" stroke="#71717a" fontSize={10} />
                    <YAxis stroke="#71717a" fontSize={10} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '0.25rem' }}
                      itemStyle={{ fontSize: '11px', fontFamily: 'monospace' }}
                    />
                    <Line type="monotone" dataKey="points" name="Actual Points" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="projected" name="Projected" stroke="#e4e4e7" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Scouting Notes & Game Logs */}
            <div className="space-y-3">
              <div className="bg-zinc-900 p-3 rounded border border-zinc-800 font-sans">
                <h4 className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest mb-1">Scout Analysis & Notes</h4>
                <p className="text-xs text-zinc-300 leading-relaxed">{player.notes}</p>
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Game Log Breakdown</h4>
                <div className="bg-zinc-900 rounded border border-zinc-800 overflow-hidden divide-y divide-zinc-800 text-xs">
                  {player.gameLogs.map((log, i) => (
                    <div key={i} className="p-2 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-zinc-200">Wk {log.week} {log.opponent}:</span>
                        <span className="text-zinc-400 ml-2 font-sans">{log.statsSummary}</span>
                      </div>
                      <div className="font-bold text-indigo-400">{log.points} pts</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: COMPARE */}
        {activeTab === 'COMPARE' && (
          <PlayerComparisonTool playerA={player} allPlayers={allPlayers} />
        )}
      </div>
    </div>
  );
};
