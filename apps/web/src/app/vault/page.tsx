'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { DecryptedVaultItem } from '@aegis/types';
import { AuthBar } from '@/components/AuthBar';
import { useAuth } from '@/lib/authStore';
import {
  deleteVaultItem,
  listVaultItems,
  saveVaultItem,
} from '@/lib/vault';

export default function VaultPage() {
  const { session, encryptionKeyB64, hydrated, hydrate } = useAuth();
  const [items, setItems] = useState<DecryptedVaultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reveal, setReveal] = useState<Record<string, boolean>>({});

  // form
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  const refresh = useCallback(async () => {
    if (!session || !encryptionKeyB64) return;
    setLoading(true);
    setError(null);
    try {
      setItems(await listVaultItems(session.accessToken, encryptionKeyB64));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load vault.');
    } finally {
      setLoading(false);
    }
  }, [session, encryptionKeyB64]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !encryptionKeyB64) return;
    setSaving(true);
    setError(null);
    try {
      await saveVaultItem(session.accessToken, encryptionKeyB64, 'password', {
        title,
        url: url || undefined,
        username: username || undefined,
        password,
      });
      setTitle('');
      setUrl('');
      setUsername('');
      setPassword('');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!session) return;
    await deleteVaultItem(session.accessToken, id);
    await refresh();
  }

  const input =
    'rounded-lg border border-hairline bg-card px-4 py-3 text-text placeholder:text-textFaint outline-none focus:border-primary';

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <AuthBar />
      <div className="mt-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Password vault</h1>
        <Link href="/" className="text-sm text-textMuted hover:text-text">
          ← Dashboard
        </Link>
      </div>
      <p className="mt-2 text-textMuted">
        Everything here is encrypted on your device before it’s saved — titles and
        URLs included. We can never read it.
      </p>

      {/* Not signed in / key not in memory */}
      {!session ? (
        <div className="mt-8 rounded-2xl border border-hairline bg-card p-6">
          <p className="text-textMuted">
            <Link href="/login" className="text-primary">
              Sign in
            </Link>{' '}
            or{' '}
            <Link href="/signup" className="text-primary">
              create an account
            </Link>{' '}
            to use your vault.
          </p>
        </div>
      ) : !encryptionKeyB64 ? (
        <div className="mt-8 rounded-2xl border border-hairline bg-card p-6">
          <p className="text-textMuted">
            Your encryption key isn’t in memory (it’s never stored). Please{' '}
            <Link href="/login" className="text-primary">
              sign in again
            </Link>{' '}
            to unlock the vault.
          </p>
        </div>
      ) : (
        <>
          <form
            onSubmit={add}
            className="mt-8 flex flex-col gap-3 rounded-2xl border border-hairline bg-card p-6"
          >
            <h2 className="text-lg font-semibold">Add a credential</h2>
            <input className={input} placeholder="Name (e.g. Bank of Example)" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <input className={input} placeholder="Website (optional)" value={url} onChange={(e) => setUrl(e.target.value)} />
            <input className={input} placeholder="Username or email" value={username} onChange={(e) => setUsername(e.target.value)} />
            <input className={input} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit" disabled={saving} className="mt-1 rounded-lg bg-primary px-6 py-3 font-semibold text-[#06121F] disabled:opacity-50">
              {saving ? 'Encrypting & saving…' : 'Save to vault'}
            </button>
          </form>

          {error && <p className="mt-3 text-sm text-severe">{error}</p>}

          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-xs tracking-widest text-textFaint">
                YOUR CREDENTIALS
              </span>
              {loading && <span className="text-xs text-textFaint">Loading…</span>}
            </div>

            {items.length === 0 && !loading ? (
              <p className="rounded-2xl border border-hairline bg-card p-6 text-textMuted">
                No credentials yet. Add your first one above.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {items.map((it) => (
                  <div key={it.id} className="rounded-xl border border-hairline bg-cardElevated p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{it.data.title}</p>
                        {it.data.url && (
                          <p className="font-mono text-xs text-textFaint">{it.data.url}</p>
                        )}
                      </div>
                      <button onClick={() => remove(it.id)} className="text-xs text-textFaint hover:text-severe">
                        Delete
                      </button>
                    </div>
                    {it.data.username && (
                      <p className="mt-2 text-sm text-textMuted">{it.data.username}</p>
                    )}
                    <div className="mt-1 flex items-center gap-3">
                      <span className="font-mono text-sm">
                        {reveal[it.id] ? it.data.password : '••••••••••'}
                      </span>
                      <button
                        onClick={() => setReveal((r) => ({ ...r, [it.id]: !r[it.id] }))}
                        className="text-xs text-primary"
                      >
                        {reveal[it.id] ? 'Hide' : 'Reveal'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
