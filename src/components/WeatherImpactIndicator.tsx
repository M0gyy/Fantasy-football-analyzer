import React from 'react';
import {
  CloudRain,
  Wind,
  Snowflake,
  Sun,
  Thermometer,
  ShieldAlert,
  Zap,
  Info,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Umbrella
} from 'lucide-react';
import { Player, GameWeather } from '../types';
import { getGameWeatherForPlayer, getWeatherConditionBadge } from '../utils/weatherImpact';

interface WeatherImpactIndicatorProps {
  player: Player;
  compact?: boolean;
}

export const WeatherImpactIndicator: React.FC<WeatherImpactIndicatorProps> = ({
  player,
  compact = false
}) => {
  const weather: GameWeather = getGameWeatherForPlayer(player);
  const badge = getWeatherConditionBadge(weather.condition, weather.impactLevel);

  const renderConditionIcon = () => {
    switch (weather.condition) {
      case 'DOME':
        return <Building2 className="w-4 h-4 text-sky-400" />;
      case 'HIGH_WIND':
        return <Wind className="w-4 h-4 text-amber-400 animate-pulse" />;
      case 'RAIN':
      case 'HEAVY_RAIN':
        return <CloudRain className="w-4 h-4 text-blue-400" />;
      case 'SNOW':
        return <Snowflake className="w-4 h-4 text-cyan-300" />;
      case 'EXTREME_COLD':
        return <Thermometer className="w-4 h-4 text-indigo-400" />;
      case 'CLEAR':
      default:
        return <Sun className="w-4 h-4 text-amber-300" />;
    }
  };

  // Position-tailored volume note
  const getPositionSpecificNote = () => {
    const pos = player.position;
    if (weather.impactLevel === 'OPTIMAL') {
      return `Ideal setup for ${pos} ${player.name}. Full offensive playbook unlocked with zero weather constraints.`;
    }

    if (pos === 'K') {
      return weather.kickingImpact;
    }
    if (pos === 'QB' || pos === 'WR' || pos === 'TE') {
      return weather.passingImpact;
    }
    if (pos === 'RB') {
      return weather.rushingImpact;
    }
    if (pos === 'DEF') {
      return `Weather conditions increase likelihood of fumbles and low-scoring defensive slugfest.`;
    }
    return weather.impactSummary;
  };

  if (compact) {
    return (
      <div className={`p-2 rounded border flex items-center justify-between text-xs font-mono ${badge.bg}`}>
        <div className="flex items-center gap-2">
          {renderConditionIcon()}
          <div>
            <span className="font-bold text-white block">{weather.condition.replace('_', ' ')}</span>
            <span className="text-[10px] text-zinc-300">
              {weather.isDome ? 'Dome (72°F)' : `${weather.tempF}°F • ${weather.windMph}mph wind`}
            </span>
          </div>
        </div>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${badge.bg}`}>
          {weather.impactLevel}
        </span>
      </div>
    );
  }

  return (
    <div className={`rounded-lg p-3.5 border font-mono space-y-2.5 transition-all ${
      weather.impactLevel === 'SEVERE'
        ? 'bg-rose-950/20 border-rose-800/50'
        : weather.impactLevel === 'HIGH'
        ? 'bg-amber-950/20 border-amber-800/50'
        : weather.impactLevel === 'MODERATE'
        ? 'bg-yellow-950/20 border-yellow-800/40'
        : 'bg-zinc-900/90 border-zinc-800'
    }`}>
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded flex items-center justify-center border bg-zinc-950/80 ${badge.bg}`}>
            {renderConditionIcon()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-white uppercase tracking-tight">
                {weather.stadiumName}
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 font-sans">
              {weather.isDome ? 'Climate Controlled Indoor Stadium' : `Game Forecast • ${player.opponent}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${badge.bg}`}>
            {badge.text}
          </span>
        </div>
      </div>

      {/* Weather Metrics Stats Bar */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs bg-zinc-950/80 p-2 rounded border border-zinc-800/60 font-mono">
        <div>
          <span className="text-[9px] text-zinc-500 block uppercase">Temperature</span>
          <span className="font-bold text-zinc-200">{weather.tempF}°F</span>
        </div>
        <div className="border-x border-zinc-800">
          <span className="text-[9px] text-zinc-500 block uppercase">Wind Speed</span>
          <span className={`font-bold ${weather.windMph >= 20 ? 'text-amber-400' : 'text-zinc-200'}`}>
            {weather.windMph} mph {weather.gustMph ? `(${weather.gustMph}g)` : ''}
          </span>
        </div>
        <div>
          <span className="text-[9px] text-zinc-500 block uppercase">Precipitation</span>
          <span className={`font-bold ${weather.precipChance >= 50 ? 'text-blue-400' : 'text-zinc-200'}`}>
            {weather.precipChance}%
          </span>
        </div>
      </div>

      {/* Weather Impact Summary Note */}
      <div className="text-xs font-sans space-y-1.5 pt-0.5">
        <div className="flex items-start gap-2">
          {weather.impactLevel === 'OPTIMAL' ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${badge.iconColor}`} />
          )}
          <p className="text-zinc-200 leading-snug">
            {weather.impactSummary}
          </p>
        </div>

        {/* Position-tailored volume impact callout */}
        <div className="p-2 rounded bg-zinc-950/60 border border-zinc-800/80 text-[11px] flex items-start gap-2">
          <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-mono font-bold text-amber-300 mr-1 uppercase">
              [{player.position} VOLUME IMPACT]:
            </span>
            <span className="text-zinc-300">{getPositionSpecificNote()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
