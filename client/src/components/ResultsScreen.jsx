import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Crown,
  Medal,
  Award,
  RotateCcw,
  Home,
  Sparkles,
  CheckCircle2,
  Zap,
  Users,
  Target
} from 'lucide-react';
import { sounds } from '../utils/sound';

export default function ResultsScreen({
  roomState,
  playerId,
  isHost,
  onPlayAgain,
  onExitHome
}) {
  // Guard: if roomState is not ready yet, show a loading placeholder
  if (!roomState) {
    return (
      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-10 text-center">
        <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-200">
          <Sparkles className="w-8 h-8 text-amber-500 mx-auto mb-3 animate-pulse" />
          <h2 className="text-xl font-black text-slate-900 mb-2">Calculating Results...</h2>
          <p className="text-sm text-slate-500">Please wait while we finalize the standings.</p>
        </div>
      </div>
    );
  }

  const claims = roomState?.claims || {};
  const claimKeys = ['early_five', 'top_line', 'middle_line', 'bottom_line', 'full_house'];

  // Trigger celebration confetti & victory fanfare on mount
  useEffect(() => {
    try {
      if (sounds && typeof sounds.playFanfare === 'function') {
        sounds.playFanfare();
      }
    } catch {
      // Ignore audio errors
    }

    try {
      // Golden champion confetti shower
      const duration = 2.5 * 1000;
      const animationEnd = Date.now() + duration;
      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#f59e0b', '#10b981', '#fbbf24', '#3b82f6', '#ec4899']
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#f59e0b', '#10b981', '#fbbf24', '#3b82f6', '#ec4899']
        });

        if (Date.now() < animationEnd) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    } catch {
      // Ignore
    }
  }, []);

  // Use server-provided podium & leaderboard or compute fallback
  let podium, leaderboard;
  try {
    podium = roomState?.podium || computeClientPodium(roomState);
    leaderboard = roomState?.leaderboard || computeClientLeaderboard(roomState);
  } catch (err) {
    console.error('Error computing results:', err);
    podium = { first: null, second: null, third: null };
    leaderboard = [];
  }

  const claimTitles = {
    early_five: { name: 'Early Five', badge: '⚡ Early 5', desc: 'First 5 numbers' },
    top_line: { name: 'Top Line', badge: '🥇 Top Line', desc: 'Row 1 complete' },
    middle_line: { name: 'Middle Line', badge: '🥈 Mid Line', desc: 'Row 2 complete' },
    bottom_line: { name: 'Bottom Line', badge: '🥉 Bot Line', desc: 'Row 3 complete' },
    full_house: { name: 'Full House (Housie)', badge: '👑 Housie', desc: 'All 15 numbers' }
  };

  const firstPlace = podium?.first;
  const secondPlace = podium?.second;
  const thirdPlace = podium?.third;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 text-center shadow-2xl border border-emerald-500/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-xs font-black uppercase tracking-widest mb-3">
            <Trophy className="w-3.5 h-3.5 fill-current" />
            <span>Tournament Complete</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-2">
            Game Champions
          </h1>
          <p className="text-slate-300 text-xs sm:text-base max-w-lg mx-auto font-medium">
            {firstPlace
              ? `Congratulations to ${firstPlace.name} for taking 1st Place!`
              : 'All rounds finished. Here are the official tournament standings!'}
          </p>

          <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] sm:text-xs font-bold text-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Numbers Drawn: {roomState?.calledNumbers?.length || 0} / 90</span>
            <span className="text-slate-500">•</span>
            <span>Tasks: 5 / 5 Completed</span>
          </div>
        </div>
      </div>

      {/* Podium (1st, 2nd, 3rd Places) */}
      <div className="bg-white rounded-3xl p-4 sm:p-7 shadow-lg border border-slate-200">
        <div className="text-center mb-6">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center justify-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            <span>Official Victory Podium</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            1st Place (Full House) • 2nd Place (Majority Lines) • 3rd Place (Podium Finisher)
          </p>
        </div>

        {/* 3 Pedestal Columns */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end max-w-2xl mx-auto pt-4 pb-2">
          {/* 2nd Place (Silver - Left) */}
          <div className="flex flex-col items-center">
            {secondPlace ? (
              <div className="w-full flex flex-col items-center animate-slideUp">
                {/* Avatar / Crown */}
                <div className="relative mb-2">
                  <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-tr from-slate-300 to-slate-100 border-2 border-slate-300 shadow-md flex items-center justify-center font-black text-slate-700 text-xl sm:text-2xl">
                    🥈
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-slate-700 text-white rounded-full p-1 shadow-xs">
                    <Medal className="w-3 h-3" />
                  </div>
                </div>

                <div className="text-center mb-2 px-1">
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-500 block">
                    2nd Place
                  </span>
                  <h3 className="font-black text-xs sm:text-base text-slate-900 truncate max-w-[90px] sm:max-w-[150px]">
                    {secondPlace.name} {secondPlace.id === playerId && '(You)'}
                  </h3>
                  <span className="text-[9px] sm:text-[11px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md inline-block mt-0.5">
                    {secondPlace.awardReason}
                  </span>
                </div>

                {/* Pedestal Block */}
                <div className="w-full h-24 sm:h-32 bg-gradient-to-b from-slate-200 to-slate-300 rounded-t-2xl flex flex-col items-center justify-center border-t-2 border-slate-300 shadow-inner">
                  <span className="font-black text-2xl sm:text-3xl text-slate-600">2</span>
                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Silver
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-full text-center text-slate-400 text-xs py-8">
                No Contender
              </div>
            )}
          </div>

          {/* 1st Place (Gold - Center, Tallest) */}
          <div className="flex flex-col items-center -mt-6">
            {firstPlace ? (
              <div className="w-full flex flex-col items-center animate-bounce-slow">
                {/* Gold Crown Animation */}
                <div className="relative mb-2">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-amber-500 animate-pulse">
                    <Crown className="w-6 h-6 sm:w-8 sm:h-8 fill-current drop-shadow-sm" />
                  </div>
                  <div className="w-18 h-18 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 border-4 border-amber-200 shadow-xl flex items-center justify-center font-black text-white text-3xl sm:text-4xl ring-4 ring-amber-300/40">
                    🥇
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-amber-600 text-white rounded-full p-1.5 shadow-md">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="text-center mb-2 px-1">
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full inline-block mb-0.5">
                    1st Place (Winner)
                  </span>
                  <h3 className="font-black text-sm sm:text-lg text-slate-900 truncate max-w-[110px] sm:max-w-[180px]">
                    {firstPlace.name} {firstPlace.id === playerId && '(You)'}
                  </h3>
                  <span className="text-[10px] sm:text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md inline-block mt-0.5">
                    {firstPlace.awardReason}
                  </span>
                </div>

                {/* Pedestal Block */}
                <div className="w-full h-32 sm:h-44 bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 rounded-t-3xl flex flex-col items-center justify-center border-t-4 border-yellow-200 shadow-lg text-white">
                  <Crown className="w-6 h-6 sm:w-8 sm:h-8 fill-current text-yellow-100 mb-0.5" />
                  <span className="font-black text-3xl sm:text-4xl drop-shadow-sm">1</span>
                  <span className="text-[10px] sm:text-xs font-black text-yellow-100 uppercase tracking-widest">
                    Champion
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-full text-center text-slate-400 text-xs py-12">
                No Winner
              </div>
            )}
          </div>

          {/* 3rd Place (Bronze - Right) */}
          <div className="flex flex-col items-center">
            {thirdPlace ? (
              <div className="w-full flex flex-col items-center animate-slideUp">
                {/* Avatar / Medal */}
                <div className="relative mb-2">
                  <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-tr from-amber-700 to-amber-500 border-2 border-amber-600 shadow-md flex items-center justify-center font-black text-white text-xl sm:text-2xl">
                    🥉
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-amber-800 text-white rounded-full p-1 shadow-xs">
                    <Award className="w-3 h-3" />
                  </div>
                </div>

                <div className="text-center mb-2 px-1">
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-800 block">
                    3rd Place
                  </span>
                  <h3 className="font-black text-xs sm:text-base text-slate-900 truncate max-w-[90px] sm:max-w-[150px]">
                    {thirdPlace.name} {thirdPlace.id === playerId && '(You)'}
                  </h3>
                  <span className="text-[9px] sm:text-[11px] font-bold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded-md inline-block mt-0.5">
                    {thirdPlace.awardReason}
                  </span>
                </div>

                {/* Pedestal Block */}
                <div className="w-full h-20 sm:h-28 bg-gradient-to-b from-amber-600 via-amber-700 to-amber-800 rounded-t-2xl flex flex-col items-center justify-center border-t-2 border-amber-400 shadow-inner text-amber-100">
                  <span className="font-black text-2xl sm:text-3xl">3</span>
                  <span className="text-[9px] sm:text-[10px] font-bold text-amber-200 uppercase tracking-widest">
                    Bronze
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-full text-center text-slate-400 text-xs py-8">
                No Contender
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Tournament Leaderboard Table */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-md border border-slate-200">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <h2 className="font-black text-slate-900 text-base sm:text-lg">
              Tournament Standings
            </h2>
          </div>
          <span className="text-xs font-black text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            {leaderboard?.length || 0} Players
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Rank</th>
                <th className="py-2.5 px-3">Player</th>
                <th className="py-2.5 px-3">Awards & Claims</th>
                <th className="py-2.5 px-3 text-right">Struck</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {leaderboard && leaderboard.map((player) => {
                const isMe = player.id === playerId;
                const isPodium = player.rank <= 3;

                return (
                  <tr
                    key={player.id}
                    className={`transition-colors ${
                      isMe
                        ? 'bg-emerald-50/80 font-bold text-emerald-950'
                        : 'hover:bg-slate-50/60 text-slate-800'
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        {player.rank === 1 && <span className="text-base">🥇</span>}
                        {player.rank === 2 && <span className="text-base">🥈</span>}
                        {player.rank === 3 && <span className="text-base">🥉</span>}
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs ${
                            isPodium
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          #{player.rank}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-black">{player.name}</span>
                        {isMe && (
                          <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-200/80 px-1.5 py-0.2 rounded-md">
                            You
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block font-normal">
                        {player.placeTitle || `${player.rank}th Place`}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex flex-wrap items-center gap-1">
                        {player.badges && player.badges.length > 0 ? (
                          player.badges.map((b, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200/60 inline-flex items-center gap-1"
                            >
                              {b}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">
                            {player.awardReason || 'Participant'}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <span className="font-black text-slate-900">
                        {player.struckCount || 0}
                      </span>
                      <span className="text-slate-400 text-xs">/15</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5 Category Champions Grid */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-md border border-slate-200">
        <h3 className="font-black text-slate-900 text-sm sm:text-base mb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-emerald-600" />
          <span>Category Winners</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
          {claimKeys.map((key) => {
            const claim = claims[key];
            const meta = claimTitles[key];
            const isWinner = Boolean(claim);
            const isMe = claim?.winnerId === playerId;

            return (
              <div
                key={key}
                className={`p-3 rounded-2xl border transition flex items-center justify-between ${
                  isWinner
                    ? 'bg-emerald-50/70 border-emerald-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-900">
                      {meta.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium block">
                    {meta.desc}
                  </span>
                </div>

                <div className="text-right">
                  {isWinner ? (
                    <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {isMe ? 'You Won!' : claim.winnerName}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">
                      Unclaimed
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Action Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        {isHost && (
          <button
            onClick={() => {
              sounds.playClick();
              onPlayAgain();
            }}
            className="w-full sm:w-auto py-3.5 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
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
          className="w-full sm:w-auto py-3.5 px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-black text-sm shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>Return to Home</span>
        </button>
      </div>
    </div>
  );
}

// Fallback client-side calculation if server did not attach podium
function computeClientLeaderboard(roomState) {
  if (!roomState) return [];
  const players = Array.isArray(roomState.players) ? roomState.players : [];
  if (players.length === 0) return [];
  const claims = roomState.claims || {};
  const calledSet = new Set(roomState.calledNumbers || []);
  const lineTypes = ['top_line', 'middle_line', 'bottom_line'];

  const stats = players.map((p) => {
    if (!p) return null;
    const ticketNumbers = p?.ticket?.numbers || [];
    const struckCount = ticketNumbers.filter((n) => calledSet.has(n)).length;
    const wonClaims = Object.values(claims).filter((c) => c && c.winnerId === p?.id);
    const hasFullHouse = Boolean(claims.full_house && claims.full_house.winnerId === p?.id);
    const linesWon = lineTypes.filter((t) => claims[t] && claims[t].winnerId === p?.id).length;
    const hasEarlyFive = Boolean(claims.early_five && claims.early_five.winnerId === p?.id);
    const badges = wonClaims.map((c) => c?.badge || c?.name || 'Winner');

    return {
      id: p?.id || Math.random().toString(),
      name: p?.name || 'Player',
      hasFullHouse,
      linesWon,
      hasEarlyFive,
      totalClaims: wonClaims.length,
      badges,
      struckCount
    };
  }).filter(Boolean);

  // Full house winner always first
  stats.sort((a, b) => {
    if (a.hasFullHouse && !b.hasFullHouse) return -1;
    if (!a.hasFullHouse && b.hasFullHouse) return 1;
    if (b.linesWon !== a.linesWon) return b.linesWon - a.linesWon;
    if (b.hasEarlyFive !== a.hasEarlyFive) return (b.hasEarlyFive ? 1 : 0) - (a.hasEarlyFive ? 1 : 0);
    return b.struckCount - a.struckCount;
  });

  return stats.map((s, idx) => ({
    ...s,
    rank: idx + 1,
    placeTitle: idx === 0 ? '1st Place (Winner)' : idx === 1 ? '2nd Place' : idx === 2 ? '3rd Place' : `${idx + 1}th Place`,
    awardReason: s.hasFullHouse ? 'Housie Champion 👑' : s.linesWon > 0 ? `${s.linesWon} Lines Won` : s.hasEarlyFive ? 'Early Five Winner' : `${s.struckCount}/15 Struck`
  }));
}

function computeClientPodium(roomState) {
  const lb = computeClientLeaderboard(roomState);
  return {
    first: lb[0] || null,
    second: lb[1] || null,
    third: lb[2] || null
  };
}
