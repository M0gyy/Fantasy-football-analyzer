import { AnalystConsensus, AnalystRankEntry, Player } from '../types';

export interface AnalystOutletInfo {
  id: string;
  name: string;
  analystName: string;
  outlet: string;
  weight: number;
  badgeColor: string;
  description: string;
}

export const ANALYST_OUTLETS: AnalystOutletInfo[] = [
  {
    id: 'fantasypros',
    name: 'FantasyPros ECR',
    analystName: 'Consensus (120+ Experts)',
    outlet: 'FantasyPros',
    weight: 1.0,
    badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    description: 'Industry standard aggregate of 120+ verified fantasy football analysts.'
  },
  {
    id: 'mike_clay',
    name: 'Mike Clay',
    analystName: 'Mike Clay',
    outlet: 'ESPN Fantasy',
    weight: 0.95,
    badgeColor: 'bg-red-500/10 text-red-400 border-red-500/30',
    description: 'ESPN Lead Analyst known for detailed volume-based unit projections.'
  },
  {
    id: 'evan_silva',
    name: 'Establish The Run',
    analystName: 'Evan Silva & Adam Levitan',
    outlet: 'Establish The Run (ETR)',
    weight: 0.95,
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    description: 'High-stakes oriented matchups, target share & air yard quantitative model.'
  },
  {
    id: 'pff_consensus',
    name: 'PFF Analyst Model',
    analystName: 'PFF Analytics Team',
    outlet: 'Pro Football Focus',
    weight: 0.9,
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    description: 'Player grade matching, pass-block win rate, and coverage matchup modeling.'
  },
  {
    id: 'matthew_berry',
    name: 'Matthew Berry',
    analystName: 'Matthew Berry',
    outlet: 'Fantasy Life / NBC Sports',
    weight: 0.85,
    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    description: 'Love/Hate consensus, narrative flow, and red zone touch expectations.'
  },
  {
    id: 'matt_harmon',
    name: 'Matt Harmon',
    analystName: 'Matt Harmon',
    outlet: 'Yahoo / Reception Perception',
    weight: 0.9,
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    description: 'Route tree success rates, press coverage win rate, and WR target share expert.'
  }
];

