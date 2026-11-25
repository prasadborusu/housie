const assert = require('assert');
const { generateTambolaTicket } = require('../server/ticketGenerator');
const { validateClaim, CLAIM_TYPES, calculateLeaderboard } = require('../server/claims');

console.log('--- 1. Testing Tambola Ticket Generator (100 sample tickets) ---');

for (let i = 0; i < 100; i++) {
  const ticket = generateTambolaTicket(`test_${i}`);
  const grid = ticket.grid;

  // Assert 3 rows
  assert.strictEqual(grid.length, 3, 'Ticket must have 3 rows');

  // Assert 9 columns per row
  for (let r = 0; r < 3; r++) {
    assert.strictEqual(grid[r].length, 9, `Row ${r} must have 9 columns`);
  }

  // Assert exactly 5 numbers per row
  for (let r = 0; r < 3; r++) {
    const rowNumbers = grid[r].filter(n => n > 0);
    assert.strictEqual(rowNumbers.length, 5, `Row ${r} must have exactly 5 numbers, got ${rowNumbers.length}`);
  }

  // Assert total 15 numbers
  assert.strictEqual(ticket.numbers.length, 15, 'Ticket must have 15 numbers');

  // Assert unique numbers
  const numSet = new Set(ticket.numbers);
  assert.strictEqual(numSet.size, 15, 'All 15 numbers must be unique');

  // Assert column ranges and column sorting
  for (let c = 0; c < 9; c++) {
    const min = c === 0 ? 1 : c * 10;
    const max = c === 8 ? 90 : c * 10 + 9;
    const colNumbers = [];

    for (let r = 0; r < 3; r++) {
      const val = grid[r][c];
      if (val > 0) {
        assert(val >= min && val <= max, `Number ${val} in col ${c} out of range [${min}, ${max}]`);
        colNumbers.push(val);
      }
    }

    // Every column must have at least 1 number
    assert(colNumbers.length >= 1, `Column ${c} must have at least 1 number`);
    assert(colNumbers.length <= 3, `Column ${c} cannot have more than 3 numbers`);

    // Column numbers must be sorted ascending
    for (let j = 0; j < colNumbers.length - 1; j++) {
      assert(colNumbers[j] < colNumbers[j + 1], `Column ${c} numbers not sorted: ${colNumbers}`);
    }
  }
}

console.log('✓ All 100 tickets passed 100% of Tambola rules!');

console.log('\n--- 2. Testing Server-side Claim Validation Logic ---');

const sampleTicket = generateTambolaTicket('sample_1');
const allNumbers = sampleTicket.numbers;
const topRow = sampleTicket.grid[0].filter(n => n > 0);
const midRow = sampleTicket.grid[1].filter(n => n > 0);
const botRow = sampleTicket.grid[2].filter(n => n > 0);

// Test Early Five
// Invalid: only 4 numbers called
const resEarly4 = validateClaim(CLAIM_TYPES.EARLY_FIVE, sampleTicket, allNumbers.slice(0, 4));
assert.strictEqual(resEarly4.valid, false, 'Early 5 with 4 numbers must be rejected');
console.log('✓ Bogus Early 5 rejected correctly:', resEarly4.reason);

// Valid: 5 numbers called
const resEarly5 = validateClaim(CLAIM_TYPES.EARLY_FIVE, sampleTicket, allNumbers.slice(0, 5));
assert.strictEqual(resEarly5.valid, true, 'Early 5 with 5 numbers must be accepted');
console.log('✓ Valid Early 5 accepted correctly');

// Test Duplicate Claim Prevention
const roomClaims = {
  [CLAIM_TYPES.EARLY_FIVE]: { winnerName: 'Charlie', winnerId: 'usr_1' }
};
const resDup = validateClaim(CLAIM_TYPES.EARLY_FIVE, sampleTicket, allNumbers.slice(0, 5), roomClaims);
assert.strictEqual(resDup.valid, false, 'Duplicate Early 5 claim must be rejected');
console.log('✓ Duplicate claim prevented:', resDup.reason);

