import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Plus,
  X,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { Player, TradeAnalysisResponse, LeagueSettings } from '../types';
import { calculateFallbackTradeAnalysis } from '../utils/fantasyCalculators';

interface TradeAnalyzerViewProps {
  userPlayers: Player[];
  allAvailablePlayers: Player[];
  leagueSettings: LeagueSettings;
}

export const TradeAnalyzerView: React.FC<TradeAnalyzerViewProps> = ({
  userPlayers,
  allAvailablePlayers,
  leagueSettings
}) => {
  const [giving, setGiving] = useState<Player[]>([userPlayers[0] || allAvailablePlayers[0]]);
  const [receiving, setReceiving] = useState<Player[]>([allAvailablePlayers[1] || userPlayers[1]]);

  const [isLoading, setIsLoading] = useState(false);
  const [tradeResult, setTradeResult] = useState<TradeAnalysisResponse | null>(null);

  // Available candidate lists for selection dropdowns
  const availableToGive = userPlayers.filter(p => !giving.some(g => g.id === p.id));
  const availableToReceive = allAvailablePlayers.filter(p => !receiving.some(r => r.id === p.id));

  const handleAddGiving = (player: Player) => {
    if (player) setGiving([...giving, player]);
  };

  const handleRemoveGiving = (playerId: string) => {
    setGiving(giving.filter(p => p.id !== playerId));
  };

  const handleAddReceiving = (player: Player) => {
    if (player) setReceiving([...receiving, player]);
  };

  const handleRemoveReceiving = (playerId: string) => {
    setReceiving(receiving.filter(p => p.id !== playerId));
  };

  const handleAnalyzeTrade = async () => {
    if (giving.length === 0 || receiving.length === 0) return;

    setIsLoading(true);
    setTradeResult(null);

    try {
      const response = await fetch('/api/ai/trade-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ giving, receiving, leagueSettings })
      });

      if (!response.ok) {
        throw new Error('AI analysis service unreachable');
      }

      const data: TradeAnalysisResponse = await response.json();
      setTradeResult(data);
    } catch (err) {
      console.warn('Using fallback trade evaluation:', err);
      const fallback = calculateFallbackTradeAnalysis(giving, receiving);
      setTradeResult(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  const givingTotalPoints = giving.reduce((s, p) => s + p.projectedPoints, 0);
  const receivingTotalPoints = receiving.reduce((s, p) => s + p.projectedPoints, 0);
  const pointDelta = receivingTotalPoints - givingTotalPoints;

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold">
            <ArrowLeftRight className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>Trade Machine & Valuation Engine</span>
              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                GEMINI 3.6 EVALUATOR
              </span>
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5 font-mono">
              Build cross-roster trade offers to analyze PPG delta, roster depth shifts, and verdict grades.
            </p>
          </div>
        </div>
      </div>

      {/* Trade Builder Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Giving Column */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <div>
              <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-widest block">YOU SURRENDER</span>
              <h2 className="font-bold text-white text-xs font-mono">Outgoing Assets</h2>
            </div>
            <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">
              -{givingTotalPoints.toFixed(1)} PPG
            </span>
          </div>

          {/* Player Cards List */}
          <div className="space-y-2">
            {giving.map((p) => (
              <div
                key={p.id}
                className="bg-zinc-900 border border-zinc-800 rounded p-2.5 flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-zinc-200 text-xs">{p.name}</div>
                  <p className="text-[10px] font-mono text-zinc-500">
                    {p.position} • {p.team} • Proj: {p.projectedPoints} pts
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveGiving(p.id)}
                  className="p-1 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Asset Dropdown */}
          <div className="pt-1">
            <select
              id="select-add-giving"
              onChange={(e) => {
                const found = userPlayers.find(p => p.id === e.target.value);
                if (found) handleAddGiving(found);
                e.target.value = '';
              }}
              defaultValue=""
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded p-2 font-mono outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="" disabled>+ Add Player From Roster...</option>
              {availableToGive.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.position} - {p.team}) - Proj {p.projectedPoints} pts
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Receiving Column */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <div>
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest block">YOU RECEIVE</span>
              <h2 className="font-bold text-white text-xs font-mono">Incoming Assets</h2>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
              +{receivingTotalPoints.toFixed(1)} PPG
            </span>
          </div>

          {/* Player Cards List */}
          <div className="space-y-2">
            {receiving.map((p) => (
              <div
                key={p.id}
                className="bg-zinc-900 border border-zinc-800 rounded p-2.5 flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-zinc-200 text-xs">{p.name}</div>
                  <p className="text-[10px] font-mono text-zinc-500">
                    {p.position} • {p.team} • Proj: {p.projectedPoints} pts
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveReceiving(p.id)}
                  className="p-1 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Asset Dropdown */}
          <div className="pt-1">
            <select
              id="select-add-receiving"
              onChange={(e) => {
                const found = allAvailablePlayers.find(p => p.id === e.target.value);
                if (found) handleAddReceiving(found);
                e.target.value = '';
              }}
              defaultValue=""
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded p-2 font-mono outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="" disabled>+ Add Player From Partner / Pool...</option>
              {availableToReceive.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.position} - {p.team}) - Proj {p.projectedPoints} pts
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Action Button & Net Delta Bar */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-zinc-500 uppercase">NET PPG DELTA:</span>
          <span className={`text-lg font-mono font-bold ${pointDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {pointDelta >= 0 ? '+' : ''}{pointDelta.toFixed(1)} PPG
          </span>
        </div>

        <button
          id="btn-run-trade-ai"
          onClick={handleAnalyzeTrade}
          disabled={isLoading || giving.length === 0 || receiving.length === 0}
          className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-mono font-bold text-xs rounded transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>EVALUATING PROPOSAL...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>EVALUATE TRADE WITH GEMINI</span>
            </>
          )}
        </button>
      </div>

      {/* AI Trade Report Result Card */}
      {tradeResult && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-4 shadow-xl animate-fadeIn font-mono">
          {/* Header Grade & Recommendation */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded bg-indigo-600 text-white flex items-center justify-center font-mono font-extrabold text-2xl shadow-md">
                {tradeResult.grade}
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase">VALUATION GRADE</span>
                <h3 className="text-base font-bold text-white mt-0.5">Trade Assessment Matrix</h3>
                <p className="text-xs text-zinc-400">
                  Lineup Delta: <strong className={tradeResult.myPointDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {tradeResult.myPointDelta >= 0 ? '+' : ''}{tradeResult.myPointDelta} pts/week
                  </strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {tradeResult.recommendation === 'ACCEPT' && (
                <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs rounded flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ACCEPT PROPOSAL</span>
                </span>
              )}
              {tradeResult.recommendation === 'REJECT' && (
                <span className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-xs rounded flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" />
                  <span>REJECT PROPOSAL</span>
                </span>
              )}
              {tradeResult.recommendation === 'COUNTER' && (
                <span className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs rounded flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4" />
                  <span>COUNTER PROPOSAL</span>
                </span>
              )}
            </div>
          </div>

          {/* Analysis Summary */}
          <div className="bg-zinc-900 p-3 rounded border border-zinc-800">
            <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Executive Summary</h4>
            <p className="text-xs text-zinc-300 leading-relaxed font-sans">{tradeResult.analysisSummary}</p>
          </div>

          {/* Key Bullet Factors */}
          <div>
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Influencing Factors</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {tradeResult.keyFactors.map((factor, idx) => (
                <div key={idx} className="bg-zinc-900 p-2.5 rounded border border-zinc-800 text-[11px] text-zinc-300">
                  • {factor}
                </div>
              ))}
            </div>
          </div>

          {/* Positional & Schedule Impact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="bg-zinc-900/80 p-3 rounded border border-zinc-800">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Strengths Gained</span>
              <p className="text-xs text-zinc-300 mt-1 font-sans">{tradeResult.positionalImpact.strengthGained}</p>
            </div>

            <div className="bg-zinc-900/80 p-3 rounded border border-zinc-800">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block">Vulnerabilities Created</span>
              <p className="text-xs text-zinc-300 mt-1 font-sans">{tradeResult.positionalImpact.vulnerabilityCreated}</p>
            </div>
          </div>

          {/* Detailed Verdict */}
          <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded text-xs text-amber-200 font-sans">
            <strong className="text-amber-400 font-mono block mb-1">Strategic Verdict:</strong>
            {tradeResult.verdictDetail}
          </div>
        </div>
      )}
    </div>
  );
};
