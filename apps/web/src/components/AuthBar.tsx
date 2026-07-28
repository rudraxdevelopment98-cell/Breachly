'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useAuth } from '@/lib/authStore';

/** Top bar showing auth state — sign in / create account, or the signed-in user. */
export function AuthBar() {
  const { session, hydrated, hydrate, logout } = useAuth();

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  return (
    <div className="flex items-center justify-between border-b border-hairline pb-4">
      <span className="font-mono text-xs tracking-widest text-primary">AEGIS</span>
      {session ? (
        <div className="flex items-center gap-4 text-sm">
          <Link href="/vault" className="text-textMuted hover:text-text">
            Vault
          </Link>
          <span className="font-mono text-xs text-textMuted">{session.email}</span>
          <button onClick={logout} className="text-textFaint hover:text-text">
            Log out
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-4 text-sm">
          <Link href="/login" className="text-textMuted hover:text-text">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-primary px-4 py-2 font-semibold text-[#06121F]"
          >
            Create account
          </Link>
        </div>
      )}
    </div>
  );
}
