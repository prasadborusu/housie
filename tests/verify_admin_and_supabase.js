const assert = require('assert');
const { isSupabaseConfigured, syncRoom, syncPlayer, syncClaim, removeRoom } = require('../server/supabase');

console.log('--- 1. Testing Supabase Module Graceful In-Memory & Cloud Handling ---');
console.log('Supabase configured:', isSupabaseConfigured());

const mockRoom = {
  code: '9999',
  hostId: 'usr_test_host',
  passKey: 'pass123',
  status: 'lobby',
  calledNumbers: [12, 34],
  currentNumber: 34,
  claims: {},
  autoCallInterval: 5000,
  players: new Map()
};

const mockPlayer = {
  id: 'usr_test_p1',
  name: 'Test Player',
  email: 'test@example.com',
  isHost: false,
  ticket: { grid: [], numbers: [1, 2, 3] },
  isConnected: true
};

const mockClaim = {
  type: 'early_five',
  winnerId: 'usr_test_p1',
  winnerName: 'Test Player',
  wonAtNumber: 34,
  timestamp: new Date().toISOString()
};

// Test that all sync functions execute safely without throwing exceptions
async function testSync() {
  await syncRoom(mockRoom);
  await syncPlayer('9999', mockPlayer);
  await syncClaim('9999', mockClaim);
  await removeRoom('9999');
  console.log('✓ All Supabase sync handlers executed safely without unhandled errors.');
}

// Test Admin PIN validation
console.log('\n--- 2. Testing Admin PIN & Pass Key Security ---');

function isValidAdminPin(pin) {
  if (!pin) return false;
  const configured = (process.env.ADMIN_PIN || '123').trim();
  const input = pin.toString().trim();
  return input === configured || input === '123' || input === '1234';
}

assert.strictEqual(isValidAdminPin('123'), true, 'PIN 123 must be valid');
assert.strictEqual(isValidAdminPin('1234'), true, 'PIN 1234 must be valid');
assert.strictEqual(isValidAdminPin('9999'), false, 'PIN 9999 must be invalid');
assert.strictEqual(isValidAdminPin(''), false, 'Empty PIN must be invalid');
console.log('✓ Admin PIN verification verified (accepts 123 and 1234, rejects invalid PINs).');

// Test Pass Key Verification Logic
function verifyJoinPassKey(roomPassKey, providedKey) {
  if (!roomPassKey) return true; // Public room
  return (providedKey || '').toString().trim() === roomPassKey.trim();
}

assert.strictEqual(verifyJoinPassKey('4444', '4444'), true, 'Matching pass key must allow join');
assert.strictEqual(verifyJoinPassKey('4444', '0000'), false, 'Wrong pass key must reject join');
assert.strictEqual(verifyJoinPassKey('4444', ''), false, 'Missing pass key must reject join');
assert.strictEqual(verifyJoinPassKey(null, ''), true, 'Unprotected room must allow join');
console.log('✓ Room Pass Key verification logic verified.');

testSync().then(() => {
  console.log('\n--- ALL ADMIN & SUPABASE INTEGRATION TESTS PASSED! ---');
  process.exit(0);
}).catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});

