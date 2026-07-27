import React, { useState, useEffect } from 'react';
import { X, RefreshCw, CheckCircle2, Zap, ShieldCheck, ExternalLink, AlertCircle, LogOut, ChevronRight, Users } from 'lucide-react';
import { LeagueSettings, RosterSlot, Player, Position, InjuryStatus } from '../types';

interface YahooImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (settings: LeagueSettings, roster: RosterSlot[]) => void;
}

interface YahooLeague {
  league_key: string;
  league_id: string;
  name: string;
  num_teams: number;
  scoring_type: string;
  current_week: number;
  season: string;
}

interface YahooTeam {
  team_key: string;
  team_id: string;
  name: string;
  is_mine: boolean;
}

interface YahooPlayer {
  player_key: string;
  name: string;
  position: string;
  team: string;
  photoUrl?: string;
  status: string;
  slot: string;
}

type FlowStep =
  | 'CHECKING_AUTH'
  | 'NOT_CONNECTED'
  | 'FETCHING_LEAGUES'
  | 'SELECT_LEAGUE'
  | 'FETCHING_TEAMS'
  | 'SELECT_TEAM'
  | 'FETCHING_ROSTER'
  | 'SUCCESS'
  | 'ERROR';

function mapPosition(pos: string): Position {
  const p = pos.toUpperCase().split(',')[0].trim();
  const map: Record<string, Position> = {
    QB: 'QB', RB: 'RB', WR: 'WR', TE: 'TE', K: 'K',
    DEF: 'DEF', D: 'DEF', DST: 'DEF', FLEX: 'FLEX',
    PG: 'PG', SG: 'SG', SF: 'SF', PF: 'PF', C: 'C',
    G: 'G', F: 'F', UTIL: 'UTIL',
  };
  return map[p] || 'WR';
}

function mapInjuryStatus(status: string): InjuryStatus {
  const s = status.toUpperCase();
  if (s.includes('OUT')) return 'OUT';
  if (s.includes('DOUBTFUL')) return 'DOUBTFUL';
  if (s.includes('QUESTIONABLE')) return 'QUESTIONABLE';
  if (s.includes('PROBABLE')) return 'PROBABLE';
  if (s.includes('IR')) return 'IR';
  return 'HEALTHY';
}

function yahooScoringFormat(scoringType: string): LeagueSettings['scoringFormat'] {
  const s = scoringType.toLowerCase();
  if (s.includes('half')) return 'HALF_PPR';
  if (s.includes('ppr') || s.includes('full')) return 'PPR';
  if (s.includes('standard') || s.includes('head')) return 'STANDARD';
  return 'PPR';
}

function buildRosterSlots(players: YahooPlayer[]): RosterSlot[] {
  const slotOrder = ['QB', 'WR', 'WR', 'RB', 'RB', 'TE', 'FLEX', 'K', 'DEF', 'BN', 'BN', 'BN', 'BN', 'IR'];
  const slots: RosterSlot[] = [];
  const slotCounts: Record<string, number> = {};

  // Sort players by slot priority
  const slotPriority: Record<string, number> = {
    QB: 0, WR: 1, RB: 2, TE: 3, 'W/R/T': 4, FLEX: 4, K: 5, DEF: 6, D: 6, DST: 6, BN: 7, IR: 8,
  };
  const sorted = [...players].sort((a, b) => {
    const pa = slotPriority[a.slot] ?? 7;
    const pb = slotPriority[b.slot] ?? 7;
    return pa - pb;
  });

  for (const p of sorted) {
    const slot = p.slot || 'BN';
    slotCounts[slot] = (slotCounts[slot] || 0) + 1;
    const idx = slotCounts[slot];

    const slotId = `y-${slot.toLowerCase().replace(/[^a-z]/g, '')}-${idx}`;
    const isBench = slot === 'BN';
    const isIR = slot === 'IR';

    let slotName = slot;
    if (slot === 'W/R/T' || slot === 'FLEX') slotName = 'FLEX';
    else if (isBench) slotName = 'BENCH';
    else if (isIR) slotName = 'IR';

    const allowedPositions: Position[] = isBench
      ? ['QB', 'RB', 'WR', 'TE', 'K', 'DEF']
      : isIR
      ? ['QB', 'RB', 'WR', 'TE']
      : slot === 'FLEX' || slot === 'W/R/T'
      ? ['RB', 'WR', 'TE']
      : [mapPosition(slot)];

    const player: Player = {
      id: p.player_key || `yp-${Math.random()}`,
      name: p.name,
      sport: 'NFL',
      position: mapPosition(p.position),
      team: p.team || 'FA',
      opponent: '',
      photoUrl: p.photoUrl,
      projectedPoints: 0,
      avgPoints: 0,
      seasonTotalPoints: 0,
      injuryStatus: mapInjuryStatus(p.status),
      rosteredPercentage: 100,
      matchupDifficulty: 'NEUTRAL',
      defenseVsPositionRank: 16,
      adp: 0,
      tier: 3,
      notes: `Yahoo import • Status: ${p.status || 'Active'}`,
      gameLogs: [],
    };

    slots.push({ slotId, slotName, allowedPositions, player });
  }

  return slots;
}

