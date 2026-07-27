import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { RosterView } from './components/RosterView';
import { TradeAnalyzerView } from './components/TradeAnalyzerView';
import { StartSitView } from './components/StartSitView';
import { WaiverWireView } from './components/WaiverWireView';
import { DraftKitView } from './components/DraftKitView';
import { AICoachView } from './components/AICoachView';
import { NFLfastrMatchupView } from './components/NFLfastrMatchupView';
import { PlayerDetailModal } from './components/PlayerDetailModal';
import { LeagueSettingsModal } from './components/LeagueSettingsModal';
import { YahooImportModal } from './components/YahooImportModal';

import {
  INITIAL_USER_ROSTER,
  MOCK_PLAYERS,
  MOCK_MATCHUP,
  MOCK_WAIVER_TARGETS,
  MOCK_DRAFT_PICKS,
  INITIAL_LEAGUE_SETTINGS
} from './data/mockData';

import { RosterSlot, Player, LeagueSettings, DraftPick, WaiverTarget } from './types';
import { autoOptimizeLineup } from './utils/fantasyCalculators';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [roster, setRoster] = useState<RosterSlot[]>(INITIAL_USER_ROSTER);
  const [allPlayers, setAllPlayers] = useState<Player[]>(MOCK_PLAYERS);
  const [waiverTargets, setWaiverTargets] = useState<WaiverTarget[]>(MOCK_WAIVER_TARGETS);
  const [draftPicks, setDraftPicks] = useState<DraftPick[]>(MOCK_DRAFT_PICKS);
  const [matchup, setMatchup] = useState(MOCK_MATCHUP);
  const [leagueSettings, setLeagueSettings] = useState<LeagueSettings>(INITIAL_LEAGUE_SETTINGS);

  const [selectedPlayerModal, setSelectedPlayerModal] = useState<Player | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isYahooImportOpen, setIsYahooImportOpen] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);

  // Check backend server health
  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.aiEnabled === 'boolean') {
          setAiEnabled(data.aiEnabled);
        }
      })
      .catch(() => {
        setAiEnabled(true);
      });
  }, []);

  // Swap two roster slots
  const handleSwapPlayers = (slotIdA: string, slotIdB: string) => {
    setRoster(prev => {
      const newRoster = [...prev];
      const indexA = newRoster.findIndex(s => s.slotId === slotIdA);
      const indexB = newRoster.findIndex(s => s.slotId === slotIdB);

      if (indexA === -1 || indexB === -1) return prev;

      const slotA = newRoster[indexA];
      const slotB = newRoster[indexB];

      const playerA = slotA.player;
      const playerB = slotB.player;

      // Check position validity if swapping into starter slot
      const isAValidForB = !playerA || slotB.allowedPositions.includes(playerA.position) || slotB.slotName === 'BENCH' || slotB.slotName === 'IR';
      const isBValidForA = !playerB || slotA.allowedPositions.includes(playerB.position) || slotA.slotName === 'BENCH' || slotA.slotName === 'IR';

      if (!isAValidForB || !isBValidForA) {
        alert("Cannot swap position: player position is not eligible for that starting slot.");
        return prev;
      }

      newRoster[indexA] = { ...slotA, player: playerB };
      newRoster[indexB] = { ...slotB, player: playerA };

      return newRoster;
    });
  };

  // Run auto lineup optimizer
  const handleOptimizeRoster = () => {
    const optimized = autoOptimizeLineup(roster);
    setRoster(optimized);
  };

  // Claim waiver player
  const handleClaimPlayer = (player: Player) => {
    // Find empty bench or starter slot
    setRoster(prev => {
      const newRoster = [...prev];
      const emptyBench = newRoster.find(s => s.slotName === 'BENCH' && s.player === null);
      if (emptyBench) {
        emptyBench.player = player;
        alert(`Successfully claimed ${player.name}! Added to bench.`);
      } else {
        alert("Bench is currently full. Drop or swap a player first!");
      }
      return newRoster;
    });
  };

  // Draft player pick
  const handleDraftPlayer = (player: Player) => {
    setDraftPicks(prev => {
      const newPicks = [...prev];
      const nextUnpicked = newPicks.find(p => p.playerPicked === null);
      if (nextUnpicked) {
        nextUnpicked.playerPicked = player;
      }
      return newPicks;
    });

    setAllPlayers(prev => prev.filter(p => p.id !== player.id));
  };

  // Filter user's non-null players
  const userPlayers = roster
    .map(s => s.player)
    .filter((p): p is Player => p !== null);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-200 font-sans selection:bg-indigo-500 selection:text-white flex flex-col justify-between">
      <div>
        {/* Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          leagueSettings={leagueSettings}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenYahooImport={() => setIsYahooImportOpen(true)}
          aiEnabled={aiEnabled}
        />

        {/* Main Container View router */}
        <main className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-5">
          {activeTab === 'dashboard' && (
            <DashboardView
              matchup={matchup}
              roster={roster}
              waiverTargets={waiverTargets}
              leagueSettings={leagueSettings}
              setActiveTab={setActiveTab}
              onSelectPlayer={setSelectedPlayerModal}
              onOptimizeRoster={handleOptimizeRoster}
            />
          )}

          {activeTab === 'nflfastr' && (
            <NFLfastrMatchupView />
          )}

          {activeTab === 'roster' && (
            <RosterView
              roster={roster}
              onSwapPlayers={handleSwapPlayers}
              onOptimizeRoster={handleOptimizeRoster}
              onSelectPlayer={setSelectedPlayerModal}
            />
          )}

          {activeTab === 'trade' && (
            <TradeAnalyzerView
              userPlayers={userPlayers}
              allAvailablePlayers={allPlayers}
              leagueSettings={leagueSettings}
            />
          )}

          {activeTab === 'start-sit' && (
            <StartSitView
              allPlayers={allPlayers}
              leagueSettings={leagueSettings}
            />
          )}

          {activeTab === 'waiver' && (
            <WaiverWireView
              waiverTargets={waiverTargets}
              onSelectPlayer={setSelectedPlayerModal}
              onClaimPlayer={handleClaimPlayer}
              faabBudget={leagueSettings.faabBudget}
            />
          )}

          {activeTab === 'draft' && (
            <DraftKitView
              draftPicks={draftPicks}
              availablePlayers={allPlayers}
              leagueSettings={leagueSettings}
              onSelectPlayer={setSelectedPlayerModal}
              onDraftPlayer={handleDraftPlayer}
            />
          )}

          {activeTab === 'coach' && (
            <AICoachView
              userRoster={roster}
              leagueSettings={leagueSettings}
            />
          )}
        </main>
      </div>

      {/* Bottom Telemetry Status Bar */}
      <footer className="h-6 bg-indigo-600 flex items-center justify-between px-3 text-[10px] text-white font-mono font-medium mt-8 border-t border-indigo-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span className="opacity-80">ENGINE:</span> Gridiron v2.4.0
          </div>
          <div className="flex items-center gap-1">
            <span className="opacity-80">FORMAT:</span> {leagueSettings.sport} {leagueSettings.scoringFormat}
          </div>
          <div className="hidden sm:flex items-center gap-1">
            <span className="opacity-80">WEEK:</span> {leagueSettings.currentWeek}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1">
            <span>UTF-8</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>{aiEnabled ? 'AI CONNECTED' : 'OFFLINE'}</span>
            <div className={`w-1.5 h-1.5 rounded-full ${aiEnabled ? 'bg-emerald-300 animate-pulse' : 'bg-zinc-400'}`} />
          </div>
        </div>
      </footer>

      {/* Player Detail Modal */}
      <PlayerDetailModal
        player={selectedPlayerModal}
        allPlayers={allPlayers}
        onClose={() => setSelectedPlayerModal(null)}
      />

      {/* League Settings Modal */}
      <LeagueSettingsModal
        settings={leagueSettings}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={setLeagueSettings}
        onOpenYahooImport={() => setIsYahooImportOpen(true)}
      />

      {/* Yahoo Fantasy Import Modal */}
      <YahooImportModal
        isOpen={isYahooImportOpen}
        onClose={() => setIsYahooImportOpen(false)}
        onImportSuccess={(newSettings, newRoster) => {
          setLeagueSettings(newSettings);
          setRoster(newRoster);
        }}
      />
    </div>
  );
}
