export type SportType = 'NFL' | 'NBA' | 'EPL';

export type Position =
  // NFL
  | 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DEF' | 'FLEX'
  // NBA
  | 'PG' | 'SG' | 'SF' | 'PF' | 'C' | 'G' | 'F' | 'UTIL'
  // EPL
  | 'GKP' | 'DEF_SOC' | 'MID' | 'FWD';

export type InjuryStatus = 'HEALTHY' | 'PROBABLE' | 'QUESTIONABLE' | 'DOUBTFUL' | 'OUT' | 'IR';

export interface GameLog {
  week: number;
  opponent: string;
  points: number;
  projectedPoints: number;
  statsSummary: string; // e.g. "28/38, 312 YDS, 3 TD, 1 INT"
  targetsOrTouches?: number;
}

export type WeatherCondition =
  | 'DOME'
  | 'CLEAR'
  | 'RAIN'
  | 'HEAVY_RAIN'
  | 'HIGH_WIND'
  | 'SNOW'
  | 'EXTREME_COLD';

export interface GameWeather {
  condition: WeatherCondition;
  tempF: number;
  windMph: number;
  gustMph?: number;
  precipChance: number; // 0 to 100%
  stadiumName: string;
  isDome: boolean;
  impactLevel: 'OPTIMAL' | 'MODERATE' | 'HIGH' | 'SEVERE';
  impactSummary: string;
  passingImpact: string;
  kickingImpact: string;
  rushingImpact: string;
}

export interface AdvancedPlayerStats {
  epaPerPlay: number; // Expected Points Added per play e.g. +0.28
  cpoe?: number; // Completion % Over Expected e.g. +4.2%
  yprr?: number; // Yards Per Route Run e.g. 2.68
  anyA?: number; // Adjusted Net Yards Per Attempt e.g. 8.12
  successRate: number; // Success Rate % e.g. 52.4%
  yacoe?: number; // Yards After Catch Over Expected e.g. +1.45
  passBlockWinRate?: number; // Pass Block Win Rate % e.g. 74.5%
  runBlockWinRate?: number; // Run Block Win Rate % e.g. 72.1%
  intendedAirYards?: number; // Total Intended Air Yards e.g. 2480
  airYardsPerAttempt?: number; // Air Yards per Attempt e.g. 8.4
  aDot?: number; // Average Depth of Target e.g. 9.2 yds
  pressureRate?: number; // Pressure Rate % faced / generated e.g. 32.5%
  timeToThrow?: number; // Avg Time to Throw e.g. 2.64s
  targetShare?: number; // Target Share % e.g. 27.5%
  routeParticipation?: number; // Route Participation Rate % e.g. 88.5%
  
  // Football Outsiders Metrics
  dvoa: number | string; // Defense-adjusted Value Over Average e.g. +18.5% or "+18.5%"
  dyar?: number; // Defense-adjusted Yards Above Replacement e.g. 420

  // PFF Data Metrics
  pffGrade: number; // PFF Overall Grade 0-100 e.g. 89.4
  pffPassGrade?: number; // PFF Passing Grade e.g. 91.2
  pffRunGrade?: number; // PFF Rushing Grade e.g. 84.5
  pffRecGrade?: number; // PFF Receiving Grade e.g. 88.2
  pffBlockGrade?: number; // PFF Blocking Grade e.g. 78.4
}

export interface AnalystRankEntry {
  analystName: string; // e.g. "FantasyPros ECR", "Mike Clay (ESPN)", "Evan Silva (ETR)", "PFF Consensus", "Matthew Berry (Rotoballer)", "Matt Harmon (Yahoo)"
  outlet: string; // e.g. "FantasyPros", "ESPN", "Establish The Run", "PFF", "Rotoballer", "Yahoo Sports"
  rank: number;
  positionRank: string; // e.g. "WR4", "RB2"
  projectedPoints?: number;
  recommendation: 'MUST_START' | 'START' | 'FLEX' | 'BENCH' | 'RISKY';
  note?: string;
}

