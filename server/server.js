require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { generateTambolaTicket } = require('./ticketGenerator');
const { CLAIM_TYPES, CLAIM_METADATA, validateClaim, calculateLeaderboard } = require('./claims');
const {
  isSupabaseConfigured,
  syncRoom,
  syncPlayer,
  syncClaim,
  removeRoom
} = require('./supabase');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// In-memory room store (synced with Supabase if configured)
const rooms = new Map();

// Admin PIN check (accepts env ADMIN_PIN, '123', or '1234')
function isValidAdminPin(pin) {
  if (!pin) return false;
  const configured = (process.env.ADMIN_PIN || '123').trim();
  const input = pin.toString().trim();
  return input === configured || input === '123' || input === '1234';
}

// Helper to generate unique 4-digit numeric code
function generateRoomCode() {
  let code;
  let attempts = 0;
  do {
    code = Math.floor(1000 + Math.random() * 9000).toString();
    attempts++;
  } while (rooms.has(code) && attempts < 1000);
  return code;
}

// Generate shuffled array of 1..90
function generateShuffledPool() {
  const pool = [];
  for (let i = 1; i <= 90; i++) pool.push(i);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

// Sanitizes room state for public broadcast
function getPublicRoomState(room, forPlayerId = null) {
  if (!room) return null;

  const playersList = Array.from(room.players.values()).map(p => ({
    id: p.id,
    name: p.name,
    isHost: p.id === room.hostId,
    isConnected: p.isConnected,
    email: p.id === forPlayerId ? p.email : undefined,
    ticket: p.id === forPlayerId ? p.ticket : null
  }));

  return {
    code: room.code,
    hostId: room.hostId,
    status: room.status,
    requiresPassKey: Boolean(room.passKey),
    calledNumbers: room.calledNumbers,
    currentNumber: room.currentNumber,
    lastNumbers: room.calledNumbers.slice(-5).reverse(),
    claims: room.claims,
    claimMetadata: CLAIM_METADATA,
    completedTasksCount: Object.keys(room.claims || {}).length,
    totalTasksCount: 5,
    allTasksCompleted: Boolean(room.allTasksCompleted || Object.keys(room.claims || {}).length >= 5),
    leaderboard: room.leaderboard || (room.status === 'ended' ? calculateLeaderboard(room).leaderboard : null),
    podium: room.podium || (room.status === 'ended' ? calculateLeaderboard(room).podium : null),
    autoCallInterval: room.autoCallInterval,
    isAutoCalling: room.isAutoCalling,
    players: playersList,
    totalPlayers: playersList.length,
    remainingNumbersCount: room.numberPool.length,
    myTicket: forPlayerId && room.players.has(forPlayerId) ? room.players.get(forPlayerId).ticket : null
  };
}

// Stop any running auto-caller timer
function stopAutoCaller(room) {
  if (room.timer) {
    clearInterval(room.timer);
    room.timer = null;
  }
  room.isAutoCalling = false;
}

// Broadcast updated room state
function broadcastRoomUpdate(room) {
  for (const [playerId, player] of room.players.entries()) {
    if (player.socketId) {
      const personalState = getPublicRoomState(room, playerId);
      io.to(player.socketId).emit('room_state', personalState);
    }
  }
}

// Call next number
function callNextNumber(room) {
  if (room.status !== 'playing') return;
  if (room.numberPool.length === 0) {
    stopAutoCaller(room);
    room.status = 'ended';
    const { podium, leaderboard } = calculateLeaderboard(room);
    room.podium = podium;
    room.leaderboard = leaderboard;

    io.to(room.code).emit('game_ended', {
      reason: 'All 90 numbers have been called!',
      calledNumbers: room.calledNumbers,
      claims: room.claims,
      podium,
      leaderboard
    });
    broadcastRoomUpdate(room);
    syncRoom(room);
    return;
  }

  const nextNumber = room.numberPool.pop();
  room.calledNumbers.push(nextNumber);
  room.currentNumber = nextNumber;

  io.to(room.code).emit('number_called', {
    number: nextNumber,
    calledNumbers: room.calledNumbers,
    totalCalled: room.calledNumbers.length,
    remaining: room.numberPool.length
  });

  broadcastRoomUpdate(room);
  syncRoom(room);

  // If this was the last number (number 90), end the game
  if (room.numberPool.length === 0) {
    stopAutoCaller(room);
    room.status = 'ended';
    const { podium, leaderboard } = calculateLeaderboard(room);
    room.podium = podium;
    room.leaderboard = leaderboard;

    io.to(room.code).emit('game_ended', {
      reason: 'All 90 numbers have been called!',
      calledNumbers: room.calledNumbers,
      claims: room.claims,
      podium,
      leaderboard
    });
    broadcastRoomUpdate(room);
    syncRoom(room);
  }
}

// Start auto-caller
function startAutoCaller(room) {
  stopAutoCaller(room);
  room.isAutoCalling = true;
  room.timer = setInterval(() => {
    callNextNumber(room);
  }, room.autoCallInterval);
}

// REST Endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    activeRooms: rooms.size,
    supabaseConfigured: isSupabaseConfigured()
  });
});

