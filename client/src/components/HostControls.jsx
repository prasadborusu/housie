import React, { useState } from 'react';
import { Play, Pause, FastForward, Square, Clock, Crown } from 'lucide-react';
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
    <div className="bg-slate-900 text-white rounded-2xl p-2.5 sm:p-3.5 shadow-md border border-slate-800">
      <div className="flex items-center justify-between gap-2">
        {/* Host Mini Badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
            <Crown className="w-3.5 h-3.5 fill-current" />
          </div>
          <span className="text-[11px] font-black uppercase text-amber-300 hidden xs:inline">
            Host
          </span>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-1.5 flex-1 justify-end">
          {/* Pause / Resume */}
          {isPaused ? (
            <button
              onClick={() => {
                sounds.playClick();
                onResume();
              }}
              className="py-1.5 px-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-black text-[11px] flex items-center gap-1 cursor-pointer transition"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Resume</span>
            </button>
          ) : (
            <button
              onClick={() => {
                sounds.playClick();
                onPause();
              }}
              className="py-1.5 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-[11px] flex items-center gap-1 cursor-pointer transition"
            >
              <Pause className="w-3 h-3 fill-current" />
              <span>Pause</span>
            </button>
          )}

          {/* Next Number */}
          <button
            onClick={() => {
              sounds.playClick();
              onNextNumber();
            }}
            className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-[11px] flex items-center gap-1 border border-slate-700 cursor-pointer transition"
          >
            <FastForward className="w-3 h-3 text-emerald-400" />
            <span>Next</span>
          </button>

          {/* Speed Toggle */}
          <button
            onClick={() => {
              sounds.playClick();
              setShowSettings(!showSettings);
            }}
            className={`py-1.5 px-2 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer transition ${
              showSettings
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>{Math.round(autoCallInterval / 1000)}s</span>
          </button>

          {/* End Game */}
          <button
            onClick={() => {
              sounds.playClick();
              if (window.confirm('End this game round for all players?')) {
                onEndGame();
              }
            }}
            className="p-1.5 rounded-lg bg-rose-900/40 hover:bg-rose-900 text-rose-300 border border-rose-800 transition cursor-pointer"
            title="End Game"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>
        </div>
      </div>

      {/* Speed Dropdown Strip */}
      {showSettings && (
        <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-xs animate-fadeIn">
          <span className="text-[11px] text-slate-400 font-bold">
            Interval:
          </span>
          <div className="flex items-center gap-1">
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
                  setShowSettings(false);
                }}
                className={`py-1 px-2.5 rounded-md font-black text-[11px] transition cursor-pointer ${
                  autoCallInterval === s.ms
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-slate-800 text-slate-300'
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
