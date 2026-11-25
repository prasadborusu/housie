import React, { useState } from 'react';
import { Play, Pause, FastForward, Square, Clock, Crown, Settings2 } from 'lucide-react';
import { sounds } from '../utils/sound';

export default function HostControls({
  status,
  isAutoCalling,
  autoCallInterval,
  onPause,
  onResume,
  onNextNumber,
  onEndGame,
  onSpeedChange
}) {
  const [showSettings, setShowSettings] = useState(false);

  const isPaused = status === 'paused';

  return (
    <div className="bg-slate-900 text-white rounded-3xl p-4 sm:p-5 shadow-xl border border-slate-800">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Host Badge & Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md">
            <Crown className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-white">
                Host Game Controls
              </span>
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                  isPaused
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {isPaused ? 'Paused' : 'Drawing'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Control draw speed or manually call next number
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {/* Pause / Resume */}
          {isPaused ? (
            <button
              onClick={() => {
                sounds.playClick();
                onResume();
              }}
              className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Resume Auto-Call</span>
            </button>
          ) : (
            <button
              onClick={() => {
                sounds.playClick();
                onPause();
              }}
              className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition"
            >
              <Pause className="w-4 h-4 fill-current" />
              <span>Pause Auto-Call</span>
            </button>
          )}

          {/* Next Number (Manual) */}
          <button
            onClick={() => {
              sounds.playClick();
              onNextNumber();
            }}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 border border-slate-700 cursor-pointer transition"
          >
            <FastForward className="w-4 h-4" />
            <span>Next Number</span>
          </button>

          {/* Speed settings toggle */}
          <button
            onClick={() => {
              sounds.playClick();
              setShowSettings(!showSettings);
            }}
            className={`p-2.5 rounded-xl border transition cursor-pointer ${
              showSettings
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Speed settings"
          >
            <Clock className="w-4 h-4" />
          </button>

          {/* End Game */}
          <button
            onClick={() => {
              sounds.playClick();
              if (window.confirm('Are you sure you want to end this game for everyone?')) {
                onEndGame();
              }
            }}
            className="py-2.5 px-3 rounded-xl bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white font-bold text-xs flex items-center gap-1.5 border border-rose-500/30 transition cursor-pointer"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>End Game</span>
          </button>
        </div>
      </div>

      {/* Speed Selector panel */}
      {showSettings && (
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs animate-fadeIn">
          <span className="text-slate-400 font-semibold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Auto-draw interval:
          </span>
          <div className="flex items-center gap-1.5">
            {[
              { label: '3s', ms: 3000 },
              { label: '5s', ms: 5000 },
              { label: '8s', ms: 8000 },
              { label: '10s', ms: 10000 }
            ].map((s) => (
              <button
                key={s.ms}
                onClick={() => {
                  sounds.playClick();
                  onSpeedChange(s.ms);
                }}
                className={`py-1 px-3 rounded-lg font-bold text-xs transition cursor-pointer ${
                  autoCallInterval === s.ms
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