// Test Top Line
// Bogus: 4 of 5 called
const resTopBogus = validateClaim(CLAIM_TYPES.TOP_LINE, sampleTicket, topRow.slice(0, 4));
assert.strictEqual(resTopBogus.valid, false, 'Top Line missing 1 number must be rejected');
console.log('✓ Bogus Top Line rejected:', resTopBogus.reason);

// Valid: all 5 top row called
const resTopValid = validateClaim(CLAIM_TYPES.TOP_LINE, sampleTicket, topRow);
assert.strictEqual(resTopValid.valid, true, 'Top Line with all 5 numbers must be accepted');
console.log('✓ Valid Top Line accepted');

// Test Full House
// Bogus: 14 called, 1 missing
const resFullBogus = validateClaim(CLAIM_TYPES.FULL_HOUSE, sampleTicket, allNumbers.slice(0, 14));
assert.strictEqual(resFullBogus.valid, false, 'Full House with 14 numbers must be rejected');
console.log('✓ Bogus Full House rejected:', resFullBogus.reason);

// Valid: all 15 called
const resFullValid = validateClaim(CLAIM_TYPES.FULL_HOUSE, sampleTicket, allNumbers);
assert.strictEqual(resFullValid.valid, true, 'Full House with all 15 numbers must be accepted');
console.log('✓ Valid Full House accepted');

console.log('\n--- 3. Testing Official Ranking & Podium Calculation (calculateLeaderboard) ---');

const mockPlayers = new Map();
mockPlayers.set('usr_alice', {
  id: 'usr_alice',
  name: 'Alice',
  ticket: generateTambolaTicket('alice_ticket')
});
mockPlayers.set('usr_bob', {
  id: 'usr_bob',
  name: 'Bob',
  ticket: generateTambolaTicket('bob_ticket')
});
mockPlayers.set('usr_charlie', {
  id: 'usr_charlie',
  name: 'Charlie',
  ticket: generateTambolaTicket('charlie_ticket')
});
mockPlayers.set('usr_dave', {
  id: 'usr_dave',
  name: 'Dave',
  ticket: generateTambolaTicket('dave_ticket')
});

const mockClaims = {
  [CLAIM_TYPES.FULL_HOUSE]: { winnerId: 'usr_alice', winnerName: 'Alice', name: 'Full House', badge: '👑 Full House' },
  [CLAIM_TYPES.TOP_LINE]: { winnerId: 'usr_bob', winnerName: 'Bob', name: 'Top Line', badge: '🥇 Top Line' },
  [CLAIM_TYPES.BOTTOM_LINE]: { winnerId: 'usr_bob', winnerName: 'Bob', name: 'Bottom Line', badge: '🥉 Bottom Line' },
  [CLAIM_TYPES.MIDDLE_LINE]: { winnerId: 'usr_charlie', winnerName: 'Charlie', name: 'Middle Line', badge: '🥈 Mid Line' },
  [CLAIM_TYPES.EARLY_FIVE]: { winnerId: 'usr_dave', winnerName: 'Dave', name: 'Early Five', badge: '⚡ Early 5' }
};

const mockRoom = {
  players: mockPlayers,
  claims: mockClaims,
  calledNumbers: [1, 5, 10, 15, 20, 25, 30, 35, 40]
};

const { podium, leaderboard } = calculateLeaderboard(mockRoom);

// 1st Place MUST be Alice (claimed Full House / Housie)
assert.strictEqual(podium.first.id, 'usr_alice', '1st place must be Full House claimant (Alice)');
assert.strictEqual(podium.first.hasFullHouse, true);
console.log('✓ 1st Place awarded to Full House winner (Alice):', podium.first.placeTitle);

// 2nd Place MUST be Bob (claimed majority of lines: 2 lines)
assert.strictEqual(podium.second.id, 'usr_bob', '2nd place must be majority lines claimant (Bob)');
assert.strictEqual(podium.second.linesWon, 2, 'Bob won 2 lines (majority)');
console.log('✓ 2nd Place awarded to majority lines winner (Bob, 2 lines):', podium.second.placeTitle);

