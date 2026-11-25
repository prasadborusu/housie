import React from 'react';
import { Award, Zap, Trophy, Crown, CheckCircle2, Sparkles } from 'lucide-react';
import { sounds } from '../utils/sound';

export default function ClaimsSection({
  claims = {},
  ticket,
  manualDaubs = new Set(),
  onClaim,
  isClaiming,
  playerId
}) {
  // Helper to check user eligibility based on player's marked numbers
  const checkClaimProgress = (type) => {
    if (!ticket || !ticket.grid) return { ready: false, progress: '0/5', count: 0, total: 5 };

    if (type === 'early_five') {
      const markedCount = ticket.numbers.filter((n) => manualDaubs.has(n)).length;
      return {
        ready: markedCount >= 5,
        progress: `${Math.min(5, markedCount)}/5`,
        count: Math.min(5, markedCount),
        total: 5
      };
    }
    if (type === 'top_line') {
      const rowNums = ticket.grid[0].filter((n) => n > 0);
      const markedCount = rowNums.filter((n) => manualDaubs.has(n)).length;
      return {
        ready: markedCount === 5,
        progress: `${markedCount}/5`,
        count: markedCount,
        total: 5
      };
    }
    if (type === 'middle_line') {
      const rowNums = ticket.grid[1].filter((n) => n > 0);
      const markedCount = rowNums.filter((n) => manualDaubs.has(n)).length;
      return {
        ready: markedCount === 5,
        progress: `${markedCount}/5`,
        count: markedCount,
        total: 5
      };
    }
    if (type === 'bottom_line') {
      const rowNums = ticket.grid[2].filter((n) => n > 0);
      const markedCount = rowNums.filter((n) => manualDaubs.has(n)).length;
      return {
        ready: markedCount === 5,
        progress: `${markedCount}/5`,
        count: markedCount,
        total: 5
      };
    }
    if (type === 'full_house') {
      const markedCount = ticket.numbers.filter((n) => manualDaubs.has(n)).length;
      return {
        ready: markedCount === 15,
        progress: `${markedCount}/15`,
        count: markedCount,
        total: 15
      };
    }
    return { ready: false, progress: '0/5', count: 0, total: 5 };
  };

  const claimCategories = [
    { id: 'early_five', name: 'Early 5', fullName: 'Early Five', desc: 'Any 5 numbers', icon: Zap },
    { id: 'top_line', name: 'Top Line', fullName: 'Top Line', desc: 'Row 1 complete', icon: Award },
    { id: 'middle_line', name: 'Mid Line', fullName: 'Middle Line', desc: 'Row 2 complete', icon: Award },
    { id: 'bottom_line', name: 'Bot Line', fullName: 'Bottom Line', desc: 'Row 3 complete', icon: Award },
    { id: 'full_house', name: 'Full House', fullName: 'Full House', desc: 'All 15 numbers', icon: Crown }
  ];

  const handleClaimClick = (catId) => {
    sounds.playClick();
    onClaim(catId);
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-md border border-slate-200">
      <div className="flex items-center justify-between mb-2.5 sm:mb-3 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          <h3 className="font-black text-slate-900 text-xs sm:text-sm">
            Winning Claims
          </h3>
        </div>
        <span className="text-[10px] sm:text-xs font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
          {Object.keys(claims).length} / 5 Won
        </span>
      </div>

      {/* Grid: 2 columns on mobile, 5 columns on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5">
        {claimCategories.map((cat, idx) => {
          const claimRecord = claims[cat.id];
          const isClaimed = Boolean(claimRecord);
          const isMeWinner = claimRecord?.winnerId === playerId;
          const { ready, progress, count, total } = checkClaimProgress(cat.id);
          const Icon = cat.icon;
          const percent = Math.min(100, Math.round((count / total) * 100));

          // Full House on mobile spans full width of 2 columns
          const isFullHouseSpan = cat.id === 'full_house' ? 'col-span-2 sm:col-span-1' : '';

          return (
            <div
              key={cat.id}
              className={`rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border transition-all flex flex-col justify-between ${isFullHouseSpan} ${
                isClaimed
                  ? isMeWinner
                    ? 'bg-emerald-50/90 border-emerald-300 ring-1 ring-emerald-300'
                    : 'bg-slate-50 border-slate-200 opacity-80'
                  : ready
                  ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/50 shadow-sm animate-pulse-glow'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[11px] sm:text-xs font-black text-slate-900 flex items-center gap-1 truncate">
                    <Icon className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="truncate">{cat.name}</span>
                  </span>
                  <span
                    className={`text-[9px] sm:text-[10px] font-black px-1.5 py-0.2 rounded-md shrink-0 ${
                      ready
                        ? 'bg-amber-400 text-slate-950 font-black'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {progress}
                  </span>
                </div>

                {/* Compact Progress bar */}
                {!isClaimed && (
                  <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        ready ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Action / Winner Status */}
              <div>
                {isClaimed ? (
                  <div className="text-center pt-1 border-t border-slate-100">
                    <div className="flex items-center justify-center gap-1 text-[10px] sm:text-xs font-black text-slate-800 truncate">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="truncate max-w-[90px]">
                        {isMeWinner ? 'You Won!' : claimRecord.winnerName}
                      </span>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleClaimClick(cat.id)}
                    disabled={isClaiming}
                    className={`w-full py-1.5 sm:py-2 px-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black transition cursor-pointer active:scale-95 ${
                      ready
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm ring-1 ring-emerald-300'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {ready ? 'Claim!' : 'Claim'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
