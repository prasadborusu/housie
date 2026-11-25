/**
 * Supabase Cloud Database Integration for HOUSEY
 * Synchronizes rooms, players, game states, and winning claims.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || '';

let supabase = null;
const isConfigured = Boolean(supabaseUrl && supabaseKey);

if (isConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });
    console.log('✓ Supabase client initialized successfully.');
  } catch (err) {
    console.warn('⚠️ Supabase client initialization warning:', err.message);
  }
} else {
  console.log('ℹ️ Supabase credentials not found in .env (SUPABASE_URL, SUPABASE_KEY). Running in in-memory mode with full multiplayer support.');
}

/**
 * Check if Supabase is active
 */
function isSupabaseConfigured() {
  return Boolean(supabase);
}

/**
 * Save or update a room in Supabase
 */
async function syncRoom(room) {
  if (!supabase) return null;
  try {
    const payload = {
      code: room.code,
      host_id: room.hostId,
      host_name: room.players.get(room.hostId)?.name || 'Admin Host',
      pass_key: room.passKey || null,
      status: room.status,
      called_numbers: room.calledNumbers || [],
      current_number: room.currentNumber || null,
      claims: room.claims || {},
      auto_call_interval: room.autoCallInterval || 5000,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('rooms')
      .upsert(payload, { onConflict: 'code' });

    if (error) console.error('Supabase syncRoom error:', error.message);
    return data;
  } catch (err) {
    console.error('Supabase syncRoom exception:', err.message);
    return null;
  }
}

/**
 * Save or update a player in Supabase
 */
async function syncPlayer(roomCode, player) {
  if (!supabase) return null;
  try {
    const payload = {
      id: player.id,
      room_code: roomCode,
      name: player.name,
      email: player.email || null,
      is_host: Boolean(player.isHost),
      ticket: player.ticket || null,
      is_connected: Boolean(player.isConnected)
    };

    const { data, error } = await supabase
      .from('players')
      .upsert(payload, { onConflict: 'id' });

    if (error) console.error('Supabase syncPlayer error:', error.message);
    return data;
  } catch (err) {
    console.error('Supabase syncPlayer exception:', err.message);
    return null;
  }
}

/**
 * Record a winning claim in Supabase
 */
async function syncClaim(roomCode, claim) {
  if (!supabase) return null;
  try {
    const payload = {
      room_code: roomCode,
      claim_type: claim.type,
      winner_id: claim.winnerId,
      winner_name: claim.winnerName,
      won_at_number: claim.wonAtNumber,
      created_at: claim.timestamp || new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('claims')
      .insert(payload);

    if (error) console.error('Supabase syncClaim error:', error.message);
    return data;
  } catch (err) {
    console.error('Supabase syncClaim exception:', err.message);
    return null;
  }
}

/**
 * Delete a room from Supabase
 */
async function removeRoom(roomCode) {
  if (!supabase) return null;
  try {
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('code', roomCode);

    if (error) console.error('Supabase removeRoom error:', error.message);
  } catch (err) {
    console.error('Supabase removeRoom exception:', err.message);
  }
}

module.exports = {
  isSupabaseConfigured,
  syncRoom,
  syncPlayer,
  syncClaim,
  removeRoom
};

