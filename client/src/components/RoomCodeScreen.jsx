import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, LogIn, KeyRound, AlertCircle, Lock, ShieldCheck } from 'lucide-react';
import { sounds } from '../utils/sound';

export default function RoomCodeScreen({
  playerDetails,
  onBack,
  onJoinRoom,
  onOpenAdmin,
  errorMessage,
  requiresPassKey,
  isLoading
}) {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [passKey, setPassKey] = useState('');
  const [showPassKeyField, setShowPassKeyField] = useState(requiresPassKey || false);
  const [localError, setLocalError] = useState('');
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  // Focus first input box on mount
  useEffect(() => {
    inputRefs[0]?.current?.focus();
  }, []);

  // Update showPassKeyField if parent signals room requires it
  useEffect(() => {
    if (requiresPassKey) {
      setShowPassKeyField(true);
    }
  }, [requiresPassKey]);

  // Check URL params for room code e.g. ?room=1234
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromUrl = urlParams.get('room');
    if (roomFromUrl && /^\d{4}$/.test(roomFromUrl)) {
      setDigits(roomFromUrl.split(''));
    }
    const passFromUrl = urlParams.get('pass');
    if (passFromUrl) {
      setPassKey(passFromUrl);
      setShowPassKeyField(true);
    }
  }, []);

  const handleDigitChange = (index, value) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    if (!cleanValue) {
      const newDigits = [...digits];
      newDigits[index] = '';
      setDigits(newDigits);
      return;
    }

    const char = cleanValue.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    setLocalError('');
    sounds.playClick();

    if (index < 3) {
      inputRefs[index + 1]?.current?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
        inputRefs[index - 1]?.current?.focus();
      } else {
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs[index - 1]?.current?.focus();
    } else if (e.key === 'ArrowRight' && index < 3) {
      inputRefs[index + 1]?.current?.focus();
    } else if (e.key === 'Enter') {
      handleJoinSubmit();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    const numericOnly = pasteData.replace(/[^0-9]/g, '');

    if (numericOnly.length >= 4) {
      const codeDigits = numericOnly.slice(0, 4).split('');
      setDigits(codeDigits);
      setLocalError('');
      sounds.playClick();
      inputRefs[3]?.current?.focus();
    } else if (numericOnly.length > 0) {
      const newDigits = [...digits];
      for (let i = 0; i < numericOnly.length && i < 4; i++) {
        newDigits[i] = numericOnly[i];
      }
      setDigits(newDigits);
      inputRefs[Math.min(3, numericOnly.length)]?.current?.focus();
    }
  };

  const handleJoinSubmit = () => {
    const fullCode = digits.join('');
    if (fullCode.length !== 4) {
      sounds.playError();
      setLocalError('Please enter the full 4-digit room code.');
      const emptyIdx = digits.findIndex((d) => !d);
      if (emptyIdx !== -1) inputRefs[emptyIdx]?.current?.focus();
      return;
    }

    sounds.playClick();
    setLocalError('');
    onJoinRoom(fullCode, passKey.trim());
  };

  const displayError = errorMessage || localError;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-100 relative">
          {/* Top navigation back button */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => {
                sounds.playClick();
                onBack();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition py-1 px-2.5 rounded-lg hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Playing as</span>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
                {playerDetails.name}
              </span>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <div className="inline-flex p-3 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200/60 mb-3 shadow-xs">
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Join a Game
            </h2>
            <p className="text-slate-500 text-sm mt-1.5">
              Enter the 4-digit code provided by your game host
            </p>
          </div>

          {/* 4 Numeric Input Boxes */}
          <div className="mb-5">
            <div className="flex justify-center gap-3 sm:gap-4" onPaste={handlePaste}>
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={inputRefs[idx]}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  aria-label={`Digit ${idx + 1}`}
                  className={`w-14 h-16 sm:w-16 sm:h-20 text-center text-2xl sm:text-3xl font-extrabold rounded-2xl bg-slate-50 border transition shadow-inner focus:outline-none focus:scale-105 focus:bg-white ${
                    displayError
                      ? 'border-rose-400 text-rose-900 focus:ring-2 focus:ring-rose-200'
                      : digit
                      ? 'border-emerald-500 text-emerald-900 bg-emerald-50/30 focus:ring-2 focus:ring-emerald-200'
                      : 'border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'
                  }`}
                />
              ))}
            </div>

            {/* Optional / Required Pass Key field */}
            {showPassKeyField ? (
              <div className="mt-4 pt-3 border-t border-slate-100 animate-fadeIn">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    Room Pass Key
                  </span>
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Protected Room
                  </span>
                </label>
                <input
                  type="password"
                  placeholder="Enter Pass Key"
                  value={passKey}
                  onChange={(e) => setPassKey(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinSubmit()}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:bg-white text-sm"
                  autoFocus
                />
              </div>
            ) : (
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={() => setShowPassKeyField(true)}
                  className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 transition"
                >
                  Have a room pass key? Enter here
                </button>
              </div>
            )}

            {/* Error Message */}
            {displayError && (
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-rose-600 mt-3 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{displayError}</span>
              </div>
            )}
          </div>

          {/* Action: Join Room */}
          <button
            onClick={handleJoinSubmit}
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-base shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-70"
          >
            <LogIn className="w-5 h-5" />
            <span>{isLoading ? 'Joining Room...' : 'Join Room'}</span>
          </button>

          {/* Admin Managed Game Notice */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              Only Game Admins can create rooms. Contact your host to get a room code and key.
            </p>
            <button
              onClick={onOpenAdmin}
              className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-700 transition px-2.5 py-1 rounded-lg hover:bg-slate-100"
            >
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Admin Portal</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
