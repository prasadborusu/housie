import React from 'react';
import { Trophy, Crown, Award, RotateCcw, Home, Sparkles, CheckCircle2 } from 'lucide-react';
import { sounds } from '../utils/sound';

export default function ResultsScreen({
  roomState,
  playerId,
  isHost,
  onPlayAgain,
  onExitHome
}) {
  const claims = roomState?.claims || {};
  const claimKeys = ['early_five', 'top_line', 'middle_line', 'bottom_line', 'full_house'];
  const fullHouseWinner = claims.full_house;

  const claimTitles = {
    early_five: { name: 'Early Five', badge: '⚡ Early 5' },
    top_line: { name: 'Top Line', badge: '🥇 Top Line' },
    middle_line: { name: 'Middle Line', badge: '🥈 Middle Line' },
    bottom_line: { name: 'Bottom Line', badge: '🥉 Bottom Line' },
    full_house: { name: 'Full House (Grand Winner)', badge: '👑 Full House' }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-8 animate-fadeIn">
      {/* Trophy Card */}
      <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 text-white rounded-3xl p-6 sm:p-10 text-center shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex p-4 rounded-3xl bg-white/20 backdrop-blur-md mb-4 shadow-lg">
            <Trophy className="w-12 h-12 text-yellow-100" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
            Game Over!
          </h1>
          <p className="text-amber-100 text-sm sm:text-base max-w-md mx-auto">
            {fullHouseWinner
              ? `Congratulations to ${fullHouseWinner.winnerName} for claiming the Full House!`
              : 'All rounds complete. Here are the champion winners!'}
          </p>

          <div className="mt-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/20 text-xs font-bold uppercase tracking-wider text-amber-100">
            <Sparkles className="w-4 h-4 text-amber-200" />
            Total Numbers Called: {roomState?.calledNumbers?.length || 0} / 90
          </div>
        </div>
      </div>

      {/* Winners Roster */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-200">
        <h2 className="text-lg font-extrabold text-slate-900 mb-6 flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-600" />
          <span>Category Champions</span>
        </h2>

        <div className="space-y-3">
          {claimKeys.map((key) => {
            const claim = claims[key];
            const meta = claimTitles[key];
            const isWinner = Boolean(claim);
            const isMe = claim?.winnerId === playerId;

            return (
              <div
                key={key}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                  isWinner
                    ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-200'
                    : 'bg-slate-50/60 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      key === 'full_house'
                        ? 'bg-amber-400 text-slate-950'
                        : isWinner
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {key === 'full_house' ? <Crown className="w-5 h-5 fill-current" /> : <Award className="w-5 h-5" />}
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                      {meta.name}
                    </h3>
                    {isWinner ? (
                      <p className="text-xs text-slate-600">
                        Claimed at call #{claim.totalNumbersCalled} (Number {claim.wonAtNumber})
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400">Unclaimed this round</p>
                    )}
                  </div>
                </div>

                <div>
                  {isWinner ? (
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 font-black text-sm sm:text-base text-emerald-800 bg-emerald-100 px-3 py-1 rounded-xl">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        {isMe ? 'You Won!' : claim.winnerName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400 px-3 py-1 rounded-xl bg-slate-100">
                      ---
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
        {isHost && (
          <button
            onClick={() => {
              sounds.playClick();
              onPlayAgain();
            }}
            className="w-full sm:w-auto py-3.5 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again (New Round)</span>
          </button>
        )}

        <button
          onClick={() => {
            sounds.playClick();
            onExitHome();
          }}
          className="w-full sm:w-auto py-3.5 px-8 rounded-2xl bg-white hover:bg-slate-50 active:scale-95 text-slate-700 font-bold text-sm border-2 border-slate-200 hover:border-slate-300 shadow-xs flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
      </div>
    </div>
  );
}

