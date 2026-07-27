import { Player, AdvancedPlayerStats } from '../types';

export function getAdvancedStatsForPlayer(player: Player): AdvancedPlayerStats {
  if (player.advancedStats) {
    return player.advancedStats;
  }

  const pos = player.position;
  const avg = player.avgPoints || 12.0;

  // Position-tailored baseline values based on PPG tier
  if (pos === 'QB') {
    const isElite = avg >= 21.0;
    return {
      epaPerPlay: isElite ? 0.24 : 0.08,
      cpoe: isElite ? 4.2 : 0.8,
      anyA: isElite ? 7.85 : 6.12,
      successRate: isElite ? 51.5 : 44.2,
      intendedAirYards: isElite ? 2350 : 1820,
      airYardsPerAttempt: isElite ? 8.4 : 7.2,
      aDot: isElite ? 8.6 : 7.4,
      pressureRate: isElite ? 31.2 : 38.5,
      timeToThrow: isElite ? 2.62 : 2.85,
      targetShare: undefined,
      routeParticipation: undefined,
      dvoa: isElite ? '+22.4%' : '+3.1%',
      dyar: isElite ? 485 : 190,
      pffGrade: isElite ? 89.2 : 72.4,
      pffPassGrade: isElite ? 90.5 : 71.2,
      pffRunGrade: isElite ? 78.4 : 64.0,
      passBlockWinRate: isElite ? 76.5 : 68.2,
      runBlockWinRate: isElite ? 72.8 : 66.4
    };
  }

  if (pos === 'WR') {
    const isElite = avg >= 16.0;
    return {
      epaPerPlay: isElite ? 0.38 : 0.12,
      yprr: isElite ? 2.72 : 1.65,
      successRate: isElite ? 56.2 : 46.8,
      yacoe: isElite ? 2.15 : 0.45,
      intendedAirYards: isElite ? 1120 : 640,
      aDot: isElite ? 11.4 : 9.2,
      targetShare: player.targetShare || (isElite ? 28.2 : 17.5),
      routeParticipation: isElite ? 92.5 : 78.0,
      dvoa: isElite ? '+24.8%' : '+5.2%',
      dyar: isElite ? 310 : 120,
      pffGrade: isElite ? 88.6 : 71.5,
      pffRecGrade: isElite ? 90.1 : 72.0,
      passBlockWinRate: undefined,
      runBlockWinRate: isElite ? 68.4 : 58.2
    };
  }

  if (pos === 'RB') {
    const isElite = avg >= 15.0;
    return {
      epaPerPlay: isElite ? 0.12 : -0.04,
      yprr: isElite ? 1.85 : 0.95,
      successRate: isElite ? 49.5 : 41.2,
      yacoe: isElite ? 1.88 : 0.62,
      targetShare: player.targetShare || (isElite ? 16.5 : 8.2),
      routeParticipation: isElite ? 64.2 : 42.0,
      dvoa: isElite ? '+16.2%' : '-2.4%',
      dyar: isElite ? 210 : 65,
      pffGrade: isElite ? 85.4 : 69.8,
      pffRunGrade: isElite ? 87.2 : 70.1,
      pffRecGrade: isElite ? 76.4 : 61.2,
      passBlockWinRate: isElite ? 68.5 : 56.0,
      runBlockWinRate: isElite ? 74.2 : 65.1
    };
  }

  if (pos === 'TE') {
    const isElite = avg >= 12.0;
    return {
      epaPerPlay: isElite ? 0.28 : 0.05,
      yprr: isElite ? 2.18 : 1.32,
      successRate: isElite ? 52.8 : 43.5,
      yacoe: isElite ? 1.42 : 0.35,
      intendedAirYards: isElite ? 680 : 380,
      aDot: isElite ? 7.8 : 6.1,
      targetShare: player.targetShare || (isElite ? 22.4 : 12.8),
      routeParticipation: isElite ? 84.0 : 62.5,
      dvoa: isElite ? '+18.6%' : '-1.2%',
      dyar: isElite ? 185 : 45,
      pffGrade: isElite ? 86.8 : 68.5,
      pffRecGrade: isElite ? 88.2 : 69.0,
      pffBlockGrade: isElite ? 72.4 : 60.5,
      passBlockWinRate: isElite ? 71.2 : 62.4,
      runBlockWinRate: isElite ? 70.5 : 61.8
    };
  }

  // Baseline for K / DEF
  return {
    epaPerPlay: 0.10,
    successRate: 48.0,
    dvoa: '+5.0%',
    dyar: 100,
    pffGrade: 75.0
  };
}
