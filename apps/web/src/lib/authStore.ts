'use client';

import { create } from 'zustand';

export interface Session {
  email: string;
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  session: Session | null;
  /**
   * The client-side encryption_key (base64), held IN MEMORY ONLY — never
   * persisted. It's gone on reload (re-login re-derives it). This is what keeps
   * the vault zero-knowledge: it never touches disk or the server.
   */
  encryptionKeyB64: string | null;
  hydrated: boolean;
  setSession: (session: Session, encryptionKeyB64: string) => void;
  hydrate: () => void;
  logout: () => void;
}

const STORAGE_KEY = 'aegis.session';

export const useAuth = create<AuthState>((set) => ({
  session: null,
  encryptionKeyB64: null,
  hydrated: false,
  setSession: (session, encryptionKeyB64) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }
    set({ session, encryptionKeyB64 });
  },
  hydrate: () => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(STORAGE_KEY);
    set({ session: raw ? (JSON.parse(raw) as Session) : null, hydrated: true });
  },
  logout: () => {
    if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY);
    set({ session: null, encryptionKeyB64: null });
  },
}));
