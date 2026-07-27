import React from 'react';
import {
  Trophy,
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  Scale,
  TrendingUp,
  Sparkles,
  Settings,
  Bot,
  Activity
} from 'lucide-react';
import { LeagueSettings } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  leagueSettings: LeagueSettings;
  onOpenSettings: () => void;
  onOpenYahooImport: () => void;
  aiEnabled: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  leagueSettings,
  onOpenSettings,
  onOpenYahooImport,
  aiEnabled
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Architect', icon: LayoutDashboard },
    { id: 'nflfastr', label: 'Team Matchups', icon: Activity },
    { id: 'roster', label: 'Roster Inspector', icon: Users },
    { id: 'trade', label: 'Trade Machine', icon: ArrowLeftRight },
    { id: 'start-sit', label: 'Start / Sit', icon: Scale },
    { id: 'waiver', label: 'Waiver Wire', icon: TrendingUp },
    { id: 'draft', label: 'Draft Live', icon: Trophy },
    { id: 'coach', label: 'AI Coach', icon: Bot, isAi: true },
  ];

  return (
    <header className="sticky top-0 z-40 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 h-12 flex items-center">
      <div className="max-w-7xl w-full mx-auto px-3 sm:px-5 lg:px-6 flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center font-bold text-xs text-white shadow-sm shadow-indigo-600/30">
              NX
            </div>
            <span className="font-semibold text-sm tracking-tight text-white flex items-center gap-1.5">
              Gridiron Engine <span className="text-zinc-500 font-mono text-[11px]">v2.4</span>
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-zinc-400 bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800">
            <span className="text-indigo-400 font-bold">{leagueSettings.sport}</span>
            <span className="text-zinc-600">•</span>
            <span className="text-amber-400">{leagueSettings.scoringFormat}</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-zinc-400">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'text-indigo-400 bg-zinc-800/90 border border-zinc-700/80 font-semibold shadow-sm'
                    : 'hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : item.isAi ? 'text-amber-400' : 'text-zinc-400'}`} />
                <span>{item.label}</span>
                {item.isAi && !isActive && (
                  <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2">
          <button
            id="btn-import-yahoo-header"
            onClick={onOpenYahooImport}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-950/80 hover:bg-purple-900 border border-purple-700/60 text-purple-200 hover:text-white rounded text-xs font-semibold font-mono transition-all duration-150 cursor-pointer shadow-sm shadow-purple-950/50"
            title="Import from Yahoo Fantasy"
          >
            <span className="w-4 h-4 rounded bg-purple-600 text-white font-bold text-[10px] flex items-center justify-center leading-none">
              Y!
            </span>
            <span className="hidden sm:inline">Yahoo! import</span>
          </button>

          <button
            id="header-settings-btn"
            onClick={onOpenSettings}
            className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors border border-transparent hover:border-zinc-700 cursor-pointer"
            title="League Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Tab Navigation */}
      <div className="md:hidden absolute top-12 left-0 right-0 bg-zinc-950 border-b border-zinc-800 flex overflow-x-auto px-2 py-1.5 gap-1 no-scrollbar z-30">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-zinc-300 bg-zinc-900 border border-zinc-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
