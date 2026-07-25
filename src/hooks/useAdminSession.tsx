import { createContext, useContext } from 'react';

import type { GitHubSession, RepoConfig } from '@/lib/github';

export interface AdminSessionValue {
  session: GitHubSession | null;
  login: (token: string, config: RepoConfig) => Promise<void>;
  logout: () => void;
}

export const AdminSessionContext = createContext<AdminSessionValue | null>(null);

export function useAdminSession(): AdminSessionValue {
  const value = useContext(AdminSessionContext);

  if (!value) {
    throw new Error('useAdminSession precisa estar dentro de AdminSessionProvider');
  }

  return value;
}