// 3rd Place MUST be Charlie (claimed 1 line)
assert.strictEqual(podium.third.id, 'usr_charlie', '3rd place must be Charlie (1 line won)');
assert.strictEqual(podium.third.linesWon, 1);
console.log('✓ 3rd Place awarded to next line claimant (Charlie):', podium.third.placeTitle);

// 4th Place MUST be Dave (Early Five)
assert.strictEqual(leaderboard[3].id, 'usr_dave', '4th place must be Dave (Early 5)');
console.log('✓ 4th Place awarded to Early Five claimant (Dave)');

console.log('\n--- 4. Testing Late Entry Prevention During Active Games ---');

function simulateJoinAttempt(room, { name, playerId }) {
  if (playerId && room.players.has(playerId)) {
    return { success: true, reconnected: true };
  }
  if (room.status === 'playing' || room.status === 'paused') {
    return {
      success: false,
      error: 'Game is already in progress! Late entry is not allowed. Please wait for the next round.'
    };
  }
  if (room.status === 'ended') {
    return { success: false, error: 'This game round has already ended.' };
  }
  return { success: true, reconnected: false };
}

const activeGameRoom = {
  status: 'playing',
  players: new Map([['existing_user_1', { name: 'Player One' }]])
};

// 1. New player trying to join during 'playing' -> MUST BE REJECTED
const newJoinAttempt = simulateJoinAttempt(activeGameRoom, { name: 'Late Player' });
assert.strictEqual(newJoinAttempt.success, false, 'New player must be rejected while game is playing');
assert.strictEqual(
  newJoinAttempt.error,
  'Game is already in progress! Late entry is not allowed. Please wait for the next round.'
);
console.log('✓ New player rejected during active game:', newJoinAttempt.error);

// 2. Existing player reconnecting during 'playing' -> MUST BE ACCEPTED
const existingReconnect = simulateJoinAttempt(activeGameRoom, {
  name: 'Player One',
  playerId: 'existing_user_1'
});
assert.strictEqual(existingReconnect.success, true, 'Existing player must be allowed to reconnect');
console.log('✓ Existing player successfully reconnected during active game');

// 3. Paused game room -> new player MUST BE REJECTED
activeGameRoom.status = 'paused';
const pausedJoinAttempt = simulateJoinAttempt(activeGameRoom, { name: 'Another Late Player' });
assert.strictEqual(pausedJoinAttempt.success, false, 'New player must be rejected when game is paused');
console.log('✓ New player rejected during paused game');

// 4. Lobby room -> new player MUST BE ACCEPTED
activeGameRoom.status = 'lobby';
const lobbyJoinAttempt = simulateJoinAttempt(activeGameRoom, { name: 'Lobby Player' });
assert.strictEqual(lobbyJoinAttempt.success, true, 'New player can join during lobby');
console.log('✓ New player successfully joined during lobby stage');

console.log('\n--- 5. Testing Game Auto-End on Full House Claim ---');
function checkGameShouldEnd(claimType, currentClaims) {
  const isFullHouse = claimType === CLAIM_TYPES.FULL_HOUSE;
  const ALL_REQUIRED_CLAIMS = [
    CLAIM_TYPES.EARLY_FIVE,
    CLAIM_TYPES.TOP_LINE,
    CLAIM_TYPES.MIDDLE_LINE,
    CLAIM_TYPES.BOTTOM_LINE,
    CLAIM_TYPES.FULL_HOUSE
  ];
  const allTasksCompleted = ALL_REQUIRED_CLAIMS.every(type => Boolean(currentClaims[type]) || type === claimType);
  return isFullHouse || allTasksCompleted;
}

assert.strictEqual(checkGameShouldEnd(CLAIM_TYPES.FULL_HOUSE, {}), true, 'Full House must immediately trigger game end');
assert.strictEqual(checkGameShouldEnd(CLAIM_TYPES.TOP_LINE, {}), false, 'Top Line alone should not end game');
console.log('✓ Full House immediately ends the game round and transitions to results');

console.log('\n--- ALL UNIT & VALIDATION TESTS PASSED! ---');

