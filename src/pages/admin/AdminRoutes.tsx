import { Route, Routes } from 'react-router-dom';

import AdminSessionProvider from '@/components/admin/AdminSessionProvider';

import AdminEditorPage from './AdminEditorPage';
import AdminLayout from './AdminLayout';
import AdminListPage from './AdminListPage';
import AdminLoginPage from './AdminLoginPage';
import AdminSettingsPage from './AdminSettingsPage';

/**
 * Todo o painel num módulo só, carregado sob demanda por `App`. Assim nem o provider
 * de sessão nem o cliente do GitHub entram no bundle de quem apenas visita o site.
 */
export default function AdminRoutes() {
  return (
    <AdminSessionProvider>
      <Routes>
        <Route index element={<AdminLoginPage />} />
        <Route element={<AdminLayout />}>
          <Route path="cases" element={<AdminListPage section="cases" />} />
          <Route path="cases/:id" element={<AdminEditorPage section="cases" />} />
          <Route path="insights" element={<AdminListPage section="insights" />} />
          <Route path="insights/:id" element={<AdminEditorPage section="insights" />} />
          <Route path="configuracoes" element={<AdminSettingsPage />} />
        </Route>
      </Routes>
    </AdminSessionProvider>
  );
}
