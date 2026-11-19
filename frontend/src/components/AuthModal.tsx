import React, { useState } from 'react';

interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  candidate_id: string | null;
}

interface AuthModalProps {
  lang: 'fr' | 'en';
  open: boolean;
  onClose: () => void;
  onAuthenticated: (user: AuthUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  lang,
  open,
  onClose,
  onAuthenticated,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(mode === 'register' ? '/api/auth/register' : '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          mode === 'register'
            ? { email, password, full_name: fullName }
            : { email, password },
        ),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Authentication failed');
      onAuthenticated(data);
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#111827] p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">
            {mode === 'login'
              ? (lang === 'fr' ? 'Connexion' : 'Sign in')
              : (lang === 'fr' ? 'Créer un compte' : 'Create account')}
          </h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">×</button>
        </div>

        <div className="grid grid-cols-2 rounded-xl border border-slate-700 p-1 mb-5">
          {(['login', 'register'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => { setMode(item); setError(''); }}
              className={`py-2 rounded-lg text-sm ${mode === item ? 'bg-emerald-500 text-slate-950' : 'text-slate-300'}`}
            >
              {item === 'login'
                ? (lang === 'fr' ? 'Connexion' : 'Sign in')
                : (lang === 'fr' ? 'Inscription' : 'Register')}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === 'register' && (
            <input
              type="text"
              required
              minLength={2}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder={lang === 'fr' ? 'Nom complet' : 'Full name'}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
            />
          )}
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
          />
          <input
            type="password"
            required
            minLength={mode === 'register' ? 12 : 1}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={lang === 'fr' ? 'Mot de passe' : 'Password'}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
          />
          {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-500 py-3 font-bold text-slate-950 disabled:opacity-50"
          >
            {loading
              ? (lang === 'fr' ? 'Validation…' : 'Please wait…')
              : (mode === 'login'
                ? (lang === 'fr' ? 'Se connecter' : 'Sign in')
                : (lang === 'fr' ? 'Créer mon compte' : 'Create account'))}
          </button>
        </form>
      </div>
    </div>
  );
};
