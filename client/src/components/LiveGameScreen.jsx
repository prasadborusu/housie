import React, { useState, useEffect } from 'react';
import {
  Hash,
  Trophy,
  History,
  Grid,
  AlertTriangle,
  Info,
  Sparkles,
  Volume2
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
  const progressPercent = Math.round((totalCalled / 90) * 100);
  const calledSet = new Set(calledNumbers);
  const currentLingo = getNumberLingo(currentNumber);

  // Trigger animation & sound on new number
  useEffect(() => {
    if (currentNumber) {
      setAnimatingNumber(currentNumber);
      const timer = setTimeout(() => {
        setAnimatingNumber(null);
      }, 600);
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
      setTicketNotice(`Number ${num} has not been called yet! Keep an eye on the board.`);
      setTimeout(() => setTicketNotice(null), 3500);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6 space-y-6">
      {/* Top Banner: 3D Glossy Ball & Game Tracker */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-xl border border-slate-200/80 relative overflow-hidden">
        {/* Soft Ambient Radial Accents */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-100/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-100/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Current Called Number in 3D Spherical Bingo Ball */}
          <div className="flex items-center gap-5 sm:gap-7">
            <div className="relative">
              {/* 3D Ball */}
              <div
                key={currentNumber}
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full ball-3d text-white flex flex-col items-center justify-center border-4 border-white select-none ${
                  animatingNumber ? 'animate-number-pop ring-8 ring-emerald-400/40' : ''
                }`}
              >
                {/* Shiny white circular highlight */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/15 flex items-center justify-center backdrop-blur-xs">
                  <span className="font-black text-3xl sm:text-4xl tracking-tight text-white drop-shadow-md">
                    {currentNumber || '--'}
                  </span>
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full shadow-md border-2 border-white">
                Live
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Current Call
                </span>
                {currentNumber && (
                  <span className="text-xs text-amber-700 font-bold italic flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-current" />
                    "{currentLingo}"
                  </span>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                {currentNumber ? `Number ${currentNumber}` : 'Waiting for call...'}
              </h2>

              <div className="flex items-center gap-2 mt-1 text-xs">
                <span className="text-slate-600 font-bold">
                  {totalCalled} of 90 called
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-emerald-700 font-black">
                  {90 - totalCalled} remaining
                </span>
              </div>
            </div>
          </div>

          {/* History of last 5 calls & 1-90 Master Board Button */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto justify-end">
            {/* Last 5 Numbers badges */}
            <div className="bg-slate-50/90 backdrop-blur-sm p-3.5 rounded-2xl border border-slate-200 w-full sm:w-auto shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-emerald-600" />
                  Recent Draws
                </span>
              </div>
              <div className="flex items-center gap-2">
                {lastNumbers.length > 0 ? (
                  lastNumbers.slice(0, 5).map((num, i) => (
                    <span
                      key={i}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm transition-transform ${
                        i === 0
                          ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300 scale-105 font-black'
                          : 'bg-white text-slate-800 border border-slate-200 shadow-2xs hover:scale-105'
                      }`}
                    >
                      {num}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 py-1">No numbers yet</span>
                )}
              </div>
            </div>

            {/* 1-90 Master Board Button */}
            <button
              onClick={() => {
                sounds.playClick();
                setIsBoardOpen(true);
              }}
              className="w-full sm:w-auto py-3 px-4.5 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-slate-900/15 cursor-pointer transition"
            >
              <Grid className="w-4 h-4 text-emerald-400" />
              <span>1–90 Master Board</span>
            </button>
          </div>
        </div>

        {/* Game Progress Bar with Glow */}
        <div className="w-full bg-slate-100 h-2.5 rounded-full mt-6 overflow-hidden shadow-inner">
          <div
            className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 h-full transition-all duration-500 rounded-full shadow-xs"
            style={{ width: `${progressPercent}%` }}
          />
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

      {/* Uncalled Number Tap Notice Banner */}
      {ticketNotice && (
        <div className="bg-amber-50 border-2 border-amber-300 text-amber-900 rounded-2xl p-3.5 text-xs font-bold flex items-center gap-2.5 animate-fadeIn shadow-sm">
          <Info className="w-5 h-5 text-amber-600 shrink-0" />
          <span>{ticketNotice}</span>
        </div>
      )}

      {/* Bogus Claim Error Notice if claimant made an invalid claim */}
      {claimError && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 flex items-start justify-between gap-3 animate-fadeIn shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-rose-800">
                Claim Verification Notice (Bogus Claim)
              </h4>
              <p className="text-xs text-rose-700 mt-0.5 font-medium">{claimError}</p>
            </div>
          </div>
          <button
            onClick={onClearClaimError}
            className="text-xs font-bold text-rose-700 hover:text-rose-900 cursor-pointer p-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Game Layout: Ticket (Left 7) & Claims + Players (Right 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Tambola Ticket Section */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
              <span>Your Tambola Card</span>
            </h3>
            <span className="text-xs text-slate-500 font-semibold">
              Listen to the call and tap to strike
            </span>
          </div>

          <TambolaTicket
            ticket={ticket || roomState.myTicket}
            calledNumbers={calledNumbers}
            manualDaubs={manualDaubs}
            onToggleCellDaub={handleToggleCellDaub}
          />
        </div>

        {/* Winning Claims Section */}
        <div className="lg:col-span-5 space-y-4">
          <ClaimsSection
            claims={roomState.claims || {}}
            ticket={ticket || roomState.myTicket}
            manualDaubs={manualDaubs}
            onClaim={onClaimPrize}
            isClaiming={isClaiming}
            playerId={playerId}
          />
        </div>
      </div>

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
