import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { socket } from './utils/socket';
import { sounds } from './utils/sound';

import Navbar from './components/Navbar';
import HomeScreen from './components/HomeScreen';
import RoomCodeScreen from './components/RoomCodeScreen';
import LobbyScreen from './components/LobbyScreen';
import LiveGameScreen from './components/LiveGameScreen';
import ResultsScreen from './components/ResultsScreen';
import AdminPage from './components/AdminPage';
import LeaveModal from './components/LeaveModal';
import Toast from './components/Toast';
import EmojiReactions from './components/EmojiReactions';

export default function App() {
  // Navigation Screens: 'welcome' | 'room_code' | 'lobby' | 'live_game' | 'results' | 'admin'
  const [currentScreen, setCurrentScreen] = useState('welcome');

  // Player & Room State
  const [playerDetails, setPlayerDetails] = useState(() => ({
    name: localStorage.getItem('housey_name') || '',
    email: localStorage.getItem('housey_email') || ''
  }));
  const [playerId, setPlayerId] = useState(() => localStorage.getItem('housey_player_id') || null);
  const [roomCode, setRoomCode] = useState(() => localStorage.getItem('housey_room_code') || null);
  const [myTicket, setMyTicket] = useState(() => {
    try {
      const saved = localStorage.getItem('housey_ticket');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [roomState, setRoomState] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [requiresPassKey, setRequiresPassKey] = useState(false);
  const [claimError, setClaimError] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Toast Helper
  const addToast = useCallback((message, type = 'info', title = '') => {
    const id = Date.now() + Math.random().toString();
    setToasts((prev) => [...prev.slice(-4), { id, message, type, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Check URL params on mount (?admin=true, ?room=XXXX)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === 'true' || window.location.pathname === '/admin') {
      setCurrentScreen('admin');
      return;
    }
  }, []);

  // Reconnection on load if room and player were stored
  useEffect(() => {
    const savedRoom = localStorage.getItem('housey_room_code');
    const savedId = localStorage.getItem('housey_player_id');

    if (savedRoom && savedId) {
      socket.emit('reconnect_session', { roomCode: savedRoom, playerId: savedId }, (res) => {
        if (res && res.success) {
          setRoomCode(savedRoom);
          setPlayerId(savedId);
          if (res.ticket) {
            setMyTicket(res.ticket);
            localStorage.setItem('housey_ticket', JSON.stringify(res.ticket));
          }
          if (res.roomState) {
            setRoomState(res.roomState);
            if (res.roomState.status === 'playing' || res.roomState.status === 'paused') {
              setCurrentScreen('live_game');
            } else if (res.roomState.status === 'ended') {
              setCurrentScreen('results');
            } else {
              setCurrentScreen('lobby');
            }
          }
        } else {
          // Stale session, clean up
          localStorage.removeItem('housey_room_code');
          localStorage.removeItem('housey_ticket');
        }
      });
    }
  }, []);

  // Socket event listeners
  useEffect(() => {
    // 1. Room State Sync
    socket.on('room_state', (state) => {
      if (state) {
        setRoomState(state);
        if (state.myTicket) {
          setMyTicket(state.myTicket);
          localStorage.setItem('housey_ticket', JSON.stringify(state.myTicket));
        }

        // Auto screen navigation depending on room status
        if (state.status === 'playing' || state.status === 'paused') {
          setCurrentScreen((prev) => (prev !== 'live_game' ? 'live_game' : prev));
        } else if (state.status === 'ended') {
          setCurrentScreen('results');
        } else if (state.status === 'lobby') {
          setCurrentScreen((prev) => (prev === 'live_game' || prev === 'results' ? 'lobby' : prev));
        }
      }
    });

    // 2. Number Called
    socket.on('number_called', ({ number }) => {
      sounds.playNumberCall(number);
    });

    // 3. Claim Awarded (Celebration)
    socket.on('claim_awarded', ({ claim, winnerName, winnerId, isFullHouse }) => {
      sounds.playFanfare();

      try {
        confetti({
          particleCount: isFullHouse ? 180 : 90,
          spread: isFullHouse ? 100 : 70,
          origin: { y: 0.6 }
        });
      } catch {
        // Fallback
      }

      const isMe = winnerId === playerId;
      addToast(
        isMe
          ? `You won ${claim.name}! Awesome job!`
          : `${winnerName} claimed ${claim.name}!`,
        'claim',
        isMe ? '🎉 Congratulations!' : '🏆 Prize Claimed!'
      );
    });

    // 4. Game Started
    socket.on('game_started', () => {
      addToast('Game has started! Good luck!', 'success', 'Tambola Live');
      setCurrentScreen('live_game');
    });

    // 5. Game Ended
    socket.on('game_ended', ({ reason, podium, leaderboard, claims, calledNumbers }) => {
      addToast(reason || 'The Tambola game has ended!', 'info', 'Game Complete');
      setRoomState((prev) => ({
        ...(prev || {}),
        status: 'ended',
        podium: podium || prev?.podium,
        leaderboard: leaderboard || prev?.leaderboard,
        claims: claims || prev?.claims,
        calledNumbers: calledNumbers || prev?.calledNumbers
      }));
      setCurrentScreen('results');
    });

    // 6. Game Restarted
    socket.on('game_restarted', ({ message }) => {
      addToast(message || 'Host started a new round! Fresh tickets issued.', 'info', 'New Round');
      setCurrentScreen('lobby');
    });

    // 7. Player Joined / Left
    socket.on('player_joined', ({ playerName, playerCount }) => {
      addToast(`${playerName} joined the room (${playerCount} players)`, 'info');
    });

    socket.on('player_left', ({ playerName, playerCount }) => {
      addToast(`${playerName} left the room (${playerCount} players)`, 'info');
    });

    return () => {
      socket.off('room_state');
      socket.off('number_called');
      socket.off('claim_awarded');
      socket.off('game_started');
      socket.off('game_ended');
      socket.off('game_restarted');
      socket.off('player_joined');
      socket.off('player_left');
    };
  }, [playerId, addToast]);

  // Host detection
  const isHost = Boolean(roomState && playerId && roomState.hostId === playerId);

  // Navigation handlers
  const handleEnterDetails = ({ name, email }) => {
    setPlayerDetails({ name, email });
    setCurrentScreen('room_code');
  };

  const handleBackToWelcome = () => {
    setCurrentScreen('welcome');
    setJoinError('');
    setRequiresPassKey(false);
  };

  // Join Room with optional/required passKey
  const handleJoinRoom = (code, passKey) => {
    setIsLoading(true);
    setJoinError('');

    let resolved = false;
    const timeoutTimer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        setIsLoading(false);
        setJoinError('Server connection timed out. Please check your backend connection.');
      }
    }, 4000);

    socket.emit('join_room', {
      roomCode: code,
      name: playerDetails.name,
      email: playerDetails.email,
      passKey: passKey || null,
      playerId: playerId
    }, (res) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeoutTimer);
      setIsLoading(false);
      if (res && res.success) {
        setRoomCode(res.roomCode);
        setPlayerId(res.playerId);
        setMyTicket(res.ticket);

        localStorage.setItem('housey_room_code', res.roomCode);
        localStorage.setItem('housey_player_id', res.playerId);
        localStorage.setItem('housey_ticket', JSON.stringify(res.ticket));

        setCurrentScreen('lobby');
        addToast(`Joined Room ${res.roomCode}!`, 'success', 'Welcome');
      } else {
        if (res?.requiresPassKey) {
          setRequiresPassKey(true);
        }
        setJoinError(res?.error || 'Could not join room. Check the code.');
        sounds.playError();
      }
    });
  };

  // Admin Room Creation Handler
  const handleAdminCreateRoom = (res) => {
    setRoomCode(res.roomCode);
    setPlayerId(res.playerId);
    setMyTicket(res.ticket);

    localStorage.setItem('housey_room_code', res.roomCode);
    localStorage.setItem('housey_player_id', res.playerId);
    localStorage.setItem('housey_ticket', JSON.stringify(res.ticket));

    setCurrentScreen('lobby');
    addToast(
      `Room ${res.roomCode} created! ${res.passKey ? `(Pass Key: ${res.passKey})` : ''}`,
      'success',
      'Room Active'
    );
  };

  // Host Controls
  const handleStartGame = ({ autoCall }) => {
    socket.emit('start_game', { autoCall }, (res) => {
      if (res && !res.success) {
        addToast(res.error || 'Failed to start game', 'error');
      }
    });
  };

  const handlePauseGame = () => {
    socket.emit('pause_game');
  };

  const handleResumeGame = () => {
    socket.emit('resume_game');
  };

  const handleNextNumber = () => {
    socket.emit('next_number');
  };

  const handleEndGame = () => {
    socket.emit('end_game');
  };

  const handleSpeedChange = (intervalMs) => {
    socket.emit('set_speed', { intervalMs });
  };

  const handlePlayAgain = () => {
    socket.emit('restart_game', (res) => {
      if (res && res.success) {
        setCurrentScreen('lobby');
      }
    });
  };

  // Claim Prize
  const handleClaimPrize = (claimType) => {
    setIsClaiming(true);
    setClaimError('');

    socket.emit('claim_prize', { claimType }, (res) => {
      setIsClaiming(false);
      if (res && res.success) {
        addToast(res.message, 'success');
      } else {
        sounds.playError();
        setClaimError(res?.error || 'Invalid claim. Check your numbers.');
      }
    });
  };

  // Leave Room
  const handleConfirmLeave = () => {
    socket.emit('leave_room', () => {
      setIsLeaveModalOpen(false);
      setRoomCode(null);
      setRoomState(null);
      setMyTicket(null);
      localStorage.removeItem('housey_room_code');
      localStorage.removeItem('housey_ticket');
      setCurrentScreen('room_code');
      addToast('You left the game room.', 'info');
    });
  };

  const handleExitHome = () => {
    setIsLeaveModalOpen(false);
    setRoomCode(null);
    setRoomState(null);
    setMyTicket(null);
    localStorage.removeItem('housey_room_code');
    localStorage.removeItem('housey_ticket');
    setCurrentScreen('welcome');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-slate-900 selection:bg-emerald-200">
      {/* Top Navigation */}
      <Navbar
        roomCode={roomCode}
        isHost={isHost}
        playerCount={roomState?.totalPlayers}
        onLeaveRoom={() => setIsLeaveModalOpen(true)}
        playerName={playerDetails.name}
        onOpenAdmin={() => setCurrentScreen('admin')}
      />

      {/* Screen Views */}
      <main className="flex-1">
        {currentScreen === 'welcome' && (
          <HomeScreen
            initialName={playerDetails.name}
            initialEmail={playerDetails.email}
            onEnter={handleEnterDetails}
          />
        )}

        {currentScreen === 'room_code' && (
          <RoomCodeScreen
            playerDetails={playerDetails}
            onBack={handleBackToWelcome}
            onJoinRoom={handleJoinRoom}
            onOpenAdmin={() => setCurrentScreen('admin')}
            errorMessage={joinError}
            requiresPassKey={requiresPassKey}
            isLoading={isLoading}
          />
        )}

        {currentScreen === 'admin' && (
          <AdminPage
            playerDetails={playerDetails}
            onAdminCreateRoom={handleAdminCreateRoom}
            onExitAdmin={() => setCurrentScreen(playerDetails.name ? 'room_code' : 'welcome')}
          />
        )}

        {currentScreen === 'lobby' && (
          <LobbyScreen
            roomState={roomState}
            playerId={playerId}
            isHost={isHost}
            onStartGame={handleStartGame}
            onChangeSpeed={handleSpeedChange}
            ticket={myTicket}
          />
        )}

        {currentScreen === 'live_game' && (
          <LiveGameScreen
            roomState={roomState || {}}
            playerId={playerId}
            isHost={isHost}
            ticket={myTicket}
            onPause={handlePauseGame}
            onResume={handleResumeGame}
            onNextNumber={handleNextNumber}
            onEndGame={handleEndGame}
            onSpeedChange={handleSpeedChange}
            onClaimPrize={handleClaimPrize}
            isClaiming={isClaiming}
            claimError={claimError}
            onClearClaimError={() => setClaimError('')}
          />
        )}

        {currentScreen === 'results' && (
          <ResultsScreen
            roomState={roomState}
            playerId={playerId}
            isHost={isHost}
            onPlayAgain={handlePlayAgain}
            onExitHome={handleExitHome}
          />
        )}
      </main>

      {/* Leave Confirmation Dialog */}
      <LeaveModal
        isOpen={isLeaveModalOpen}
        onCancel={() => setIsLeaveModalOpen(false)}
        onConfirm={handleConfirmLeave}
        isHost={isHost}
      />

      {/* Toast Alert Stack */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Real-time Emoji Reactions Button & Floating Overlay */}
      {roomCode && playerId && (currentScreen === 'lobby' || currentScreen === 'live_game' || currentScreen === 'results') && (
        <EmojiReactions
          roomCode={roomCode}
          playerId={playerId}
          playerName={playerDetails.name}
        />
      )}
    </div>
  );
}
