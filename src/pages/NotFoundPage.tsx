import { Link } from 'react-router-dom';

import { usePageMeta } from '@/hooks/usePageMeta';

export default function NotFoundPage() {
  usePageMeta({
    title: 'Página não encontrada | Venture',
    description: 'O conteúdo solicitado não foi encontrado no novo site da Venture.',
    canonical: '/404',
  });

  return (
    <section className="px-[6vw] pt-40 pb-24 md:pt-48 md:pb-32">
      <div className="max-w-3xl">
        <span className="micro-label text-accent block mb-4">404</span>
        <h1 className="headline-lg text-venture-white mb-6" style={{ fontSize: 'clamp(3rem, 7vw, 5rem)' }}>
          Conteúdo não encontrado
        </h1>
        <p className="text-lg text-venture-gray mb-10 leading-relaxed max-w-2xl">
          A rota existe no novo front, mas este slug não retornou conteúdo válido do WordPress.
        </p>

        <div className="flex flex-wrap gap-4">
          <Link to="/" className="btn-primary">
            Voltar para a home
          </Link>
          <Link
            to="/insights"
            className="inline-flex items-center rounded-md border border-white/15 px-6 py-4 text-sm font-medium text-venture-white transition-colors hover:border-accent hover:text-accent"
          >
            Explorar insights
          </Link>
        </div>
      </div>
    </section>
  );
}