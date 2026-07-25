import { useRef, useLayoutEffect, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useInsights } from '@/hooks/useInsights';
import { PIN_PRIORITY, scheduleScrollRefresh } from '@/lib/scroll-pins';

gsap.registerPlugin(ScrollTrigger);

const SKELETON_COUNT = 6;

export default function InsightsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);

  const { insights, loading } = useInsights(SKELETON_COUNT);

  // A seção fica fixa enquanto a grade avança da primeira para a segunda linha.
  // O cálculo usa a altura real dos cards, inclusive após os dados do WordPress chegarem.
  useLayoutEffect(() => {
    const section = sectionRef.current;
    const grid = gridRef.current;
    if (!section || !grid) return;

    const ctx = gsap.context(() => {
      const cards = cardsRef.current.filter(
        (card): card is HTMLAnchorElement => Boolean(card)
      );

      // Distância que a grade precisa subir para a última linha entrar por completo,
      // com uma folga de 8% da altura da seção sobrando embaixo.
      const getGridTravel = () =>
        Math.max(
          0,
          grid.offsetTop +
            grid.scrollHeight -
            section.clientHeight +
            section.clientHeight * 0.08
        );

      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () =>
            '+=' +
            Math.round(
              Math.max(window.innerHeight * 1.15, getGridTravel() * 2.7)
            ),
          pin: true,
          scrub: 0.65,
          invalidateOnRefresh: true,
          refreshPriority: PIN_PRIORITY.insights,
        },
      });

      scrollTl.fromTo(
        headingRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.18, ease: 'none' },
        0
      );

      scrollTl.fromTo(
        cards,
        { y: 40, opacity: 0, scale: 0.98 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.22,
          stagger: 0.025,
          ease: 'none',
        },
        0.05
      );

      scrollTl.to({}, { duration: 0.12 });

      scrollTl.to(
        headingRef.current,
        { y: -40, opacity: 0, duration: 0.22, ease: 'power1.inOut' },
        0.42
      );

      scrollTl.to(
        grid,
        { y: () => -getGridTravel(), duration: 0.34, ease: 'power1.inOut' },
        0.42
      );

      // Mantém a segunda linha inteira em tela antes de liberar Parcerias.
      scrollTl.to({}, { duration: 0.28 });
    }, section);

    return () => ctx.revert();
  }, [insights, loading]);

  // Recalcula as posições quando os dados chegam (agrupado com as outras seções).
  useEffect(() => {
    if (!loading) {
      scheduleScrollRefresh();
    }
  }, [loading]);

  // Items to render: real data or skeleton placeholders
  const items = loading
    ? Array.from({ length: SKELETON_COUNT }, (_, i) => ({ id: i, skeleton: true as const }))
    : insights.map((insight) => ({ ...insight, skeleton: false as const }));

  return (
    <section
      ref={sectionRef}
      className="section-pinned bg-venture-black z-[70] py-20 md:py-24"
    >
      {/* Heading Block */}
      <div
        ref={headingRef}
        className="px-[6vw] mb-12 md:mb-16"
      >
        <h2 className="headline-lg text-venture-white mb-4" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}>
          Insights
        </h2>
        <p className="text-venture-gray text-lg max-w-xl">
          Relatórios, análises e tendências para decisões melhores.
        </p>

        <Link
          to="/insights"
          className="inline-flex items-center gap-2 mt-6 text-sm font-medium text-accent transition-colors hover:text-venture-white"
        >
          <span>Ver todos os insights</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Grid */}
      <div ref={gridRef} className="px-[6vw] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {items.map((item, index) => (
          <Link
            key={item.id}
            ref={(el) => { cardsRef.current[index] = el; }}
            to={item.skeleton ? '#' : item.link}
            className="group cursor-pointer block"
            onClick={(event) => {
              if (item.skeleton) {
                event.preventDefault();
              }
            }}
          >
            {item.skeleton ? (
              <>
                {/* Skeleton Thumbnail */}
                <div className="relative overflow-hidden mb-4 aspect-[16/10] bg-venture-charcoal/30 animate-pulse rounded" />
                {/* Skeleton Meta */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-3 w-16 bg-venture-charcoal/30 animate-pulse rounded" />
                  <div className="h-3 w-12 bg-venture-charcoal/30 animate-pulse rounded" />
                </div>
                {/* Skeleton Title */}
                <div className="h-5 w-full bg-venture-charcoal/30 animate-pulse rounded mb-1" />
                <div className="h-5 w-2/3 bg-venture-charcoal/30 animate-pulse rounded" />
              </>
            ) : (
              <>
                {/* Thumbnail */}
                <div className="relative overflow-hidden mb-4 aspect-[16/10]">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    style={{ filter: 'grayscale(30%) contrast(1.05)' }}
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-accent/0 group-hover:bg-accent/10 transition-colors duration-300" />
                </div>

                {/* Content */}
                <div className="flex items-center gap-3 mb-2">
                  <span className="micro-label text-accent">{item.category}</span>
                  <span className="flex items-center gap-1 text-venture-gray text-xs">
                    <Clock className="w-3 h-3" />
                    {item.readTime}
                  </span>
                </div>

                <h3 className="text-venture-white font-display font-semibold text-lg leading-snug group-hover:text-accent transition-colors duration-300">
                  {item.title}
                </h3>

                <div className="mt-3 flex items-center gap-2 text-venture-gray text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span>Ler artigo</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
