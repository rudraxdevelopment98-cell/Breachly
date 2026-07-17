'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { BrokerListingStatus } from '@aegis/types';
import { checkBreaches, isValidEmail, scanBrokers } from '@/lib/api';

const STATUS_LABEL: Record<BrokerListingStatus, { text: string; color: string }> = {
  found: { text: 'Found', color: 'text-exposed border-exposed' },
  opt_out_pending: { text: 'Opt-out pending', color: 'text-primary border-primary' },
  removed: { text: 'Removed', color: 'text-safe border-safe' },
  reappeared: { text: 'Reappeared', color: 'text-severe border-severe' },
};

export default function Dashboard() {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);

  const breach = useMutation({ mutationFn: (e: string) => checkBreaches(e) });
  const brokers = useQuery({ queryKey: ['brokers'], queryFn: scanBrokers });

  const trimmed = email.trim();
  const invalid = touched && trimmed.length > 0 && !isValidEmail(trimmed);
  const result = breach.data;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="font-mono text-xs tracking-widest text-primary">AEGIS</p>
      <h1 className="mt-2 text-3xl font-bold">Exposure dashboard</h1>
      <p className="mt-2 text-textMuted">
        Check an email against known breaches and see your data-broker exposure.
        Private by design — secrets never leave your device.
      </p>

      {/* Breach check */}
      <section className="mt-8">
        <div className="flex gap-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="you@example.com"
            className="flex-1 rounded-lg border border-hairline bg-card px-4 py-3 text-text placeholder:text-textFaint outline-none focus:border-primary"
          />
          <button
            onClick={() => {
              setTouched(true);
              if (isValidEmail(trimmed)) breach.mutate(trimmed);
            }}
            disabled={breach.isPending}
            className="rounded-lg bg-primary px-6 py-3 font-semibold text-[#06121F] disabled:opacity-40"
          >
            {breach.isPending ? 'Checking…' : 'Check'}
          </button>
        </div>
        {invalid && (
          <p className="mt-2 text-sm text-exposed">Enter a valid email address.</p>
        )}
        {breach.isError && (
          <p className="mt-2 text-sm text-severe">
            {(breach.error as Error).message}
          </p>
        )}
      </section>

      {/* Breach result */}
      {result && (
        <section className="mt-8 rounded-2xl border border-hairline bg-card p-6">
          <span
            className={`inline-block rounded-full border px-3 py-1 font-mono text-xs ${
              result.breached ? 'text-exposed border-exposed' : 'text-safe border-safe'
            }`}
          >
            {result.breached
              ? `${result.breaches.length} BREACH${result.breaches.length === 1 ? '' : 'ES'}`
              : 'NO BREACHES FOUND'}
          </span>
          <h2 className="mt-3 text-xl font-semibold">
            {result.breached ? 'This email was exposed' : 'Looking clear'}
          </h2>

          <div className="mt-4 space-y-3">
            {result.breaches.map((b) => (
              <div
                key={b.id}
                className="rounded-xl border border-hairline bg-cardElevated p-4"
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-semibold">{b.title}</span>
                  <span className="font-mono text-xs text-textMuted">{b.year}</span>
                </div>
                <p className="mt-1 text-sm text-textMuted">{b.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {b.exposedFields.map((f) => (
                    <span
                      key={f}
                      className={`rounded border px-2 py-0.5 text-xs ${
                        /password/i.test(f)
                          ? 'border-exposed text-exposed'
                          : 'border-hairline text-textMuted'
                      }`}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Broker listings */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Data-broker exposure</h2>
        <p className="mt-1 text-sm text-textMuted">
          Curated people-search sites we monitor. California-registered brokers
          route through the DROP deletion platform.
        </p>
        <div className="mt-4 overflow-hidden rounded-2xl border border-hairline">
          {brokers.isLoading && (
            <p className="p-4 text-textMuted">Scanning brokers…</p>
          )}
          {brokers.data?.map((l, i) => {
            const s = STATUS_LABEL[l.status];
            return (
              <div
                key={l.id}
                className={`flex items-center justify-between px-4 py-3 ${
                  i > 0 ? 'border-t border-hairline' : ''
                }`}
              >
                <div>
                  <p className="font-medium">{l.brokerName}</p>
                  <p className="font-mono text-xs text-textFaint">
                    {l.brokerDomain}
                    {l.registry === 'ca_drop' ? ' · DROP-eligible' : ''}
                  </p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs ${s.color}`}>
                  {s.text}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="mt-12 text-center text-sm text-textFaint">
        Zero-knowledge by design · Breach data via Have I Been Pwned
      </footer>
    </main>
  );
}
