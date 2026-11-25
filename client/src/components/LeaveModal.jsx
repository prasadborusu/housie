import React from 'react';
import { AlertCircle, LogOut } from 'lucide-react';
import { sounds } from '../utils/sound';

export default function LeaveModal({ isOpen, onCancel, onConfirm, isHost }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-200 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <LogOut className="w-6 h-6" />
        </div>

        <h3 className="font-extrabold text-slate-900 text-lg mb-1">
          Leave the Game?
        </h3>

        <p className="text-xs text-slate-500 mb-6">
          {isHost
            ? 'As host, leaving will transfer host privileges or close the room if no players remain.'
            : 'Are you sure you want to leave this game room? You will forfeit your ticket.'}
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sounds.playClick();
              onCancel();
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
          >
            Stay
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              onConfirm();
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/25 transition cursor-pointer"
          >
            Leave Game
          </button>
        </div>
      </div>
    </div>
  );
}

