import React from 'react';
import { X, CheckCircle2, Hash } from 'lucide-react';
import { sounds } from '../utils/sound';

export default function BoardModal({ isOpen, onClose, calledNumbers = [], currentNumber }) {
  if (!isOpen) return null;

  const calledSet = new Set(calledNumbers);
  const totalCalled = calledNumbers.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-3 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <Hash className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-lg">
                1–90 Master Board
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500">
                {totalCalled} of 90 numbers drawn
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden xs:inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-emerald-700 bg-emerald-50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              {90 - totalCalled} left
            </span>
            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 1-90 Numbers Grid */}
        <div className="p-2.5 sm:p-5 overflow-y-auto flex-1">
          <div className="grid grid-cols-10 gap-1 sm:gap-1.5">
            {Array.from({ length: 90 }, (_, i) => i + 1).map((num) => {
              const isCalled = calledSet.has(num);
              const isCurrent = num === currentNumber;

              return (
                <div
                  key={num}
                  className={`aspect-square rounded-md sm:rounded-xl flex items-center justify-center text-[10px] sm:text-xs md:text-sm font-black transition-all select-none ${
                    isCurrent
                      ? 'bg-amber-400 text-slate-950 ring-2 sm:ring-4 ring-amber-300 scale-105 shadow-md z-10'
                      : isCalled
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100/90 text-slate-400 border border-slate-200/50'
                  }`}
                >
                  {num}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-emerald-600 inline-block" />
              Called
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-amber-400 inline-block" />
              Latest
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-slate-200 inline-block" />
              Uncalled
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Close Board
          </button>
        </div>
      </div>
    </div>
  );
}

