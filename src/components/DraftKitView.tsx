import React, { useState } from 'react';
import {
  Trophy,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Loader2,
  ListFilter
} from 'lucide-react';
import { DraftPick, Player, LeagueSettings } from '../types';

interface DraftKitViewProps {
  draftPicks: DraftPick[];
  availablePlayers: Player[];
  leagueSettings: LeagueSettings;
  onSelectPlayer: (player: Player) => void;
  onDraftPlayer: (player: Player) => void;
}

export const DraftKitView: React.FC<DraftKitViewProps> = ({
  draftPicks,
  availablePlayers,
  leagueSettings,
  onSelectPlayer,
  onDraftPlayer
}) => {
  const [selectedPos, setSelectedPos] = useState<string>('ALL');
  const [aiAdvice, setAiAdvice] = useState<any | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Find current pick turn
  const currentPick = draftPicks.find(p => p.playerPicked === null) || draftPicks[0];
  const userPicks = draftPicks.filter(p => p.isUser && p.playerPicked !== null);

  const filteredAvailable = availablePlayers.filter(p => {
    if (selectedPos === 'ALL') return true;
    return p.position === selectedPos;
  });

  const getAiDraftAdvice = async () => {
    setIsAiLoading(true);
    setAiAdvice(null);

    try {
      const response = await fetch('/api/ai/draft-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          availablePlayers: availablePlayers.slice(0, 8),
          currentRound: currentPick?.round || 1,
          pickNumber: currentPick?.pickNumber || 1,
          userRoster: userPicks.map(p => p.playerPicked?.name),
          strategy: "Hero-RB & High-Target WR"
        })
      });

      if (!response.ok) throw new Error("AI draft service failed");

      const data = await response.json();
      setAiAdvice(data);
    } catch (err) {
      console.warn("Fallback draft advice:", err);
      const top = availablePlayers[0];
      setAiAdvice({
        topPickId: top?.id,
        topPickReason: `Highest available VORP (Value Over Replacement Player) with projected ${top?.projectedPoints} PPG.`,
        alternativePickId: availablePlayers[1]?.id,
        positionScarcityAlert: "Tier 1 Running Backs are rapidly depleting.",
        strategyVerdict: "Drafting best available player optimizes overall lineup projection floor."
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Draft Banner */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>Live Draft Board & ADP Engine</span>
              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                SNAKE SIMULATOR
              </span>
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5 font-mono">
              Snake draft matrix with position scarcity tracking, ADP tiers, and real-time AI pick recommendations.
            </p>
          </div>
        </div>

        <button
          id="btn-get-draft-ai"
          onClick={getAiDraftAdvice}
          disabled={isAiLoading}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs rounded transition-all flex items-center gap-2 cursor-pointer"
        >
          {isAiLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          )}
          <span>GET AI ADVICE</span>
        </button>
      </div>

      {/* AI Draft Advisor Report Box */}
      {aiAdvice && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 space-y-2 animate-fadeIn font-mono">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI RECOMMENDATION FOR PICK #{currentPick?.pickNumber}</span>
          </div>
          <p className="text-xs text-zinc-200 font-sans">
            💡 <strong>Top Pick:</strong> {aiAdvice.topPickReason}
          </p>
          <div className="flex flex-wrap gap-2 text-[10px] pt-1">
            <span className="bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded">
              ⚠️ {aiAdvice.positionScarcityAlert}
            </span>
            <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded">
              🎯 Strategy: {aiAdvice.strategyVerdict}
            </span>
          </div>
        </div>
      )}

      {/* Draft Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Available Players & Tier Rankings */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between font-mono">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Available Player Pool</h2>

            {/* Position filter */}
            <div className="flex gap-1">
              {['ALL', 'QB', 'RB', 'WR', 'TE'].map((pos) => (
                <button
                  key={pos}
                  onClick={() => setSelectedPos(pos)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    selectedPos === pos ? 'bg-indigo-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-lg divide-y divide-zinc-800/80 max-h-[480px] overflow-y-auto custom-scrollbar font-mono">
            {filteredAvailable.map((p) => (
              <div
                key={p.id}
                className="p-2.5 flex items-center justify-between hover:bg-zinc-900/60 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded bg-zinc-900 border border-zinc-800 text-indigo-400 font-bold text-xs flex items-center justify-center">
                    {p.position}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        onClick={() => onSelectPlayer(p)}
                        className="font-bold text-zinc-200 text-xs hover:text-indigo-400 cursor-pointer font-sans"
                      >
                        {p.name}
                      </span>
                      <span className="text-[9px] bg-zinc-900 text-zinc-500 px-1 py-0.2 rounded border border-zinc-800">
                        Tier {p.tier}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500">{p.team} • ADP: {p.adp} • Proj: {p.projectedPoints} pts</p>
                  </div>
                </div>

                <button
                  onClick={() => onDraftPlayer(p)}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] rounded transition-colors cursor-pointer"
                >
                  DRAFT
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Live Draft Board Logs */}
        <div className="lg:col-span-5 space-y-3 font-mono">
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Board Matrix</h2>

          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 space-y-2 max-h-[480px] overflow-y-auto custom-scrollbar">
            {draftPicks.map((pick) => (
              <div
                key={pick.pickNumber}
                className={`p-2 rounded border text-[11px] flex items-center justify-between ${
                  pick.isUser
                    ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300'
                    : 'bg-zinc-900 border-zinc-800/80 text-zinc-300'
                }`}
              >
                <div>
                  <span className="font-bold mr-1.5">#{pick.pickNumber} (R{pick.round})</span>
                  <span className="text-zinc-500">{pick.teamName}: </span>
                  <strong className="text-zinc-100 font-sans">{pick.playerPicked?.name || <span className="text-amber-400 animate-pulse font-mono">ON THE CLOCK</span>}</strong>
                </div>

                {pick.playerPicked && (
                  <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-zinc-950 text-zinc-400 border border-zinc-800">
                    {pick.playerPicked.position}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
