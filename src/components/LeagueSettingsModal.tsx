import React, { useState } from 'react';
import { X, Settings, Check } from 'lucide-react';
import { LeagueSettings, SportType } from '../types';

interface LeagueSettingsModalProps {
  settings: LeagueSettings;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: LeagueSettings) => void;
  onOpenYahooImport?: () => void;
}

export const LeagueSettingsModal: React.FC<LeagueSettingsModalProps> = ({
  settings,
  isOpen,
  onClose,
  onSave,
  onOpenYahooImport
}) => {
  const [formData, setFormData] = useState<LeagueSettings>({ ...settings });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn font-mono">
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg w-full max-w-md p-4 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-indigo-400" />
            <h2 className="font-bold text-white text-sm tracking-tight font-sans">League Configuration</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {onOpenYahooImport && (
          <div className="p-3 bg-purple-950/40 border border-purple-800/60 rounded-lg flex items-center justify-between font-sans">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-purple-600 flex items-center justify-center text-white font-bold text-xs font-mono">
                Y!
              </div>
              <div>
                <p className="text-xs font-bold text-purple-100">Sync with Yahoo Fantasy</p>
                <p className="text-[10px] text-purple-300/80">Auto-import league settings, rosters & rules</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenYahooImport();
              }}
              className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-bold font-mono transition-colors cursor-pointer"
            >
              IMPORT
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="p-3 bg-purple-950/30 border border-purple-800/50 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block">
                Your Managed Team Details
              </label>
              {formData.isYahooSynced && (
                <span className="text-[10px] bg-purple-900/60 text-purple-200 border border-purple-700/50 px-1.5 py-0.5 rounded font-mono">
                  Y! League #{formData.yahooLeagueId || '847291'}
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="text-zinc-400 font-semibold text-[10px] block mb-1">
                  YOUR TEAM NAME
                </label>
                <input
                  id="input-my-team-name"
                  type="text"
                  value={formData.myTeamName || 'Apex Dominators'}
                  onChange={(e) => setFormData({ ...formData, myTeamName: e.target.value })}
                  placeholder="e.g. Apex Dominators"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 focus:border-purple-500 outline-none text-xs"
                />
              </div>
              <div>
                <label className="text-zinc-400 font-semibold text-[10px] block mb-1">
                  YAHOO TEAM #
                </label>
                <select
                  id="select-my-team-number"
                  value={formData.myTeamNumber || 1}
                  onChange={(e) => setFormData({ ...formData, myTeamNumber: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 focus:border-purple-500 outline-none text-xs font-mono cursor-pointer"
                >
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                    <option key={n} value={n}>Team #{n}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="text-zinc-400 font-bold text-[10px] uppercase mb-1 block">LEAGUE NAME</label>
            <input
              id="input-league-name"
              type="text"
              value={formData.leagueName}
              onChange={(e) => setFormData({ ...formData, leagueName: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-zinc-100 focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-400 font-bold text-[10px] uppercase mb-1 block">SPORT</label>
              <select
                id="select-league-sport"
                value={formData.sport}
                onChange={(e) => setFormData({ ...formData, sport: e.target.value as SportType })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-zinc-100 focus:border-indigo-500 outline-none cursor-pointer"
              >
                <option value="NFL">NFL Football</option>
                <option value="NBA">NBA Basketball</option>
                <option value="EPL">EPL Soccer</option>
              </select>
            </div>

            <div>
              <label className="text-zinc-400 font-bold text-[10px] uppercase mb-1 block">SCORING FORMAT</label>
              <select
                id="select-scoring-format"
                value={formData.scoringFormat}
                onChange={(e) => setFormData({ ...formData, scoringFormat: e.target.value as any })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-zinc-100 focus:border-indigo-500 outline-none cursor-pointer"
              >
                <option value="PPR">PPR (1 Pt/Rec)</option>
                <option value="HALF_PPR">Half-PPR (0.5 Pt/Rec)</option>
                <option value="STANDARD">Standard (No PPR)</option>
                <option value="SUPERFLEX">Superflex</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-400 font-bold text-[10px] uppercase mb-1 block">TEAMS COUNT</label>
              <input
                id="input-teams-count"
                type="number"
                min={4}
                max={20}
                value={formData.teamsCount}
                onChange={(e) => setFormData({ ...formData, teamsCount: Number(e.target.value) })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-zinc-100 focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="text-zinc-400 font-bold text-[10px] uppercase mb-1 block">FAAB BUDGET ($)</label>
              <input
                id="input-faab-budget"
                type="number"
                value={formData.faabBudget}
                onChange={(e) => setFormData({ ...formData, faabBudget: Number(e.target.value) })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-zinc-100 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold rounded transition-colors cursor-pointer"
            >
              CANCEL
            </button>
            <button
              id="btn-save-settings"
              type="submit"
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>SAVE CONFIG</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
