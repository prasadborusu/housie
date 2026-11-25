/**
 * Server-side Tambola Winning Claims Validator
 */

const CLAIM_TYPES = {
  EARLY_FIVE: 'early_five',
  TOP_LINE: 'top_line',
  MIDDLE_LINE: 'middle_line',
  BOTTOM_LINE: 'bottom_line',
  FULL_HOUSE: 'full_house'
};

const CLAIM_METADATA = {
  [CLAIM_TYPES.EARLY_FIVE]: {
    id: CLAIM_TYPES.EARLY_FIVE,
    name: 'Early Five',
    description: 'First to strike any 5 numbers on the ticket',
    badge: '⚡ Early 5'
  },
  [CLAIM_TYPES.TOP_LINE]: {
    id: CLAIM_TYPES.TOP_LINE,
    name: 'Top Line',
    description: 'All 5 numbers in the top row struck',
    badge: '🥇 Top Line'
  },
  [CLAIM_TYPES.MIDDLE_LINE]: {
    id: CLAIM_TYPES.MIDDLE_LINE,
    name: 'Middle Line',
    description: 'All 5 numbers in the middle row struck',
    badge: '🥈 Mid Line'
  },
  [CLAIM_TYPES.BOTTOM_LINE]: {
    id: CLAIM_TYPES.BOTTOM_LINE,
    name: 'Bottom Line',
    description: 'All 5 numbers in the bottom row struck',
    badge: '🥉 Bottom Line'
  },
  [CLAIM_TYPES.FULL_HOUSE]: {
    id: CLAIM_TYPES.FULL_HOUSE,
    name: 'Full House',
    description: 'All 15 numbers on the ticket struck',
    badge: '👑 Full House'
  }
};

/**
 * Validates a claim against the player's ticket and the called numbers.
 * @param {string} claimType - ID of the claim
 * @param {object} ticket - Player's ticket { grid, numbers }
 * @param {Array<number>} calledNumbers - Numbers called so far
 * @param {object} roomClaims - Map of already won claims
 * @returns {object} { valid: boolean, reason?: string, details?: object }
 */
function validateClaim(claimType, ticket, calledNumbers, roomClaims = {}) {
  if (!CLAIM_METADATA[claimType]) {
    return { valid: false, reason: 'Unknown claim category' };
  }

  // Check if claim has already been awarded
  if (roomClaims[claimType]) {
    return {
      valid: false,
      reason: `${CLAIM_METADATA[claimType].name} has already been claimed by ${roomClaims[claimType].winnerName}!`
    };
  }

  const calledSet = new Set(calledNumbers);
  const grid = ticket.grid;

  if (claimType === CLAIM_TYPES.EARLY_FIVE) {
    const matchedNumbers = ticket.numbers.filter(n => calledSet.has(n));
    if (matchedNumbers.length >= 5) {
      return {
        valid: true,
        details: { matchedCount: matchedNumbers.length, needed: 5, matchedNumbers }
      };
    } else {
      return {
        valid: false,
        reason: `Bogus claim! You need 5 called numbers, but only ${matchedNumbers.length} have been called so far.`
      };
    }
  }

  if (claimType === CLAIM_TYPES.TOP_LINE) {
    const rowNumbers = grid[0].filter(n => n > 0);
    const uncalled = rowNumbers.filter(n => !calledSet.has(n));
    if (uncalled.length === 0) {
      return { valid: true, details: { rowNumbers } };
    } else {
      return {
        valid: false,
        reason: `Bogus claim! Top line has ${uncalled.length} uncalled number(s): ${uncalled.join(', ')}.`
      };
    }
  }

  if (claimType === CLAIM_TYPES.MIDDLE_LINE) {
    const rowNumbers = grid[1].filter(n => n > 0);
    const uncalled = rowNumbers.filter(n => !calledSet.has(n));
    if (uncalled.length === 0) {
      return { valid: true, details: { rowNumbers } };
    } else {
      return {
        valid: false,
        reason: `Bogus claim! Middle line has ${uncalled.length} uncalled number(s): ${uncalled.join(', ')}.`
      };
    }
  }

  if (claimType === CLAIM_TYPES.BOTTOM_LINE) {
    const rowNumbers = grid[2].filter(n => n > 0);
    const uncalled = rowNumbers.filter(n => !calledSet.has(n));
    if (uncalled.length === 0) {
      return { valid: true, details: { rowNumbers } };
    } else {
      return {
        valid: false,
        reason: `Bogus claim! Bottom line has ${uncalled.length} uncalled number(s): ${uncalled.join(', ')}.`
      };
    }
  }

  if (claimType === CLAIM_TYPES.FULL_HOUSE) {
    const uncalled = ticket.numbers.filter(n => !calledSet.has(n));
    if (uncalled.length === 0) {
      return { valid: true, details: { totalMatched: 15 } };
    } else {
      return {
        valid: false,
        reason: `Bogus claim! Full House requires all 15 numbers. You still have ${uncalled.length} uncalled number(s): ${uncalled.join(', ')}.`
      };
    }
  }

  return { valid: false, reason: 'Invalid claim conditions' };
}