export const YahooImportModal: React.FC<YahooImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [step, setStep] = useState<FlowStep>('CHECKING_AUTH');
  const [errorMsg, setErrorMsg] = useState('');
  const [redirectUri, setRedirectUri] = useState('');
  const [leagues, setLeagues] = useState<YahooLeague[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<YahooLeague | null>(null);
  const [teams, setTeams] = useState<YahooTeam[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<YahooTeam | null>(null);

  // Check auth status whenever modal opens
  useEffect(() => {
    if (!isOpen) return;
    setStep('CHECKING_AUTH');
    setErrorMsg('');
    setLeagues([]);
    setSelectedLeague(null);
    setTeams([]);
    setSelectedTeam(null);

    Promise.all([
      fetch('/api/auth/yahoo/status').then(r => r.json()),
      fetch('/api/auth/yahoo/redirect-uri').then(r => r.json()),
    ]).then(([statusData, uriData]) => {
      setRedirectUri(uriData.redirectUri || '');
      if (statusData.connected) {
        fetchLeagues();
      } else {
        setStep('NOT_CONNECTED');
      }
    }).catch(() => setStep('NOT_CONNECTED'));
  }, [isOpen]);

  const fetchLeagues = async () => {
    setStep('FETCHING_LEAGUES');
    try {
      const res = await fetch('/api/yahoo/leagues');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch leagues');
      setLeagues(data.leagues || []);
      setStep('SELECT_LEAGUE');
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to fetch your Yahoo leagues.');
      setStep('ERROR');
    }
  };

  const handleSelectLeague = async (league: YahooLeague) => {
    setSelectedLeague(league);
    setStep('FETCHING_TEAMS');
    try {
      const res = await fetch(`/api/yahoo/teams/${league.league_key}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch teams');
      const fetchedTeams: YahooTeam[] = data.teams || [];
      setTeams(fetchedTeams);
      // Auto-select user's own team if identifiable
      const mine = fetchedTeams.find(t => t.is_mine);
      if (mine) {
        await importRoster(mine, league);
      } else {
        setStep('SELECT_TEAM');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to fetch league teams.');
      setStep('ERROR');
    }
  };

  const importRoster = async (team: YahooTeam, league: YahooLeague) => {
    setSelectedTeam(team);
    setStep('FETCHING_ROSTER');
    try {
      const res = await fetch(`/api/yahoo/roster/${team.team_key}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch roster');
      const players: YahooPlayer[] = data.players || [];
      const rosterSlots = buildRosterSlots(players);
      const settings: LeagueSettings = {
        leagueName: league.name,
        sport: 'NFL',
        scoringFormat: yahooScoringFormat(league.scoring_type),
        teamsCount: league.num_teams || 12,
        faabBudget: 100,
        currentWeek: league.current_week || 1,
        myTeamName: team.name,
        yahooLeagueId: league.league_id,
        isYahooSynced: true,
      };
      setStep('SUCCESS');
      setTimeout(() => {
        onImportSuccess(settings, rosterSlots);
        onClose();
      }, 1200);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to fetch your roster.');
      setStep('ERROR');
    }
  };

  const handleDisconnect = async () => {
    await fetch('/api/auth/yahoo/logout', { method: 'POST' });
    setStep('NOT_CONNECTED');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn font-mono">
      <div className="bg-zinc-950 border border-purple-900/60 rounded-xl w-full max-w-lg p-5 space-y-4 shadow-2xl shadow-purple-950/40 relative overflow-hidden">

        {/* Top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-indigo-500 to-purple-400" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 font-bold text-sm">
              Y!
            </div>
            <div>
              <h2 className="font-bold text-white text-base tracking-tight font-sans flex items-center gap-2">
                Yahoo Fantasy Sports
                <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800/80 px-2 py-0.5 rounded font-mono">
                  OAuth 2.0
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400 font-sans">
                Import your live roster and league settings directly from Yahoo.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── CHECKING AUTH ── */}
        {step === 'CHECKING_AUTH' && (
          <div className="py-10 flex flex-col items-center gap-3 text-zinc-400">
            <RefreshCw className="w-7 h-7 animate-spin text-purple-400" />
            <p className="text-sm">Checking Yahoo connection…</p>
          </div>
        )}

        {/* ── NOT CONNECTED ── */}
        {step === 'NOT_CONNECTED' && (
          <div className="space-y-4">
            <div className="p-4 bg-purple-950/30 border border-purple-800/50 rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-purple-300 font-semibold text-sm">
                <ShieldCheck className="w-4 h-4" />
                Connect your Yahoo account
              </div>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                Click below to authorize Gridiron Engine with Yahoo Fantasy Sports. You'll be redirected to Yahoo and then brought back automatically.
              </p>
              {redirectUri && (
                <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded text-[10px] font-mono text-zinc-400 space-y-1">
                  <p className="text-zinc-500 uppercase font-bold">Required redirect URI in your Yahoo app:</p>
                  <p className="text-emerald-400 break-all">{redirectUri}</p>
                  <p className="text-zinc-500 font-sans">
                    Register this at{' '}
                    <a href="https://developer.yahoo.com/apps/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">
                      developer.yahoo.com/apps
                    </a>
                  </p>
                </div>
              )}
            </div>
            <a
              href="/api/auth/yahoo"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-colors shadow-lg shadow-purple-600/30 text-sm cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              Connect Yahoo Account
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          </div>
        )}

        {/* ── FETCHING LEAGUES ── */}
        {step === 'FETCHING_LEAGUES' && (
          <div className="py-10 flex flex-col items-center gap-3 text-zinc-400">
            <RefreshCw className="w-7 h-7 animate-spin text-purple-400" />
            <p className="text-sm">Loading your Yahoo leagues…</p>
          </div>
        )}

        {/* ── SELECT LEAGUE ── */}
        {step === 'SELECT_LEAGUE' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Your NFL Leagues</p>
              <button
                onClick={handleDisconnect}
                className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
              >
                <LogOut className="w-3 h-3" /> Disconnect
              </button>
            </div>
            {leagues.length === 0 ? (
              <div className="p-4 text-center text-zinc-500 text-sm border border-zinc-800 rounded-lg">
                No active NFL leagues found for your account.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {leagues.map(league => (
                  <button
                    key={league.league_key}
                    onClick={() => handleSelectLeague(league)}
                    className="w-full text-left p-3 rounded-lg bg-zinc-900 hover:bg-purple-950/40 border border-zinc-800 hover:border-purple-600/60 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white group-hover:text-purple-300 transition-colors">
                        {league.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-purple-900/60 text-purple-200 border border-purple-700/50 px-2 py-0.5 rounded">
                          {league.scoring_type?.toUpperCase() || 'PPR'}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-purple-400" />
                      </div>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1 font-sans">
                      {league.num_teams} teams • Season {league.season} • Week {league.current_week}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── FETCHING TEAMS ── */}
        {step === 'FETCHING_TEAMS' && (
          <div className="py-10 flex flex-col items-center gap-3 text-zinc-400">
            <RefreshCw className="w-7 h-7 animate-spin text-purple-400" />
            <p className="text-sm">Loading teams in {selectedLeague?.name}…</p>
          </div>
        )}

        {/* ── SELECT TEAM ── */}
        {step === 'SELECT_TEAM' && selectedLeague && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-300 uppercase tracking-wider">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              Which team is yours in {selectedLeague.name}?
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {teams.map(team => (
                <button
                  key={team.team_key}
                  onClick={() => importRoster(team, selectedLeague)}
                  className="w-full text-left p-3 rounded-lg bg-zinc-900 hover:bg-purple-950/40 border border-zinc-800 hover:border-purple-600/60 transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white group-hover:text-purple-300">
                      {team.name}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-purple-400" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── FETCHING ROSTER ── */}
        {step === 'FETCHING_ROSTER' && (
          <div className="py-10 flex flex-col items-center gap-3 text-zinc-400">
            <RefreshCw className="w-7 h-7 animate-spin text-purple-400" />
            <div className="text-center space-y-1">
              <p className="text-sm text-purple-200 font-semibold">Importing {selectedTeam?.name}…</p>
              <p className="text-[11px] font-mono text-zinc-500">Fetching roster from Yahoo Fantasy API</p>
            </div>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {step === 'SUCCESS' && (
          <div className="py-8 flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            <p className="text-sm font-bold text-emerald-200">Yahoo League Synced!</p>
            <p className="text-xs text-zinc-400 font-sans">
              {selectedTeam?.name} loaded from {selectedLeague?.name}
            </p>
          </div>
        )}

        {/* ── ERROR ── */}
        {step === 'ERROR' && (
          <div className="space-y-3">
            <div className="p-4 bg-red-950/30 border border-red-800/50 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-red-300">Something went wrong</p>
                <p className="text-xs text-zinc-400 font-sans">{errorMsg}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep('NOT_CONNECTED')}
                className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded text-sm transition-colors cursor-pointer"
              >
                Reconnect
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-bold rounded text-sm transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[10px] text-zinc-500">
          <span>Official Yahoo Sports Fantasy API</span>
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
