import { useCallback, useMemo, useState, type ReactNode } from 'react';

import { AdminSessionContext } from '@/hooks/useAdminSession';
import { signIn, type GitHubSession, type RepoConfig } from '@/lib/github';

/**
 * A sessão (incluindo o token) fica só no `sessionStorage` desta aba: fechou o
 * navegador, precisa entrar de novo. Nada é gravado no repositório.
 */
const STORAGE_KEY = 'venture.admin.session';

export default function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<GitHubSession | null>(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as GitHubSession) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback(async (token: string, config: RepoConfig) => {
    const next = await signIn(token, config);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSession(next);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }, []);

  const value = useMemo(() => ({ session, login, logout }), [session, login, logout]);

  return <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>;
}