export interface AnalystConsensus {
  ecrRank: number; // Expert Consensus Rank overall
  ecrPositionalRank: string; // e.g. "WR3"
  bestRank: number;
  worstRank: number;
  avgRank: number;
  stdDev: number; // Variance / disagreement level
  startConsensusPct: number; // e.g. 94 (% of top analysts recommending START)
  analystRanks: AnalystRankEntry[];
  expertTag?: string; // e.g. "🔥 Consensus Smash", "⚠️ High Variance Volatile", "💎 High-Stakes Target"
}

export interface Player {
  id: string;
  name: string;
  sport: SportType;
  position: Position;
  team: string; // e.g. "KC", "LAL", "ARS"
  opponent: string; // e.g. "vs BAL" or "@ SF"
  photoUrl?: string;
  projectedPoints: number;
  avgPoints: number;
  seasonTotalPoints: number;
  injuryStatus: InjuryStatus;
  rosteredPercentage: number;
  matchupDifficulty: 'EASY' | 'NEUTRAL' | 'HARD' | 'VERY_HARD';
  defenseVsPositionRank: number; // 1 is easiest defense to score against, 32 is toughest
  adp: number; // Average Draft Position
  tier: number;
  byeWeek?: number;
  notes: string;
  gameLogs: GameLog[];
  weather?: GameWeather;
  // Stats specifics
  targetShare?: number; // % for WR/TE/RB
  redzoneTouches?: number;
  usageRate?: number; // % for NBA
  advancedStats?: AdvancedPlayerStats;
  analystConsensus?: AnalystConsensus;
}

export interface RosterSlot {
  slotId: string;
  slotName: string; // "QB", "RB1", "RB2", "WR1", "WR2", "TE", "FLEX", "K", "DEF", "BENCH", "IR"
  player: Player | null;
  allowedPositions: Position[];
}

export interface TeamMatchup {
  myTeamName: string;
  myScore: number;
  myProjectedScore: number;
  opponentTeamName: string;
  opponentScore: number;
  opponentProjectedScore: number;
  week: number;
  winProbability: number; // 0 to 100
}

export interface TradeSide {
  teamName: string;
  playersGiven: Player[];
}

export interface TradeAnalysisResponse {
  grade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'D' | 'F';
  recommendation: 'ACCEPT' | 'REJECT' | 'COUNTER';
  myPointDelta: number; // e.g. +4.2 ppg
  analysisSummary: string;
  keyFactors: string[];
  positionalImpact: {
    strengthGained: string;
    vulnerabilityCreated: string;
  };
  scheduleImpact: string;
  verdictDetail: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface InjuryNewsFeedItem {
  id: string;
  playerName: string;
  team: string;
  position: string;
  status: string; // e.g. "QUESTIONABLE", "OUT", "FULL PRACTICE", "LIMITED"
  headline: string;
  summary: string;
  sourceName?: string;
  sourceUrl?: string;
  updatedAt: string;
}

export interface LiveInjuryNewsResponse {
  newsItems: InjuryNewsFeedItem[];
  groundingSources: GroundingSource[];
  aiAnalysisContext: string;
}

export interface StartSitComparison {
  playerA: Player;
  playerB: Player;
  recommendedPlayerId: string;
  confidenceScore: number; // 0-100%
  analysisSummary: string;
  keyReasons: string[];
  matchupComparison: string;
  weatherOrVenueFactor: string;
  injuryContextNote?: string;
  groundingSources?: GroundingSource[];
  injuryNewsItems?: InjuryNewsFeedItem[];
}

export interface WaiverTarget {
  player: Player;
  recommendedFaabBid: number; // $ value or % of budget
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  breakoutReason: string;
  scheduleOutlook: string;
}

export interface DraftPick {
  round: number;
  pickNumber: number; // Overall pick e.g. 1 to 144
  teamName: string;
  isUser: boolean;
  playerPicked: Player | null;
}

export interface LeagueSettings {
  leagueName: string;
  sport: SportType;
  scoringFormat: 'PPR' | 'HALF_PPR' | 'STANDARD' | 'SUPERFLEX' | 'POINTS';
  teamsCount: number;
  faabBudget: number;
  currentWeek: number;
  myTeamName?: string;
  myTeamNumber?: number;
  yahooLeagueId?: string;
  isYahooSynced?: boolean;
}

export interface ReceiverProfile {
  name: string;
  position: 'WR1' | 'WR2' | 'WR3' | 'SLOT' | 'TE' | 'RB' | string;
  alignment: 'Wide Left' | 'Wide Right' | 'Slot' | string;
  targetShare: number; // e.g. 26.5%
  yprr: number; // Yards per route run e.g. 2.45
  adot: number; // e.g. 9.1
  catchRateVsPress: number; // e.g. 68.5%
}

export interface CornerbackProfile {
  name: string;
  position: 'CB1' | 'CB2' | 'SLOT CB' | string;
  coverageType: 'Man / Shadow' | 'Zone / Left' | 'Zone / Right' | 'Slot Nickel' | string;
  passerRatingAllowed: number; // e.g. 64.2
  yardsPerCoverageSnap: number; // e.g. 0.85
  catchRateAllowed: number; // e.g. 52.1%
  shadowRate: number; // e.g. 65% shadow rate
}

export interface NFLfastrTeamMetrics {
  teamCode: string; // e.g. "KC"
  city: string; // e.g. "Kansas City"
  name: string; // e.g. "Chiefs"
  fullName: string; // "Kansas City Chiefs"
  conference: 'AFC' | 'NFC';
  division: 'East' | 'North' | 'South' | 'West';
  record: string; // "12-4"
  color: string; // e.g. "#E31837"
  
