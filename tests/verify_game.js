const assert = require('assert');
const { generateTambolaTicket } = require('../server/ticketGenerator');
const { validateClaim, CLAIM_TYPES } = require('../server/claims');

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

console.log('\n--- ALL UNIT & VALIDATION TESTS PASSED! ---');

