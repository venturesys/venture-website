import { useRef, useLayoutEffect, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Layers, Bot, Building2, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useIsMobile } from '@/hooks/use-mobile';
import { usePartners } from '@/hooks/usePartners';
import { PIN_PRIORITY, scheduleScrollRefresh } from '@/lib/scroll-pins';

gsap.registerPlugin(ScrollTrigger);

// Static icon mapping — WP can't provide Lucide icons
const ICON_MAP: Record<string, LucideIcon> = {
  'softexpert-2': Layers,
  'biti9-rpa': Bot,
};

export default function PartnersSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLAnchorElement | null)[]>([]);

  const { partners, loading } = usePartners();
  const isMobile = useIsMobile();

  // Mobile: reveal simples ao rolar, sem pin nem scroll-jacking.
  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section || !isMobile || loading || partners.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        headlineRef.current,
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: headlineRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      cardsRef.current.forEach((card) => {
        if (!card) return;
        gsap.fromTo(
          card,
          { y: 32, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 90%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });
    }, section);

    return () => ctx.revert();
  }, [isMobile, partners, loading]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section || isMobile || loading || partners.length === 0) return;

    const ctx = gsap.context(() => {
      const partnerCards = cardsRef.current.filter(
        (card): card is HTMLAnchorElement => Boolean(card)
      );
      const cardEntranceStagger = 0.18 / Math.max(1, partnerCards.length - 1);
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=110%',
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          refreshPriority: PIN_PRIORITY.partners,
        },
      });

      // ENTRANCE (0% - 30%)
      scrollTl.fromTo(
        headlineRef.current,
        { y: '-30vh', opacity: 0 },
        { y: 0, opacity: 1, duration: 0.22, ease: 'none' },
        0
      );

      partnerCards.forEach((card, i) => {
        if (card) {
          scrollTl.fromTo(
            card,
            { x: '60vw', opacity: 0, rotateY: 10 },
            { x: 0, opacity: 1, rotateY: 0, duration: 0.22, ease: 'none' },
            0.1 + i * cardEntranceStagger
          );
        }
      });

      // EXIT (70% - 100%)
      partnerCards.forEach((card) => {
        if (card) {
          scrollTl.fromTo(
            card,
            { x: 0, opacity: 1 },
            { x: '-40vw', opacity: 0, duration: 0.3, ease: 'power2.in' },
            0.7
          );
        }
      });

      scrollTl.fromTo(
        headlineRef.current,
        { opacity: 1 },
        { opacity: 0, duration: 0.25, ease: 'power2.in' },
        0.75
      );

    }, section);

    return () => ctx.revert();
  }, [partners, loading, isMobile]);

  useEffect(() => {
    if (!loading) {
      scheduleScrollRefresh();
    }
  }, [loading]);

  // Use WP data or fallback skeletons with same structure
  const items = loading
    ? [
      { id: 0, slug: 'softexpert-2', name: 'SOFTEXPERT', description: '', tags: ['GESTÃO', 'CONFORMIDADE', 'EXCELÊNCIA'], skeleton: true as const },
      { id: 1, slug: 'biti9-rpa', name: 'BITI9', description: '', tags: ['RPA', 'AUTOMAÇÃO', 'IA'], skeleton: true as const },
    ]
    : partners.map((p) => ({ ...p, skeleton: false as const }));

  if (isMobile) {
    return (
      <section ref={sectionRef} className="relative bg-venture-black py-20 px-6">
        <div ref={headlineRef}>
          <h2 className="headline-lg text-venture-white" style={{ fontSize: 'clamp(2.25rem, 9vw, 3.25rem)' }}>
            <span className="block">Nossas</span>
            <span className="block">
              Parcer<span className="text-accent">ias</span>
            </span>
          </h2>

          <Link
            to="/parceiros"
            className="inline-flex items-center gap-2 mt-6 text-sm font-medium text-accent transition-colors hover:text-venture-white"
          >
            <span>Explorar parceiros</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 mt-10">
          {items.map((partner, index) => {
            const Icon = ICON_MAP[partner.slug] ?? Building2;

            return (
              <Link
                key={partner.id}
                ref={(el) => { cardsRef.current[index] = el; }}
                to={partner.skeleton ? '#' : partner.link}
                className="card-border bg-venture-charcoal/30 backdrop-blur-sm flex flex-col justify-between p-6"
                onClick={(event) => {
                  if (partner.skeleton) {
                    event.preventDefault();
                  }
                }}
              >
                <div className="mb-4">
                  <Icon className="w-8 h-8 text-accent" />
                </div>

                <div>
                  <h3 className="font-display font-bold text-venture-white text-xl uppercase tracking-tight mb-3">
                    {partner.name}
                  </h3>
                  {partner.skeleton ? (
                    <div className="space-y-2 mb-4">
                      <div className="h-4 w-full bg-venture-charcoal/30 animate-pulse rounded" />
                      <div className="h-4 w-2/3 bg-venture-charcoal/30 animate-pulse rounded" />
                    </div>
                  ) : (
                    <p className="text-venture-gray text-sm leading-relaxed mb-4">
                      {partner.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {partner.tags.map((tag) => (
                      <span
                        key={tag}
                        className="micro-label text-venture-gray px-2 py-1 bg-venture-black/50 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="section-pinned bg-venture-black z-[80]"
    >
      {/* Headline */}
      <div
        ref={headlineRef}
        className="absolute"
        style={{ left: '6vw', top: '14vh', width: '60vw' }}
      >
        <h2 className="headline-lg text-venture-white" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)' }}>
          <span className="block">Nossas</span>
          <span className="block">
            Parcer<span className="text-accent">ias</span>
          </span>
        </h2>

        <Link
          to="/parceiros"
          className="inline-flex items-center gap-2 mt-6 text-sm font-medium text-accent transition-colors hover:text-venture-white"
        >
          <span>Explorar parceiros</span>
        </Link>
      </div>

      {/* Partner Cards */}
      <div
        className="absolute grid"
        style={{
          left: '6vw',
          right: '6vw',
          top: '42vh',
          gridAutoFlow: 'column',
          gridAutoColumns: 'minmax(min(280px, 88vw), 420px)',
          columnGap: 0,
          rowGap: '24px',
          perspective: '1000px',
        }}
      >
        {items.map((partner, index) => {
          const Icon = ICON_MAP[partner.slug] ?? Building2;

          return (
            <Link
              key={partner.id}
              ref={(el) => { cardsRef.current[index] = el; }}
              to={partner.skeleton ? '#' : partner.link}
              className="card-border bg-venture-charcoal/30 backdrop-blur-sm flex min-w-0 flex-col justify-between p-6 md:p-8"
              style={{
                height: 'min(44vh, 300px)',
              }}
              onClick={(event) => {
                if (partner.skeleton) {
                  event.preventDefault();
                }
              }}
            >
              {/* Icon */}
              <div className="mb-4">
                <Icon className="w-8 h-8 text-accent" />
              </div>

              {/* Content */}
              <div>
                <h3 className="font-display font-bold text-venture-white text-xl md:text-2xl uppercase tracking-tight mb-3">
                  {partner.name}
                </h3>
                {partner.skeleton ? (
                  <div className="space-y-2 mb-4">
                    <div className="h-4 w-full bg-venture-charcoal/30 animate-pulse rounded" />
                    <div className="h-4 w-2/3 bg-venture-charcoal/30 animate-pulse rounded" />
                  </div>
                ) : (
                  <p className="text-venture-gray text-sm md:text-base leading-relaxed mb-4">
                    {partner.description}
                  </p>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {partner.tags.map((tag) => (
                    <span
                      key={tag}
                      className="micro-label text-venture-gray px-2 py-1 bg-venture-black/50 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