/**
 * Calculates official game rankings (1st, 2nd, 3rd places and full leaderboard).
 * Rules per specification:
 * 1. 1st Place (Gold): Player who claimed Full House (Housie).
 * 2. 2nd Place (Silver): Among remaining players, whoever claimed the majority of lines (Top Line, Mid Line, Bottom Line).
 * 3. 3rd Place (Bronze): Among remaining players, whoever claimed the next most lines / Early 5 / highest ticket progress.
 * 4. Runners-up: Ranked by claims and total numbers struck.
 */
function calculateLeaderboard(room) {
  if (!room || !room.players) {
    return { podium: { first: null, second: null, third: null }, leaderboard: [] };
  }

  const calledSet = new Set(room.calledNumbers || []);
  const claims = room.claims || {};
  const lineTypes = [CLAIM_TYPES.TOP_LINE, CLAIM_TYPES.MIDDLE_LINE, CLAIM_TYPES.BOTTOM_LINE];

  // Build stats for each player
  const playerStats = Array.from(room.players.values()).map(player => {
    const ticketNumbers = player.ticket?.numbers || [];
    const struckNumbers = ticketNumbers.filter(n => calledSet.has(n));
    const struckCount = struckNumbers.length;

    // Check claims won by this player
    const wonClaims = Object.values(claims).filter(c => c.winnerId === player.id);
    const hasFullHouse = Boolean(claims[CLAIM_TYPES.FULL_HOUSE] && claims[CLAIM_TYPES.FULL_HOUSE].winnerId === player.id);

    // Count lines won (Top, Mid, Bottom)
    const linesWon = lineTypes.filter(type => claims[type] && claims[type].winnerId === player.id).length;
    const hasEarlyFive = Boolean(claims[CLAIM_TYPES.EARLY_FIVE] && claims[CLAIM_TYPES.EARLY_FIVE].winnerId === player.id);

    // Badges list
    const badges = wonClaims.map(c => c.badge || c.name);

    // Earliest claim timestamp for tie-breaking
    const earliestClaimTime = wonClaims.length > 0
      ? Math.min(...wonClaims.map(c => new Date(c.timestamp || 0).getTime()))
      : Infinity;

    return {
      id: player.id,
      name: player.name,
      email: player.email,
      hasFullHouse,
      linesWon,
      hasEarlyFive,
      totalClaims: wonClaims.length,
      wonClaims,
      badges,
      struckCount,
      totalNumbers: ticketNumbers.length || 15,
      earliestClaimTime
    };
  });

  // Podium selection:
  // 1. First Place: Full House (Housie) winner
  let firstPlace = null;
  const fullHousePlayer = playerStats.find(p => p.hasFullHouse);
  const remainingForPodium = [...playerStats];

  if (fullHousePlayer) {
    firstPlace = {
      ...fullHousePlayer,
      rank: 1,
      placeTitle: '1st Place (Grand Winner)',
      awardReason: 'Full House (Housie) Champion 👑'
    };
    const idx = remainingForPodium.findIndex(p => p.id === fullHousePlayer.id);
    if (idx !== -1) remainingForPodium.splice(idx, 1);
  } else {
    // If Full House was not claimed (e.g. host ended game early), sort by lines -> early 5 -> struck
    remainingForPodium.sort(compareNonFullHouse);
    if (remainingForPodium.length > 0) {
      const top = remainingForPodium.shift();
      firstPlace = {
        ...top,
        rank: 1,
        placeTitle: '1st Place',
        awardReason: top.linesWon > 0 ? `${top.linesWon} Lines Won` : 'Top Scorer'
      };
    }
  }

  // 2. Second Place: Among remaining players, whoever claimed the majority of lines
  remainingForPodium.sort(compareNonFullHouse);
  let secondPlace = null;
  if (remainingForPodium.length > 0) {
    const second = remainingForPodium.shift();
    let reason = 'Top Runner-up';
    if (second.linesWon > 0) {
      reason = second.linesWon === 1 ? '1 Line Won' : `${second.linesWon} Lines (Majority Winner)`;
    } else if (second.hasEarlyFive) {
      reason = 'Early Five Winner';
    } else {
      reason = `${second.struckCount}/15 Struck`;
    }

    secondPlace = {
      ...second,
      rank: 2,
      placeTitle: '2nd Place',
      awardReason: reason
    };
  }

  // 3. Third Place: Next highest contender
  remainingForPodium.sort(compareNonFullHouse);
  let thirdPlace = null;
  if (remainingForPodium.length > 0) {
    const third = remainingForPodium.shift();
    let reason = 'Podium Finisher';
    if (third.linesWon > 0) {
      reason = `${third.linesWon} Line Won`;
    } else if (third.hasEarlyFive) {
      reason = 'Early Five Winner';
    } else {
      reason = `${third.struckCount}/15 Struck`;
    }

    thirdPlace = {
      ...third,
      rank: 3,
      placeTitle: '3rd Place',
      awardReason: reason
    };
  }

  // 4. Build full ranked leaderboard
  const leaderboard = [];
  if (firstPlace) leaderboard.push(firstPlace);
  if (secondPlace) leaderboard.push(secondPlace);
  if (thirdPlace) leaderboard.push(thirdPlace);

  remainingForPodium.forEach((p) => {
    leaderboard.push({
      ...p,
      rank: leaderboard.length + 1,
      placeTitle: `${leaderboard.length + 1}th Place`,
      awardReason: p.totalClaims > 0 ? `${p.totalClaims} Claim(s)` : `${p.struckCount}/15 Struck`
    });
  });

  return {
    podium: {
      first: firstPlace,
      second: secondPlace,
      third: thirdPlace
    },
    leaderboard
  };
}

function compareNonFullHouse(a, b) {
  // Majority lines first
  if (b.linesWon !== a.linesWon) {
    return b.linesWon - a.linesWon;
  }
  // Then Early Five
  if (b.hasEarlyFive !== a.hasEarlyFive) {
    return (b.hasEarlyFive ? 1 : 0) - (a.hasEarlyFive ? 1 : 0);
  }
  // Then total claims
  if (b.totalClaims !== a.totalClaims) {
    return b.totalClaims - a.totalClaims;
  }
  // Then struck numbers on ticket
  if (b.struckCount !== a.struckCount) {
    return b.struckCount - a.struckCount;
  }
  // Earliest claim time
  return a.earliestClaimTime - b.earliestClaimTime;
}

module.exports = {
  CLAIM_TYPES,
  CLAIM_METADATA,
  validateClaim,
  calculateLeaderboard
};

