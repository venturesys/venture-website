import { Suspense, lazy, useEffect } from 'react';
import { Outlet, Route, Routes, useLocation } from 'react-router-dom';

import Navigation from './components/Navigation';
import FooterSection from './sections/FooterSection';
import ContentDetailPage from './pages/ContentDetailPage';
import ContentListingPage from './pages/ContentListingPage';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';
// O painel é carregado sob demanda: nada dele vai no bundle de quem só visita o site.
const AdminRoutes = lazy(() => import('./pages/admin/AdminRoutes'));

import './App.css';

function ScrollManager() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/' && location.hash) {
      return;
    }

    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.hash, location.pathname]);

  return null;
}

function SiteLayout() {
  return (
    <div className="relative min-h-screen bg-venture-black">
      <div className="noise-overlay" />
      <ScrollManager />
      <Navigation />
      <main className="relative z-10">
        <Outlet />
      </main>
      <FooterSection />
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* Painel: fora do SiteLayout, sem navegação nem rodapé do site público. */}
      <Route
        path="admin/*"
        element={
          <Suspense fallback={<div className="min-h-screen bg-white" />}>
            <AdminRoutes />
          </Suspense>
        }
      />

      <Route element={<SiteLayout />}>
        <Route index element={<HomePage />} />
        <Route path="insights" element={<ContentListingPage family="insight" />} />
        <Route path="insights/:slug" element={<ContentDetailPage family="insight" />} />
        <Route path="cases" element={<ContentListingPage family="case" />} />
        <Route path="cases/:slug" element={<ContentDetailPage family="case" />} />
        <Route path="servicos" element={<ContentListingPage family="service" />} />
        <Route path="servicos/:slug" element={<ContentDetailPage family="service" />} />
        <Route path="parceiros" element={<ContentListingPage family="partner" />} />
        <Route path="parceiros/:slug" element={<ContentDetailPage family="partner" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
