import React from 'react';
import {
  Activity,
  Award,
  Zap,
  TrendingUp,
  Shield,
  Clock,
  Target,
  BarChart2,
  PieChart,
  HelpCircle,
  Percent,
  Wind
} from 'lucide-react';
import { Player } from '../types';
import { getAdvancedStatsForPlayer } from '../utils/advancedMetrics';

interface AdvancedAnalyticsCardProps {
  player: Player;
  title?: string;
  compact?: boolean;
}

export const AdvancedAnalyticsCard: React.FC<AdvancedAnalyticsCardProps> = ({
  player,
  title = "ADVANCED METRICS & PFF / FOOTBALL OUTSIDERS",
  compact = false
}) => {
  const stats = getAdvancedStatsForPlayer(player);

  const getPffGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (grade >= 80) return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
    if (grade >= 70) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  if (compact) {
    return (
      <div className="bg-zinc-950 border border-zinc-800 rounded p-2.5 space-y-2 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
          <div className="flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold text-white text-[11px]">{player.name}</span>
          </div>
          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${getPffGradeColor(stats.pffGrade)}`}>
            PFF {stats.pffGrade}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px]">
          <div className="bg-zinc-900 p-1.5 rounded">
            <span className="text-zinc-500 block">EPA/Play:</span>
            <span className="font-bold text-indigo-300">{stats.epaPerPlay >= 0 ? `+${stats.epaPerPlay}` : stats.epaPerPlay}</span>
          </div>
          <div className="bg-zinc-900 p-1.5 rounded">
            <span className="text-zinc-500 block">DVOA:</span>
            <span className="font-bold text-emerald-400">{stats.dvoa}</span>
          </div>
          {stats.yprr !== undefined && (
            <div className="bg-zinc-900 p-1.5 rounded">
              <span className="text-zinc-500 block">YPRR:</span>
              <span className="font-bold text-amber-300">{stats.yprr}</span>
            </div>
          )}
          {stats.cpoe !== undefined && (
            <div className="bg-zinc-900 p-1.5 rounded">
              <span className="text-zinc-500 block">CPOE:</span>
              <span className="font-bold text-emerald-300">{stats.cpoe >= 0 ? `+${stats.cpoe}%` : `${stats.cpoe}%`}</span>
            </div>
          )}
          <div className="bg-zinc-900 p-1.5 rounded">
            <span className="text-zinc-500 block">Success Rate:</span>
            <span className="font-bold text-zinc-200">{stats.successRate}%</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3.5 space-y-3 font-mono">
      {/* Card Header with Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-tight">{title}</h3>
            <p className="text-[10px] text-zinc-400 font-sans">
              NFLfastr, Football Outsiders (DVOA), PFF Grades & ESPN Analytics.
            </p>
          </div>
        </div>

        {/* PFF & Football Outsiders Source Badges */}
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getPffGradeColor(stats.pffGrade)}`}>
            PFF Grade: {stats.pffGrade}
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-purple-950 text-purple-300 border-purple-800">
            DVOA: {stats.dvoa}
          </span>
        </div>
      </div>

      {/* Primary Analytics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
        {/* 1. EPA per play */}
        <div className="bg-zinc-900 p-2 rounded border border-zinc-800/80">
          <div className="flex items-center justify-between text-[10px] text-zinc-500">
            <span>EPA / Play</span>
            <TrendingUp className="w-3 h-3 text-indigo-400" />
          </div>
          <div className="text-sm font-bold text-indigo-300 mt-0.5">
            {stats.epaPerPlay >= 0 ? `+${stats.epaPerPlay}` : stats.epaPerPlay}
          </div>
          <span className="text-[9px] text-zinc-500 block font-sans">Expected Points Added</span>
        </div>

        {/* 2. Success Rate */}
        <div className="bg-zinc-900 p-2 rounded border border-zinc-800/80">
          <div className="flex items-center justify-between text-[10px] text-zinc-500">
            <span>Success Rate</span>
            <Percent className="w-3 h-3 text-emerald-400" />
          </div>
          <div className="text-sm font-bold text-emerald-400 mt-0.5">
            {stats.successRate}%
          </div>
          <span className="text-[9px] text-zinc-500 block font-sans">Positive EPA plays %</span>
        </div>

        {/* 3. Football Outsiders DYAR */}
        {stats.dyar !== undefined && (
          <div className="bg-zinc-900 p-2 rounded border border-zinc-800/80">
            <div className="flex items-center justify-between text-[10px] text-zinc-500">
              <span>FO DYAR</span>
              <Award className="w-3 h-3 text-purple-400" />
            </div>
            <div className="text-sm font-bold text-purple-300 mt-0.5">
              +{stats.dyar}
            </div>
            <span className="text-[9px] text-zinc-500 block font-sans">Yards Above Replacement</span>
          </div>
        )}

        {/* 4. CPOE (QB) */}
        {stats.cpoe !== undefined && (
          <div className="bg-zinc-900 p-2 rounded border border-zinc-800/80">
            <div className="flex items-center justify-between text-[10px] text-zinc-500">
              <span>CPOE</span>
              <Target className="w-3 h-3 text-cyan-400" />
            </div>
            <div className="text-sm font-bold text-cyan-300 mt-0.5">
              {stats.cpoe >= 0 ? `+${stats.cpoe}%` : `${stats.cpoe}%`}
            </div>
            <span className="text-[9px] text-zinc-500 block font-sans">Comp % Over Expected</span>
          </div>
        )}

        {/* 5. YPRR (WR/TE) */}
        {stats.yprr !== undefined && (
          <div className="bg-zinc-900 p-2 rounded border border-zinc-800/80">
            <div className="flex items-center justify-between text-[10px] text-zinc-500">
              <span>YPRR</span>
              <Zap className="w-3 h-3 text-amber-400" />
            </div>
            <div className="text-sm font-bold text-amber-300 mt-0.5">
              {stats.yprr} Yds
            </div>
            <span className="text-[9px] text-zinc-500 block font-sans">Yards / Route Run</span>
          </div>
        )}

        {/* 6. ANY/A (QB) */}
        {stats.anyA !== undefined && (
          <div className="bg-zinc-900 p-2 rounded border border-zinc-800/80">
            <div className="flex items-center justify-between text-[10px] text-zinc-500">
              <span>ANY / A</span>
              <BarChart2 className="w-3 h-3 text-blue-400" />
            </div>
            <div className="text-sm font-bold text-blue-300 mt-0.5">
              {stats.anyA} YPA
            </div>
            <span className="text-[9px] text-zinc-500 block font-sans">Adj Net Yds / Attempt</span>
          </div>
        )}

        {/* 7. YACOE (WR/TE/RB) */}
        {stats.yacoe !== undefined && (
          <div className="bg-zinc-900 p-2 rounded border border-zinc-800/80">
            <div className="flex items-center justify-between text-[10px] text-zinc-500">
              <span>YACOE</span>
              <Activity className="w-3 h-3 text-emerald-400" />
            </div>
            <div className="text-sm font-bold text-emerald-300 mt-0.5">
              +{stats.yacoe} Yds
            </div>
            <span className="text-[9px] text-zinc-500 block font-sans">YAC Over Expected</span>
          </div>
        )}

        {/* 8. Air Yards (Intended & aDOT) */}
        {stats.aDot !== undefined && (
          <div className="bg-zinc-900 p-2 rounded border border-zinc-800/80">
            <div className="flex items-center justify-between text-[10px] text-zinc-500">
              <span>aDOT / Air Yds</span>
              <Wind className="w-3 h-3 text-teal-400" />
            </div>
            <div className="text-sm font-bold text-teal-300 mt-0.5">
              {stats.aDot} Yds
            </div>
            <span className="text-[9px] text-zinc-500 block font-sans">
              {stats.intendedAirYards ? `${stats.intendedAirYards} Intended Yds` : 'Avg Depth of Target'}
            </span>
          </div>
        )}

        {/* 9. Target Share & Route Participation */}
        {stats.targetShare !== undefined && (
          <div className="bg-zinc-900 p-2 rounded border border-zinc-800/80">
            <div className="flex items-center justify-between text-[10px] text-zinc-500">
              <span>Target Share</span>
              <PieChart className="w-3 h-3 text-indigo-400" />
            </div>
            <div className="text-sm font-bold text-indigo-300 mt-0.5">
              {stats.targetShare}%
            </div>
            <span className="text-[9px] text-zinc-500 block font-sans">
              {stats.routeParticipation ? `${stats.routeParticipation}% Route Part` : 'Team Target %'}
            </span>
          </div>
        )}

        {/* 10. Pressure Rate & Time to Throw */}
        {stats.pressureRate !== undefined && (
          <div className="bg-zinc-900 p-2 rounded border border-zinc-800/80">
            <div className="flex items-center justify-between text-[10px] text-zinc-500">
              <span>Pressure Rate</span>
              <Clock className="w-3 h-3 text-rose-400" />
            </div>
            <div className="text-sm font-bold text-rose-300 mt-0.5">
              {stats.pressureRate}%
            </div>
            <span className="text-[9px] text-zinc-500 block font-sans">
              {stats.timeToThrow ? `${stats.timeToThrow}s Time to Throw` : 'Pockets Under Pressure'}
            </span>
          </div>
        )}

        {/* 11. Pass Block / Run Block Win Rate */}
        {(stats.passBlockWinRate !== undefined || stats.runBlockWinRate !== undefined) && (
          <div className="bg-zinc-900 p-2 rounded border border-zinc-800/80">
            <div className="flex items-center justify-between text-[10px] text-zinc-500">
              <span>O-Line Win Rate</span>
              <Shield className="w-3 h-3 text-sky-400" />
            </div>
            <div className="text-sm font-bold text-sky-300 mt-0.5">
              {stats.passBlockWinRate ? `${stats.passBlockWinRate}% PBWR` : `${stats.runBlockWinRate}% RBWR`}
            </div>
            <span className="text-[9px] text-zinc-500 block font-sans">ESPN / PFF Win Rate</span>
          </div>
        )}
      </div>
    </div>
  );
};