  // Offensive Advanced Metrics (NFLfastr)
  offEpaPerPlay: number; // e.g. +0.182
  offEpaRank: number; // 1 to 32
  passEpaPerPlay: number; // e.g. +0.245
  rushEpaPerPlay: number; // e.g. +0.021
  offSuccessRate: number; // e.g. 48.6 (%)
  proe: number; // Pass Rate Over Expected % e.g. +4.8
  cpoe: number; // Completion % Over Expected e.g. +3.5
  explosivePlayRate: number; // 15+ yd pass / 10+ yd run % e.g. 12.4
  earlyDownPassRate: number; // 1st/2nd down pass % neutral e.g. 56.2
  aDot: number; // Avg depth of target in yards e.g. 8.2
  yacPerRec: number; // Yards after catch per rec e.g. 6.1
  neutralPaceSecs: number; // Secs per play neutral script e.g. 26.2
  redZoneEpa: number; // EPA / play in redzone e.g. +0.16
  
  // Defensive Advanced Metrics Allowed (NFLfastr)
  defEpaPerPlay: number; // EPA / play allowed e.g. -0.091
  defEpaRank: number; // 1 to 32 (1 is best defense)
  passDefEpaPerPlay: number; // Dropback EPA allowed e.g. -0.082
  rushDefEpaPerPlay: number; // Rush EPA allowed e.g. -0.104
  defSuccessRateAllowed: number; // Success rate allowed % e.g. 40.8
  pressureRate: number; // Pressure % generated e.g. 37.4
  sackRate: number; // Sack % e.g. 7.8
  blitzRate: number; // Blitz % e.g. 28.2
  
  topReceivers: ReceiverProfile[];
  topCornerbacks: CornerbackProfile[];

  keyStrengths: string[];
  keyVulnerabilities: string[];
}

export interface NFLfastrMatchupAnalysis {
  projectedWinner: string;
  projectedScore: string; // e.g. "Chiefs 27, Ravens 24"
  gameScriptForecast: string;
  passExploitability: string;
  rushExploitability: string;
  pressureAndHavocImpact: string;
  fantasyKeyTakeaway: string;
  keyMatchupEdge: string;
  confidenceScore: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedActions?: string[];
}
