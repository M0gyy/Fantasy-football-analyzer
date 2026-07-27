import { Player, RosterSlot, TradeAnalysisResponse } from '../types';

/**
 * Optimizes the lineup by placing highest projected players into their valid starting slots
 */
export function autoOptimizeLineup(currentRoster: RosterSlot[]): RosterSlot[] {
  // Extract all available non-null players from starters and bench
  const allPlayers = currentRoster
    .map(slot => slot.player)
    .filter((p): p is Player => p !== null);

  // Sort players descending by projected points
  const sortedPlayers = [...allPlayers].sort((a, b) => b.projectedPoints - a.projectedPoints);

  // Separate non-bench, non-IR starter template slots
  const starterSlots = currentRoster.filter(s => s.slotName !== 'BENCH' && s.slotName !== 'IR');
  const benchSlots = currentRoster.filter(s => s.slotName === 'BENCH');
  const irSlot = currentRoster.find(s => s.slotName === 'IR');

  const assignedPlayerIds = new Set<string>();
  const newRoster: RosterSlot[] = starterSlots.map(slot => ({ ...slot, player: null }));

  // First pass: Assign exact position matches (QB, RB, WR, TE, K, DEF)
  for (const slot of newRoster) {
    if (slot.slotName === 'FLEX') continue; // Skip flex for second pass

    const bestFit = sortedPlayers.find(p =>
      !assignedPlayerIds.has(p.id) &&
      slot.allowedPositions.includes(p.position) &&
      p.injuryStatus !== 'OUT' &&
      p.injuryStatus !== 'IR'
    );

    if (bestFit) {
      slot.player = bestFit;
      assignedPlayerIds.add(bestFit.id);
    }
  }

  // Second pass: Assign FLEX slot
  const flexSlot = newRoster.find(s => s.slotName === 'FLEX');
  if (flexSlot) {
    const bestFlex = sortedPlayers.find(p =>
      !assignedPlayerIds.has(p.id) &&
      flexSlot.allowedPositions.includes(p.position) &&
      p.injuryStatus !== 'OUT' &&
      p.injuryStatus !== 'IR'
    );
    if (bestFlex) {
      flexSlot.player = bestFlex;
      assignedPlayerIds.add(bestFlex.id);
    }
  }

  // Assign remaining players to BENCH slots
  const unassigned = sortedPlayers.filter(p => !assignedPlayerIds.has(p.id));
  const newBench: RosterSlot[] = benchSlots.map((slot, index) => ({
    ...slot,
    player: unassigned[index] || null
  }));

  return [...newRoster, ...newBench, ...(irSlot ? [irSlot] : [])];
}

/**
 * Fallback static trade analysis calculator if AI response is offline
 */
export function calculateFallbackTradeAnalysis(
  giving: Player[],
  receiving: Player[]
): TradeAnalysisResponse {
  const givingTotalProj = giving.reduce((sum, p) => sum + p.projectedPoints, 0);
  const receivingTotalProj = receiving.reduce((sum, p) => sum + p.projectedPoints, 0);
  const delta = receivingTotalProj - givingTotalProj;

  let grade: TradeAnalysisResponse['grade'] = 'B';
  let recommendation: TradeAnalysisResponse['recommendation'] = 'COUNTER';

  if (delta >= 4.0) {
    grade = 'A+';
    recommendation = 'ACCEPT';
  } else if (delta >= 1.5) {
    grade = 'A';
    recommendation = 'ACCEPT';
  } else if (delta >= -0.5) {
    grade = 'B+';
    recommendation = 'ACCEPT';
  } else if (delta >= -3.0) {
    grade = 'C+';
    recommendation = 'COUNTER';
  } else {
    grade = 'F';
    recommendation = 'REJECT';
  }

  return {
    grade,
    recommendation,
    myPointDelta: Math.round(delta * 10) / 10,
    analysisSummary: `Trading away ${giving.map(p => p.name).join(', ')} for ${receiving.map(p => p.name).join(', ')} results in a net projected difference of ${delta >= 0 ? '+' : ''}${delta.toFixed(1)} pts/week.`,
    keyFactors: [
      `Point Delta: ${delta >= 0 ? '+' : ''}${delta.toFixed(1)} PPG`,
      `Highest single player value: ${[...giving, ...receiving].sort((a,b) => b.projectedPoints - a.projectedPoints)[0]?.name || 'N/A'}`,
      `Injury Risk: ${receiving.some(p => p.injuryStatus !== 'HEALTHY') ? 'Elevated (Injuries present)' : 'Low (All healthy)'}`
    ],
    positionalImpact: {
      strengthGained: receiving.map(p => p.position).join('/'),
      vulnerabilityCreated: giving.map(p => p.position).join('/'),
    },
    scheduleImpact: "Neutral remaining schedule strength impact.",
    verdictDetail: recommendation === 'ACCEPT'
      ? "This trade improves your starting lineup's projected point baseline without creating unsustainable roster depth holes."
      : "You are giving up higher projected consistency. Consider requesting a secondary bench upgrade before accepting."
  };
}

export function getMatchupBadgeColor(difficulty: Player['matchupDifficulty']) {
  switch (difficulty) {
    case 'EASY':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'NEUTRAL':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'HARD':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'VERY_HARD':
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  }
}

export function getInjuryBadgeColor(status: Player['injuryStatus']) {
  switch (status) {
    case 'HEALTHY':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'PROBABLE':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'QUESTIONABLE':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'DOUBTFUL':
    case 'OUT':
    case 'IR':
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  }
}
