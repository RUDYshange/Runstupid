
import React, { useState } from 'react';
import { auth } from '../services/dbService';

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (!displayName.trim()) { setError('Name is required.'); setIsLoading(false); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); setIsLoading(false); return; }
        const { error: signUpError } = await auth.signUp(email, password, displayName.trim());
        if (signUpError) { setError(signUpError.message); setIsLoading(false); return; }
        setSuccessMsg('Account created! Check your email to confirm, then sign in.');
        setMode('signin');
        setPassword('');
      } else {
        const { error: signInError } = await auth.signIn(email, password);
        if (signInError) { setError(signInError.message); setIsLoading(false); return; }
        onAuthSuccess();
      }
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong. Try again.');
    }

    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-stupid-black flex flex-col items-center justify-center px-6 pt-safe pb-safe">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 size-96 bg-stupid-purple/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 size-64 bg-stupid-neon/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="bg-stupid-purple px-4 py-2 rounded-xl shadow-2xl shadow-stupid-purple/40 transform -skew-x-12 flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-white text-xl font-black scale-x-[-1]">directions_run</span>
            <span className="font-display font-black italic text-white text-2xl uppercase tracking-tighter leading-none">RUN STUPID</span>
          </div>
          <p className="text-[10px] font-black text-white/30 tracking-[0.5em] uppercase">SOCIAL CLUB ESTD 2025</p>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-stupid-gray p-1.5 rounded-2xl border border-white/10 mb-8">
          {(['signin', 'signup'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); setSuccessMsg(null); }}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase italic tracking-widest transition-all ${
                mode === m ? 'bg-stupid-purple text-white shadow-lg' : 'text-white/30'
              }`}
            >
              {m === 'signin' ? 'Sign In' : 'Join Pack'}
            </button>
          ))}
        </div>

        {/* Success banner */}
        {successMsg && (
          <div className="mb-6 bg-stupid-neon/10 border border-stupid-neon/30 rounded-2xl px-4 py-3">
            <p className="text-stupid-neon text-xs font-black uppercase tracking-wider">{successMsg}</p>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3">
            <p className="text-red-400 text-xs font-black uppercase tracking-wider">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'signup' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase text-white/30 tracking-widest px-1">Your Name</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="e.g. Alex The Stupid"
                autoComplete="name"
                className="w-full bg-stupid-card border border-white/10 rounded-2xl px-5 py-4 text-white text-sm font-medium placeholder-white/20 focus:outline-none focus:border-stupid-purple transition-colors"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase text-white/30 tracking-widest px-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@runstupid.com"
              autoComplete="email"
              required
              className="w-full bg-stupid-card border border-white/10 rounded-2xl px-5 py-4 text-white text-sm font-medium placeholder-white/20 focus:outline-none focus:border-stupid-purple transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase text-white/30 tracking-widest px-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'Min 6 characters' : '••••••••'}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              required
              className="w-full bg-stupid-card border border-white/10 rounded-2xl px-5 py-4 text-white text-sm font-medium placeholder-white/20 focus:outline-none focus:border-stupid-purple transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full bg-stupid-purple text-white font-black italic text-lg py-5 rounded-[24px] uppercase tracking-tighter shadow-[0_15px_40px_rgba(168,0,255,0.4)] border-t border-white/20 active:scale-[0.98] transition-all disabled:opacity-60 disabled:scale-100"
          >
            {isLoading
              ? (mode === 'signin' ? 'Signing in...' : 'Creating account...')
              : (mode === 'signin' ? 'LET\'S GO' : 'JOIN THE PACK')}
          </button>
        </form>

        <p className="text-center text-[10px] text-white/20 font-bold uppercase tracking-widest mt-8">
          {mode === 'signin' ? "No account? " : "Already running? "}
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }}
            className="text-stupid-purple underline underline-offset-2"
          >
            {mode === 'signin' ? 'Join the Pack' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthScreen;
