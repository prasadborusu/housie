import React from 'react';
import { Check, Ticket as TicketIcon, Sparkles } from 'lucide-react';

export default function TambolaTicket({
  ticket,
  calledNumbers = [],
  manualDaubs = new Set(),
  onToggleCellDaub,
  playerName
}) {
  if (!ticket || !ticket.grid) {
    return (
      <div className="glass-panel rounded-3xl p-8 text-center text-slate-400 border border-slate-200">
        Generating your ticket...
      </div>
    );
  }

  // A cell is marked purely if the player manually tapped/daubed it
  const isMarked = (number) => {
    if (!number) return false;
    return manualDaubs.has(number);
  };

  const totalNumbers = ticket.numbers ? ticket.numbers.length : 15;
  const markedNumbers = ticket.numbers ? ticket.numbers.filter((n) => manualDaubs.has(n)).length : 0;
  const progressPercent = Math.round((markedNumbers / totalNumbers) * 100);

  // Check row completions for row badges
  const rowStatus = ticket.grid.map((row) => {
    const numbersInRow = row.filter((n) => n > 0);
    const markedInRow = numbersInRow.filter((n) => manualDaubs.has(n)).length;
    return {
      total: numbersInRow.length,
      marked: markedInRow,
      isComplete: markedInRow === numbersInRow.length && numbersInRow.length > 0
    };
  });

  return (
    <div className="relative bg-white rounded-3xl p-4 sm:p-6 shadow-xl border-2 border-emerald-900/10 overflow-hidden transition-all duration-300 hover:shadow-2xl">
      {/* Background Subtle Watermark Stamp */}
      <div className="absolute -right-10 -bottom-10 pointer-events-none select-none opacity-[0.03] text-slate-900 font-black text-9xl">
        HOUSEY
      </div>

      {/* Decorative Ticket Header Strip */}
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-dashed border-slate-200/90">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-sm">
            <TicketIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-slate-900 tracking-wider uppercase">
                {playerName ? `${playerName}'s Official Ticket` : 'Official Tambola Ticket'}
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                CERTIFIED
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
              <span>SER: {ticket.id || 'HOU-8821'}</span>
              <span>•</span>
              <span>15 Numbers</span>
            </div>
          </div>
        </div>

        {/* Marked Progress pill */}
        <div className="flex items-center gap-2.5">
          <div className="text-right">
            <span className="text-xs font-black text-emerald-800">
              {markedNumbers} / {totalNumbers}
            </span>
            <span className="text-[10px] text-slate-400 block font-semibold">
              Struck
            </span>
          </div>
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-300 flex items-center justify-center font-black text-xs text-emerald-700 shadow-inner">
            {progressPercent}%
          </div>
        </div>
      </div>

      {/* Ticket Grid (3 rows x 9 columns) */}
      <div className="overflow-x-auto pb-1">
        <div className="min-w-[340px] sm:min-w-0 border-2 border-slate-700/20 rounded-2xl overflow-hidden shadow-sm bg-slate-200/80">
          <div className="grid grid-rows-3 gap-[2px] bg-slate-300/80">
            {ticket.grid.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className="grid grid-cols-9 gap-[2px] bg-slate-300/80"
              >
                {row.map((num, colIndex) => {
                  const marked = isMarked(num);

                  if (num === 0) {
                    // Blank ticket space with authentic paper pattern
                    return (
                      <div
                        key={colIndex}
                        className="h-12 sm:h-16 bg-[#FFFDF9] flex items-center justify-center select-none"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-200/60" />
                      </div>
                    );
                  }

                  return (
                    <button
                      key={colIndex}
                      type="button"
                      onClick={() => onToggleCellDaub && onToggleCellDaub(num)}
                      className={`relative h-12 sm:h-16 flex items-center justify-center font-black text-lg sm:text-2xl transition-all duration-150 select-none cursor-pointer active:scale-90 ${
                        marked
                          ? 'bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 text-white shadow-inner'
                          : 'bg-white hover:bg-emerald-50/80 text-slate-900 hover:shadow-xs'
                      }`}
                    >
                      {/* Number Text */}
                      <span className={`z-10 transition-transform ${marked ? 'scale-105 drop-shadow-sm' : ''}`}>
                        {num}
                      </span>

                      {/* Realistic Ink Stamp Badge if marked */}
                      {marked && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-stamp">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white/60 flex items-center justify-center opacity-30 transform -rotate-12">
                            <Check className="w-6 h-6 sm:w-8 sm:h-8 stroke-[3.5] text-white" />
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row completion tracker badges & instruction */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {rowStatus.map((st, i) => (
            <span
              key={i}
              className={`px-2.5 py-1 rounded-xl text-xs transition-all flex items-center gap-1 ${
                st.isComplete
                  ? 'bg-emerald-500 text-white font-black shadow-xs ring-2 ring-emerald-300'
                  : 'bg-slate-100 text-slate-700 font-bold'
              }`}
            >
              <span>Row {i + 1}:</span>
              <span className="font-mono">{st.marked}/{st.total}</span>
              {st.isComplete && <Sparkles className="w-3 h-3 text-amber-200 fill-current" />}
            </span>
          ))}
        </div>

        <div className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60 flex items-center gap-1">
          <span>👆 Tap called numbers to strike</span>
        </div>
      </div>
    </div>
  );
}
