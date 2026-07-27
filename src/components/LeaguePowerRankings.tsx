import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Crown,
  Zap,
  RefreshCw,
  Award,
  BarChart3,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Legend
} from 'recharts';
import { RosterSlot, LeagueSettings } from '../types';

interface LeaguePowerRankingsProps {
  roster: RosterSlot[];
  leagueSettings: LeagueSettings;
}

interface RadarMetric {
  attribute: string;
  userScore: number;
  leagueAvgScore: number;
  topTeamScore: number;
}

interface TeamPowerEntry {
  rank: number;
  teamName: string;
  ownerName: string;
  record: string;
  projectedPoints: number;
  powerRating: number;
  primaryStrength: string;
  biggestWeakness: string;
  isUserTeam: boolean;
}

interface PowerRankingsData {
  userRank: number;
  totalTeams: number;
  tier: string;
  powerScore: number;
  radarMetrics: RadarMetric[];
  standingsRankings: TeamPowerEntry[];
  aiSummary: string;
  keyTakeaways: string[];
}

// Fallback / Initial Heuristic Data
const defaultRadarMetrics: RadarMetric[] = [
  { attribute: 'Starters Power', userScore: 88, leagueAvgScore: 74, topTeamScore: 92 },
  { attribute: 'Bench Depth', userScore: 82, leagueAvgScore: 70, topTeamScore: 86 },
  { attribute: 'Consistency', userScore: 91, leagueAvgScore: 72, topTeamScore: 89 },
  { attribute: 'Schedule Ease', userScore: 79, leagueAvgScore: 75, topTeamScore: 84 },
  { attribute: 'Injury Resilience', userScore: 85, leagueAvgScore: 68, topTeamScore: 88 },
  { attribute: 'Ceiling Upside', userScore: 94, leagueAvgScore: 76, topTeamScore: 95 }
];

const defaultStandings: TeamPowerEntry[] = [
  {
    rank: 1,
    teamName: 'Mahomes & The Kingdom',
    ownerName: 'Alex Rivera',
    record: '4-0',
    projectedPoints: 128.4,
    powerRating: 93.2,
    primaryStrength: 'Elite QB1 & TE Stack',
    biggestWeakness: 'Shallow RB3 Depth',
    isUserTeam: false
  },
  {
    rank: 2,
    teamName: 'Gridiron Dynasty (You)',
    ownerName: 'Your Team',
    record: '3-1',
    projectedPoints: 124.8,
    powerRating: 89.8,
    primaryStrength: 'Top-tier WR Corps & Explosive Upside',
    biggestWeakness: 'Bye Week Flexibility',
    isUserTeam: true
  },
  {
    rank: 3,
    teamName: 'Gridiron Blitzers',
    ownerName: 'Sarah Jenkins',
    record: '3-1',
    projectedPoints: 121.2,
    powerRating: 86.4,
    primaryStrength: 'Workhorse RB Tandem',
    biggestWeakness: 'Volatile WR3',
    isUserTeam: false
  },
  {
    rank: 4,
    teamName: 'Touchdown Titans',
    ownerName: 'Marcus Vance',
    record: '2-2',
    projectedPoints: 118.5,
    powerRating: 81.0,
    primaryStrength: 'Solid Starting Lineup',
    biggestWeakness: 'Injury Prone Starters',
    isUserTeam: false
  },
  {
    rank: 5,
    teamName: 'End Zone Eagles',
    ownerName: 'Dave Miller',
    record: '2-2',
    projectedPoints: 115.0,
    powerRating: 77.5,
    primaryStrength: 'Heavy Target Volume WRs',
    biggestWeakness: 'Weak QB Production',
    isUserTeam: false
  },
  {
    rank: 6,
    teamName: 'Red Zone Renegades',
    ownerName: 'Chris Taylor',
    record: '2-2',
    projectedPoints: 112.8,
    powerRating: 74.2,
    primaryStrength: 'Red Zone Touch Concentration',
    biggestWeakness: 'Negative Matchup Script',
    isUserTeam: false
  },
  {
    rank: 7,
    teamName: 'Gridiron Gladiators',
    ownerName: 'Jordan Smith',
    record: '1-3',
    projectedPoints: 108.6,
    powerRating: 69.5,
    primaryStrength: 'Strong Bench Handcuffs',
    biggestWeakness: 'Low Weekly Ceiling',
    isUserTeam: false
  },
  {
    rank: 8,
    teamName: 'Field Goal Gurus',
    ownerName: 'Elena Rostova',
    record: '1-3',
    projectedPoints: 104.2,
    powerRating: 65.0,
    primaryStrength: 'High Pass-Volume Offenses',
    biggestWeakness: 'Low Rushing Floor',
    isUserTeam: false
  },
  {
    rank: 9,
    teamName: 'Pigskin Panthers',
    ownerName: 'Brian Lee',
    record: '1-3',
    projectedPoints: 101.5,
    powerRating: 61.2,
    primaryStrength: 'Defensive Streamers',
    biggestWeakness: 'Severe Skill Injury Bug',
    isUserTeam: false
  },
  {
    rank: 10,
    teamName: 'Blitz Brigade',
    ownerName: 'Kevin Patel',
    record: '0-4',
    projectedPoints: 97.0,
    powerRating: 54.8,
    primaryStrength: 'Underdog Target Volume',
    biggestWeakness: 'Lack of Elite Touch Drivers',
    isUserTeam: false
  }
];

