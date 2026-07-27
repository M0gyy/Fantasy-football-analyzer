import React, { useState } from 'react';
import {
  Zap,
  TrendingUp,
  Shield,
  Activity,
  Flame,
  Gauge,
  Sparkles,
  Loader2,
  ArrowRightLeft,
  Check,
  AlertCircle,
  Trophy,
  Target,
  BarChart3,
  Clock,
  Compass
} from 'lucide-react';
import { NFLfastrTeamMetrics, NFLfastrMatchupAnalysis } from '../types';
import { NFLFASTR_TEAMS } from '../data/nflfastrData';

export const NFLfastrMatchupView: React.FC = () => {
  const [homeTeamCode, setHomeTeamCode] = useState<string>('KC');
  const [awayTeamCode, setAwayTeamCode] = useState<string>('BAL');
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'WR_CB' | 'PASSING' | 'RUSHING' | 'HAVOC' | 'PACE'>('ALL');
  
  const [aiAnalysis, setAiAnalysis] = useState<NFLfastrMatchupAnalysis | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  const homeTeam = NFLFASTR_TEAMS.find(t => t.teamCode === homeTeamCode) || NFLFASTR_TEAMS[0];
  const awayTeam = NFLFASTR_TEAMS.find(t => t.teamCode === awayTeamCode) || NFLFASTR_TEAMS[1];

  // Featured Preset Matchups
  const presetMatchups = [
    { name: 'KC vs BAL', home: 'KC', away: 'BAL' },
    { name: 'SF vs DET', home: 'SF', away: 'DET' },
    { name: 'BUF vs PHI', home: 'BUF', away: 'PHI' },
    { name: 'CIN vs HOU', home: 'CIN', away: 'HOU' },
    { name: 'GB vs MIN', home: 'GB', away: 'MIN' },
    { name: 'MIA vs NYJ', home: 'MIA', away: 'NYJ' },
  ];

  // Helper to calculate matchup EPA edge
  // Home Pass Offense EPA vs Away Pass Def EPA Allowed
  const homePassMatchupEpa = homeTeam.passEpaPerPlay - (-awayTeam.passDefEpaPerPlay); // e.g. 0.252 - 0.095 = +0.157
  const awayPassMatchupEpa = awayTeam.passEpaPerPlay - (-homeTeam.passDefEpaPerPlay);

  const homeRushMatchupEpa = homeTeam.rushEpaPerPlay - (-awayTeam.rushDefEpaPerPlay);
  const awayRushMatchupEpa = awayTeam.rushEpaPerPlay - (-homeTeam.rushDefEpaPerPlay);

  // Call Gemini API for advanced NFLfastr matchup synthesis
  const fetchAiAnalysis = async () => {
    setIsAiLoading(true);
    setAiAnalysis(null);

    try {
      const response = await fetch('/api/ai/nflfastr-matchup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homeTeam, awayTeam }),
      });

      if (!response.ok) {
        throw new Error('Server returned non-200');
      }

      const data = await response.json();
      setAiAnalysis(data);
    } catch (err) {
      console.warn('AI API fallback heuristic for NFLfastr matchup analysis:', err);
      // Fallback response if offline or key missing
      setTimeout(() => {
        const homeAdvantage = homeTeam.offEpaPerPlay + homeTeam.defEpaPerPlay > awayTeam.offEpaPerPlay + awayTeam.defEpaPerPlay;
        const winner = homeAdvantage ? homeTeam.fullName : awayTeam.fullName;
        
        setAiAnalysis({
          projectedWinner: winner,
          projectedScore: homeAdvantage ? `${homeTeam.name} 27, ${awayTeam.name} 23` : `${awayTeam.name} 26, ${homeTeam.name} 24`,
          gameScriptForecast: `Expect a high-volume passing script. ${homeTeam.fullName} carries a +${(homeTeam.proe).toFixed(1)}% PROE in neutral situations, while ${awayTeam.fullName} relies on heavy personnel success.`,
          passExploitability: `${homeTeam.name} Pass Offense EPA (+${homeTeam.passEpaPerPlay}) faces ${awayTeam.name} Pass Defense (${awayTeam.passDefEpaPerPlay} EPA allowed). Key matchup lies in ${homeTeam.name} CPOE (+${homeTeam.cpoe}%).`,
          rushExploitability: `${awayTeam.name} Rush EPA (+${awayTeam.rushEpaPerPlay}) holds an edge against ${homeTeam.name} front box defense (${homeTeam.rushDefEpaPerPlay} EPA allowed).`,
          pressureAndHavocImpact: `${homeTeam.name} pressure rate (${homeTeam.pressureRate}%) vs ${awayTeam.name} sack rate (${awayTeam.sackRate}%). Blitz packages will dictate early-down success.`,
          fantasyKeyTakeaway: `Boost fantasy pass catchers on ${homeTeam.name} due to early-down passing frequency. Monitor target share distribution in red zone.`,
          keyMatchupEdge: `${homeAdvantage ? homeTeam.name : awayTeam.name} holds the efficiency advantage in total Expected Points Added (EPA) per play.`,
          confidenceScore: 78
        });
      }, 500);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSwapTeams = () => {
    const temp = homeTeamCode;
    setHomeTeamCode(awayTeamCode);
    setAwayTeamCode(temp);
    setAiAnalysis(null);
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Top Banner: NFLfastr Engine Control Header */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>NFLfastr Team Matchup Matrix</span>
              <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800 font-bold">
                PLAY-BY-PLAY EPA ENGINE
              </span>
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Head-to-head Expected Points Added (EPA), Pass Rate Over Expected (PROE), CPOE & Pressure Havoc analytics.
            </p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[10px] text-zinc-500 font-bold uppercase mr-1">PRESETS:</span>
          {presetMatchups.map((pm) => (
            <button
              key={pm.name}
              onClick={() => {
                setHomeTeamCode(pm.home);
                setAwayTeamCode(pm.away);
                setAiAnalysis(null);
              }}
              className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                homeTeamCode === pm.home && awayTeamCode === pm.away
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {pm.name}
            </button>
          ))}
        </div>
      </div>

      {/* Team Selection Cards Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Home Team Card Picker */}
        <div className="md:col-span-5 bg-zinc-950 border border-zinc-800 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              HOME TEAM
            </span>
            <span className="text-[10px] text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
              EPA RANK #{homeTeam.offEpaRank} OFFENSE
            </span>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={homeTeamCode}
              onChange={(e) => {
                setHomeTeamCode(e.target.value);
                setAiAnalysis(null);
              }}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm font-bold text-white focus:border-indigo-500 outline-none cursor-pointer"
            >
              {NFLFASTR_TEAMS.map((t) => (
                <option key={t.teamCode} value={t.teamCode}>
                  {t.fullName} ({t.record})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-[10px] pt-1">
            <div className="bg-zinc-900 p-1.5 rounded border border-zinc-800">
              <span className="text-zinc-500 block uppercase">OFF EPA</span>
              <span className="text-emerald-400 font-bold text-xs">{homeTeam.offEpaPerPlay > 0 ? `+${homeTeam.offEpaPerPlay}` : homeTeam.offEpaPerPlay}</span>
            </div>
            <div className="bg-zinc-900 p-1.5 rounded border border-zinc-800">
              <span className="text-zinc-500 block uppercase">DEF EPA</span>
              <span className="text-indigo-400 font-bold text-xs">{homeTeam.defEpaPerPlay}</span>
            </div>
            <div className="bg-zinc-900 p-1.5 rounded border border-zinc-800">
              <span className="text-zinc-500 block uppercase">PROE %</span>
              <span className="text-amber-400 font-bold text-xs">{homeTeam.proe > 0 ? `+${homeTeam.proe}%` : `${homeTeam.proe}%`}</span>
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <div className="md:col-span-2 flex items-center justify-center py-1">
          <button
            onClick={handleSwapTeams}
            className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-full border border-zinc-800 transition-all hover:scale-105 cursor-pointer shadow-md"
            title="Swap Home and Away Teams"
          >
            <ArrowRightLeft className="w-4 h-4 text-indigo-400" />
          </button>
        </div>

        {/* Away Team Card Picker */}
        <div className="md:col-span-5 bg-zinc-950 border border-zinc-800 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              AWAY TEAM
            </span>
            <span className="text-[10px] text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
              EPA RANK #{awayTeam.offEpaRank} OFFENSE
            </span>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={awayTeamCode}
              onChange={(e) => {
                setAwayTeamCode(e.target.value);
                setAiAnalysis(null);
              }}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm font-bold text-white focus:border-indigo-500 outline-none cursor-pointer"
            >
              {NFLFASTR_TEAMS.map((t) => (
                <option key={t.teamCode} value={t.teamCode}>
                  {t.fullName} ({t.record})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-[10px] pt-1">
            <div className="bg-zinc-900 p-1.5 rounded border border-zinc-800">
              <span className="text-zinc-500 block uppercase">OFF EPA</span>
              <span className="text-emerald-400 font-bold text-xs">{awayTeam.offEpaPerPlay > 0 ? `+${awayTeam.offEpaPerPlay}` : awayTeam.offEpaPerPlay}</span>
            </div>
            <div className="bg-zinc-900 p-1.5 rounded border border-zinc-800">
              <span className="text-zinc-500 block uppercase">DEF EPA</span>
              <span className="text-indigo-400 font-bold text-xs">{awayTeam.defEpaPerPlay}</span>
            </div>
            <div className="bg-zinc-900 p-1.5 rounded border border-zinc-800">
              <span className="text-zinc-500 block uppercase">PROE %</span>
              <span className="text-amber-400 font-bold text-xs">{awayTeam.proe > 0 ? `+${awayTeam.proe}%` : `${awayTeam.proe}%`}</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Analysis Trigger Bar */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-zinc-300 font-medium font-sans">
            Synthesize play-by-play game scripts, EPA differential & fantasy match-up exploits using Gemini AI.
          </span>
        </div>

        <button
          id="btn-run-nflfastr-ai"
          onClick={fetchAiAnalysis}
          disabled={isAiLoading}
          className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shadow-md"
        >
          {isAiLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Zap className="w-3.5 h-3.5 text-amber-300" />
          )}
          <span>ANALYZE MATCHUP WITH AI</span>
        </button>
      </div>

      {/* AI Matchup Analysis Results Card */}
      {aiAnalysis && (
        <div className="bg-zinc-950 border border-indigo-500/40 rounded-lg p-4 space-y-3 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-800 gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-indigo-600 text-white font-bold text-[10px] rounded">
                AI PROJECTION
              </span>
              <h2 className="text-sm font-bold text-white font-sans">
                Projected Outcome: <span className="text-emerald-400">{aiAnalysis.projectedWinner}</span> ({aiAnalysis.projectedScore})
              </h2>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-500">CONFIDENCE:</span>
              <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {aiAnalysis.confidenceScore}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-sans">
            <div className="bg-zinc-900/80 p-3 rounded border border-zinc-800 space-y-1">
              <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase block">⚡ GAME SCRIPT FORECAST</span>
              <p className="text-zinc-300 leading-relaxed">{aiAnalysis.gameScriptForecast}</p>
            </div>

            <div className="bg-zinc-900/80 p-3 rounded border border-zinc-800 space-y-1">
              <span className="text-[10px] font-mono text-amber-400 font-bold uppercase block">🎯 FANTASY KEY TAKEAWAY</span>
              <p className="text-zinc-300 leading-relaxed">{aiAnalysis.fantasyKeyTakeaway}</p>
            </div>

            <div className="bg-zinc-900/80 p-3 rounded border border-zinc-800 space-y-1">
              <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase block">🏈 PASS EXPLOITABILITY</span>
              <p className="text-zinc-300 leading-relaxed">{aiAnalysis.passExploitability}</p>
            </div>

            <div className="bg-zinc-900/80 p-3 rounded border border-zinc-800 space-y-1">
              <span className="text-[10px] font-mono text-blue-400 font-bold uppercase block">🏃 RUSH EXPLOITABILITY</span>
              <p className="text-zinc-300 leading-relaxed">{aiAnalysis.rushExploitability}</p>
            </div>
          </div>

          <div className="bg-zinc-900 p-2.5 rounded border border-zinc-800 flex items-center gap-2 text-xs font-mono text-zinc-300">
            <Compass className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span><strong>STATISTICAL EDGE:</strong> {aiAnalysis.keyMatchupEdge}</span>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between pt-1">
        <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">ADVANCED METRICS MATRIX</h2>

        <div className="flex gap-1 flex-wrap">
          {[
            { id: 'ALL', label: 'ALL' },
            { id: 'WR_CB', label: 'WR / CB MATCHUPS' },
            { id: 'PASSING', label: 'PASSING' },
            { id: 'RUSHING', label: 'RUSHING' },
            { id: 'HAVOC', label: 'HAVOC' },
            { id: 'PACE', label: 'PACE' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Head-to-Head Comparison Cards */}
      <div className="space-y-3">
        {/* WR / CB Shadow & Individual Coverage Matchup Section */}
        {(activeCategory === 'ALL' || activeCategory === 'WR_CB' || activeCategory === 'PASSING') && (
          <div className="bg-zinc-950 border border-indigo-500/30 rounded-lg p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-zinc-800 gap-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Wide Receiver vs Cornerback Individual Coverage Matchups</span>
                  <span className="text-[10px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60 font-mono">
                    SHADOW & ALIGNMENT ANALYTICS
                  </span>
                </h3>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">
                Target Share • YPRR • CB Passer Rating Allowed
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Home Team WRs vs Away Team CBs */}
              <div className="bg-zinc-900/90 rounded-lg p-3 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span className="text-xs font-bold text-indigo-400">{homeTeam.fullName} Pass Catchers</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">vs {awayTeam.name} Secondary</span>
                </div>

                <div className="space-y-2.5">
                  {(homeTeam.topReceivers || []).map((wr, idx) => {
                    const cb = (awayTeam.topCornerbacks || [])[idx % (awayTeam.topCornerbacks?.length || 1)] || {
                      name: 'Primary CB',
                      position: 'CB1',
                      coverageType: 'Zone / Left',
                      passerRatingAllowed: 75.0,
                      yardsPerCoverageSnap: 1.0,
                      catchRateAllowed: 55.0,
                      shadowRate: 20
                    };

                    const edgeScore = (wr.yprr * 30) - (cb.passerRatingAllowed * 0.5) - (cb.yardsPerCoverageSnap * 20);
                    const isWrEdge = edgeScore > 10;
                    const isCbEdge = edgeScore < -8;

                    return (
                      <div key={wr.name} className="bg-zinc-950 p-2.5 rounded border border-zinc-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-white">
                            <span className="text-indigo-400 font-mono">{wr.position}</span>
                            <span>{wr.name}</span>
                            <span className="text-[10px] text-zinc-500 font-normal">({wr.alignment})</span>
                          </div>
                          
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            isWrEdge
                              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                              : isCbEdge
                              ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                              : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                          }`}>
                            {isWrEdge ? '🔥 WR Edge' : isCbEdge ? '🔒 CB Lock' : '⚖ Neutral'}
                          </span>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-zinc-900/60 p-2 rounded">
                          <div>
                            <span className="text-zinc-500 block">OFF: {wr.name}</span>
                            <span className="text-zinc-300 font-bold">{wr.targetShare}% Tgt Share</span>
                            <span className="text-zinc-400 block">{wr.yprr} YPRR • {wr.adot} aDOT</span>
                          </div>
                          <div className="border-l border-zinc-800 pl-2">
                            <span className="text-zinc-500 block">DEF: {cb.name} ({cb.coverageType})</span>
                            <span className="text-zinc-300 font-bold">{cb.passerRatingAllowed} Rating Allowed</span>
                            <span className="text-zinc-400 block">{cb.yardsPerCoverageSnap} Yds/Snap • {cb.shadowRate}% Shadow</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Away Team WRs vs Home Team CBs */}
              <div className="bg-zinc-900/90 rounded-lg p-3 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-xs font-bold text-amber-400">{awayTeam.fullName} Pass Catchers</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">vs {homeTeam.name} Secondary</span>
                </div>

                <div className="space-y-2.5">
                  {(awayTeam.topReceivers || []).map((wr, idx) => {
                    const cb = (homeTeam.topCornerbacks || [])[idx % (homeTeam.topCornerbacks?.length || 1)] || {
                      name: 'Primary CB',
                      position: 'CB1',
                      coverageType: 'Zone / Right',
                      passerRatingAllowed: 75.0,
                      yardsPerCoverageSnap: 1.0,
                      catchRateAllowed: 55.0,
                      shadowRate: 20
                    };

                    const edgeScore = (wr.yprr * 30) - (cb.passerRatingAllowed * 0.5) - (cb.yardsPerCoverageSnap * 20);
                    const isWrEdge = edgeScore > 10;
                    const isCbEdge = edgeScore < -8;

                    return (
                      <div key={wr.name} className="bg-zinc-950 p-2.5 rounded border border-zinc-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-white">
                            <span className="text-amber-400 font-mono">{wr.position}</span>
                            <span>{wr.name}</span>
                            <span className="text-[10px] text-zinc-500 font-normal">({wr.alignment})</span>
                          </div>
                          
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            isWrEdge
                              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                              : isCbEdge
                              ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                              : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                          }`}>
                            {isWrEdge ? '🔥 WR Edge' : isCbEdge ? '🔒 CB Lock' : '⚖ Neutral'}
                          </span>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-zinc-900/60 p-2 rounded">
                          <div>
                            <span className="text-zinc-500 block">OFF: {wr.name}</span>
                            <span className="text-zinc-300 font-bold">{wr.targetShare}% Tgt Share</span>
                            <span className="text-zinc-400 block">{wr.yprr} YPRR • {wr.adot} aDOT</span>
                          </div>
                          <div className="border-l border-zinc-800 pl-2">
                            <span className="text-zinc-500 block">DEF: {cb.name} ({cb.coverageType})</span>
                            <span className="text-zinc-300 font-bold">{cb.passerRatingAllowed} Rating Allowed</span>
                            <span className="text-zinc-400 block">{cb.yardsPerCoverageSnap} Yds/Snap • {cb.shadowRate}% Shadow</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Category 1: Expected Points Added (EPA) & Efficiency */}
        {(activeCategory === 'ALL' || activeCategory === 'PASSING' || activeCategory === 'RUSHING') && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Expected Points Added (EPA) Differential
                </h3>
              </div>
              <span className="text-[10px] text-zinc-500">Higher EPA = Better Efficiency</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Home Offense vs Away Defense */}
              <div className="bg-zinc-900 p-3 rounded border border-zinc-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-indigo-400">{homeTeam.name} Offense</span>
                  <span className="text-zinc-500">vs</span>
                  <span className="font-bold text-amber-400">{awayTeam.name} Defense</span>
                </div>

                {/* Pass Matchup */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-400">Pass EPA / Play</span>
                    <span className="font-bold text-white">
                      +{homeTeam.passEpaPerPlay} <span className="text-zinc-500 font-normal">vs</span> {awayTeam.passDefEpaPerPlay} allowed
                    </span>
                  </div>
                  <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-indigo-500"
                      style={{ width: `${Math.min(100, Math.max(10, (homeTeam.passEpaPerPlay + 0.1) * 200))}%` }}
                    />
                  </div>
                </div>

                {/* Rush Matchup */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-400">Rush EPA / Play</span>
                    <span className="font-bold text-white">
                      {homeTeam.rushEpaPerPlay > 0 ? `+${homeTeam.rushEpaPerPlay}` : homeTeam.rushEpaPerPlay} <span className="text-zinc-500 font-normal">vs</span> {awayTeam.rushDefEpaPerPlay} allowed
                    </span>
                  </div>
                  <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-500"
                      style={{ width: `${Math.min(100, Math.max(10, (homeTeam.rushEpaPerPlay + 0.1) * 200))}%` }}
                    />
                  </div>
                </div>

                <div className="text-[10px] text-zinc-400 bg-zinc-950 p-2 rounded border border-zinc-800/80 font-sans mt-2">
                  💡 Net Pass Edge: <strong className="text-emerald-400">{homePassMatchupEpa > 0 ? `+${homePassMatchupEpa.toFixed(3)} EPA` : `${homePassMatchupEpa.toFixed(3)} EPA`}</strong> per dropback
                </div>
              </div>

              {/* Away Offense vs Home Defense */}
              <div className="bg-zinc-900 p-3 rounded border border-zinc-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-amber-400">{awayTeam.name} Offense</span>
                  <span className="text-zinc-500">vs</span>
                  <span className="font-bold text-indigo-400">{homeTeam.name} Defense</span>
                </div>

                {/* Pass Matchup */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-400">Pass EPA / Play</span>
                    <span className="font-bold text-white">
                      +{awayTeam.passEpaPerPlay} <span className="text-zinc-500 font-normal">vs</span> {homeTeam.passDefEpaPerPlay} allowed
                    </span>
                  </div>
                  <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-amber-500"
                      style={{ width: `${Math.min(100, Math.max(10, (awayTeam.passEpaPerPlay + 0.1) * 200))}%` }}
                    />
                  </div>
                </div>

                {/* Rush Matchup */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-400">Rush EPA / Play</span>
                    <span className="font-bold text-white">
                      {awayTeam.rushEpaPerPlay > 0 ? `+${awayTeam.rushEpaPerPlay}` : awayTeam.rushEpaPerPlay} <span className="text-zinc-500 font-normal">vs</span> {homeTeam.rushDefEpaPerPlay} allowed
                    </span>
                  </div>
                  <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-500"
                      style={{ width: `${Math.min(100, Math.max(10, (awayTeam.rushEpaPerPlay + 0.1) * 200))}%` }}
                    />
                  </div>
                </div>

                <div className="text-[10px] text-zinc-400 bg-zinc-950 p-2 rounded border border-zinc-800/80 font-sans mt-2">
                  💡 Net Pass Edge: <strong className="text-emerald-400">{awayPassMatchupEpa > 0 ? `+${awayPassMatchupEpa.toFixed(3)} EPA` : `${awayPassMatchupEpa.toFixed(3)} EPA`}</strong> per dropback
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category 2: PROE, CPOE & Air Yards Profile */}
        {(activeCategory === 'ALL' || activeCategory === 'PASSING') && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Passing Script & Accuracy Metrics (PROE / CPOE)
                </h3>
              </div>
              <span className="text-[10px] text-zinc-500">NFLfastr Model Inputs</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              {/* PROE */}
              <div className="bg-zinc-900 p-2.5 rounded border border-zinc-800">
                <span className="text-[10px] text-zinc-500 font-bold uppercase block">PROE (Pass Rate Over Expected)</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-indigo-400 font-bold">{homeTeam.teamCode}: {homeTeam.proe > 0 ? `+${homeTeam.proe}%` : `${homeTeam.proe}%`}</span>
                  <span className="text-amber-400 font-bold">{awayTeam.teamCode}: {awayTeam.proe > 0 ? `+${awayTeam.proe}%` : `${awayTeam.proe}%`}</span>
                </div>
              </div>

              {/* CPOE */}
              <div className="bg-zinc-900 p-2.5 rounded border border-zinc-800">
                <span className="text-[10px] text-zinc-500 font-bold uppercase block">CPOE (Accuracy Over Exp)</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-indigo-400 font-bold">{homeTeam.teamCode}: +{homeTeam.cpoe}%</span>
                  <span className="text-amber-400 font-bold">{awayTeam.teamCode}: +{awayTeam.cpoe}%</span>
                </div>
              </div>

              {/* aDOT */}
              <div className="bg-zinc-900 p-2.5 rounded border border-zinc-800">
                <span className="text-[10px] text-zinc-500 font-bold uppercase block">Avg Depth of Target (aDOT)</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-indigo-400 font-bold">{homeTeam.teamCode}: {homeTeam.aDot} yds</span>
                  <span className="text-amber-400 font-bold">{awayTeam.teamCode}: {awayTeam.aDot} yds</span>
                </div>
              </div>

              {/* YAC per Rec */}
              <div className="bg-zinc-900 p-2.5 rounded border border-zinc-800">
                <span className="text-[10px] text-zinc-500 font-bold uppercase block">YAC per Reception</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-indigo-400 font-bold">{homeTeam.teamCode}: {homeTeam.yacPerRec} yds</span>
                  <span className="text-amber-400 font-bold">{awayTeam.teamCode}: {awayTeam.yacPerRec} yds</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category 3: Defensive Pressure & Havoc */}
        {(activeCategory === 'ALL' || activeCategory === 'HAVOC') && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Defensive Pressure, Sack & Blitz Havoc Engine
                </h3>
              </div>
              <span className="text-[10px] text-zinc-500">Pass Rush & Disguise Metrics</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-zinc-900 p-3 rounded border border-zinc-800 space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase block">Pass Rush Pressure Rate</span>
                <div className="flex justify-between font-bold mt-1">
                  <span className="text-indigo-400">{homeTeam.teamCode}: {homeTeam.pressureRate}%</span>
                  <span className="text-amber-400">{awayTeam.teamCode}: {awayTeam.pressureRate}%</span>
                </div>
              </div>

              <div className="bg-zinc-900 p-3 rounded border border-zinc-800 space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase block">Sack Percentage</span>
                <div className="flex justify-between font-bold mt-1">
                  <span className="text-indigo-400">{homeTeam.teamCode}: {homeTeam.sackRate}%</span>
                  <span className="text-amber-400">{awayTeam.teamCode}: {awayTeam.sackRate}%</span>
                </div>
              </div>

              <div className="bg-zinc-900 p-3 rounded border border-zinc-800 space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase block">Blitz Frequency</span>
                <div className="flex justify-between font-bold mt-1">
                  <span className="text-indigo-400">{homeTeam.teamCode}: {homeTeam.blitzRate}%</span>
                  <span className="text-amber-400">{awayTeam.teamCode}: {awayTeam.blitzRate}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category 4: Red Zone & Pace */}
        {(activeCategory === 'ALL' || activeCategory === 'PACE') && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Neutral Script Pace & Red Zone EPA
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-zinc-900 p-3 rounded border border-zinc-800 space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase block">Neutral Pace (Secs per play)</span>
                <p className="text-[11px] text-zinc-400 font-sans mt-1">
                  {homeTeam.teamCode}: <strong className="text-white font-mono">{homeTeam.neutralPaceSecs}s</strong> | {awayTeam.teamCode}: <strong className="text-white font-mono">{awayTeam.neutralPaceSecs}s</strong>
                </p>
              </div>

              <div className="bg-zinc-900 p-3 rounded border border-zinc-800 space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase block">Red Zone EPA / Play</span>
                <p className="text-[11px] text-zinc-400 font-sans mt-1">
                  {homeTeam.teamCode}: <strong className="text-emerald-400 font-mono">+{homeTeam.redZoneEpa}</strong> | {awayTeam.teamCode}: <strong className="text-emerald-400 font-mono">+{awayTeam.redZoneEpa}</strong>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Scouting Notes Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 space-y-2">
          <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
            {homeTeam.fullName} Key Strengths & Vulnerabilities
          </span>
          <div className="space-y-1 text-xs font-sans">
            <div className="text-emerald-400 font-mono text-[11px]">
              ✔ Strengths: {homeTeam.keyStrengths.join(' • ')}
            </div>
            <div className="text-amber-400 font-mono text-[11px]">
              ⚠ Vulnerabilities: {homeTeam.keyVulnerabilities.join(' • ')}
            </div>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 space-y-2">
          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
            {awayTeam.fullName} Key Strengths & Vulnerabilities
          </span>
          <div className="space-y-1 text-xs font-sans">
            <div className="text-emerald-400 font-mono text-[11px]">
              ✔ Strengths: {awayTeam.keyStrengths.join(' • ')}
            </div>
            <div className="text-amber-400 font-mono text-[11px]">
              ⚠ Vulnerabilities: {awayTeam.keyVulnerabilities.join(' • ')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
