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

module.exports = {
  CLAIM_TYPES,
  CLAIM_METADATA,
  validateClaim
};

