import React, { useState } from 'react';
import { User, Mail, ArrowRight, ShieldCheck, Sparkles, Award, Zap } from 'lucide-react';
import { sounds } from '../utils/sound';

export default function HomeScreen({ initialName = '', initialEmail = '', onEnter }) {
  const [name, setName] = useState(initialName || localStorage.getItem('housey_name') || '');
  const [email, setEmail] = useState(initialEmail || localStorage.getItem('housey_email') || '');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const errs = {};
    if (!name.trim()) {
      errs.name = 'Please enter your name.';
    } else if (name.trim().length < 2) {
      errs.name = 'Name must be at least 2 characters.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errs.email = 'Please enter your email.';
    } else if (!emailRegex.test(email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sounds.playClick();
    if (!validate()) {
      sounds.playError();
      return;
    }

    setIsSubmitting(true);
    localStorage.setItem('housey_name', name.trim());
    localStorage.setItem('housey_email', email.trim());

    setTimeout(() => {
      setIsSubmitting(false);
      onEnter({
        name: name.trim(),
        email: email.trim()
      });
    }, 200);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-8 sm:py-12 overflow-hidden">
      {/* Decorative Floating 3D Tambola Orbs in Background */}
      <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full ball-3d opacity-25 blur-sm pointer-events-none animate-orb-1 flex items-center justify-center text-white font-black text-2xl">
        7
      </div>
      <div className="absolute top-1/4 -right-12 w-36 h-36 rounded-full ball-3d-amber opacity-20 blur-sm pointer-events-none animate-orb-2 flex items-center justify-center text-white font-black text-3xl">
        42
      </div>
      <div className="absolute -bottom-10 left-1/3 w-28 h-28 rounded-full ball-3d opacity-20 blur-sm pointer-events-none animate-bounce-slow flex items-center justify-center text-white font-black text-xl">
        88
      </div>

      <div className="relative w-full max-w-md z-10">
        {/* Card Container */}
        <div className="glass-panel rounded-3xl p-6 sm:p-9 shadow-2xl shadow-slate-200/60 relative overflow-hidden transition-all duration-300">
          {/* Subtle top accent bar */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600" />

          {/* Logo & Header */}
          <div className="text-center mb-7 pt-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-3xl shadow-xl shadow-emerald-500/30 mb-4 animate-bounce-slow ring-4 ring-emerald-100">
              H
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-3 py-0.5 rounded-full shadow-2xs">
                Multiplayer Housie & Bingo
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Let's Play Tambola!
            </h1>
            <p className="text-slate-600 text-sm mt-1.5 font-medium">
              Join your friends for a fun, live game of Tambola.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Your Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  id="name"
                  type="text"
                  placeholder="e.g. Alex Sharma"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                  }}
                  className={`w-full pl-11 pr-4 py-3 bg-slate-50/80 border rounded-2xl text-slate-900 font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white text-base transition ${
                    errors.name
                      ? 'border-rose-400 focus:ring-rose-200'
                      : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-200'
                  }`}
                  autoFocus
                />
              </div>
              {errors.name && (
                <p className="text-xs font-semibold text-rose-600 mt-1 pl-1">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="email" className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                  Your Email <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Kept private
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="e.g. alex@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                  }}
                  className={`w-full pl-11 pr-4 py-3 bg-slate-50/80 border rounded-2xl text-slate-900 font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white text-base transition ${
                    errors.email
                      ? 'border-rose-400 focus:ring-rose-200'
                      : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-200'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-xs font-semibold text-rose-600 mt-1 pl-1">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] text-white font-black text-base shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition duration-150 cursor-pointer disabled:opacity-70"
            >
              <span>{isSubmitting ? 'Entering...' : 'Enter Game'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          {/* Feature Badges */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-4 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-current" /> Live Sync
            </span>
            <span className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-emerald-600" /> Fair 90-Ball
            </span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-teal-500" /> No Passwords
            </span>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-5 font-medium">
          HOUSEY is purely for entertainment with family & friends.
        </p>
      </div>
    </div>
  );
}
