import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  PlusCircle,
  Database,
  Users,
  Clock,
  Trash2,
  ExternalLink,
  Check,
  Copy,
  AlertCircle,
  Sparkles,
  ArrowRight,
  LogOut
} from 'lucide-react';
import { socket } from '../utils/socket';
import { sounds } from '../utils/sound';

export default function AdminPage({
  onAdminCreateRoom,
  onJoinAsHost,
  onExitAdmin,
  playerDetails
}) {
  const [pinDigits, setPinDigits] = useState(['', '', '', '']);
  const [isUnlocked, setIsUnlocked] = useState(
    () => sessionStorage.getItem('housey_admin_auth') === 'true'
  );
  const [pinError, setPinError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Admin Dashboard State
  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'rooms' | 'supabase'
  const [hostName, setHostName] = useState(playerDetails?.name || 'Admin');
  const [customRoomCode, setCustomRoomCode] = useState(() =>
    Math.floor(1000 + Math.random() * 9000).toString()
  );
  const [passKey, setPassKey] = useState('');
  const [autoCallInterval, setAutoCallInterval] = useState(5000);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Active rooms list
  const [roomsList, setRoomsList] = useState([]);
  const [supabaseStatus, setSupabaseStatus] = useState({ configured: false });
  const [copiedCode, setCopiedCode] = useState(null);

  // Fetch active rooms & supabase status
  const fetchRooms = () => {
    socket.emit('admin_get_rooms', { adminPin: sessionStorage.getItem('housey_admin_pin') || '123' }, (res) => {
      if (res && res.success) {
        setRoomsList(res.rooms || []);
      }
    });

    fetch('/api/supabase/status')
      .then((r) => r.json())
      .then((data) => setSupabaseStatus(data))
      .catch(() => {});
  };

  useEffect(() => {
    if (isUnlocked) {
      fetchRooms();
      const interval = setInterval(fetchRooms, 4000);
      return () => clearInterval(interval);
    }
  }, [isUnlocked]);

  // Handle PIN input
  const handleDigitChange = (index, value) => {
    const clean = value.replace(/[^0-9]/g, '');
    const newDigits = [...pinDigits];
    newDigits[index] = clean ? clean.slice(-1) : '';
    setPinDigits(newDigits);
    setPinError('');

    // Auto-advance
    if (clean && index < 3) {
      document.getElementById(`admin-pin-${index + 1}`)?.focus();
    }

    // Auto-verify if 3 or 4 digits entered
    const currentCode = newDigits.join('');
    if (currentCode.length >= 3) {
      checkPin(currentCode);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      const newDigits = [...pinDigits];
      newDigits[index - 1] = '';
      setPinDigits(newDigits);
      document.getElementById(`admin-pin-${index - 1}`)?.focus();
    } else if (e.key === 'Enter') {
      checkPin(pinDigits.join(''));
    }
  };

  const checkPin = (code) => {
    const pin = code.trim();
    if (!pin) return;
    setIsVerifying(true);

    socket.emit('admin_verify_pin', { pin }, (res) => {
      setIsVerifying(false);
      if (res && res.success) {
        sounds.playClick();
        setIsUnlocked(true);
        sessionStorage.setItem('housey_admin_auth', 'true');
        sessionStorage.setItem('housey_admin_pin', pin);
        setPinError('');
      } else {
        sounds.playError();
        setPinError('Incorrect Admin PIN. Try 123 or check your .env');
      }
    });
  };

  const handleLockAdmin = () => {
    sounds.playClick();
    setIsUnlocked(false);
    sessionStorage.removeItem('housey_admin_auth');
    sessionStorage.removeItem('housey_admin_pin');
    setPinDigits(['', '', '', '']);
  };

  const handleCreateRoom = (e) => {
    e.preventDefault();
    sounds.playClick();
    setIsCreating(true);
    setCreateError('');

    const adminPin = sessionStorage.getItem('housey_admin_pin') || '123';

    socket.emit('admin_create_room', {
      adminPin,
      name: hostName.trim() || 'Admin',
      email: playerDetails?.email || 'admin@housey.com',
      customCode: customRoomCode,
      passKey: passKey.trim() || null,
      autoCallInterval
    }, (res) => {
      setIsCreating(false);
      if (res && res.success) {
        onAdminCreateRoom(res);
      } else {
        sounds.playError();
        setCreateError(res?.error || 'Failed to create room.');
      }
    });
  };

  const handleCloseRoom = (code) => {
    if (!window.confirm(`Are you sure you want to terminate Room ${code}? All connected players will be disconnected.`)) {
      return;
    }
    sounds.playClick();
    const adminPin = sessionStorage.getItem('housey_admin_pin') || '123';
    socket.emit('admin_close_room', { adminPin, roomCode: code }, () => {
      fetchRooms();
    });
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(key);
    sounds.playClick();
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // 1. PIN LOCK SCREEN
  if (!isUnlocked) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 text-center relative overflow-hidden">
          {/* Top lock ornament */}
          <div className="w-16 h-16 rounded-3xl bg-slate-900 text-amber-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-slate-900/20">
            <Lock className="w-8 h-8" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-xs font-bold uppercase tracking-wider text-amber-800 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin Security Portal
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Enter Admin PIN
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 mb-6">
            Enter the 4-digit master pass code to manage & create rooms
          </p>

          {/* 4 Digit Input */}
          <div className="flex justify-center gap-3 sm:gap-4 mb-4">
            {pinDigits.map((digit, idx) => (
              <input
                key={idx}
                id={`admin-pin-${idx}`}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                autoFocus={idx === 0}
                className="w-14 h-16 sm:w-16 sm:h-18 text-center text-3xl font-black rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition"
              />
            ))}
          </div>

          {/* Error Message */}
          {pinError && (
            <p className="text-xs font-semibold text-rose-600 mb-4 animate-fadeIn">
              {pinError}
            </p>
          )}

          {/* Unlock Button */}
          <button
            onClick={() => checkPin(pinDigits.join(''))}
            disabled={isVerifying}
            className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Unlock className="w-4 h-4 text-emerald-400" />
            <span>{isVerifying ? 'Verifying...' : 'Unlock Admin Portal'}</span>
          </button>

          {/* Back button */}
          <button
            onClick={onExitAdmin}
            className="mt-4 text-xs font-bold text-slate-400 hover:text-slate-600 transition"
          >
            ← Return to Game
          </button>
        </div>
      </div>
    );
  }

  // 2. UNLOCKED ADMIN DASHBOARD
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-md">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                HOUSEY Admin Center
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Master Host
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
              <span className="flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                Supabase: {supabaseStatus.configured ? (
                  <strong className="text-emerald-400 font-semibold">Connected</strong>
                ) : (
                  <strong className="text-amber-400 font-semibold">In-Memory Mode</strong>
                )}
              </span>
              <span>•</span>
              <span>PIN: Active</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLockAdmin}
            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white transition flex items-center gap-1.5 border border-slate-700"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock</span>
          </button>
          <button
            onClick={onExitAdmin}
            className="py-2 px-3 rounded-xl bg-rose-900/40 hover:bg-rose-900 text-xs font-bold text-rose-300 hover:text-white transition flex items-center gap-1.5 border border-rose-800"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit Admin</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('create')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'create'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create Game Room</span>
        </button>

        <button
          onClick={() => setActiveTab('rooms')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'rooms'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Active Rooms ({roomsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('supabase')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'supabase'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Supabase Cloud Sync</span>
        </button>
      </div>

      {/* TAB 1: CREATE ROOM */}
      {activeTab === 'create' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 max-w-xl">
          <div className="mb-6">
            <h2 className="text-xl font-extrabold text-slate-900">
              Create New Game Room
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Only Administrators can generate game rooms. Configure the room code and optional pass key.
            </p>
          </div>

          <form onSubmit={handleCreateRoom} className="space-y-4">
            {/* Host Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Admin Host Name
              </label>
              <input
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="Admin Host"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>

            {/* Room Code */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  4-Digit Room Code
                </label>
                <button
                  type="button"
                  onClick={() => setCustomRoomCode(Math.floor(1000 + Math.random() * 9000).toString())}
                  className="text-xs font-semibold text-emerald-700 hover:underline"
                >
                  Generate New
                </button>
              </div>
              <input
                type="text"
                pattern="[0-9]{4}"
                maxLength={4}
                value={customRoomCode}
                onChange={(e) => setCustomRoomCode(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full font-mono text-xl font-black px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:border-emerald-500 focus:outline-none tracking-widest"
                required
              />
            </div>

            {/* Pass Key */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Room Pass Key (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="e.g. 1234 or leave blank for open room"
                  value={passKey}
                  onChange={(e) => setPassKey(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                If set, players must enter this Pass Key along with the 4-digit code to join.
              </p>
            </div>

            {/* Speed */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Auto-Call Interval
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '3s Fast', ms: 3000 },
                  { label: '5s Normal', ms: 5000 },
                  { label: '8s Relaxed', ms: 8000 },
                  { label: '10s Casual', ms: 10000 }
                ].map((s) => (
                  <button
                    key={s.ms}
                    type="button"
                    onClick={() => setAutoCallInterval(s.ms)}
                    className={`py-2 px-1 text-center text-xs font-bold rounded-xl transition ${
                      autoCallInterval === s.ms
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {createError && (
              <p className="text-xs font-semibold text-rose-600">
                {createError}
              </p>
            )}

            <button
              type="submit"
              disabled={isCreating}
              className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition cursor-pointer mt-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isCreating ? 'Creating Room...' : 'Create & Launch Room'}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: ACTIVE ROOMS */}
      {activeTab === 'rooms' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Active Game Rooms ({roomsList.length})
              </h2>
              <p className="text-xs text-slate-500">
                Live rooms currently running on the server
              </p>
            </div>
            <button
              onClick={fetchRooms}
              className="text-xs font-bold text-emerald-700 hover:underline"
            >
              Refresh
            </button>
          </div>

          {roomsList.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              No active rooms. Click "Create Game Room" to start one!
            </div>
          ) : (
            <div className="space-y-3">
              {roomsList.map((room) => (
                <div
                  key={room.code}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black font-mono text-lg">
                      {room.code}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">
                          Room {room.code}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                          {room.status}
                        </span>
                        {room.passKey && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <KeyRound className="w-3 h-3" />
                            Pass: {room.passKey}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Host: {room.hostName} • {room.playerCount} player(s) • {room.totalNumbersCalled}/90 called
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleCopy(room.code, `code_${room.code}`)}
                      className="py-1.5 px-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1"
                    >
                      {copiedCode === `code_${room.code}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy Code</span>
                    </button>
                    {room.passKey && (
                      <button
                        onClick={() => handleCopy(room.passKey, `pass_${room.code}`)}
                        className="py-1.5 px-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1"
                      >
                        {copiedCode === `pass_${room.code}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copy Pass</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleCloseRoom(room.code)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                      title="Terminate Room"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SUPABASE CONFIG */}
      {activeTab === 'supabase' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-5">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-600" />
              <span>Supabase Cloud Database Setup</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Connect your Supabase project to persist game rooms, player tickets, and winning claims to the cloud.
            </p>
          </div>

          {/* Status Box */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${
            supabaseStatus.configured
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-amber-50 border-amber-300 text-amber-900'
          }`}>
            <div>
              <div className="font-extrabold text-sm">
                Status: {supabaseStatus.configured ? 'Active & Connected' : 'In-Memory Mode (No Credentials Configured)'}
              </div>
              <p className="text-xs opacity-80 mt-0.5">
                {supabaseStatus.configured
                  ? 'All room states, tickets, and claims are being synced to Supabase.'
                  : 'Multiplayer is fully functional in-memory. Add credentials to your .env file to enable cloud backup.'}
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-3 text-xs text-slate-600">
            <h3 className="font-bold text-slate-800 text-sm">
              How to Connect Supabase:
            </h3>
            <ol className="list-decimal pl-4 space-y-2">
              <li>
                Create a project at <strong className="text-slate-900">supabase.com</strong>.
              </li>
              <li>
                Open <strong className="text-slate-900">SQL Editor</strong> in your Supabase dashboard and run the SQL schema located in <code className="bg-slate-100 px-1.5 py-0.5 rounded text-emerald-700 font-mono">supabase_schema.sql</code>.
              </li>
              <li>
                Copy your <strong className="text-slate-900">Project URL</strong> and <strong className="text-slate-900">Anon / Service Key</strong> into <code className="bg-slate-100 px-1.5 py-0.5 rounded text-emerald-700 font-mono">.env</code>:
                <pre className="mt-2 p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] overflow-x-auto">
{`SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-supabase-service-role-or-anon-key`}
                </pre>
              </li>
              <li>Restart the server (<code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">npm start</code>). Supabase will automatically connect!</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

