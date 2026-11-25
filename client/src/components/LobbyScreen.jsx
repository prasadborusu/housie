import React, { useState } from 'react';
import {
  Users,
  Copy,
  Check,
  Share2,
  Crown,
  Play,
  Clock,
  HelpCircle,
  Sparkles,
  Wifi,
  ShieldCheck,
  KeyRound,
  Lock
} from 'lucide-react';
import TambolaTicket from './TambolaTicket';
import { sounds } from '../utils/sound';

export default function LobbyScreen({
  roomState,
  playerId,
  isHost,
  onStartGame,
  onChangeSpeed,
  ticket
}) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [selectedSpeed, setSelectedSpeed] = useState(roomState?.autoCallInterval || 5000);

  const roomCode = roomState?.code || '----';
  const players = roomState?.players || [];
  const currentPlayer = players.find((p) => p.id === playerId);
  const passKey = roomState?.passKey;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    sounds.playClick();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyPass = () => {
    if (!passKey) return;
    navigator.clipboard.writeText(passKey);
    setCopiedPass(true);
    sounds.playClick();
    setTimeout(() => setCopiedPass(false), 2000);
  };

  const handleShareLink = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?room=${roomCode}${passKey ? `&pass=${passKey}` : ''}`;
    if (navigator.share) {
      navigator.share({
        title: 'Join my Tambola game on HOUSEY!',
        text: `Play Tambola with me on HOUSEY! Room Code: ${roomCode}${passKey ? ` | Pass Key: ${passKey}` : ''}`,
        url: shareUrl
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      sounds.playClick();
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleSpeedChange = (speed) => {
    setSelectedSpeed(speed);
    sounds.playClick();
    if (onChangeSpeed) {
      onChangeSpeed(speed);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6 animate-fadeIn">
      {/* Top Banner: Room Code & Quick Invite Card */}
      <div className="bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden">
        {/* Background decorative circles */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-emerald-500/20 pointer-events-none blur-2xl" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-teal-400/20 pointer-events-none blur-xl" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold uppercase tracking-wider text-emerald-200 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Game Lobby
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Share the Room Code with Friends!
            </h1>
            <p className="text-emerald-100/80 text-sm mt-1 max-w-lg font-medium">
              Players are entering with their unique certified tickets. When ready, the host starts the game!
            </p>
          </div>

          {/* Big Room Code Box */}
          <div className="flex flex-col items-center bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/20 shadow-xl min-w-[270px]">
            <span className="text-[11px] uppercase font-black tracking-widest text-emerald-200 mb-1">
              4-Digit Room Code
            </span>
            <div className="font-mono text-4xl sm:text-5xl font-black tracking-widest text-amber-300 drop-shadow-md mb-2">
              {roomCode}
            </div>

            {/* Pass Key if set */}
            {passKey && (
              <div className="flex items-center gap-1.5 bg-black/25 px-3 py-1 rounded-full text-xs font-bold text-amber-200 mb-3 border border-amber-300/30">
                <Lock className="w-3.5 h-3.5" />
                <span>Pass Key: <strong className="text-white font-mono">{passKey}</strong></span>
                <button
                  onClick={handleCopyPass}
                  className="ml-1 text-slate-300 hover:text-white"
                  title="Copy Pass Key"
                >
                  {copiedPass ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 w-full">
              <button
                onClick={handleCopyCode}
                className="flex-1 py-2 px-3 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-xs font-black text-white transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
              </button>
              <button
                onClick={handleShareLink}
                className="flex-1 py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-500 active:scale-95 text-xs font-black text-slate-950 transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Link Copied!' : 'Share Link'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Ticket Preview (Left) & Lobby Status (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Player's Generated Tambola Ticket (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span>Your Tambola Card Preview</span>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Ready
              </span>
            </h2>
            <button
              onClick={() => setShowRules(!showRules)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showRules ? 'Hide Rules' : 'Prize Categories'}</span>
            </button>
          </div>

          {/* Ticket Component */}
          <TambolaTicket
            ticket={ticket || roomState?.myTicket}
            calledNumbers={[]}
            playerName={currentPlayer?.name}
          />

          {/* Rules Card */}
          {showRules && (
            <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 text-xs text-slate-700 space-y-2 animate-fadeIn shadow-xs">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600 fill-current" /> How to Win:
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px]">
                <li className="bg-white p-2.5 rounded-xl border border-amber-100 shadow-2xs">
                  <strong className="text-emerald-800">⚡ Early Five:</strong> Strike any 5 numbers anywhere on your ticket.
                </li>
                <li className="bg-white p-2.5 rounded-xl border border-amber-100 shadow-2xs">
                  <strong className="text-emerald-800">🥇 Top Line:</strong> Strike all 5 numbers in the top row.
                </li>
                <li className="bg-white p-2.5 rounded-xl border border-amber-100 shadow-2xs">
                  <strong className="text-emerald-800">🥈 Middle Line:</strong> Strike all 5 numbers in the middle row.
                </li>
                <li className="bg-white p-2.5 rounded-xl border border-amber-100 shadow-2xs">
                  <strong className="text-emerald-800">🥉 Bottom Line:</strong> Strike all 5 numbers in the bottom row.
                </li>
                <li className="bg-white p-2.5 rounded-xl border border-amber-100 shadow-2xs sm:col-span-2">
                  <strong className="text-emerald-800">👑 Full House:</strong> Strike all 15 numbers on your card!
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Right Column: Players Roster & Host Launch Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Players Roster Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-slate-100 text-slate-800">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">
                    Connected Players
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {players.length} player{players.length !== 1 ? 's' : ''} in lobby
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <Wifi className="w-3 h-3 text-emerald-500 animate-pulse" /> Live
              </span>
            </div>

            {/* Players List */}
            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {players.map((p, index) => {
                const isMe = p.id === playerId;
                const colors = [
                  'from-emerald-600 to-teal-700',
                  'from-blue-600 to-indigo-700',
                  'from-purple-600 to-pink-700',
                  'from-amber-500 to-orange-600'
                ];
                const bgGradient = colors[index % colors.length];

                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-3 rounded-2xl transition ${
                      isMe
                        ? 'bg-emerald-50/80 border border-emerald-300 shadow-2xs'
                        : 'bg-slate-50/80 border border-slate-100 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-2xl bg-gradient-to-br ${bgGradient} text-white font-black text-xs flex items-center justify-center shadow-xs`}>
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-slate-900 truncate max-w-[140px]">
                            {p.name}
                          </span>
                          {isMe && (
                            <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-md">
                              You
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                          <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" /> Private
                        </span>
                      </div>
                    </div>

                    {p.isHost && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300 shadow-2xs">
                        <Crown className="w-3 h-3 text-amber-600 fill-current" /> Host
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Host Controls OR Waiting Status */}
          {isHost ? (
            <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-md border-2 border-emerald-300 bg-gradient-to-b from-white to-emerald-50/40 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-900 font-black text-sm">
                  <Crown className="w-4 h-4 text-amber-500 fill-current" />
                  <span>Host Launch Controls</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  Admin
                </span>
              </div>

              {/* Call speed selector */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" /> Draw Speed
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: '3s Fast', ms: 3000 },
                    { label: '5s Normal', ms: 5000 },
                    { label: '8s Relaxed', ms: 8000 },
                    { label: '10s Casual', ms: 10000 }
                  ].map((spd) => (
                    <button
                      key={spd.ms}
                      type="button"
                      onClick={() => handleSpeedChange(spd.ms)}
                      className={`py-2 px-1 text-center text-xs font-black rounded-xl transition cursor-pointer ${
                        selectedSpeed === spd.ms
                          ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-300'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {spd.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Game Action */}
              <button
                onClick={() => {
                  sounds.playClick();
                  onStartGame({ autoCall: true });
                }}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] text-white font-black text-base shadow-xl shadow-emerald-600/35 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Start Tambola Draw</span>
              </button>
            </div>
          ) : (
            <div className="bg-amber-50/80 rounded-3xl p-6 text-center border border-amber-200 space-y-2 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto animate-pulse">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="font-black text-slate-900 text-sm">
                Waiting for Host to start...
              </h4>
              <p className="text-xs text-slate-600 max-w-xs mx-auto font-medium">
                Review your numbers on the ticket above. The game will automatically launch when the host starts!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
