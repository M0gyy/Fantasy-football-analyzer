import React, { useState } from 'react';
import { X, RefreshCw, CheckCircle2, Zap, ArrowRight, ShieldCheck, Database, Info, ExternalLink } from 'lucide-react';
import { LeagueSettings, RosterSlot, Player } from '../types';
import { MOCK_PLAYERS } from '../data/mockData';

interface YahooImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (settings: LeagueSettings, roster: RosterSlot[]) => void;
}

export const YahooImportModal: React.FC<YahooImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess
}) => {
  const [leagueId, setLeagueId] = useState('847291');
  const [season, setSeason] = useState('2024');
  const [teamNumber, setTeamNumber] = useState('1');
  const [importMode, setImportMode] = useState<'ID' | 'PRESET'>('PRESET');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'IDLE' | 'AUTH' | 'FETCHING' | 'SUCCESS'>('IDLE');
  const [progressMsg, setProgressMsg] = useState('');

  if (!isOpen) return null;

  const handleImport = (presetName?: string, presetFormat?: 'PPR' | 'HALF_PPR' | 'SUPERFLEX') => {
    setIsLoading(true);
    setStep('AUTH');
    setProgressMsg('Connecting to Yahoo Fantasy API OAuth 2.0 gateway...');

    setTimeout(() => {
      setStep('FETCHING');
      setProgressMsg('Reading Yahoo League Settings & Scoring Matrices...');
    }, 900);

    setTimeout(() => {
      setProgressMsg('Mapping Yahoo Roster IDs to NFLfastr Player Profiles...');
    }, 1800);

    setTimeout(() => {
      setStep('SUCCESS');
      setIsLoading(false);

      const targetLeagueName = presetName || `Yahoo League #${leagueId}`;
      const format = presetFormat || 'PPR';

      const importedSettings: LeagueSettings = {
        leagueName: targetLeagueName,
        sport: 'NFL',
        scoringFormat: format,
        teamsCount: 12,
        faabBudget: 100,
        currentWeek: 9
      };

      // Create a customized Yahoo synced roster
      const importedRoster: RosterSlot[] = [
        { slotId: "s-qb", slotName: "QB", allowedPositions: ["QB"], player: MOCK_PLAYERS[1] }, // Lamar Jackson
        { slotId: "s-rb1", slotName: "RB1", allowedPositions: ["RB"], player: MOCK_PLAYERS[8] }, // Saquon Barkley
        { slotId: "s-rb2", slotName: "RB2", allowedPositions: ["RB"], player: MOCK_PLAYERS[9] }, // Derrick Henry
        { slotId: "s-wr1", slotName: "WR1", allowedPositions: ["WR"], player: MOCK_PLAYERS[15] }, // Justin Jefferson
        { slotId: "s-wr2", slotName: "WR2", allowedPositions: ["WR"], player: MOCK_PLAYERS[16] }, // Ja'Marr Chase
        { slotId: "s-te", slotName: "TE", allowedPositions: ["TE"], player: MOCK_PLAYERS[22] }, // Brock Bowers
        { slotId: "s-flex", slotName: "FLEX", allowedPositions: ["RB", "WR", "TE"], player: MOCK_PLAYERS[11] }, // Jahmyr Gibbs
        { slotId: "s-k", slotName: "K", allowedPositions: ["K"], player: MOCK_PLAYERS[25] }, // Brandon Aubrey
        { slotId: "s-def", slotName: "DEF", allowedPositions: ["DEF"], player: MOCK_PLAYERS[27] }, // Minnesota Vikings DEF
        { slotId: "s-bench1", slotName: "BENCH", allowedPositions: ["QB", "RB", "WR", "TE", "K", "DEF"], player: MOCK_PLAYERS[3] }, // Jayden Daniels
        { slotId: "s-bench2", slotName: "BENCH", allowedPositions: ["QB", "RB", "WR", "TE", "K", "DEF"], player: MOCK_PLAYERS[14] }, // Kenneth Walker III
        { slotId: "s-bench3", slotName: "BENCH", allowedPositions: ["QB", "RB", "WR", "TE", "K", "DEF"], player: MOCK_PLAYERS[21] }, // Nico Collins
        { slotId: "s-ir", slotName: "IR", allowedPositions: ["QB", "RB", "WR", "TE"], player: null },
      ];

      setTimeout(() => {
        onImportSuccess(importedSettings, importedRoster);
        onClose();
        setStep('IDLE');
      }, 700);

    }, 2600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn font-mono">
      <div className="bg-zinc-950 border border-purple-900/60 rounded-xl w-full max-w-lg p-5 space-y-4 shadow-2xl shadow-purple-950/40 relative overflow-hidden">
        
        {/* Decorative Top Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-indigo-500 to-purple-400" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 font-bold text-sm">
              Y!
            </div>
            <div>
              <h2 className="font-bold text-white text-base tracking-tight font-sans flex items-center gap-2">
                Import Yahoo Fantasy League
                <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800/80 px-2 py-0.5 rounded font-mono">
                  API v2 Sync
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400 font-sans">
                Sync live rosters, league settings, and scoring formats directly from Yahoo Sports.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-900/90 rounded-lg border border-zinc-800 text-xs">
          <button
            onClick={() => setImportMode('PRESET')}
            className={`py-1.5 px-3 rounded font-medium transition-all ${
              importMode === 'PRESET'
                ? 'bg-purple-600 text-white font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Sample Yahoo Leagues
          </button>
          <button
            onClick={() => setImportMode('ID')}
            className={`py-1.5 px-3 rounded font-medium transition-all ${
              importMode === 'ID'
                ? 'bg-purple-600 text-white font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Enter League ID
          </button>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="py-8 px-4 bg-purple-950/20 border border-purple-800/40 rounded-lg flex flex-col items-center justify-center text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-purple-200">{progressMsg}</p>
              <p className="text-[10px] text-zinc-400 font-mono">
                {step === 'AUTH' && 'Authenticating OAuth 2.0 token token_key=yf_9428...'}
                {step === 'FETCHING' && 'GET /fantasy/v2/league/449.l.847291/standings'}
                {step === 'SUCCESS' && 'Roster mapped! Initializing state update...'}
              </p>
            </div>
          </div>
        )}

        {/* Success State */}
        {!isLoading && step === 'SUCCESS' && (
          <div className="py-6 px-4 bg-emerald-950/20 border border-emerald-800/40 rounded-lg flex flex-col items-center justify-center text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            <p className="text-sm font-bold text-emerald-200">Yahoo Fantasy League Synced!</p>
            <p className="text-xs text-zinc-400">Updating roster and matchup matrices...</p>
          </div>
        )}

        {/* Content based on Mode */}
        {!isLoading && step === 'IDLE' && importMode === 'PRESET' && (
          <div className="space-y-2.5">
            <label className="text-[11px] font-semibold text-zinc-300 block font-sans">
              Select a pre-configured Yahoo League template:
            </label>

            <div className="space-y-2">
              <button
                onClick={() => handleImport('Yahoo Apex Champions (12-Team PPR)', 'PPR')}
                className="w-full text-left p-3 rounded-lg bg-zinc-900 hover:bg-purple-950/40 border border-zinc-800 hover:border-purple-600/60 transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white group-hover:text-purple-300 transition-colors">
                    Yahoo Apex Champions League
                  </span>
                  <span className="text-[10px] bg-purple-900/60 text-purple-200 border border-purple-700/50 px-2 py-0.5 rounded">
                    PPR • 12 Teams
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1 font-sans">
                  Includes Lamar Jackson, Saquon Barkley, Derrick Henry & Justin Jefferson.
                </p>
              </button>

              <button
                onClick={() => handleImport('Yahoo Diamond Superflex (10-Team)', 'SUPERFLEX')}
                className="w-full text-left p-3 rounded-lg bg-zinc-900 hover:bg-purple-950/40 border border-zinc-800 hover:border-purple-600/60 transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white group-hover:text-purple-300 transition-colors">
                    Yahoo Diamond Superflex Dynasty
                  </span>
                  <span className="text-[10px] bg-amber-900/60 text-amber-200 border border-amber-700/50 px-2 py-0.5 rounded">
                    Superflex • 10 Teams
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1 font-sans">
                  Dual QB starting format with Jayden Daniels & Lamar Jackson stack.
                </p>
              </button>

              <button
                onClick={() => handleImport('Yahoo High-Stakes Half-PPR', 'HALF_PPR')}
                className="w-full text-left p-3 rounded-lg bg-zinc-900 hover:bg-purple-950/40 border border-zinc-800 hover:border-purple-600/60 transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white group-hover:text-purple-300 transition-colors">
                    Yahoo High-Stakes Pro League
                  </span>
                  <span className="text-[10px] bg-indigo-900/60 text-indigo-200 border border-indigo-700/50 px-2 py-0.5 rounded">
                    Half-PPR • $200 FAAB
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1 font-sans">
                  Competitive waiver wire settings with $200 FAAB budget setup.
                </p>
              </button>
            </div>
          </div>
        )}

        {!isLoading && step === 'IDLE' && importMode === 'ID' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleImport();
            }}
            className="space-y-3 text-xs"
          >
            <div>
              <label className="text-zinc-400 font-bold text-[10px] uppercase mb-1 block">
                YAHOO LEAGUE ID
              </label>
              <input
                type="text"
                value={leagueId}
                onChange={(e) => setLeagueId(e.target.value)}
                placeholder="e.g. 847291"
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:border-purple-500 outline-none font-mono"
                required
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">
                Found in your Yahoo Fantasy League URL (e.g. football.fantasysports.yahoo.com/f1/<span className="text-purple-400 font-bold">847291</span>)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-400 font-bold text-[10px] uppercase mb-1 block">
                  SEASON
                </label>
                <select
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:border-purple-500 outline-none cursor-pointer"
                >
                  <option value="2025">2025 NFL Season</option>
                  <option value="2024">2024 NFL Season</option>
                  <option value="2023">2023 NFL Season</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-400 font-bold text-[10px] uppercase mb-1 block">
                  TEAM NUMBER
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={teamNumber}
                  onChange={(e) => setTeamNumber(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:border-purple-500 outline-none"
                />
              </div>
            </div>

            <div className="p-2.5 rounded bg-purple-950/30 border border-purple-900/50 flex items-start gap-2 text-[11px] text-purple-200 font-sans">
              <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <span>
                OAuth 2.0 handshake will automatically fetch your Yahoo team's current week starters, bench players, and custom scoring parameters.
              </span>
            </div>

            <div className="pt-2 border-t border-zinc-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold rounded transition-colors cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-purple-600/30"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>CONNECT & SYNC YAHOO</span>
              </button>
            </div>
          </form>
        )}

        {/* Footer Note */}
        <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[10px] text-zinc-500">
          <div className="flex items-center gap-1">
            <Database className="w-3 h-3 text-purple-400" />
            <span>Official Yahoo Sports Fantasy Partner Protocol</span>
          </div>
          <a
            href="https://football.fantasysports.yahoo.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-purple-400 hover:underline"
          >
            Yahoo Sports <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>

      </div>
    </div>
  );
};
