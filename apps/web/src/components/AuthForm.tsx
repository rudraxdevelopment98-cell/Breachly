'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { login, signup } from '@/lib/auth';
import { useAuth } from '@/lib/authStore';

export function AuthForm({ mode }: { mode: 'signup' | 'login' }) {
  const router = useRouter();
  const setSession = useAuth((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignup = mode === 'signup';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Use a password of at least 8 characters.');
      return;
    }
    setBusy(true);
    try {
      const out = isSignup
        ? await signup(email, password)
        : await login(email, password);
      setSession(
        {
          email: out.email,
          accessToken: out.tokens.accessToken,
          refreshToken: out.tokens.refreshToken,
        },
        out.encryptionKeyB64,
      );
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <Link href="/" className="font-mono text-xs tracking-widest text-primary">
        ← AEGIS
      </Link>
      <h1 className="mt-4 text-3xl font-bold">
        {isSignup ? 'Create your account' : 'Welcome back'}
      </h1>
      <p className="mt-2 text-textMuted">
        {isSignup
          ? 'Your password never leaves this device — it derives your keys locally. We can’t see it, ever.'
          : 'Sign in to your zero-knowledge account.'}
      </p>

      <form onSubmit={submit} className="mt-8 flex flex-col gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          className="rounded-lg border border-hairline bg-card px-4 py-3 text-text placeholder:text-textFaint outline-none focus:border-primary"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          className="rounded-lg border border-hairline bg-card px-4 py-3 text-text placeholder:text-textFaint outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={busy}
          className="mt-1 rounded-lg bg-primary px-6 py-3 font-semibold text-[#06121F] disabled:opacity-50"
        >
          {busy
            ? isSignup
              ? 'Creating account…'
              : 'Signing in…'
            : isSignup
              ? 'Create account'
              : 'Sign in'}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-severe">{error}</p>}

      <p className="mt-6 text-sm text-textMuted">
        {isSignup ? (
          <>
            Already have an account?{' '}
            <Link href="/login" className="text-primary">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{' '}
            <Link href="/signup" className="text-primary">
              Create an account
            </Link>
          </>
        )}
      </p>
    </main>
  );
}