app.get('/api/supabase/status', (req, res) => {
  res.json({
    configured: isSupabaseConfigured(),
    url: process.env.SUPABASE_URL ? 'Configured (hidden for security)' : 'Not set',
    hasKey: Boolean(process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)
  });
});

app.get('/api/room/:code', (req, res) => {
  const code = req.params.code;
  const room = rooms.get(code);
  if (!room) {
    return res.status(404).json({ error: 'Room not found. Check the code and try again.' });
  }
  return res.json({
    code: room.code,
    status: room.status,
    playerCount: room.players.size,
    requiresPassKey: Boolean(room.passKey),
    isLocked: room.status !== 'lobby'
  });
});

// Socket.IO Communication
io.on('connection', (socket) => {
  let currentRoomCode = null;
  let currentPlayerId = null;

  // 1. ADMIN PIN VERIFICATION
  socket.on('admin_verify_pin', ({ pin }, callback) => {
    if (isValidAdminPin(pin)) {
      return callback?.({ success: true });
    }
    return callback?.({ success: false, error: 'Incorrect Admin PIN. Please try again.' });
  });

  // 2. ADMIN CREATE ROOM (ADMIN ONLY)
  socket.on('admin_create_room', ({ adminPin, name, email, customCode, passKey, autoCallInterval = 5000 }, callback) => {
    try {
      if (!isValidAdminPin(adminPin)) {
        return callback?.({ error: 'Unauthorized: Valid Admin PIN required to create a game room.' });
      }

      const hostName = (name || 'Admin Host').trim();
      const hostEmail = (email || 'admin@housey.com').trim();

      // Room code: custom 4 digits or generated
      let roomCode = (customCode || '').toString().trim();
      if (!/^\d{4}$/.test(roomCode) || rooms.has(roomCode)) {
        roomCode = generateRoomCode();
      }

      const playerId = `usr_admin_${Math.random().toString(36).substring(2, 7)}`;
      const ticket = generateTambolaTicket();

      const newRoom = {
        code: roomCode,
        hostId: playerId,
        passKey: passKey ? passKey.toString().trim() : null,
        status: 'lobby',
        players: new Map(),
        numberPool: generateShuffledPool(),
        calledNumbers: [],
        currentNumber: null,
        claims: {},
        autoCallInterval: Math.max(2000, Math.min(20000, Number(autoCallInterval) || 5000)),
        isAutoCalling: false,
        timer: null,
        createdAt: new Date()
      };

      const hostPlayer = {
        id: playerId,
        name: hostName,
        email: hostEmail,
        socketId: socket.id,
        ticket: ticket,
        isHost: true,
        isConnected: true
      };

      newRoom.players.set(playerId, hostPlayer);
      rooms.set(roomCode, newRoom);

      currentRoomCode = roomCode;
      currentPlayerId = playerId;

      socket.join(roomCode);

      // Cloud database sync
      syncRoom(newRoom);
      syncPlayer(roomCode, hostPlayer);

      callback?.({
        success: true,
        roomCode,
        passKey: newRoom.passKey,
        playerId,
        ticket
      });

      broadcastRoomUpdate(newRoom);
    } catch (err) {
      console.error('Error creating admin room:', err);
      callback?.({ error: 'Failed to create room.' });
    }
  });

  // 3. LEGACY / REGULAR CREATE ROOM (NOW BLOCKED FOR REGULAR PLAYERS)
  socket.on('create_room', ({ adminPin, name, email }, callback) => {
    if (!isValidAdminPin(adminPin)) {
      return callback?.({
        error: 'Only the Administrator can create game rooms. Please use the 4-digit code provided by your host to join!'
      });
    }
    // If adminPin provided, redirect to admin creation
    socket.emit('admin_create_room', { adminPin, name, email }, callback);
  });

  // 4. ADMIN GET ALL ROOMS
  socket.on('admin_get_rooms', ({ adminPin }, callback) => {
    if (!isValidAdminPin(adminPin)) {
      return callback?.({ error: 'Unauthorized' });
    }

    const roomsList = Array.from(rooms.values()).map(r => ({
      code: r.code,
      hostName: r.players.get(r.hostId)?.name || 'Admin',
      status: r.status,
      passKey: r.passKey,
      playerCount: r.players.size,
      totalNumbersCalled: r.calledNumbers.length,
      claimsCount: Object.keys(r.claims).length,
      createdAt: r.createdAt
    }));

    callback?.({
      success: true,
      rooms: roomsList,
      supabaseConfigured: isSupabaseConfigured()
    });
  });

  // 5. ADMIN CLOSE ROOM
  socket.on('admin_close_room', ({ adminPin, roomCode }, callback) => {
    if (!isValidAdminPin(adminPin)) {
      return callback?.({ error: 'Unauthorized' });
    }

    const room = rooms.get(roomCode);
    if (!room) return callback?.({ error: 'Room not found' });

    stopAutoCaller(room);
    io.to(roomCode).emit('game_ended', {
      reason: 'This room was closed by the Administrator.',
      calledNumbers: room.calledNumbers,
      claims: room.claims
    });

    removeRoom(roomCode);
    rooms.delete(roomCode);

    callback?.({ success: true });
  });

  // 6. JOIN ROOM (VALIDATES PASS KEY IF PROTECTED)
  socket.on('join_room', ({ roomCode, name, email, passKey, playerId: existingId }, callback) => {
    try {
      const code = (roomCode || '').toString().trim();
      const room = rooms.get(code);

      if (!room) {
        return callback?.({ error: 'Room does not exist. Please check the 4-digit code.' });
      }

      if (!name || !name.trim()) {
        return callback?.({ error: 'Name is required to join.' });
      }

      // Check Room Pass Key
      if (room.passKey) {
        const providedKey = (passKey || '').toString().trim();
        if (providedKey !== room.passKey) {
          return callback?.({
            error: 'This room requires a valid Pass Key. Please enter the correct key.',
            requiresPassKey: true
          });
        }
      }

      // Check if player is reconnecting
      let player = null;
      let playerId = existingId;

      if (playerId && room.players.has(playerId)) {
        player = room.players.get(playerId);
        player.socketId = socket.id;
        player.isConnected = true;
        if (name) player.name = name.trim();
        if (email) player.email = email.trim();
      } else {
        // Prevent new players from entering middle of an active or ended game
        if (room.status === 'playing' || room.status === 'paused') {
          return callback?.({
            error: 'Game is already in progress! Late entry is not allowed. Please wait for the next round.'
          });
        }
        if (room.status === 'ended') {
          return callback?.({
            error: 'This game round has already ended. Please ask the host to start a new round or join another room.'
          });
        }

        playerId = `usr_${Math.random().toString(36).substring(2, 9)}`;
        const ticket = generateTambolaTicket();

        player = {
          id: playerId,
          name: name.trim(),
          email: email.trim(),
          socketId: socket.id,
          ticket: ticket,
          isConnected: true
        };

        room.players.set(playerId, player);
      }

      currentRoomCode = code;
      currentPlayerId = playerId;

      socket.join(code);

      // Cloud sync
      syncPlayer(code, player);

      callback?.({
        success: true,
        roomCode: code,
        playerId: player.id,
        isHost: player.id === room.hostId,
        ticket: player.ticket
      });

      io.to(code).emit('player_joined', {
        playerName: player.name,
        playerCount: room.players.size
      });

      broadcastRoomUpdate(room);
    } catch (err) {
      console.error('Error joining room:', err);
      callback?.({ error: 'An unexpected error occurred while joining.' });
    }
  });

  // 7. RECONNECT SESSION
  socket.on('reconnect_session', ({ roomCode, playerId }, callback) => {
    const room = rooms.get(roomCode);
    if (!room || !room.players.has(playerId)) {
      return callback?.({ error: 'Session expired or room not found.' });
    }

    const player = room.players.get(playerId);
    player.socketId = socket.id;
    player.isConnected = true;

    currentRoomCode = roomCode;
    currentPlayerId = playerId;

    socket.join(roomCode);

    callback?.({
      success: true,
      roomState: getPublicRoomState(room, playerId),
      ticket: player.ticket
    });

    broadcastRoomUpdate(room);
  });

  // 8. HOST CONTROLS: START GAME
  socket.on('start_game', ({ autoCall = true }, callback) => {
    const room = rooms.get(currentRoomCode);
    if (!room) return callback?.({ error: 'Room not found' });
    if (room.hostId !== currentPlayerId) return callback?.({ error: 'Only the host/admin can start the game.' });

    room.status = 'playing';

    io.to(room.code).emit('game_started', {
      startedBy: room.players.get(currentPlayerId)?.name,
      status: 'playing'
    });

    callNextNumber(room);
    if (autoCall) {
      startAutoCaller(room);
    }

    broadcastRoomUpdate(room);
    syncRoom(room);
    callback?.({ success: true });
  });

  // 9. HOST CONTROLS: PAUSE / RESUME
  socket.on('pause_game', (callback) => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.hostId !== currentPlayerId) return callback?.({ error: 'Unauthorized' });

    stopAutoCaller(room);
    room.status = 'paused';
    io.to(room.code).emit('game_paused');
    broadcastRoomUpdate(room);
    syncRoom(room);
    callback?.({ success: true });
  });

  socket.on('resume_game', (callback) => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.hostId !== currentPlayerId) return callback?.({ error: 'Unauthorized' });

    room.status = 'playing';
    startAutoCaller(room);
    io.to(room.code).emit('game_resumed');
    broadcastRoomUpdate(room);
    syncRoom(room);
    callback?.({ success: true });
  });

  // 10. HOST CONTROLS: NEXT NUMBER (MANUAL)
  socket.on('next_number', (callback) => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.hostId !== currentPlayerId) return callback?.({ error: 'Unauthorized' });

    if (room.status !== 'playing' && room.status !== 'paused') {
      return callback?.({ error: 'Game is not active' });
    }

    callNextNumber(room);
    callback?.({ success: true });
  });

  // 11. HOST CONTROLS: UPDATE SPEED
  socket.on('set_speed', ({ intervalMs }, callback) => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.hostId !== currentPlayerId) return callback?.({ error: 'Unauthorized' });

    const ms = Math.max(2000, Math.min(20000, Number(intervalMs) || 5000));
    room.autoCallInterval = ms;

    if (room.isAutoCalling) {
      startAutoCaller(room);
    }

    broadcastRoomUpdate(room);
    syncRoom(room);
    callback?.({ success: true, intervalMs: ms });
  });

  // 12. HOST CONTROLS: END GAME
  socket.on('end_game', (callback) => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.hostId !== currentPlayerId) return callback?.({ error: 'Unauthorized' });

    stopAutoCaller(room);
    room.status = 'ended';
    const { podium, leaderboard } = calculateLeaderboard(room);
    room.podium = podium;
    room.leaderboard = leaderboard;

    io.to(room.code).emit('game_ended', {
      reason: 'Game ended by Host/Admin',
      calledNumbers: room.calledNumbers,
      claims: room.claims,
      podium,
      leaderboard
    });

    broadcastRoomUpdate(room);
    syncRoom(room);
    callback?.({ success: true });
  });

  // 13. HOST CONTROLS: RESTART / PLAY AGAIN
  socket.on('restart_game', (callback) => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.hostId !== currentPlayerId) return callback?.({ error: 'Unauthorized' });

    stopAutoCaller(room);
    room.status = 'lobby';
    room.numberPool = generateShuffledPool();
    room.calledNumbers = [];
    room.currentNumber = null;
    room.claims = {};
    delete room.podium;
    delete room.leaderboard;
    delete room.allTasksCompleted;

    for (const player of room.players.values()) {
      player.ticket = generateTambolaTicket();
      syncPlayer(room.code, player);
    }

    io.to(room.code).emit('game_restarted', {
      message: 'Admin has reset the game for a new round!'
    });

    broadcastRoomUpdate(room);
    syncRoom(room);
    callback?.({ success: true });
  });

  // 14. CLAIM WINNING PRIZE (SECURE SERVER-SIDE VALIDATION)
  socket.on('claim_prize', ({ claimType }, callback) => {
    try {
      const room = rooms.get(currentRoomCode);
      if (!room) return callback?.({ error: 'Room not found' });
      if (room.status !== 'playing' && room.status !== 'paused') {
        return callback?.({ error: 'Claims can only be made while the game is live!' });
      }

      const player = room.players.get(currentPlayerId);
      if (!player) return callback?.({ error: 'Player record not found' });

      const result = validateClaim(claimType, player.ticket, room.calledNumbers, room.claims);

      if (!result.valid) {
        return callback?.({
          success: false,
          error: result.reason || 'Invalid claim. Please re-check your ticket numbers!'
        });
      }

      const claimMeta = CLAIM_METADATA[claimType];
      const claimRecord = {
        type: claimType,
        name: claimMeta.name,
        badge: claimMeta.badge,
        winnerId: player.id,
        winnerName: player.name,
        wonAtNumber: room.currentNumber,
        totalNumbersCalled: room.calledNumbers.length,
        timestamp: new Date().toISOString()
      };

      room.claims[claimType] = claimRecord;

      const isFullHouse = claimType === CLAIM_TYPES.FULL_HOUSE;

      io.to(room.code).emit('claim_awarded', {
        claim: claimRecord,
        winnerName: player.name,
        winnerId: player.id,
        isFullHouse
      });

      // Check if Full House is claimed OR all 5 prize tasks are completed
      const ALL_REQUIRED_CLAIMS = [
        CLAIM_TYPES.EARLY_FIVE,
        CLAIM_TYPES.TOP_LINE,
        CLAIM_TYPES.MIDDLE_LINE,
        CLAIM_TYPES.BOTTOM_LINE,
        CLAIM_TYPES.FULL_HOUSE
      ];
      const completedTasksCount = ALL_REQUIRED_CLAIMS.filter(type => Boolean(room.claims[type])).length;
      const allTasksCompleted = completedTasksCount === ALL_REQUIRED_CLAIMS.length;

      if (isFullHouse || allTasksCompleted) {
        stopAutoCaller(room);
        room.status = 'ended';
        room.allTasksCompleted = true;

        let podium = null;
        let leaderboard = [];
        try {
          const result = calculateLeaderboard(room);
          podium = result.podium;
          leaderboard = result.leaderboard;
        } catch (err) {
          console.error('Error calculating leaderboard:', err);
          podium = { first: null, second: null, third: null };
          leaderboard = [];
        }
        room.podium = podium;
        room.leaderboard = leaderboard;

        io.to(room.code).emit('game_ended', {
          reason: isFullHouse ? `Full House (Housie) claimed by ${player.name}! 👑` : 'All game tasks completed! Finalizing Grand Results... 🎉',
          calledNumbers: room.calledNumbers,
          claims: room.claims,
          podium,
          leaderboard,
          allTasksCompleted: true
        });
      }

      broadcastRoomUpdate(room);
      syncRoom(room);
      syncClaim(room.code, claimRecord);

      callback?.({
        success: true,
        message: `Congratulations! Your ${claimMeta.name} claim is verified and awarded! 🎉`,
        claim: claimRecord
      });
    } catch (err) {
      console.error('Error processing claim:', err);
      callback?.({
        success: false,
        error: 'An unexpected error occurred while processing your claim. Please try again.'
      });
    }
  });

  // 15. LEAVE ROOM
  socket.on('leave_room', (callback) => {
    if (currentRoomCode && currentPlayerId) {
      const room = rooms.get(currentRoomCode);
      if (room) {
        const player = room.players.get(currentPlayerId);
        room.players.delete(currentPlayerId);

        if (room.hostId === currentPlayerId) {
          const remainingPlayerIds = Array.from(room.players.keys());
          if (remainingPlayerIds.length > 0) {
            room.hostId = remainingPlayerIds[0];
            io.to(room.code).emit('host_changed', {
              newHostId: room.hostId,
              newHostName: room.players.get(room.hostId).name
            });
          } else {
            stopAutoCaller(room);
            removeRoom(currentRoomCode);
            rooms.delete(currentRoomCode);
          }
        }

        io.to(room.code).emit('player_left', {
          playerName: player?.name || 'A player',
          playerCount: room.players.size
        });

        broadcastRoomUpdate(room);
        syncRoom(room);
      }
    }
    socket.leave(currentRoomCode);
    currentRoomCode = null;
    currentPlayerId = null;
    callback?.({ success: true });
  });

  // 16. LIVE EMOJI REACTIONS (BROADCASTS TO ALL PLAYERS FOR 2-3 SECONDS)
  socket.on('send_reaction', ({ emoji }) => {
    if (!currentRoomCode || !currentPlayerId) return;
    const room = rooms.get(currentRoomCode);
    if (!room) return;
    const player = room.players.get(currentPlayerId);
    if (!player) return;

    const reactionPayload = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      emoji: (emoji || '🎉').slice(0, 4),
      senderName: player.name,
      senderId: player.id,
      timestamp: Date.now()
    };

    io.to(room.code).emit('room_reaction', reactionPayload);
  });

  // DISCONNECT
  socket.on('disconnect', () => {
    if (currentRoomCode && currentPlayerId) {
      const room = rooms.get(currentRoomCode);
      if (room && room.players.has(currentPlayerId)) {
        const player = room.players.get(currentPlayerId);
        player.isConnected = false;
        broadcastRoomUpdate(room);
        syncPlayer(currentRoomCode, player);
      }
    }
  });
});

// Production: Serve Vite build
const distPath = path.join(__dirname, '../client/dist');
app.use(express.static(distPath));

// Fallback SPA handler for client routing
app.use((req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head><title>HOUSEY - Server Ready</title></head>
          <body style="font-family: sans-serif; text-align: center; padding: 50px; background: #FAF8F5; color: #0F172A;">
            <h1>HOUSEY Tambola Server is Running</h1>
            <p>Please build the client application using <code>npm run build</code>.</p>
          </body>
        </html>
      `);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`HOUSEY Tambola Server listening on port ${PORT}`);
  console.log(`Supabase Database: ${isSupabaseConfigured() ? 'Connected' : 'In-Memory (Set SUPABASE_URL in .env to connect)'}`);
  console.log(`Admin Lock PIN active: ${process.env.ADMIN_PIN || '123'}`);
});
