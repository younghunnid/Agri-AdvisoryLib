import React, {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {KeyRound, LogIn} from 'lucide-react';
import {apiFetch} from '../../lib/api';
import {type ClientUser, useApp} from '../../context/AppContext';

export const LoginPage: React.FC = () => {
  const {setUser} = useApp();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'forgot' | 'reset'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<{user: ClientUser}>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({identifier, password}),
      });
      setUser(res.user);
      if (res.user.roles.includes('admin')) navigate('/admin');
      else if (res.user.roles.includes('expert')) navigate('/expert');
      else navigate('/farmer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const res = await apiFetch<{message: string}>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({identifier}),
      });
      setNotice(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const res = await apiFetch<{message: string}>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({token: resetToken, newPassword}),
      });
      setNotice(res.message);
      setMode('login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div className="rounded-3xl bg-white border border-[#183B2B]/10 p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-[#16803C]">Account Access</p>
          <h1 className="font-display text-2xl font-extrabold text-[#183B2B]">
            {mode === 'login' ? 'Sign In' : mode === 'forgot' ? 'Reset Password Request' : 'Complete Password Reset'}
          </h1>
          <p className="text-sm text-[#183B2B]/75">
            {mode === 'login'
              ? 'Access your saved farming advice, question history, and expert consultations.'
              : 'Request a password reset or apply a verified reset token.'}
          </p>
        </div>

        {error && (
          <div role="alert" className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-800">
            {error}
          </div>
        )}
        {notice && (
          <div role="status" className="rounded-xl bg-[#DDEFE0] p-3 text-sm text-[#183B2B]">
            {notice}
          </div>
        )}

        {mode === 'login' && (
          <form onSubmit={(e) => void handleLogin(e)} className="space-y-4">
            <div>
              <label htmlFor="login-ident" className="block text-sm font-semibold mb-1.5">
                Phone Number or Email
              </label>
              <input
                id="login-ident"
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="+231770000101"
                className="w-full min-h-[44px] rounded-xl border border-[#183B2B]/20 px-3.5 text-sm"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-semibold mb-1.5">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-[#183B2B]/20 px-3.5 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-2xl bg-[#16803C] text-white font-semibold text-sm hover:bg-[#116630] disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" aria-hidden="true" />
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            </button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setNotice(null);
                  setMode('forgot');
                }}
                className="font-semibold text-[#16803C] hover:underline min-h-[44px]"
              >
                Forgot password?
              </button>
              <Link to="/register" className="font-semibold text-[#183B2B] hover:underline min-h-[44px] inline-flex items-center">
                Create farmer account
              </Link>
            </div>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={(e) => void handleForgot(e)} className="space-y-4">
            <p className="text-xs text-[#183B2B]/75 bg-[#F3F8F0] p-3 rounded-xl">
              Note: Automated SMS/email delivery is not configured in this Phase 1 environment. Reset tokens are never shown publicly in the browser; for local developer testing, check server logs or use the token entry form.
            </p>
            <div>
              <label htmlFor="forgot-ident" className="block text-sm font-semibold mb-1.5">
                Registered Phone Number or Email
              </label>
              <input
                id="forgot-ident"
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-[#183B2B]/20 px-3.5 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-2xl bg-[#16803C] text-white font-semibold text-sm"
            >
              <KeyRound className="w-4 h-4" aria-hidden="true" />
              <span>{loading ? 'Submitting...' : 'Request Reset'}</span>
            </button>
            <div className="flex justify-between text-xs">
              <button type="button" onClick={() => setMode('reset')} className="font-semibold text-[#16803C] hover:underline min-h-[44px]">
                I have a reset token
              </button>
              <button type="button" onClick={() => setMode('login')} className="font-semibold text-[#183B2B] hover:underline min-h-[44px]">
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={(e) => void handleReset(e)} className="space-y-4">
            <div>
              <label htmlFor="reset-token" className="block text-sm font-semibold mb-1.5">
                Reset Token
              </label>
              <input
                id="reset-token"
                type="text"
                required
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-[#183B2B]/20 px-3.5 text-sm font-mono"
              />
            </div>
            <div>
              <label htmlFor="reset-new-pw" className="block text-sm font-semibold mb-1.5">
                New Password (min 8 characters)
              </label>
              <input
                id="reset-new-pw"
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-[#183B2B]/20 px-3.5 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[48px] rounded-2xl bg-[#16803C] text-white font-semibold text-sm"
            >
              Update Password
            </button>
            <button type="button" onClick={() => setMode('login')} className="w-full text-xs font-semibold text-[#183B2B] min-h-[44px]">
              Back to Sign In
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