// Custom detailed analyst profiles for key players
const CUSTOM_ANALYST_MAP: Record<string, Partial<AnalystConsensus>> = {
  // Mahomes
  "p-qb-1": {
    ecrRank: 18,
    ecrPositionalRank: "QB2",
    bestRank: 12,
    worstRank: 24,
    avgRank: 17.8,
    stdDev: 2.4,
    startConsensusPct: 98,
    expertTag: "🔥 Consensus Elite QB1",
    analystRanks: [
      { analystName: "Consensus (120+ Experts)", outlet: "FantasyPros", rank: 18, positionRank: "QB2", projectedPoints: 23.4, recommendation: "MUST_START", note: "Prime bounceback spot vs soft Tampa Bay secondary." },
      { analystName: "Mike Clay", outlet: "ESPN Fantasy", rank: 16, positionRank: "QB1", projectedPoints: 24.1, recommendation: "MUST_START", note: "Projecting 38 pass attempts with Worthy & Rice formation shifts." },
      { analystName: "Evan Silva", outlet: "ETR", rank: 19, positionRank: "QB2", projectedPoints: 23.0, recommendation: "MUST_START", note: "High PROE matchup; TB defense surrendering high EPA/play." },
      { analystName: "PFF Analytics Team", outlet: "Pro Football Focus", rank: 15, positionRank: "QB1", projectedPoints: 24.5, recommendation: "MUST_START", note: "PFF Grade 91.2 against zone coverage schemes." },
      { analystName: "Matthew Berry", outlet: "Fantasy Life", rank: 20, positionRank: "QB3", projectedPoints: 22.8, recommendation: "MUST_START", note: "Top 3 QB start recommendation across all formats." },
      { analystName: "Matt Harmon", outlet: "Yahoo Sports", rank: 18, positionRank: "QB2", projectedPoints: 23.2, recommendation: "MUST_START", note: "Offense rhythm returning with high route participation." }
    ]
  },
  // Lamar Jackson
  "p-qb-2": {
    ecrRank: 12,
    ecrPositionalRank: "QB1",
    bestRank: 8,
    worstRank: 15,
    avgRank: 11.4,
    stdDev: 1.8,
    startConsensusPct: 100,
    expertTag: "🔥 Unanimous QB1 Overall",
    analystRanks: [
      { analystName: "Consensus (120+ Experts)", outlet: "FantasyPros", rank: 12, positionRank: "QB1", projectedPoints: 25.8, recommendation: "MUST_START", note: "Unmatched rushing floor combined with career-high passer EPA." },
      { analystName: "Mike Clay", outlet: "ESPN Fantasy", rank: 10, positionRank: "QB1", projectedPoints: 26.5, recommendation: "MUST_START", note: "Projected for 52 rushing yards and 2.4 combined TDs." },
      { analystName: "Evan Silva", outlet: "ETR", rank: 11, positionRank: "QB1", projectedPoints: 25.9, recommendation: "MUST_START", note: "Denver blitz rate (44.2%) creates massive scramble lane upside." },
      { analystName: "PFF Analytics Team", outlet: "PFF", rank: 9, positionRank: "QB1", projectedPoints: 26.8, recommendation: "MUST_START", note: "92.4 PFF overall grade leads all NFL QBs." },
      { analystName: "Matthew Berry", outlet: "Fantasy Life", rank: 13, positionRank: "QB1", projectedPoints: 25.2, recommendation: "MUST_START", note: "Unanimous #1 QB start recommendation." },
      { analystName: "Matt Harmon", outlet: "Yahoo Sports", rank: 12, positionRank: "QB1", projectedPoints: 25.6, recommendation: "MUST_START", note: "Derrick Henry synergy opening single-high safety looks." }
    ]
  },
  // Justin Jefferson
  "p-wr-1": {
    ecrRank: 4,
    ecrPositionalRank: "WR1",
    bestRank: 2,
    worstRank: 7,
    avgRank: 4.2,
    stdDev: 1.2,
    startConsensusPct: 100,
    expertTag: "💎 Consensus Alpha WR1",
    analystRanks: [
      { analystName: "Consensus (120+ Experts)", outlet: "FantasyPros", rank: 4, positionRank: "WR1", projectedPoints: 21.2, recommendation: "MUST_START", note: "31.5% target share with league-leading 3.12 YPRR." },
      { analystName: "Mike Clay", outlet: "ESPN Fantasy", rank: 3, positionRank: "WR1", projectedPoints: 22.0, recommendation: "MUST_START", note: "Projecting 10.4 targets and 94 receiving yards." },
      { analystName: "Evan Silva", outlet: "ETR", rank: 5, positionRank: "WR2", projectedPoints: 20.8, recommendation: "MUST_START", note: "Smash spot vs Indy secondary ranking 28th vs outside WRs." },
      { analystName: "PFF Analytics Team", outlet: "PFF", rank: 4, positionRank: "WR1", projectedPoints: 21.5, recommendation: "MUST_START", note: "91.8 Receiving Grade against man coverage." },
      { analystName: "Matthew Berry", outlet: "Fantasy Life", rank: 4, positionRank: "WR1", projectedPoints: 21.0, recommendation: "MUST_START", note: "Set-it-and-forget-it elite WR1." },
      { analystName: "Matt Harmon", outlet: "Yahoo Sports", rank: 2, positionRank: "WR1", projectedPoints: 22.4, recommendation: "MUST_START", note: "Reception Perception 84% win rate vs press coverage." }
    ]
  },
  // Ja'Marr Chase
  "p-wr-2": {
    ecrRank: 6,
    ecrPositionalRank: "WR2",
    bestRank: 3,
    worstRank: 10,
    avgRank: 6.1,
    stdDev: 1.9,
    startConsensusPct: 98,
    expertTag: "⚡ Explosiveness Ceiling",
    analystRanks: [
      { analystName: "Consensus (120+ Experts)", outlet: "FantasyPros", rank: 6, positionRank: "WR2", projectedPoints: 20.5, recommendation: "MUST_START", note: "Burrow-Chase stack delivering 28% target share." },
      { analystName: "Mike Clay", outlet: "ESPN Fantasy", rank: 5, positionRank: "WR2", projectedPoints: 21.1, recommendation: "MUST_START", note: "Projected 9.8 targets and 1.2 red zone touches." },
      { analystName: "Evan Silva", outlet: "ETR", rank: 7, positionRank: "WR3", projectedPoints: 19.8, recommendation: "MUST_START", note: "High shootout total game environment in Cincinnati." },
      { analystName: "PFF Analytics Team", outlet: "PFF", rank: 4, positionRank: "WR1", projectedPoints: 21.4, recommendation: "MUST_START", note: "+2.1 YACOE leads all AFC wideouts." },
      { analystName: "Matthew Berry", outlet: "Fantasy Life", rank: 6, positionRank: "WR2", projectedPoints: 20.2, recommendation: "MUST_START", note: "Elite multi-touchdown ceiling every week." },
      { analystName: "Matt Harmon", outlet: "Yahoo Sports", rank: 6, positionRank: "WR2", projectedPoints: 20.6, recommendation: "MUST_START", note: "Versatile alignment across slot and perimeter." }
    ]
  },
  // Christian McCaffrey / Derrick Henry / Saquon
  "p-rb-1": {
    ecrRank: 5,
    ecrPositionalRank: "RB1",
    bestRank: 2,
    worstRank: 9,
    avgRank: 5.2,
    stdDev: 1.6,
    startConsensusPct: 100,
    expertTag: "🔥 Volume & Touch Monster",
    analystRanks: [
      { analystName: "Consensus (120+ Experts)", outlet: "FantasyPros", rank: 5, positionRank: "RB1", projectedPoints: 22.8, recommendation: "MUST_START", note: "Unmatched 82% snap share & red zone share." },
      { analystName: "Mike Clay", outlet: "ESPN Fantasy", rank: 3, positionRank: "RB1", projectedPoints: 23.5, recommendation: "MUST_START", note: "Projected 21.5 total touches (16 rush, 5.5 rec)." },
      { analystName: "Evan Silva", outlet: "ETR", rank: 6, positionRank: "RB2", projectedPoints: 22.1, recommendation: "MUST_START", note: "49ers high goal line EPA creates touchdown security." },
      { analystName: "PFF Analytics Team", outlet: "PFF", rank: 4, positionRank: "RB1", projectedPoints: 23.2, recommendation: "MUST_START", note: "89.8 PFF Rushing & Receiving grade combined." },
      { analystName: "Matthew Berry", outlet: "Fantasy Life", rank: 5, positionRank: "RB1", projectedPoints: 22.6, recommendation: "MUST_START", note: "Overall #1 RB play when healthy." },
      { analystName: "Matt Harmon", outlet: "Yahoo Sports", rank: 5, positionRank: "RB1", projectedPoints: 22.4, recommendation: "MUST_START", note: "Heavy passing game usage adds huge PPR floor." }
    ]
  },
  // Travis Kelce
  "p-te-1": {
    ecrRank: 24,
    ecrPositionalRank: "TE1",
    bestRank: 18,
    worstRank: 32,
    avgRank: 23.8,
    stdDev: 2.8,
    startConsensusPct: 96,
    expertTag: "🔥 TE1 Safety Floor",
    analystRanks: [
      { analystName: "Consensus (120+ Experts)", outlet: "FantasyPros", rank: 24, positionRank: "TE1", projectedPoints: 15.2, recommendation: "MUST_START", note: "Averaging 8.4 targets per game in red zone trips." },
      { analystName: "Mike Clay", outlet: "ESPN Fantasy", rank: 21, positionRank: "TE1", projectedPoints: 15.8, recommendation: "MUST_START", note: "Leading tight end target share at 24.5%." },
      { analystName: "Evan Silva", outlet: "ETR", rank: 26, positionRank: "TE2", projectedPoints: 14.8, recommendation: "MUST_START", note: "Red zone target share remains elite 32%." },
      { analystName: "PFF Analytics Team", outlet: "PFF", rank: 22, positionRank: "TE1", projectedPoints: 15.5, recommendation: "MUST_START", note: "86.4 Receiving grade vs linebackers." },
      { analystName: "Matthew Berry", outlet: "Fantasy Life", rank: 25, positionRank: "TE1", projectedPoints: 15.0, recommendation: "MUST_START", note: "Mahomes' primary third-down conversion target." },
      { analystName: "Matt Harmon", outlet: "Yahoo Sports", rank: 24, positionRank: "TE1", projectedPoints: 15.1, recommendation: "MUST_START", note: "Route participation remains above 82%." }
    ]
  },
  // George Pickens / Volatile High Variance Player
  "p-wr-3": {
    ecrRank: 42,
    ecrPositionalRank: "WR18",
    bestRank: 28,
    worstRank: 58,
    avgRank: 41.5,
    stdDev: 6.8,
    startConsensusPct: 74,
    expertTag: "⚠️ High Variance Volatile",
    analystRanks: [
      { analystName: "Consensus (120+ Experts)", outlet: "FantasyPros", rank: 42, positionRank: "WR18", projectedPoints: 14.2, recommendation: "START", note: "Deep target air yard leader with high game script variance." },
      { analystName: "Mike Clay", outlet: "ESPN Fantasy", rank: 36, positionRank: "WR15", projectedPoints: 15.6, recommendation: "START", note: "12.4 aDOT provides massive upside on single explosive plays." },
      { analystName: "Evan Silva", outlet: "ETR", rank: 50, positionRank: "WR24", projectedPoints: 12.8, recommendation: "RISKY", note: "Matchup vs shadow corner limits volume floor." },
      { analystName: "PFF Analytics Team", outlet: "PFF", rank: 32, positionRank: "WR14", projectedPoints: 16.0, recommendation: "START", note: "88.2 PFF grade on contested catches." },
      { analystName: "Matthew Berry", outlet: "Fantasy Life", rank: 44, positionRank: "WR20", projectedPoints: 13.9, recommendation: "FLEX", note: "Flex play with boom/bust 25-point ceiling." },
      { analystName: "Matt Harmon", outlet: "Yahoo Sports", rank: 48, positionRank: "WR22", projectedPoints: 13.5, recommendation: "FLEX", note: "Press coverage win rate drops against top secondary." }
    ]
  }
};