export const LeaguePowerRankings: React.FC<LeaguePowerRankingsProps> = ({
  roster,
  leagueSettings
}) => {
  const [data, setData] = useState<PowerRankingsData>({
    userRank: 2,
    totalTeams: 10,
    tier: 'Championship Favorite',
    powerScore: 89.8,
    radarMetrics: defaultRadarMetrics,
    standingsRankings: defaultStandings,
    aiSummary: "Your roster ranks #2 overall in the league power rankings with an 89.8 power score. You possess elite starter projection density led by high-EPA pass catchers and consistent touch drivers. Strengthening your RB depth before upcoming bye weeks will lock in your championship trajectory.",
    keyTakeaways: [
      "Starting lineup ranks top-2 in ceiling upside & weekly scoring consistency.",
      "Bench depth sits 12% above league average, offering strong injury resilience.",
      "Consider trading surplus WR depth to target a high-tier RB2 for playoff run."
    ]
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showFullStandings, setShowFullStandings] = useState<boolean>(false);
  const [isAiGenerated, setIsAiGenerated] = useState<boolean>(false);

  // Fetch AI Power Rankings from server
  const fetchAiPowerRankings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/power-rankings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userRoster: roster,
          leagueTeams: defaultStandings,
          leagueSettings
        })
      });

      if (response.ok) {
        const resData = await response.json();
        if (resData && resData.radarMetrics) {
          setData(resData);
          setIsAiGenerated(true);
        }
      }
    } catch (err) {
      console.warn('Falling back to local heuristic power rankings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Optionally trigger initial fetch
  }, []);

  const CustomRadarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-950 border border-zinc-800 p-2.5 rounded shadow-2xl font-mono text-xs space-y-1 z-50">
          <p className="font-bold text-white border-b border-zinc-800 pb-1 flex items-center justify-between gap-4">
            <span>{label}</span>
            <span className="text-[10px] text-indigo-400">0-100 Rating</span>
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-3 text-[11px]" style={{ color: entry.color }}>
              <span>{entry.name}:</span>
              <span className="font-bold">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div id="league-power-rankings-card" className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-4 font-mono shadow-xl">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-white tracking-widest uppercase">
                League Power Rankings
              </h2>
              {isAiGenerated ? (
                <span className="text-[9px] bg-purple-950 text-purple-300 border border-purple-800 px-1.5 py-0.5 rounded font-normal flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> AI Evaluated
                </span>
              ) : (
                <span className="text-[9px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-1.5 py-0.5 rounded font-normal">
                  Live Analytics
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
              Multi-dimensional roster strength & AI standing projections across 6 core radar metrics.
            </p>
          </div>
        </div>

        {/* Action Button & User Rank Banner */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 flex items-center gap-3">
            <div>
              <span className="text-[9px] text-zinc-500 block uppercase">Power Rank</span>
              <span className="text-sm font-bold text-amber-400 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                #{data.userRank} <span className="text-zinc-500 text-xs font-normal">/ {data.totalTeams}</span>
              </span>
            </div>
            <div className="h-6 w-[1px] bg-zinc-800" />
            <div>
              <span className="text-[9px] text-zinc-500 block uppercase">Tier</span>
              <span className="text-xs font-bold text-emerald-400">{data.tier}</span>
            </div>
          </div>

          <button
            onClick={fetchAiPowerRankings}
            disabled={isLoading}
            className="bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 hover:text-purple-200 text-xs font-sans px-2.5 py-2 rounded flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title="Refresh AI Power Rankings"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-purple-400' : ''}`} />
            <span className="hidden sm:inline">{isLoading ? 'Analyzing...' : 'AI Re-Analyze'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Grid: Radar Chart + AI Executive Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Radar Chart Visualizer (7 cols) */}
        <div className="lg:col-span-7 bg-zinc-900/80 border border-zinc-800/80 rounded-lg p-3.5 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
              6-Dimension Roster Radar Evaluation
            </span>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Your Team
              </span>
              <span className="flex items-center gap-1 text-indigo-400">
                <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" /> #1 Leader
              </span>
              <span className="flex items-center gap-1 text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-zinc-500 inline-block" /> League Avg
              </span>
            </div>
          </div>

          {/* Radar Chart Container */}
          <div className="h-64 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data.radarMetrics}>
                <PolarGrid stroke="#27272a" />
                <PolarAngleAxis
                  dataKey="attribute"
                  stroke="#a1a1aa"
                  fontSize={10}
                  tickLine={false}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  stroke="#3f3f46"
                  fontSize={8}
                />
                <Tooltip content={<CustomRadarTooltip />} />
                <Radar
                  name="League Avg"
                  dataKey="leagueAvgScore"
                  stroke="#71717a"
                  fill="#71717a"
                  fillOpacity={0.15}
                  strokeDasharray="3 3"
                />
                <Radar
                  name="#1 Team Leader"
                  dataKey="topTeamScore"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.15}
                />
                <Radar
                  name="Your Team"
                  dataKey="userScore"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.35}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Strategic Roster Analysis & Insights (5 cols) */}
        <div className="lg:col-span-5 bg-zinc-900/80 border border-zinc-800/80 rounded-lg p-3.5 flex flex-col justify-between space-y-3 font-sans">
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
              <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" /> AI Executive Insight
              </span>
              <span className="text-[10px] font-mono text-zinc-400 font-bold">
                SCORE: <strong className="text-amber-400">{data.powerScore}</strong> / 100
              </span>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed font-sans">
              {data.aiSummary}
            </p>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-zinc-800/60 font-mono text-xs">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              Strategic Takeaways
            </span>
            <ul className="space-y-1.5 text-[11px] font-sans">
              {data.keyTakeaways.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2 text-zinc-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Standings & Power Ranking Breakdown Table */}
      <div className="space-y-2 pt-2 border-t border-zinc-800">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span>Projected League Power Standings</span>
            <span className="text-[9px] font-normal bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
              {data.standingsRankings.length} Teams
            </span>
          </h3>

          <button
            onClick={() => setShowFullStandings(!showFullStandings)}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer font-sans"
          >
            <span>{showFullStandings ? 'Show Top 5 Only' : 'View Full Standings'}</span>
            {showFullStandings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="border border-zinc-800 rounded overflow-hidden">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="bg-zinc-900 border-b border-zinc-800 text-[10px] text-zinc-400 uppercase">
                <th className="p-2.5 text-center w-12">Rank</th>
                <th className="p-2.5">Team & Owner</th>
                <th className="p-2.5 text-center w-20">Record</th>
                <th className="p-2.5 text-center w-28">Proj Wk Pts</th>
                <th className="p-2.5 text-center w-36">Power Score</th>
                <th className="p-2.5 text-left hidden md:table-cell">Primary Strength</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {(showFullStandings ? data.standingsRankings : data.standingsRankings.slice(0, 5)).map((team) => (
                <tr
                  key={team.rank}
                  className={`transition-colors ${
                    team.isUserTeam
                      ? 'bg-emerald-950/20 hover:bg-emerald-950/30 font-bold border-l-2 border-l-emerald-500'
                      : 'hover:bg-zinc-900/50'
                  }`}
                >
                  <td className="p-2.5 text-center">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs ${
                      team.rank === 1
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : team.isUserTeam
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      #{team.rank}
                    </span>
                  </td>
                  <td className="p-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-bold ${team.isUserTeam ? 'text-emerald-400' : 'text-zinc-200'}`}>
                        {team.teamName}
                      </span>
                      {team.isUserTeam && (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1 py-0.2 rounded uppercase font-normal">
                          YOU
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-500 block font-sans">{team.ownerName}</span>
                  </td>
                  <td className="p-2.5 text-center text-zinc-300">
                    {team.record}
                  </td>
                  <td className="p-2.5 text-center font-bold text-indigo-400">
                    {team.projectedPoints} pts
                  </td>
                  <td className="p-2.5 text-center">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-zinc-400 font-bold">{team.powerRating}</span>
                        <span className="text-zinc-500">/ 100</span>
                      </div>
                      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            team.isUserTeam ? 'bg-emerald-500' : team.rank <= 3 ? 'bg-amber-500' : 'bg-indigo-500'
                          }`}
                          style={{ width: `${Math.min(100, team.powerRating)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-2.5 text-left text-zinc-400 text-[11px] font-sans hidden md:table-cell">
                    {team.primaryStrength}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
