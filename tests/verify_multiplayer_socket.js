const { io: ioClient } = require('../client/node_modules/socket.io-client');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const { generateTambolaTicket } = require('../server/ticketGenerator');
const { CLAIM_TYPES, CLAIM_METADATA, validateClaim } = require('../server/claims');

async function runIntegrationTest() {
  console.log('--- 3. Starting Multiplayer Socket Integration Test ---');

  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });

  const rooms = new Map();
  function generateRoomCode() {
    return '5821';
  }
  function generateShuffledPool() {
    const pool = [];
    for (let i = 1; i <= 90; i++) pool.push(i);
    return pool;
  }
  function getPublicRoomState(room, forPlayerId = null) {
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
      calledNumbers: room.calledNumbers,
      currentNumber: room.currentNumber,
      claims: room.claims,
      players: playersList,
      totalPlayers: playersList.length,
      myTicket: forPlayerId && room.players.has(forPlayerId) ? room.players.get(forPlayerId).ticket : null
    };
  }

  function broadcastRoomUpdate(room) {
    for (const [playerId, player] of room.players.entries()) {
      if (player.socketId) {
        io.to(player.socketId).emit('room_state', getPublicRoomState(room, playerId));
      }
    }
  }

  io.on('connection', (socket) => {
    let currentRoomCode = null;
    let currentPlayerId = null;

    socket.on('create_room', ({ name, email }, cb) => {
      const roomCode = generateRoomCode();
      const playerId = 'usr_alice';
      const ticket = generateTambolaTicket();
      const room = {
        code: roomCode,
        hostId: playerId,
        status: 'lobby',
        players: new Map(),
        numberPool: generateShuffledPool(),
        calledNumbers: [],
        currentNumber: null,
        claims: {}
      };
      room.players.set(playerId, { id: playerId, name, email, socketId: socket.id, ticket, isConnected: true });
      rooms.set(roomCode, room);
      currentRoomCode = roomCode;
      currentPlayerId = playerId;
      socket.join(roomCode);
      cb({ success: true, roomCode, playerId, ticket });
      broadcastRoomUpdate(room);
    });

    socket.on('join_room', ({ roomCode, name, email }, cb) => {
      const room = rooms.get(roomCode);
      if (!room) return cb({ error: 'Room not found' });
      const playerId = `usr_${name.toLowerCase()}`;
      const ticket = generateTambolaTicket();
      const player = { id: playerId, name, email, socketId: socket.id, ticket, isConnected: true };
      room.players.set(playerId, player);
      currentRoomCode = roomCode;
      currentPlayerId = playerId;
      socket.join(roomCode);
      cb({ success: true, roomCode, playerId, ticket });
      broadcastRoomUpdate(room);
    });

    socket.on('start_game', (opts, cb) => {
      const room = rooms.get(currentRoomCode);
      room.status = 'playing';
      const num = room.numberPool.pop();
      room.calledNumbers.push(num);
      room.currentNumber = num;
      io.to(room.code).emit('number_called', { number: num });
      broadcastRoomUpdate(room);
      cb?.({ success: true });
    });

    socket.on('claim_prize', ({ claimType }, cb) => {
      const room = rooms.get(currentRoomCode);
      const player = room.players.get(currentPlayerId);
      const res = validateClaim(claimType, player.ticket, room.calledNumbers, room.claims);
      if (!res.valid) {
        return cb({ success: false, error: res.reason });
      }
      room.claims[claimType] = { winnerName: player.name, winnerId: player.id };
      io.to(room.code).emit('claim_awarded', { claim: { name: claimType }, winnerName: player.name });
      broadcastRoomUpdate(room);
      cb({ success: true });
    });
  });

  await new Promise(resolve => server.listen(3998, resolve));
  console.log('Test server active on port 3998');

  // Client 1: Alice (Host)
  const socketAlice = ioClient('http://localhost:3998', { forceNew: true });

  await new Promise((resolve) => {
    socketAlice.on('connect', () => {
      console.log('✓ Alice connected');
      socketAlice.emit('create_room', { name: 'Alice Host', email: 'alice@host.com' }, (res) => {
        console.log('✓ Alice created room:', res.roomCode);
        resolve();
      });
    });
  });

  // Client 2: Bob (Player)
  const socketBob = ioClient('http://localhost:3998', { forceNew: true });
  await new Promise((resolve) => {
    socketBob.on('connect', () => {
      console.log('✓ Bob connected');
      socketBob.emit('join_room', { roomCode: '5821', name: 'Bob Player', email: 'bob@player.com' }, (res) => {
        console.log('✓ Bob joined room:', res.roomCode);
        resolve();
      });
    });
  });

  // Verify Bob does NOT receive Alice's email in room_state
  await new Promise((resolve) => {
    socketBob.on('room_state', (state) => {
      const aliceInList = state.players.find(p => p.name === 'Alice Host');
      if (aliceInList) {
        if (aliceInList.email !== undefined) {
          throw new Error('SECURITY VIOLATION: Alice email was exposed to Bob!');
        } else {
          console.log('✓ Privacy verified: Alice email is kept strictly private from Bob.');
          resolve();
        }
      }
    });
  });

  // Alice starts game
  await new Promise((resolve) => {
    socketBob.on('number_called', ({ number }) => {
      console.log('✓ Bob received synchronized number called:', number);
      resolve();
    });
    socketAlice.emit('start_game', {}, () => {
      console.log('✓ Alice started game');
    });
  });

  // Bob attempts a bogus claim (Full House on 1 called number)
  await new Promise((resolve) => {
    socketBob.emit('claim_prize', { claimType: CLAIM_TYPES.FULL_HOUSE }, (res) => {
      if (res.success === false && res.error.includes('Bogus claim')) {
        console.log('✓ Bogus claim correctly rejected by server:', res.error);
        resolve();
      } else {
        throw new Error('Server should have rejected bogus Full House claim!');
      }
    });
  });

  console.log('✓ All multiplayer socket events verified successfully!');
  socketAlice.close();
  socketBob.close();
  server.close();
}

runIntegrationTest().then(() => {
  console.log('Integration test completed successfully.');
  process.exit(0);
}).catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
