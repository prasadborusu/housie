/**
 * Tambola (Housie) Ticket Generator
 *
 * Rules:
 * - 3 rows and 9 columns (27 cells).
 * - Exactly 15 numbers (5 numbers per row, 4 empty cells per row).
 * - Column 1: 1-9
 * - Column 2: 10-19
 * - Column 3: 20-29
 * - Column 4: 30-39
 * - Column 5: 40-49
 * - Column 6: 50-59
 * - Column 7: 60-69
 * - Column 8: 70-79
 * - Column 9: 80-90
 * - Numbers in each column must be sorted in ascending order from top to bottom.
 * - Every column must have at least 1 number.
 */

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomSample(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateTicketMask() {
  // We need 15 active cells across 3 rows (5 per row) and 9 columns.
  // Standard format: 6 columns have 2 numbers, 3 columns have 1 number (6*2 + 3*1 = 15).
  // Column counts must be >= 1 and <= 3, and each row count must be exactly 5.
  for (let attempt = 0; attempt < 500; attempt++) {
    // Choose which 6 columns get 2 numbers and 3 get 1 number
    const colIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8].sort(() => 0.5 - Math.random());
    const twoColIndices = new Set(colIndices.slice(0, 6));

    const grid = [
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0]
    ];

    const rowCounts = [0, 0, 0];
    let possible = true;

    // For columns with 1 number, assign to a random row
    // For columns with 2 numbers, assign to 2 distinct random rows
    // To ensure row counts equal 5, we can use a randomized greedy or backtracking fill
    for (let c = 0; c < 9; c++) {
      const isTwo = twoColIndices.has(c);
      const neededInCol = isTwo ? 2 : 1;

      // Available rows for this column that have rowCounts < 5
      const availableRows = [0, 1, 2].filter(r => rowCounts[r] < 5);
      if (availableRows.length < neededInCol) {
        possible = false;
        break;
      }

      // Pick neededInCol rows from availableRows with lowest current counts
      availableRows.sort((a, b) => rowCounts[a] - rowCounts[b] + (Math.random() - 0.5));
      const pickedRows = availableRows.slice(0, neededInCol);

      for (const r of pickedRows) {
        grid[r][c] = 1;
        rowCounts[r]++;
      }
    }

    if (possible && rowCounts[0] === 5 && rowCounts[1] === 5 && rowCounts[2] === 5) {
      return grid;
    }
  }

  // Fallback safe generator
  return fallbackMask();
}

function fallbackMask() {
  const mask = [
    [1, 1, 1, 1, 1, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 0, 0],
    [1, 0, 0, 0, 0, 1, 1, 1, 1]
  ];
  return mask;
}

function generateTambolaTicket(ticketId = null) {
  const mask = generateTicketMask();
  const ticket = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0]
  ];

  for (let c = 0; c < 9; c++) {
    const min = c === 0 ? 1 : c * 10;
    const max = c === 8 ? 90 : c * 10 + 9;

    const activeRowsInCol = [];
    for (let r = 0; r < 3; r++) {
      if (mask[r][c] === 1) {
        activeRowsInCol.push(r);
      }
    }

    // Pick activeRowsInCol.length unique random numbers in [min, max]
    const pool = [];
    for (let n = min; n <= max; n++) {
      pool.push(n);
    }
    const chosen = getRandomSample(pool, activeRowsInCol.length);
    // Sort in ascending order
    chosen.sort((a, b) => a - b);

    for (let i = 0; i < activeRowsInCol.length; i++) {
      const r = activeRowsInCol[i];
      ticket[r][c] = chosen[i];
    }
  }

  // Collect all numbers in ticket
  const numbers = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 9; c++) {
      if (ticket[r][c] !== 0) {
        numbers.push(ticket[r][c]);
      }
    }
  }

  return {
    id: ticketId || `tkt_${Math.random().toString(36).substring(2, 9)}`,
    grid: ticket,
    numbers: numbers
  };
}

module.exports = {
  generateTambolaTicket
};

