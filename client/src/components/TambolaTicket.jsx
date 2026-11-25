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
      <div className="bg-white rounded-2xl p-6 text-center text-slate-400 border border-slate-200">
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
    <div className="w-full bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-lg border border-slate-200/90 relative overflow-hidden transition">
      {/* Decorative Ticket Header Strip */}
      <div className="flex items-center justify-between pb-2.5 mb-2.5 sm:mb-3 border-b border-dashed border-slate-200">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
            <TicketIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
                {playerName ? `${playerName}'s Card` : 'Your Tambola Card'}
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                Official
              </span>
            </div>
          </div>
        </div>

        {/* Progress pill */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-xs font-black text-emerald-800">
              {markedNumbers} / {totalNumbers}
            </span>
            <span className="text-[9px] text-slate-400 block font-semibold leading-none">
              Struck
            </span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center font-black text-[11px] text-emerald-700">
            {progressPercent}%
          </div>
        </div>
      </div>

      {/* Ticket Grid: 3 rows x 9 columns (Full Width, zero horizontal clipping) */}
      <div className="w-full border border-slate-300 rounded-xl sm:rounded-2xl overflow-hidden bg-slate-200 shadow-inner">
        <div className="grid grid-rows-3 gap-[1px] bg-slate-300">
          {ticket.grid.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="grid grid-cols-9 gap-[1px] bg-slate-300"
            >
              {row.map((num, colIndex) => {
                const marked = isMarked(num);

                if (num === 0) {
                  return (
                    <div
                      key={colIndex}
                      className="h-10 sm:h-13 md:h-15 bg-[#FFFDF9] flex items-center justify-center select-none"
                    >
                      <span className="w-1 h-1 rounded-full bg-slate-200" />
                    </div>
                  );
                }

                return (
                  <button
                    key={colIndex}
                    type="button"
                    onClick={() => onToggleCellDaub && onToggleCellDaub(num)}
                    className={`relative h-10 sm:h-13 md:h-15 w-full flex items-center justify-center font-black text-sm sm:text-lg md:text-xl transition-all duration-100 select-none cursor-pointer active:scale-95 ${
                      marked
                        ? 'bg-emerald-600 text-white shadow-inner'
                        : 'bg-white hover:bg-emerald-50 text-slate-900'
                    }`}
                  >
                    <span className="z-10">{num}</span>

                    {/* Check badge when marked */}
                    {marked && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25">
                        <Check className="w-6 h-6 stroke-[3] text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Row completion tracker badges */}
      <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          {rowStatus.map((st, i) => (
            <span
              key={i}
              className={`px-2 py-0.5 rounded-lg text-[10px] sm:text-xs transition-all font-black ${
                st.isComplete
                  ? 'bg-emerald-500 text-white ring-1 ring-emerald-300'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              R{i + 1}: {st.marked}/{st.total} {st.isComplete && '✓'}
            </span>
          ))}
        </div>

        <span className="text-[10px] sm:text-xs text-slate-400 font-medium hidden sm:inline">
          Tap called numbers to mark
        </span>
      </div>
    </div>
  );
}
