import React, { useState, useRef } from 'react';
import { Volume2, VolumeX, LogOut, Copy, Check, Users, Shield } from 'lucide-react';
import { sounds } from '../utils/sound';

export default function Navbar({
  roomCode,
  isHost,
  playerCount,
  onLeaveRoom,
  playerName,
  onOpenAdmin
}) {
  const [isMuted, setIsMuted] = useState(sounds.isMuted);
  const [copied, setCopied] = useState(false);
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef(null);

  const handleToggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
    if (!muted) sounds.playClick();
  };

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    sounds.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  // Secret 3-click trigger on HOUSEY logo to open Admin Portal
  const handleLogoClick = () => {
    clickCountRef.current += 1;
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 1500);

    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      sounds.playClick();
      if (onOpenAdmin) onOpenAdmin();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-amber-900/10 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand with 3-click secret admin trigger */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleLogoClick}
            title="HOUSEY"
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-black text-xl shadow-md shadow-emerald-500/20 active:scale-95 transition cursor-pointer"
          >
            H
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                HOUSEY
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Tambola
              </span>
            </div>
            {playerName && (
              <p className="text-xs text-slate-500 truncate max-w-[120px] sm:max-w-[200px]">
                Playing as <span className="font-medium text-slate-700">{playerName}</span>
                {isHost && <span className="ml-1 text-emerald-600 font-bold">(Host)</span>}
              </p>
            )}
          </div>
        </div>

        {/* Center: Room Code pill if inside room */}
        {roomCode && (
          <div className="flex items-center gap-2 bg-amber-50/80 border border-amber-200/60 rounded-full px-3 py-1 text-xs">
            <span className="text-amber-800 font-medium">Room:</span>
            <button
              onClick={handleCopyCode}
              title="Click to copy room code"
              className="flex items-center gap-1 font-mono font-bold text-slate-900 hover:text-emerald-700 transition"
            >
              {roomCode}
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />}
            </button>
            {playerCount !== undefined && (
              <span className="flex items-center gap-1 text-slate-500 pl-1 border-l border-amber-200">
                <Users className="w-3 h-3 text-emerald-600" />
                {playerCount}
              </span>
            )}
          </div>
        )}

        {/* Right action controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Secret / Discreet Admin trigger */}
          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              title="Admin Portal"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <Shield className="w-4 h-4" />
            </button>
          )}

          {/* Sound Mute/Unmute */}
          <button
            onClick={handleToggleSound}
            title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
            className={`p-2 rounded-xl transition cursor-pointer ${
              !isMuted
                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
            }`}
          >
            {!isMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Leave room */}
          {roomCode && (
            <button
              onClick={onLeaveRoom}
              title="Leave Room"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Leave</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
