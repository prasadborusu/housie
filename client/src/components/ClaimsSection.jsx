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
    if (!ticket || !ticket.grid) return { ready: false, progress: '0', count: 0, total: 5 };

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
    return { ready: false, progress: '', count: 0, total: 5 };
  };

  const claimCategories = [
    {
      id: 'early_five',
      name: 'Early Five',
      badge: '⚡ Early 5',
      desc: 'First to strike any 5 numbers',
      icon: Zap,
      accent: 'from-amber-500 to-orange-500'
    },
    {
      id: 'top_line',
      name: 'Top Line',
      badge: '🥇 Top Line',
      desc: 'Strike all 5 in top row',
      icon: Award,
      accent: 'from-blue-600 to-indigo-600'
    },
    {
      id: 'middle_line',
      name: 'Middle Line',
      badge: '🥈 Mid Line',
      desc: 'Strike all 5 in mid row',
      icon: Award,
      accent: 'from-teal-600 to-emerald-600'
    },
    {
      id: 'bottom_line',
      name: 'Bottom Line',
      badge: '🥉 Bottom Line',
      desc: 'Strike all 5 in bot row',
      icon: Award,
      accent: 'from-purple-600 to-pink-600'
    },
    {
      id: 'full_house',
      name: 'Full House',
      badge: '👑 Full House',
      desc: 'Strike all 15 numbers!',
      icon: Crown,
      accent: 'from-amber-400 via-amber-500 to-yellow-600'
    }
  ];

  const handleClaimClick = (catId) => {
    sounds.playClick();
    onClaim(catId);
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-200">
      <div className="flex items-center justify-between mb-4 pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-base">
              Winning Claims
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Strike numbers on your card & claim instantly
            </p>
          </div>
        </div>

        <span className="text-xs font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
          {Object.keys(claims).length} / 5 Claimed
        </span>
      </div>

      {/* Grid of Claim Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {claimCategories.map((cat) => {
          const claimRecord = claims[cat.id];
          const isClaimed = Boolean(claimRecord);
          const isMeWinner = claimRecord?.winnerId === playerId;
          const { ready, progress, count, total } = checkClaimProgress(cat.id);
          const Icon = cat.icon;
          const percent = Math.min(100, Math.round((count / total) * 100));

          return (
            <div
              key={cat.id}
              className={`rounded-2xl p-4 border transition-all duration-300 flex flex-col justify-between ${
                isClaimed
                  ? isMeWinner
                    ? 'bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-300 shadow-sm'
                    : 'bg-slate-50/70 border-slate-200 opacity-90'
                  : ready
                  ? 'bg-gradient-to-b from-amber-50/90 to-amber-100/60 border-amber-400 ring-2 ring-amber-400/60 shadow-md animate-pulse-glow'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <Icon className="w-4 h-4 text-emerald-600" />
                    {cat.name}
                  </span>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                      ready
                        ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {progress}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 line-clamp-2 leading-tight mb-3 font-medium">
                  {cat.desc}
                </p>

                {/* Progress bar inside card */}
                {!isClaimed && (
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        ready ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Status or Claim Button */}
              <div>
                {isClaimed ? (
                  <div className="mt-1 pt-2.5 border-t border-slate-200/80 text-center">
                    <div className="flex items-center justify-center gap-1 text-xs font-black text-slate-900">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="truncate max-w-[120px]">
                        {isMeWinner ? 'Won by You!' : claimRecord.winnerName}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                      At call #{claimRecord.totalNumbersCalled || '---'} (No. {claimRecord.wonAtNumber})
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleClaimClick(cat.id)}
                    disabled={isClaiming}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-sm ${
                      ready
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black shadow-md shadow-emerald-600/30 ring-2 ring-emerald-300'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold'
                    }`}
                  >
                    {ready ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-current" />
                        <span>Claim Prize!</span>
                      </>
                    ) : (
                      <span>Claim</span>
                    )}
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
