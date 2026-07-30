import { useRef, useLayoutEffect, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useInsights } from '@/hooks/useInsights';
import { PIN_PRIORITY, scheduleScrollRefresh } from '@/lib/scroll-pins';

gsap.registerPlugin(ScrollTrigger);

const MAX_CARDS = 6;

/** Altura da navegação fixa; nada da grade pode terminar acima disso. */
const NAV_CLEARANCE = 96;

const GRID_GAP = 32;

/** Altura do card abaixo do thumbnail: categoria, tempo de leitura e título. */
const CARD_TEXT_HEIGHT = 95;

/**
 * Quantos cards cabem de fato na janela.
 *
 * A seção é fixada e tem `overflow: hidden`, então o que não couber some — e some por
 * cima, atrás do menu. Duas linhas só cabem em telas altas; abaixo disso a seção mostra
 * uma linha, e quem quiser o resto tem o "Ver todos os insights".
 *
 * O card é dimensionado pela largura da coluna (thumbnail 16/9), por isso a conta
 * depende das duas dimensões da janela.
 */
/** A seção só é renderizada no desktop, e ali a grade é sempre de três colunas. */
const COLUNAS = 3;

function fitCards(viewportWidth: number, viewportHeight: number): number {
  const larguraColuna = (viewportWidth * 0.88 - GRID_GAP * (COLUNAS - 1)) / COLUNAS;
  const alturaCard = (larguraColuna * 9) / 16 + CARD_TEXT_HEIGHT;

  // Espaço útil depois que o título sai de cena: da navegação até a folga inferior.
  const disponivel = viewportHeight - NAV_CLEARANCE - viewportHeight * 0.06;

  // Conta LINHAS, não cards — contar cards direto quebrava quando a grade não tinha
  // exatamente três colunas.
  const linhas = Math.max(1, Math.floor((disponivel + GRID_GAP) / (alturaCard + GRID_GAP)));

  return Math.min(MAX_CARDS, linhas * COLUNAS);
}

export default function InsightsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);

  const [cardCount, setCardCount] = useState(() =>
    typeof window === 'undefined' ? MAX_CARDS : fitCards(window.innerWidth, window.innerHeight)
  );

  const { insights, loading } = useInsights(cardCount);

  // Redimensionar muda quantos cards cabem; sem isso a grade volta a ser cortada.
  useEffect(() => {
    const onResize = () => setCardCount(fitCards(window.innerWidth, window.innerHeight));

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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

      // Quanto a grade sobe quando o título sai de cena.
      //
      // O teto é o que importa: subir mais do que `grid.offsetTop - NAV_CLEARANCE`
      // empurra a primeira linha para trás do menu fixo, que é opaco. Antes o cálculo
      // só olhava para a última linha e, em janelas mais baixas, comia meio card de
      // cima. Se nem assim a grade couber, `fitCards` já reduziu o número de cards.
      const getGridTravel = () => {
        const necessario =
          grid.offsetTop + grid.scrollHeight - section.clientHeight + section.clientHeight * 0.06;
        const maximo = Math.max(0, grid.offsetTop - NAV_CLEARANCE);

        return Math.max(0, Math.min(necessario, maximo));
      };

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
    ? Array.from({ length: cardCount }, (_, i) => ({ id: i, skeleton: true as const }))
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
      <div ref={gridRef} className="px-[6vw] grid grid-cols-3 gap-6 md:gap-8">
        {items.map((item, index) => (
          <Link
            key={item.id}
            ref={(el) => { cardsRef.current[index] = el; }}
            to={item.skeleton ? '#' : item.link}
            className="group relative cursor-pointer block"
            onClick={(event) => {
              if (item.skeleton) {
                event.preventDefault();
              }
            }}
          >
            {item.skeleton ? (
              <>
                {/* Skeleton Thumbnail */}
                <div className="relative overflow-hidden mb-4 aspect-[16/9] bg-venture-charcoal/30 animate-pulse rounded" />
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
                <div className="relative overflow-hidden mb-4 aspect-[16/9]">
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

                {/* Duas linhas no máximo: a altura do card entra no cálculo de quantas
                    linhas cabem, e um título de três linhas estouraria a conta. */}
                <h3 className="line-clamp-2 text-venture-white font-display font-semibold text-lg leading-snug group-hover:text-accent transition-colors duration-300">
                  {item.title}
                </h3>

                {/* Sobreposto ao thumbnail: reservar espaço no fluxo custava 32px por
                    card que só apareciam no hover — e era espaço que faltava embaixo. */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-venture-black via-venture-black/80 to-transparent px-3 pb-2 pt-8 text-sm text-venture-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
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