/**
 * Generate dynamic analyst consensus for any player
 */
export function generateAnalystConsensus(player: Player): AnalystConsensus {
  // Check custom override map
  if (CUSTOM_ANALYST_MAP[player.id]) {
    const override = CUSTOM_ANALYST_MAP[player.id];
    return {
      ecrRank: override.ecrRank || Math.round(player.adp || 35),
      ecrPositionalRank: override.ecrPositionalRank || `${player.position}${Math.max(1, Math.round((player.adp || 30) / 3))}`,
      bestRank: override.bestRank || Math.max(1, Math.round((player.adp || 35) * 0.75)),
      worstRank: override.worstRank || Math.round((player.adp || 35) * 1.35),
      avgRank: override.avgRank || Math.round((player.adp || 35) * 1.02),
      stdDev: override.stdDev || 3.2,
      startConsensusPct: override.startConsensusPct || 92,
      analystRanks: override.analystRanks || [],
      expertTag: override.expertTag || "🔥 Analyst Consensus Target"
    };
  }

  // Calculate baseline rank from ADP or projected points
  const baseRank = player.adp && player.adp > 0 ? player.adp : Math.max(1, Math.round(150 - player.projectedPoints * 5));

  // Determine positional index
  const posIndex = Math.max(1, Math.round(baseRank / 3.5));
  const posRankStr = `${player.position}${posIndex}`;

  const bestRank = Math.max(1, Math.round(baseRank * 0.8));
  const worstRank = Math.round(baseRank * 1.25);
  const avgRank = parseFloat(((bestRank + worstRank + baseRank) / 3).toFixed(1));
  const stdDev = parseFloat(((worstRank - bestRank) / 4.2).toFixed(1));

  let startPct = 50;
  if (player.projectedPoints >= 18) startPct = 96;
  else if (player.projectedPoints >= 14) startPct = 84;
  else if (player.projectedPoints >= 10) startPct = 62;
  else startPct = 35;

  let expertTag = "🔥 Solid Consensus";
  if (stdDev > 5.5) expertTag = "⚠️ High Analyst Disagreement";
  else if (startPct >= 90) expertTag = "💎 Consensus Start Smash";
  else if (startPct <= 40) expertTag = "⛔ Expert Bench Consensus";

  const ranks: AnalystRankEntry[] = ANALYST_OUTLETS.map((outlet, idx) => {
    // Inject realistic subtle variance across analysts
    const varianceMultiplier = 1 + ((idx - 2.5) * 0.04);
    const individualRank = Math.max(1, Math.round(baseRank * varianceMultiplier));
    const individualProj = parseFloat((player.projectedPoints * (1 + (idx - 2.5) * 0.02)).toFixed(1));

    let rec: 'MUST_START' | 'START' | 'FLEX' | 'BENCH' | 'RISKY' = 'START';
    if (individualProj >= 20) rec = 'MUST_START';
    else if (individualProj >= 15) rec = 'START';
    else if (individualProj >= 11) rec = 'FLEX';
    else if (stdDev > 5) rec = 'RISKY';
    else rec = 'BENCH';

    return {
      analystName: outlet.analystName,
      outlet: outlet.outlet,
      rank: individualRank,
      positionRank: `${player.position}${Math.max(1, Math.round(individualRank / 3.2))}`,
      projectedPoints: individualProj,
      recommendation: rec,
      note: `${outlet.name} projects ${individualProj} pts with ${player.opponent}. ${player.matchupDifficulty === 'EASY' ? 'Favorable matchup matchup boost.' : 'Tough defensive front.'}`
    };
  });

  return {
    ecrRank: Math.round(baseRank),
    ecrPositionalRank: posRankStr,
    bestRank,
    worstRank,
    avgRank,
    stdDev,
    startConsensusPct: startPct,
    analystRanks: ranks,
    expertTag
  };
}

/**
 * Enriches players list with analystConsensus data
 */
export function enrichPlayersWithAnalystData(players: Player[]): Player[] {
  return players.map((player) => ({
    ...player,
    analystConsensus: generateAnalystConsensus(player)
  }));
}
