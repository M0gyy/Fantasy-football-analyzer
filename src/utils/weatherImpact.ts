import { GameWeather, Player, WeatherCondition } from '../types';

export const DOME_TEAMS = ['DAL', 'DET', 'MIN', 'ATL', 'NO', 'LV', 'IND', 'HOU', 'LAC', 'LAR', 'ARI'];

export function getGameWeatherForPlayer(player: Player): GameWeather {
  if (player.weather) {
    return player.weather;
  }

  const team = player.team.toUpperCase();
  const opponent = player.opponent ? player.opponent.toUpperCase() : '';

  // Check if indoor dome
  const isHomeDome = DOME_TEAMS.includes(team) && opponent.startsWith('VS');
  const isAwayDome = opponent.startsWith('@') && DOME_TEAMS.some(dt => opponent.includes(dt));

  if (isHomeDome || isAwayDome) {
    return {
      condition: 'DOME',
      tempF: 72,
      windMph: 0,
      gustMph: 0,
      precipChance: 0,
      stadiumName: 'Climate Controlled Indoor Dome',
      isDome: true,
      impactLevel: 'OPTIMAL',
      impactSummary: 'Controlled indoor climate with 0 mph wind drag. Maximum air yards efficiency and kicking trajectory stability.',
      passingImpact: 'Optimal completion % & unconstrained deep target air yards.',
      kickingImpact: '+1.5 FG projection boost. Zero wind trajectory drift.',
      rushingImpact: 'Fast artificial turf surface favors explosive speed backs.'
    };
  }

  // Buffalo / Highmark Stadium weather scenario
  if (team === 'BUF' || opponent.includes('BUF')) {
    return {
      condition: 'HIGH_WIND',
      tempF: 34,
      windMph: 24,
      gustMph: 32,
      precipChance: 40,
      stadiumName: 'Highmark Stadium (Orchard Park, NY)',
      isDome: false,
      impactLevel: 'HIGH',
      impactSummary: 'Sustained winds exceeding 24 mph with gusts to 32 mph. Deep passing attempts (>20 yds) and long FG attempts (>45 yds) are severely impaired.',
      passingImpact: 'Pass air yards suppressed ~18%. High reliance on short crossers and RB dump-offs.',
      kickingImpact: '-22% FG conversion probability over 45+ yards.',
      rushingImpact: 'Rushing attempts projected to spike +16% for ground control.'
    };
  }

  // Green Bay / Chicago / Cold Rain & Wind
  if (team === 'GB' || opponent.includes('GB') || team === 'CHI' || opponent.includes('CHI')) {
    return {
      condition: 'HEAVY_RAIN',
      tempF: 38,
      windMph: 22,
      gustMph: 28,
      precipChance: 90,
      stadiumName: 'Lambeau Field (Green Bay, WI)',
      isDome: false,
      impactLevel: 'SEVERE',
      impactSummary: 'Heavy driving rain and 22 mph wind gusts. Slick ball surface increases fumble and dropped pass risk. Strong boost to ground volume.',
      passingImpact: 'Passing YPA suppressed by -1.4 yds. High drop rate on boundary routes.',
      kickingImpact: 'Wet turf and crosswinds lower FG accuracy and distance.',
      rushingImpact: 'Ground workload projected to increase by +24%.'
    };
  }

  // Kansas City / Arrowhead Rain
  if (team === 'KC' || opponent.includes('KC') || team === 'BAL' || opponent.includes('BAL')) {
    return {
      condition: 'RAIN',
      tempF: 42,
      windMph: 15,
      gustMph: 20,
      precipChance: 65,
      stadiumName: 'GEHA Field at Arrowhead Stadium',
      isDome: false,
      impactLevel: 'MODERATE',
      impactSummary: 'Intermittent rain showers with 15 mph breeze. Slight reduction in deep accuracy; target volume shifts heavily to short routes and TEs.',
      passingImpact: 'Minor drop in air yards; quick pass game favored.',
      kickingImpact: 'Kicking distance slightly dampened by wet surface.',
      rushingImpact: 'Steady ground workload with increased RB target share.'
    };
  }

  // Seattle / Philadelphia / Cleveland
  if (team === 'SEA' || opponent.includes('SEA') || team === 'PHI' || opponent.includes('PHI') || team === 'CLE' || opponent.includes('CLE')) {
    return {
      condition: 'HIGH_WIND',
      tempF: 46,
      windMph: 18,
      gustMph: 25,
      precipChance: 55,
      stadiumName: 'Outdoor Grass Field',
      isDome: false,
      impactLevel: 'MODERATE',
      impactSummary: '18 mph crosswinds in open bowl stadium. Crosswind vectors impact deep boundary throws and long field goal trajectory.',
      passingImpact: 'Boundary pass attempts capped; slot target share increases.',
      kickingImpact: '50+ yard field goals carry high trajectory variance.',
      rushingImpact: 'Slightly elevated run script.'
    };
  }

  // Default Outdoor Clear
  return {
    condition: 'CLEAR',
    tempF: 58,
    windMph: 8,
    gustMph: 12,
    precipChance: 15,
    stadiumName: 'Outdoor Stadium',
    isDome: false,
    impactLevel: 'OPTIMAL',
    impactSummary: 'Clear skies with light 8 mph breeze. Favorable conditions across all fantasy positions with no passing or kicking volume constraints.',
    passingImpact: 'Unrestricted passing air yards and deep play distribution.',
    kickingImpact: 'Standard field goal accuracy and distance metrics.',
    rushingImpact: 'Standard baseline play distribution.'
  };
}

export function getWeatherConditionBadge(condition: WeatherCondition, impactLevel: string) {
  switch (impactLevel) {
    case 'SEVERE':
      return {
        bg: 'bg-rose-950/60 text-rose-300 border-rose-700/80',
        text: 'SEVERE WEATHER RISK',
        iconColor: 'text-rose-400'
      };
    case 'HIGH':
      return {
        bg: 'bg-amber-950/60 text-amber-300 border-amber-700/80',
        text: 'HIGH WEATHER IMPACT',
        iconColor: 'text-amber-400'
      };
    case 'MODERATE':
      return {
        bg: 'bg-yellow-950/50 text-yellow-300 border-yellow-700/60',
        text: 'MODERATE WEATHER',
        iconColor: 'text-yellow-400'
      };
    case 'OPTIMAL':
    default:
      return {
        bg: 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60',
        text: 'OPTIMAL CONDITIONS',
        iconColor: 'text-emerald-400'
      };
  }
}
