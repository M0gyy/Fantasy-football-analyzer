import React, { useState, useEffect } from 'react';
import {
  Award,
  Sparkles,
  Search,
  Filter,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  Zap,
  BarChart2,
  Users,
  ChevronRight,
  Flame,
  ThumbsUp,
  ShieldAlert,
  ArrowUpRight,
  ExternalLink
} from 'lucide-react';
import { Player } from '../types';
import { MOCK_PLAYERS } from '../data/mockData';
import {
  ANALYST_OUTLETS,
  enrichPlayersWithAnalystData,
  AnalystOutletInfo
} from '../data/analystData';

interface AnalystRankingsViewProps {
  allPlayers?: Player[];
  onSelectPlayer?: (player: Player) => void;
}

interface AiAnalystSynthesis {
  executiveBrief: string;
  unanimousStarts: { playerName: string; position: string; consensusReasoning: string }[];
  disagreementPlayers: { playerName: string; position: string; varianceReason: string; bullCase: string; bearCase: string }[];
  expertLoveSleeper: { playerName: string; position: string; championAnalyst: string; breakoutCase: string };
}

export const AnalystRankingsView: React.FC<AnalystRankingsViewProps> = ({
  allPlayers = MOCK_PLAYERS,
  onSelectPlayer
}) => {
  const [enrichedPlayers, setEnrichedPlayers] = useState<Player[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<string>('ALL');
  const [selectedOutlet, setSelectedOutlet] = useState<string>('ALL');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [aiSynthesis, setAiSynthesis] = useState<AiAnalystSynthesis | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  useEffect(() => {
    const data = enrichPlayersWithAnalystData(allPlayers);
    setEnrichedPlayers(data);
  }, [allPlayers]);

  const fetchAiSynthesis = async () => {
    setIsAiLoading(true);
    try {
      const response = await fetch('/api/ai/analyst-consensus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          players: enrichedPlayers,
          selectedPosition
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result && result.executiveBrief) {
          setAiSynthesis(result);
        }
      }
    } catch (err) {
      console.warn('Fallback AI analyst synthesis:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const filteredPlayers = enrichedPlayers.filter((player) => {
    if (selectedPosition !== 'ALL' && player.position !== selectedPosition) return false;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const nameMatch = player.name.toLowerCase().includes(q);
      const teamMatch = player.team.toLowerCase().includes(q);
      const posMatch = player.position.toLowerCase().includes(q);
      if (!nameMatch && !teamMatch && !posMatch) return false;
    }

    if (selectedTag === 'MUST_START' && (player.analystConsensus?.startConsensusPct || 0) < 85) return false;
    if (selectedTag === 'HIGH_VARIANCE' && (player.analystConsensus?.stdDev || 0) < 4.5) return false;
    if (selectedTag === 'BOOM_SLEEPER' && !player.analystConsensus?.expertTag?.includes('Sleeper') && !player.analystConsensus?.expertTag?.includes('Target')) return false;

    return true;
  });

  return (
    <div className="space-y-5 font-mono text-zinc-100 pb-12">
      {/* Top Banner & Header */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 shadow-sm shadow-purple-500/20">
              <Award className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white uppercase tracking-wider">
                  Expert Consensus & Analyst Rankings Hub
                </h1>
                <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded font-normal flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-400" /> 120+ Verified Analysts
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-sans mt-1 max-w-2xl">
                Aggregated rankings, projections, and start/sit recommendations from top industry sources: FantasyPros ECR, Mike Clay (ESPN), Evan Silva (ETR), PFF Analytics, Matthew Berry, and Matt Harmon (Yahoo).
              </p>
            </div>
          </div>

          <button
            onClick={fetchAiSynthesis}
            disabled={isAiLoading}
            className="bg-purple-600 hover:bg-purple-500 text-white font-sans text-xs px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-purple-600/20 disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAiLoading ? 'animate-spin' : ''}`} />
            <span>{isAiLoading ? 'Synthesizing Consensus...' : 'AI Synthesize Expert Trends'}</span>
          </button>
        </div>

        {/* Analyst Sources Cards Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-4 pt-4 border-t border-zinc-800/80">
          {ANALYST_OUTLETS.map((outlet) => (
            <div
              key={outlet.id}
              onClick={() => setSelectedOutlet(selectedOutlet === outlet.id ? 'ALL' : outlet.id)}
              className={`p-2 rounded border text-left cursor-pointer transition-all ${
                selectedOutlet === outlet.id
                  ? 'bg-purple-950/60 border-purple-500 text-white'
                  : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 text-zinc-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-200 block truncate">{outlet.name}</span>
                <span className="text-[9px] text-zinc-500 font-mono">{(outlet.weight * 100).toFixed(0)}% WT</span>
              </div>
              <span className="text-[10px] text-purple-400 font-sans block truncate">{outlet.outlet}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Synthesis Summary Card (When Generated) */}
      {aiSynthesis && (
        <div className="bg-zinc-950 border border-purple-800/80 rounded-lg p-4 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-purple-400" /> AI Analyst Consensus Synthesis
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">Powered by Gemini 3.6 Flash</span>
          </div>

          <p className="text-xs text-zinc-200 font-sans leading-relaxed bg-purple-950/20 p-3 rounded border border-purple-900/40">
            {aiSynthesis.executiveBrief}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-sans">
            {/* Unanimous Starts */}
            <div className="bg-zinc-900 p-3 rounded border border-zinc-800 space-y-2">
              <span className="text-[11px] font-bold text-emerald-400 uppercase font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Unanimous Starts
              </span>
              <ul className="space-y-1.5">
                {aiSynthesis.unanimousStarts.map((item, idx) => (
                  <li key={idx} className="bg-zinc-950 p-2 rounded border border-zinc-800/80 space-y-0.5">
                    <span className="font-bold text-white text-xs">{item.playerName} ({item.position})</span>
                    <p className="text-[11px] text-zinc-400 leading-tight">{item.consensusReasoning}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* High Disagreement */}
            <div className="bg-zinc-900 p-3 rounded border border-zinc-800 space-y-2">
              <span className="text-[11px] font-bold text-amber-400 uppercase font-mono flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> High Disagreement
              </span>
              <ul className="space-y-1.5">
                {aiSynthesis.disagreementPlayers.map((item, idx) => (
                  <li key={idx} className="bg-zinc-950 p-2 rounded border border-zinc-800/80 space-y-1">
                    <span className="font-bold text-white text-xs">{item.playerName} ({item.position})</span>
                    <p className="text-[10px] text-zinc-400">{item.varianceReason}</p>
                    <div className="flex items-center gap-2 text-[10px] pt-1 border-t border-zinc-800/60">
                      <span className="text-emerald-400">Bull: {item.bullCase}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Expert Love Sleeper */}
            <div className="bg-zinc-900 p-3 rounded border border-zinc-800 space-y-2">
              <span className="text-[11px] font-bold text-indigo-400 uppercase font-mono flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-indigo-400" /> Expert Love Sleeper
              </span>
              {aiSynthesis.expertLoveSleeper && (
                <div className="bg-zinc-950 p-2.5 rounded border border-indigo-900/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{aiSynthesis.expertLoveSleeper.playerName}</span>
                    <span className="text-[10px] text-indigo-400 font-mono">{aiSynthesis.expertLoveSleeper.position}</span>
                  </div>
                  <span className="text-[10px] text-purple-300 font-mono block">Champion: {aiSynthesis.expertLoveSleeper.championAnalyst}</span>
                  <p className="text-[11px] text-zinc-300 leading-tight pt-1">{aiSynthesis.expertLoveSleeper.breakoutCase}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs font-sans">
        {/* Position Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-zinc-400 font-mono text-[11px] font-bold uppercase mr-1">Position:</span>
          {['ALL', 'QB', 'RB', 'WR', 'TE', 'K', 'DEF'].map((pos) => (
            <button
              key={pos}
              onClick={() => setSelectedPosition(pos)}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-all cursor-pointer ${
                selectedPosition === pos ? 'bg-purple-600 text-white font-bold' : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>

        {/* Tag Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-zinc-400 font-mono text-[11px] font-bold uppercase mr-1">Consensus:</span>
          <button
            onClick={() => setSelectedTag('ALL')}
            className={`px-2 py-1 rounded text-xs font-mono transition-all cursor-pointer ${
              selectedTag === 'ALL' ? 'bg-indigo-600 text-white font-bold' : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedTag('MUST_START')}
            className={`px-2 py-1 rounded text-xs font-mono transition-all cursor-pointer ${
              selectedTag === 'MUST_START' ? 'bg-indigo-600 text-white font-bold' : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
            }`}
          >
            🔥 Must-Starts (&gt;85%)
          </button>
          <button
            onClick={() => setSelectedTag('HIGH_VARIANCE')}
            className={`px-2 py-1 rounded text-xs font-mono transition-all cursor-pointer ${
              selectedTag === 'HIGH_VARIANCE' ? 'bg-indigo-600 text-white font-bold' : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
            }`}
          >
            ⚠️ High Disagreement
          </button>
        </div>

        {/* Search Field */}
        <div className="relative w-full sm:w-60">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search player or team..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-purple-500 outline-none"
          />
        </div>
      </div>

      {/* Analyst Consensus Table */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-900/90 text-zinc-400 font-mono border-b border-zinc-800 text-[11px] uppercase tracking-wider">
                <th className="p-3">Player</th>
                <th className="p-3 text-center">ECR Rank</th>
                <th className="p-3 text-center">Pos Rank</th>
                <th className="p-3 text-center">Min / Max</th>
                <th className="p-3 text-center">Variance (StdDev)</th>
                <th className="p-3 text-center">Start Consensus</th>
                <th className="p-3">Top Analyst Breakdown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-sans">
              {filteredPlayers.slice(0, 30).map((player) => {
                const c = player.analystConsensus;
                if (!c) return null;

                const isHighVariance = c.stdDev >= 4.5;
                const isHighStart = c.startConsensusPct >= 85;

                return (
                  <tr
                    key={player.id}
                    onClick={() => onSelectPlayer && onSelectPlayer(player)}
                    className="hover:bg-zinc-900/70 transition-colors cursor-pointer group"
                  >
                    {/* Player Info */}
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center font-mono font-bold text-xs text-purple-300 shrink-0">
                          {player.position}
                        </div>
                        <div>
                          <div className="font-bold text-white group-hover:text-purple-300 transition-colors flex items-center gap-1.5">
                            <span>{player.name}</span>
                            <span className="text-[10px] text-zinc-500 font-mono font-normal">({player.team})</span>
                          </div>
                          <span className="text-[10px] text-zinc-400 font-mono block">
                            vs {player.opponent} • Proj: {player.projectedPoints} pts
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* ECR Overall Rank */}
                    <td className="p-3 text-center font-mono font-bold text-white text-sm">
                      #{c.ecrRank}
                    </td>

                    {/* Positional Rank */}
                    <td className="p-3 text-center font-mono font-bold text-purple-400">
                      {c.ecrPositionalRank}
                    </td>

                    {/* Min / Max Range */}
                    <td className="p-3 text-center font-mono text-zinc-300 text-[11px]">
                      #{c.bestRank} - #{c.worstRank}
                    </td>

                    {/* Variance (StdDev) */}
                    <td className="p-3 text-center font-mono">
                      <div className="flex flex-col items-center">
                        <span className={`text-xs font-bold ${isHighVariance ? 'text-amber-400' : 'text-emerald-400'}`}>
                          ±{c.stdDev}
                        </span>
                        <span className="text-[9px] text-zinc-500">
                          {isHighVariance ? 'High Split' : 'Consensus'}
                        </span>
                      </div>
                    </td>

                    {/* Start Consensus % */}
                    <td className="p-3 text-center font-mono">
                      <div className="flex flex-col items-center">
                        <span className={`text-xs font-bold ${isHighStart ? 'text-emerald-400' : c.startConsensusPct <= 50 ? 'text-red-400' : 'text-zinc-200'}`}>
                          {c.startConsensusPct}%
                        </span>
                        {/* Progress mini bar */}
                        <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full ${isHighStart ? 'bg-emerald-500' : c.startConsensusPct <= 50 ? 'bg-red-500' : 'bg-indigo-500'}`}
                            style={{ width: `${c.startConsensusPct}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Analyst Mini Breakdown Badges */}
                    <td className="p-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {c.analystRanks.slice(0, 4).map((rank, i) => (
                          <div
                            key={i}
                            title={`${rank.analystName} (${rank.outlet}): Rank ${rank.positionRank}, Proj ${rank.projectedPoints}pts`}
                            className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1"
                          >
                            <span className="text-zinc-400">{rank.outlet.split(' ')[0]}:</span>
                            <span className="text-white font-bold">{rank.positionRank}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
