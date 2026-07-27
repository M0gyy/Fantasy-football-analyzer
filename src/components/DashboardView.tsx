import React from 'react';
import {
  Trophy,
  Zap,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Bot,
  ArrowLeftRight,
  Scale,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  BarChart2
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine
} from 'recharts';
import { RosterSlot, TeamMatchup, WaiverTarget, Player, LeagueSettings } from '../types';
import { getInjuryBadgeColor } from '../utils/fantasyCalculators';
import { LeaguePowerRankings } from './LeaguePowerRankings';
import { AiSleeperAlerts } from './AiSleeperAlerts';

interface DashboardViewProps {
  matchup: TeamMatchup;
  roster: RosterSlot[];
  waiverTargets: WaiverTarget[];
  leagueSettings: LeagueSettings;
  setActiveTab: (tab: string) => void;
  onSelectPlayer: (player: Player) => void;
  onOptimizeRoster: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  matchup,
  roster,
  waiverTargets,
  leagueSettings,
  setActiveTab,
  onSelectPlayer,
  onOptimizeRoster
}) => {
  // Calculate total starter projected points
  const starterSlots = roster.filter(s => s.slotName !== 'BENCH' && s.slotName !== 'IR');
  const totalStarterProj = starterSlots.reduce((sum, s) => sum + (s.player?.projectedPoints || 0), 0);

  // Check for injury or bye week issues in starting lineup
  const flaggedStarters = starterSlots.filter(s => {
    if (!s.player) return true; // empty slot
    return s.player.injuryStatus !== 'HEALTHY' && s.player.injuryStatus !== 'PROBABLE';
  });

  // Weekly historical projected vs actual points for starting lineup
  const weeklyData = [
    { week: 'Wk 1', projected: 118.4, actual: 126.2 },
    { week: 'Wk 2', projected: 122.1, actual: 114.8 },
    { week: 'Wk 3', projected: 115.0, actual: 131.5 },
    { week: 'Wk 4', projected: 126.5, actual: 122.0 },
    { week: 'Wk 5', projected: 119.8, actual: 138.4 },
    { week: 'Wk 6', projected: 128.2, actual: 121.7 },
    { week: 'Wk 7', projected: 121.0, actual: 120.3 },
    { week: 'Wk 8', projected: 130.5, actual: 135.8 },
    { week: `Wk ${leagueSettings.currentWeek}`, projected: Number(totalStarterProj.toFixed(1)), actual: Number((totalStarterProj * 0.95).toFixed(1)) }
  ];

  const avgProj = (weeklyData.reduce((acc, curr) => acc + curr.projected, 0) / weeklyData.length).toFixed(1);
  const avgAct = (weeklyData.reduce((acc, curr) => acc + curr.actual, 0) / weeklyData.length).toFixed(1);
  const totalDiff = (weeklyData.reduce((acc, curr) => acc + (curr.actual - curr.projected), 0)).toFixed(1);

  // 4-Week Points Scoring Trend & Consistency Analysis
  const fourWeekTrendData = weeklyData.slice(-4);
  const fourWeekScores = fourWeekTrendData.map(d => d.actual);
  const fourWeekAvgNum = fourWeekScores.reduce((a, b) => a + b, 0) / fourWeekScores.length;
  const fourWeekAvg = fourWeekAvgNum.toFixed(1);
  const fourWeekMin = Math.min(...fourWeekScores).toFixed(1);
  const fourWeekMax = Math.max(...fourWeekScores).toFixed(1);

  // Standard Deviation calculation
  const variance = fourWeekScores.reduce((acc, score) => acc + Math.pow(score - fourWeekAvgNum, 2), 0) / fourWeekScores.length;
  const stdDev = Math.sqrt(variance).toFixed(1);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const proj = payload.find((p: any) => p.dataKey === 'projected')?.value;
      const act = payload.find((p: any) => p.dataKey === 'actual')?.value;
      const diff = act !== undefined && proj !== undefined ? (act - proj).toFixed(1) : '0.0';
      const isPositive = Number(diff) >= 0;

      return (
        <div className="bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg shadow-2xl font-mono text-xs space-y-1.5 min-w-[160px]">
          <p className="font-bold text-white border-b border-zinc-800 pb-1 flex items-center justify-between">
            <span>{label}</span>
            <span className="text-[10px] text-zinc-500 font-normal">Lineup Total</span>
          </p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-3 text-indigo-400">
              <span className="text-zinc-400">Projected:</span>
              <span className="font-bold">{proj} pts</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-emerald-400">
              <span className="text-zinc-400">Actual:</span>
              <span className="font-bold">{act} pts</span>
            </div>
            <div className="pt-1 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
              <span className="text-zinc-500">Variance:</span>
              <span className={`font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPositive ? `+${diff}` : diff} pts
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const TrendTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const val = payload[0]?.value;
      const diffFromAvg = val ? (val - Number(fourWeekAvg)).toFixed(1) : '0.0';
      const isAboveAvg = Number(diffFromAvg) >= 0;

      return (
        <div className="bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg shadow-2xl font-mono text-xs space-y-1.5 min-w-[170px]">
          <p className="font-bold text-white border-b border-zinc-800 pb-1 flex items-center justify-between">
            <span>{label} Output</span>
            <span className="text-[10px] text-emerald-400 font-normal">Actual Total</span>
          </p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-3 text-emerald-400">
              <span className="text-zinc-400">Points Scored:</span>
              <span className="font-bold text-sm">{val} pts</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-zinc-400 text-[11px]">
              <span>4-Wk Rolling Avg:</span>
              <span className="font-bold text-zinc-300">{fourWeekAvg} pts</span>
            </div>
            <div className="pt-1 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
              <span className="text-zinc-500">Vs 4-Wk Avg:</span>
              <span className={`font-bold ${isAboveAvg ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isAboveAvg ? `+${diffFromAvg}` : diffFromAvg} pts
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Top Banner: High Density Matchup Spotlight */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          {/* Matchup Header */}
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-indigo-400 font-bold tracking-widest uppercase mb-1">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span>WEEK {leagueSettings.currentWeek} LIVE MATCHUP METRICS</span>
              {leagueSettings.isYahooSynced && (
                <span className="text-[10px] bg-purple-950/90 text-purple-200 border border-purple-700/60 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1 normal-case tracking-normal">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                  Y! Managed Team #{leagueSettings.myTeamNumber || 1}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2 flex-wrap">
              <span className="text-purple-300 flex items-center gap-1.5">
                {leagueSettings.myTeamName || matchup.myTeamName}
                <span className="text-xs bg-purple-900/60 text-purple-200 border border-purple-700/50 px-1.5 py-0.5 rounded font-mono font-normal">
                  (Your Team)
                </span>
              </span>
              <span className="text-zinc-600 text-sm font-mono font-normal">VS</span>
              <span className="text-zinc-300">{matchup.opponentTeamName}</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1 font-mono">
              PROJECTED OUTCOME: <span className="text-emerald-400 font-bold">{totalStarterProj.toFixed(1)} PTS</span> VS <span className="text-zinc-300 font-bold">{matchup.opponentProjectedScore} PTS</span>
            </p>
          </div>

          {/* Win Probability Dial / Stat Boxes */}
          <div className="flex items-center gap-3 bg-zinc-900/80 p-2.5 rounded border border-zinc-800">
            <div className="text-center px-3">
              <span className="text-[10px] text-zinc-500 font-mono uppercase block">WIN ODDS</span>
              <div className="text-xl font-mono font-bold text-emerald-400 mt-0.5">{matchup.winProbability}%</div>
            </div>
            <div className="h-8 w-[1px] bg-zinc-800" />
            <div className="text-center px-3">
              <span className="text-[10px] text-zinc-500 font-mono uppercase block">MY PROJ</span>
              <div className="text-xl font-mono font-bold text-indigo-400 mt-0.5">{totalStarterProj.toFixed(1)}</div>
            </div>
            <div className="h-8 w-[1px] bg-zinc-800" />
            <div className="text-center px-3">
              <span className="text-[10px] text-zinc-500 font-mono uppercase block">OPP PROJ</span>
              <div className="text-xl font-mono font-bold text-zinc-300 mt-0.5">{matchup.opponentProjectedScore}</div>
            </div>
          </div>
        </div>

        {/* Win Probability Bar */}
        <div className="mt-4 pt-3 border-t border-zinc-800">
          <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-1.5">
            <span>{matchup.myTeamName} ({matchup.winProbability}%)</span>
            <span>{matchup.opponentTeamName} ({100 - matchup.winProbability}%)</span>
          </div>
          <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${matchup.winProbability}%` }}
            />
            <div
              className="h-full bg-zinc-700 transition-all duration-500"
              style={{ width: `${100 - matchup.winProbability}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          id="btn-quick-optimize"
          onClick={onOptimizeRoster}
          className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 p-3 rounded-lg flex flex-col items-start transition-all duration-150 group text-left cursor-pointer"
        >
          <div className="w-7 h-7 rounded bg-indigo-600/10 text-indigo-400 flex items-center justify-center mb-2 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-semibold text-zinc-200 text-xs group-hover:text-indigo-400 transition-colors">Auto-Optimize</span>
          <span className="text-[10px] font-mono text-zinc-500 mt-0.5">Set max PPG lineup</span>
        </button>

        <button
          id="btn-quick-trade"
          onClick={() => setActiveTab('trade')}
          className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 p-3 rounded-lg flex flex-col items-start transition-all duration-150 group text-left cursor-pointer"
        >
          <div className="w-7 h-7 rounded bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2 group-hover:bg-blue-500 group-hover:text-white transition-colors">
            <ArrowLeftRight className="w-4 h-4" />
          </div>
          <span className="font-semibold text-zinc-200 text-xs group-hover:text-blue-400 transition-colors">Trade Machine</span>
          <span className="text-[10px] font-mono text-zinc-500 mt-0.5">AI proposal grade</span>
        </button>

        <button
          id="btn-quick-start-sit"
          onClick={() => setActiveTab('start-sit')}
          className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 p-3 rounded-lg flex flex-col items-start transition-all duration-150 group text-left cursor-pointer"
        >
          <div className="w-7 h-7 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
            <Scale className="w-4 h-4" />
          </div>
          <span className="font-semibold text-zinc-200 text-xs group-hover:text-emerald-400 transition-colors">Start / Sit Matrix</span>
          <span className="text-[10px] font-mono text-zinc-500 mt-0.5">Player vs player matchup</span>
        </button>

        <button
          id="btn-quick-coach"
          onClick={() => setActiveTab('coach')}
          className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 p-3 rounded-lg flex flex-col items-start transition-all duration-150 group text-left cursor-pointer"
        >
          <div className="w-7 h-7 rounded bg-purple-500/10 text-purple-400 flex items-center justify-center mb-2 group-hover:bg-purple-500 group-hover:text-white transition-colors">
            <Bot className="w-4 h-4" />
          </div>
          <span className="font-semibold text-zinc-200 text-xs group-hover:text-purple-400 transition-colors">AI Coach</span>
          <span className="text-[10px] font-mono text-zinc-500 mt-0.5">Custom strategy prompt</span>
        </button>
      </div>

      {/* Recharts Charts Grid: Primary Weekly Variance + Secondary 4-Week Performance Consistency Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Chart 1: Projected vs Actual (7 cols on lg) */}
        <div id="dashboard-weekly-points-chart" className="lg:col-span-7 bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-3 font-mono shadow-xl flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <BarChart2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-white tracking-widest uppercase flex items-center gap-2">
                  <span>Starter Lineup: Projected vs. Actual</span>
                  <span className="text-[9px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-1.5 py-0.5 rounded font-normal">
                    Weekly Variance
                  </span>
                </h2>
                <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
                  Historical weekly fantasy scoring comparison for your starting lineup.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs bg-zinc-900/90 px-3 py-1.5 rounded border border-zinc-800 self-start sm:self-auto">
              <div>
                <span className="text-[10px] text-zinc-500 block">AVG PROJ</span>
                <span className="font-bold text-indigo-400">{avgProj} pts</span>
              </div>
              <div className="h-4 w-[1px] bg-zinc-800" />
              <div>
                <span className="text-[10px] text-zinc-500 block">AVG ACTUAL</span>
                <span className="font-bold text-emerald-400">{avgAct} pts</span>
              </div>
            </div>
          </div>

          {/* Chart Container */}
          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={weeklyData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis
                  dataKey="week"
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#27272a' }}
                />
                <YAxis
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#27272a' }}
                  domain={[80, 'auto']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  formatter={(value) => (
                    <span className="text-zinc-300 capitalize font-mono text-xs">{value} Points</span>
                  )}
                />
                <Bar
                  dataKey="projected"
                  name="Projected"
                  fill="#6366f1"
                  opacity={0.4}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Actual Scored"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: '#09090b' }}
                  activeDot={{ r: 6, fill: '#34d399' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: 4-Week Points Consistency & Trend Tracker (5 cols on lg) */}
        <div id="dashboard-4week-trend-chart" className="lg:col-span-5 bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-3 font-mono shadow-xl flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-white tracking-widest uppercase flex items-center gap-1.5">
                  <span>4-Week Scoring Trend</span>
                  <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded font-normal">
                    Consistency
                  </span>
                </h2>
                <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
                  Rolling 4-week scoring performance & volatility curve.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs bg-zinc-900/90 p-2 rounded border border-zinc-800 font-mono">
            <div>
              <span className="text-[9px] text-zinc-500 block uppercase">4-Wk Avg</span>
              <span className="font-bold text-emerald-400">{fourWeekAvg}</span>
            </div>
            <div className="border-x border-zinc-800">
              <span className="text-[9px] text-zinc-500 block uppercase">Range (L-H)</span>
              <span className="font-bold text-zinc-200">{fourWeekMin}-{fourWeekMax}</span>
            </div>
            <div>
              <span className="text-[9px] text-zinc-500 block uppercase">Volatility</span>
              <span className="font-bold text-indigo-400">±{stdDev} pts</span>
            </div>
          </div>

          {/* Area Chart Container */}
          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={fourWeekTrendData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="scoreTrendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis
                  dataKey="week"
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#27272a' }}
                />
                <YAxis
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#27272a' }}
                  domain={['dataMin - 10', 'dataMax + 10']}
                />
                <Tooltip content={<TrendTooltip />} />
                <ReferenceLine
                  y={Number(fourWeekAvg)}
                  stroke="#6366f1"
                  strokeDasharray="4 4"
                  label={{ value: `AVG: ${fourWeekAvg}`, fill: '#818cf8', fontSize: 10, position: 'insideTopRight' }}
                />
                <Area
                  type="monotone"
                  dataKey="actual"
                  name="Points Scored"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#scoreTrendGradient)"
                  dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: '#09090b' }}
                  activeDot={{ r: 6, fill: '#34d399' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* League Power Rankings Component with AI Analysis & Recharts Radar Chart */}
      <LeaguePowerRankings roster={roster} leagueSettings={leagueSettings} />

      {/* AI Sleeper Alert Engine: High-Upside Bench & Waiver Player Identification */}
      <AiSleeperAlerts onSelectPlayer={onSelectPlayer} leagueSettings={leagueSettings} />

      {/* Two Column Grid: Roster Health & Waiver Wire */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Roster Alerts & Health */}
        <div className="lg:col-span-7 bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${flaggedStarters.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`} />
              <h2 className="font-bold text-white text-xs uppercase tracking-widest font-mono">Starter Lineup Inspector</h2>
            </div>
            <button
              onClick={() => setActiveTab('roster')}
              className="text-[11px] font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <span>INSPECT ROSTER</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {flaggedStarters.length === 0 ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-3 flex items-center gap-2.5 text-emerald-400 text-xs font-mono">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>All starting slots occupied by active healthy players. Optimum floor secured!</span>
            </div>
          ) : (
            <div className="space-y-2">
              {flaggedStarters.map((slot) => {
                const p = slot.player;
                return (
                  <div
                    key={slot.slotId}
                    className="bg-zinc-900 border border-zinc-800 rounded p-2.5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded bg-zinc-950 text-indigo-400 font-mono font-bold text-xs flex items-center justify-center border border-zinc-800">
                        {slot.slotName}
                      </span>
                      {p ? (
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              onClick={() => onSelectPlayer(p)}
                              className="font-bold text-zinc-200 text-xs hover:text-indigo-400 cursor-pointer transition-colors"
                            >
                              {p.name}
                            </span>
                            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${getInjuryBadgeColor(p.injuryStatus)}`}>
                              {p.injuryStatus}
                            </span>
                          </div>
                          <p className="text-[11px] font-mono text-zinc-500">{p.team} • {p.opponent} • Proj: {p.projectedPoints} pts</p>
                        </div>
                      ) : (
                        <span className="text-xs text-rose-400 font-mono font-medium">Slot empty! Requires active player</span>
                      )}
                    </div>

                    <button
                      onClick={() => setActiveTab('roster')}
                      className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-mono rounded transition-colors"
                    >
                      Swap
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Roster Starter List */}
          <div className="pt-2">
            <h3 className="text-[10px] font-bold font-mono uppercase tracking-widest text-zinc-500 mb-2">Active Starters Matrix</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {starterSlots.map((slot) => {
                const p = slot.player;
                return (
                  <div
                    key={slot.slotId}
                    onClick={() => p && onSelectPlayer(p)}
                    className="bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 p-2 rounded cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                      <span>{slot.slotName}</span>
                      <span className="text-indigo-400 font-bold">{p?.projectedPoints || 0} pts</span>
                    </div>
                    <div className="font-bold text-zinc-200 text-xs truncate mt-0.5">
                      {p ? p.name : <span className="text-rose-400 italic">Empty</span>}
                    </div>
                    {p && (
                      <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                        {p.position} • {p.team} {p.opponent}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Waiver Wire Targets Widget */}
        <div className="lg:col-span-5 bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800 mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h2 className="font-bold text-white text-xs uppercase tracking-widest font-mono">Breakout Waiver Targets</h2>
              </div>
              <button
                onClick={() => setActiveTab('waiver')}
                className="text-[11px] font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <span>HUB</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {waiverTargets.map((target) => (
                <div
                  key={target.player.id}
                  onClick={() => onSelectPlayer(target.player)}
                  className="bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 p-2.5 rounded cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-zinc-200 text-xs hover:text-indigo-400 transition-colors">
                        {target.player.name}
                      </span>
                      <p className="text-[11px] font-mono text-zinc-500">
                        {target.player.position} • {target.player.team} ({target.player.rosteredPercentage}% rostered)
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                        FAAB ${target.recommendedFaabBid}
                      </span>
                      <p className="text-[10px] font-mono text-zinc-400 mt-0.5">Proj: {target.player.projectedPoints} pts</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-300 mt-1.5 line-clamp-1 bg-zinc-950 p-1 rounded border border-zinc-800 font-mono">
                    💡 {target.breakoutReason}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800 text-center">
            <button
              onClick={() => setActiveTab('coach')}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs rounded transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Bot className="w-4 h-4" />
              <span>CONSULT AI STRATEGIST</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
