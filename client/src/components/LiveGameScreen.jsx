import React, { useState, useEffect } from 'react';
import {
  Grid,
  AlertTriangle,
  Info,
  Sparkles
} from 'lucide-react';
import TambolaTicket from './TambolaTicket';
import ClaimsSection from './ClaimsSection';
import HostControls from './HostControls';
import BoardModal from './BoardModal';
import { sounds } from '../utils/sound';
import { getNumberLingo } from '../utils/lingo';

export default function LiveGameScreen({
  roomState,
  playerId,
  isHost,
  ticket,
  onPause,
  onResume,
  onNextNumber,
  onEndGame,
  onSpeedChange,
  onClaimPrize,
  isClaiming,
  claimError,
  onClearClaimError
}) {
  const [isBoardOpen, setIsBoardOpen] = useState(false);
  const [manualDaubs, setManualDaubs] = useState(new Set());
  const [animatingNumber, setAnimatingNumber] = useState(null);
  const [ticketNotice, setTicketNotice] = useState(null);

  const calledNumbers = roomState?.calledNumbers || [];
  const currentNumber = roomState?.currentNumber;
  const lastNumbers = roomState?.lastNumbers || [];
  const totalCalled = calledNumbers.length;
  const calledSet = new Set(calledNumbers);
  const currentLingo = getNumberLingo(currentNumber);

  // Trigger animation & sound on new number
  useEffect(() => {
    if (currentNumber) {
      setAnimatingNumber(currentNumber);
      const timer = setTimeout(() => {
        setAnimatingNumber(null);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentNumber]);

  // Handle cell daub click (pure manual marking)
  const handleToggleCellDaub = (num) => {
    if (calledSet.has(num)) {
      sounds.playClick();
      setTicketNotice(null);
      setManualDaubs((prev) => {
        const next = new Set(prev);
        if (next.has(num)) {
          next.delete(num);
        } else {
          next.add(num);
        }
        return next;
      });
    } else {
      sounds.playError();
      setTicketNotice(`Number ${num} has not been called yet!`);
      setTimeout(() => setTicketNotice(null), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-2.5 sm:px-4 py-2.5 sm:py-5 space-y-3 sm:space-y-4">
      {/* Compact Minimal HUD: Called Number + Recent + Board button */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-md border border-slate-200">
        <div className="flex items-center justify-between gap-3">
          {/* Left: 3D Called Number Ball & Title */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <div
              key={currentNumber}
              className={`w-13 h-13 sm:w-16 sm:h-16 rounded-2xl ball-3d text-white flex flex-col items-center justify-center border-2 border-white shrink-0 select-none ${
                animatingNumber ? 'animate-number-pop ring-4 ring-emerald-300' : ''
              }`}
            >
              <span className="font-black text-2xl sm:text-3xl tracking-tight text-white drop-shadow-sm">
                {currentNumber || '--'}
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-50 px-2 py-0.2 rounded-md">
                  Call #{totalCalled}
                </span>
                {currentNumber && (
                  <span className="text-[11px] text-amber-700 font-bold truncate max-w-[130px] sm:max-w-[200px]">
                    "{currentLingo}"
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                {currentNumber ? `Number ${currentNumber}` : 'Waiting for call...'}
              </h2>
            </div>
          </div>

          {/* Right: Last 3 Calls + 1-90 Board Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Last 3 mini pills */}
            <div className="hidden xs:flex items-center gap-1">
              {lastNumbers.slice(1, 4).map((num, i) => (
                <span
                  key={i}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-black text-slate-700"
                >
                  {num}
                </span>
              ))}
            </div>

            {/* 1-90 Board Pill */}
            <button
              onClick={() => {
                sounds.playClick();
                setIsBoardOpen(true);
              }}
              className="py-2 px-2.5 sm:px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] sm:text-xs flex items-center gap-1 cursor-pointer transition active:scale-95 shadow-sm"
            >
              <Grid className="w-3.5 h-3.5 text-emerald-400" />
              <span>Board</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Tasks Progress Bar (Auto-ends when all 5 tasks complete) */}
      <div className="bg-white rounded-xl sm:rounded-2xl px-3 py-2 border border-slate-200/90 shadow-xs flex items-center justify-between gap-2 select-none">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] sm:text-xs font-black text-slate-800">
            Tasks:
          </span>
          <span className="text-[10px] sm:text-xs font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
            {Object.keys(roomState?.claims || {}).length} / 5 Claimed
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-bold">
          <span className={roomState?.claims?.early_five ? 'text-emerald-700 font-black' : 'text-slate-400'}>
            E5 {roomState?.claims?.early_five ? '✓' : '○'}
          </span>
          <span className="text-slate-300">•</span>
          <span className={roomState?.claims?.top_line ? 'text-emerald-700 font-black' : 'text-slate-400'}>
            Top {roomState?.claims?.top_line ? '✓' : '○'}
          </span>
          <span className="text-slate-300">•</span>
          <span className={roomState?.claims?.middle_line ? 'text-emerald-700 font-black' : 'text-slate-400'}>
            Mid {roomState?.claims?.middle_line ? '✓' : '○'}
          </span>
          <span className="text-slate-300">•</span>
          <span className={roomState?.claims?.bottom_line ? 'text-emerald-700 font-black' : 'text-slate-400'}>
            Bot {roomState?.claims?.bottom_line ? '✓' : '○'}
          </span>
          <span className="text-slate-300">•</span>
          <span className={roomState?.claims?.full_house ? 'text-amber-600 font-black' : 'text-slate-400'}>
            👑 {roomState?.claims?.full_house ? '✓' : '○'}
          </span>
        </div>
      </div>

      {/* Host Controls Panel (Shown only to Host) */}
      {isHost && (
        <HostControls
          status={roomState.status}
          isAutoCalling={roomState.isAutoCalling}
          autoCallInterval={roomState.autoCallInterval}
          onPause={onPause}
          onResume={onResume}
          onNextNumber={onNextNumber}
          onEndGame={onEndGame}
          onSpeedChange={onSpeedChange}
        />
      )}

      {/* Uncalled Number Tap Warning Banner */}
      {ticketNotice && (
        <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-xl p-2.5 text-xs font-bold flex items-center gap-2 animate-fadeIn shadow-xs">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{ticketNotice}</span>
        </div>
      )}

      {/* Bogus Claim Error Notice if claimant made an invalid claim */}
      {claimError && (
        <div className="bg-rose-50 border border-rose-300 rounded-xl p-3 flex items-start justify-between gap-2 animate-fadeIn shadow-xs">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-800 font-semibold">{claimError}</p>
          </div>
          <button
            onClick={onClearClaimError}
            className="text-xs font-bold text-rose-700 hover:text-rose-900 cursor-pointer p-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Centerpiece: The Tambola Ticket (Zero clipping, full viewport comfort) */}
      <TambolaTicket
        ticket={ticket || roomState.myTicket}
        calledNumbers={calledNumbers}
        manualDaubs={manualDaubs}
        onToggleCellDaub={handleToggleCellDaub}
      />

      {/* Compact Claims Grid */}
      <ClaimsSection
        claims={roomState.claims || {}}
        ticket={ticket || roomState.myTicket}
        manualDaubs={manualDaubs}
        onClaim={onClaimPrize}
        isClaiming={isClaiming}
        playerId={playerId}
      />

      {/* Master 1-90 Board Modal */}
      <BoardModal
        isOpen={isBoardOpen}
        onClose={() => setIsBoardOpen(false)}
        calledNumbers={calledNumbers}
        currentNumber={currentNumber}
      />
    </div>
  );
}
