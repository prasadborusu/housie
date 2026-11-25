import React, { useState, useEffect } from 'react';
import { Smile, X, Sparkles } from 'lucide-react';
import { socket } from '../utils/socket';
import { sounds } from '../utils/sound';

const EMOJI_OPTIONS = [
  { emoji: '🎉', label: 'Party' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '😂', label: 'Haha' },
  { emoji: '👏', label: 'Clap' },
  { emoji: '🥳', label: 'Celebrate' },
  { emoji: '😱', label: 'Shock' },
  { emoji: '🍀', label: 'Luck' },
  { emoji: '❤️', label: 'Love' }
];

export default function EmojiReactions({ roomCode, playerId, playerName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [reactions, setReactions] = useState([]);

  // Listen to incoming real-time reactions from any player in the room
  useEffect(() => {
    const handleReaction = (reaction) => {
      // Small pop sound for live feedback
      try {
        sounds.playClick();
      } catch {
        // Ignore sound errors
      }

      // Add random horizontal position variance (-40px to +40px)
      const xOffset = (Math.random() - 0.5) * 80;
      const newReaction = {
        ...reaction,
        xOffset,
        key: reaction.id || `${Date.now()}_${Math.random()}`
      };

      setReactions((prev) => [...prev.slice(-10), newReaction]);

      // Remove after 2.8 seconds automatically
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.key !== newReaction.key));
      }, 2800);
    };

    socket.on('room_reaction', handleReaction);

    return () => {
      socket.off('room_reaction', handleReaction);
    };
  }, []);

  const handleSendEmoji = (emoji) => {
    sounds.playClick();
    socket.emit('send_reaction', { emoji });
    // Keep dock open for rapid reactions, or can close
  };

  return (
    <>
      {/* Floating Animated Emojis Overlay (Rendered across screen, non-intrusive) */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {reactions.map((r) => (
          <div
            key={r.key}
            style={{
              right: `calc(1.5rem + ${r.xOffset}px)`,
              bottom: '5.5rem'
            }}
            className="absolute flex flex-col items-center animate-float-reaction select-none"
          >
            {/* Big floating emoji */}
            <span className="text-4xl sm:text-5xl drop-shadow-lg filter">
              {r.emoji}
            </span>

            {/* Sender name badge for 2-3 seconds */}
            <span className="mt-1 px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-black tracking-tight shadow-md border border-white/20 whitespace-nowrap">
              {r.senderId === playerId ? 'You' : r.senderName}
            </span>
          </div>
        ))}
      </div>

      {/* Floating Round Emoji Trigger Button & Reaction Dock */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end">
        {/* Reaction Options Pop-up Dock */}
        {isOpen && (
          <div className="mb-2 bg-white/95 backdrop-blur-md rounded-2xl p-2 shadow-2xl border border-slate-200/90 animate-fadeIn flex items-center gap-1 sm:gap-1.5 ring-4 ring-amber-300/30">
            {EMOJI_OPTIONS.map((item) => (
              <button
                key={item.emoji}
                onClick={() => handleSendEmoji(item.emoji)}
                title={item.label}
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl hover:bg-amber-50 active:scale-125 transition-transform text-xl sm:text-2xl flex items-center justify-center cursor-pointer select-none"
              >
                {item.emoji}
              </button>
            ))}

            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Round Emoji Button */}
        <button
          onClick={() => {
            sounds.playClick();
            setIsOpen((prev) => !prev);
          }}
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-xl flex items-center justify-center cursor-pointer transition-all duration-200 select-none active:scale-95 ${
            isOpen
              ? 'bg-slate-900 text-white ring-4 ring-slate-300'
              : 'bg-gradient-to-tr from-amber-400 via-amber-500 to-yellow-500 text-white ring-4 ring-amber-300/50 hover:shadow-amber-500/30 hover:scale-105'
          }`}
          title="Send Reaction Emoji"
          aria-label="Send Reaction Emoji"
        >
          {isOpen ? (
            <X className="w-6 h-6 stroke-[2.5]" />
          ) : (
            <span className="text-2xl sm:text-3xl filter drop-shadow-xs">😊</span>
          )}
        </button>
      </div>
    </>
  );
}

