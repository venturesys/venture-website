import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Workflow, Shield, Cpu, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useIsMobile } from '@/hooks/use-mobile';
import { PIN_PRIORITY } from '@/lib/scroll-pins';
import { getContentPath, serviceHighlights } from '@/lib/content-meta';

gsap.registerPlugin(ScrollTrigger);

const capabilities = [
  {
    id: 'estrategia',
    label: 'ESTRATÉGIA',
    title: 'Estratégia e Sustentabilidade, com visão de longo prazo.',
    icon: Shield,
    slug: serviceHighlights[0].slug,
  },
  {
    id: 'digital',
    label: 'TRANSFORMAÇÃO',
    title: 'Transformação Digital com uso de tecnologias inovadoras.',
    icon: Cpu,
    slug: serviceHighlights[1].slug,
  },
  {
    id: 'perf',
    label: 'PERFORMANCE',
    title: 'Performance e Tecnologia em automação e TI.',
    icon: Workflow,
    slug: serviceHighlights[2].slug,
  },
  {
    id: 'projetos',
    label: 'PROJETOS',
    title: 'Gestão em Projetos de Capital, controlando riscos e prazos.',
    icon: Building2,
    slug: serviceHighlights[3].slug,
  },
];

export default function CapabilitiesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const paragraphRef = useRef<HTMLParagraphElement>(null);
  const approachTitleRef = useRef<HTMLDivElement>(null);
  const approachTextRef = useRef<HTMLDivElement>(null);
  const tilesRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);
  const isMobile = useIsMobile();

  // Mobile: reveal simples ao rolar, sem pin nem scroll-jacking.
  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section || !isMobile) return;

    const ctx = gsap.context(() => {
      const reveal = (target: gsap.TweenTarget, trigger: Element | null, delay = 0) => {
        if (!trigger) return;
        gsap.fromTo(
          target,
          { y: 28, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            ease: 'power3.out',
            delay,
            scrollTrigger: {
              trigger,
              start: 'top 88%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      };

      reveal(headlineRef.current, headlineRef.current);
      reveal(paragraphRef.current, paragraphRef.current, 0.1);

      tilesRef.current.forEach((tile, i) => {
        if (tile) reveal(tile, tile, (i % 2) * 0.08);
      });

      reveal(approachTitleRef.current, approachTitleRef.current);
      reveal(approachTextRef.current, approachTextRef.current, 0.1);
    }, section);

    return () => ctx.revert();
  }, [isMobile]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section || isMobile) return;

    const ctx = gsap.context(() => {
      const tiles = tilesRef.current.filter((tile): tile is HTMLAnchorElement => Boolean(tile));
      const bars = barsRef.current.filter((bar): bar is HTMLDivElement => Boolean(bar));

      gsap.set([approachTitleRef.current, approachTextRef.current], { autoAlpha: 0 });

      const scrollTl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=2800',
          pin: true,
          scrub: 0.75,
          invalidateOnRefresh: true,
          refreshPriority: PIN_PRIORITY.capabilities,
        },
      });

      scrollTl.addLabel('specializedIn');

      scrollTl.fromTo(
        headlineRef.current,
        { x: '-18vw', autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: 0.28 },
        'specializedIn'
      );

      scrollTl.fromTo(
        paragraphRef.current,
        { x: '12vw', autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: 0.28 },
        'specializedIn+=0.04'
      );

      scrollTl.fromTo(
        tiles,
        { y: 72, autoAlpha: 0, scale: 0.96 },
        { y: 0, autoAlpha: 1, scale: 1, duration: 0.34, stagger: 0.035 },
        'specializedIn+=0.12'
      );

      scrollTl.fromTo(
        bars,
        { scaleX: 0 },
        { scaleX: 1, duration: 0.24, stagger: 0.03 },
        'specializedIn+=0.24'
      );

      scrollTl.to({}, { duration: 0.6 });
      scrollTl.addLabel('specializedOut');

      scrollTl.to(
        tiles,
        { y: -96, autoAlpha: 0, duration: 0.34, ease: 'power2.in', stagger: 0.025 },
        'specializedOut'
      );

      scrollTl.to(
        headlineRef.current,
        { x: '-24vw', autoAlpha: 0, duration: 0.32, ease: 'power2.in' },
        'specializedOut'
      );

      scrollTl.to(
        paragraphRef.current,
        { x: '18vw', autoAlpha: 0, duration: 0.32, ease: 'power2.in' },
        'specializedOut'
      );

      scrollTl.to({}, { duration: 0.18 });
      scrollTl.addLabel('approachIn');

      scrollTl.fromTo(
        approachTitleRef.current,
        { x: '18vw', autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: 0.36, ease: 'power2.out' },
        'approachIn'
      );

      scrollTl.fromTo(
        approachTextRef.current,
        { x: '-18vw', autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: 0.36, ease: 'power2.out' },
        'approachIn+=0.06'
      );

      scrollTl.to({}, { duration: 0.45 });
      scrollTl.addLabel('approachOut');

      scrollTl.to(
        approachTitleRef.current,
        { y: -72, autoAlpha: 0, duration: 0.48, ease: 'power2.inOut' },
        'approachOut'
      );

      scrollTl.to(
        approachTextRef.current,
        { y: -72, autoAlpha: 0, duration: 0.48, ease: 'power2.inOut' },
        'approachOut+=0.04'
      );
    }, section);

    return () => ctx.revert();
  }, [isMobile]);

  if (isMobile) {
    return (
      <section ref={sectionRef} className="relative bg-venture-black py-20 px-6">
        <div ref={headlineRef}>
          <h2 className="headline-lg text-venture-white" style={{ fontSize: 'clamp(2.25rem, 9vw, 3.25rem)' }}>
            <span className="block">Consultoria</span>
            <span className="block">
              Especializ<span className="text-accent">ada</span>
            </span>
          </h2>
        </div>

        <p ref={paragraphRef} className="text-venture-gray text-base leading-relaxed mt-4">
          Unimos metodologia e execução para entregar resultados em 90 dias.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10">
          {capabilities.map((cap, index) => {
            const Icon = cap.icon;

            return (
              <Link
                key={cap.id}
                ref={(el) => { tilesRef.current[index] = el; }}
                to={getContentPath('service', cap.slug)}
                className="relative card-border bg-venture-charcoal/50 backdrop-blur-sm flex flex-col justify-between p-6 gap-6 overflow-hidden"
              >
                <div
                  ref={(el) => { barsRef.current[index] = el; }}
                  className="accent-bar absolute top-0 left-0 right-0"
                />

                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-accent" />
                  <span className="micro-label text-venture-white">{cap.label}</span>
                </div>

                <p className="text-venture-gray text-sm leading-relaxed">
                  {cap.title}
                </p>
              </Link>
            );
          })}
        </div>

        <div ref={approachTitleRef} className="text-venture-white mt-16">
          <h3 className="headline-lg" style={{ fontSize: 'clamp(2rem, 8vw, 2.75rem)' }}>
            Nossa Abordagem
          </h3>
        </div>

        <div ref={approachTextRef} className="text-venture-gray leading-relaxed mt-4">
          <p className="text-lg font-medium text-venture-white mb-4">
            Fazer mais com Menos!
          </p>
          <p className="text-base">
            Combinamos <strong>práticas de mercado com inovações tecnológicas</strong>, para ofertar
            soluções de rápida implantação e baixo custo.
          </p>
          <p className="text-base mt-4">
            <strong>Integramos</strong> sua <strong>Estratégia</strong> aos <strong>Processos</strong>, com o suporte
            da <strong>Tecnologia e aplicação de Inteligência Artificial</strong>.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="section-pinned bg-venture-black z-30"
    >
      {/* Headline */}
      <div
        ref={headlineRef}
        className="absolute"
        style={{ left: '6vw', top: '14vh', width: '44vw' }}
      >
        <h2 className="headline-lg text-venture-white" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)' }}>
          <span className="block">Consultoria</span>
          <span className="block">
            Especializ<span className="text-accent">ada</span>
          </span>
        </h2>
      </div>

      {/* Paragraph */}
      <p
        ref={paragraphRef}
        className="absolute text-venture-gray text-base md:text-lg leading-relaxed"
        style={{ left: '54vw', top: '14vh', width: '40vw', maxWidth: '420px' }}
      >
        Unimos metodologia e execução para entregar resultados em 90 dias.
      </p>

      {/* Mosaic Tiles */}
      {capabilities.map((cap, index) => {
        const Icon = cap.icon;
        const leftPos = 6 + index * 22;

        return (
          <Link
            key={cap.id}
            ref={(el) => { tilesRef.current[index] = el; }}
            to={getContentPath('service', cap.slug)}
            className="absolute card-border bg-venture-charcoal/50 backdrop-blur-sm flex flex-col justify-between p-6 md:p-8"
            style={{
              position: 'absolute',
              left: `${leftPos}vw`,
              top: '38vh',
              width: '21vw',
              height: '52vh',
              maxWidth: '300px',
            }}
          >
            {/* Accent Bar */}
            <div
              ref={(el) => { barsRef.current[index] = el; }}
              className="accent-bar absolute top-0 left-0 right-0"
              style={{ position: 'absolute', transformOrigin: 'left' }}
            />

            {/* Label */}
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5 text-accent" />
              <span className="micro-label text-venture-white">{cap.label}</span>
            </div>

            {/* Caption */}
            <p className="text-venture-gray text-sm md:text-base leading-relaxed">
              {cap.title}
            </p>
          </Link>
        );
      })}

      {/* Nossa Abordagem */}
      <div
        ref={approachTitleRef}
        className="absolute text-venture-white"
        style={{ left: '6vw', top: '25vh', width: '40vw', maxWidth: '500px' }}
      >
        <h3 className="headline-lg" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)' }}>
          Nossa Abordagem
        </h3>
      </div>

      <div
        ref={approachTextRef}
        className="absolute text-venture-gray leading-relaxed"
        style={{ left: '50vw', top: '25vh', width: '44vw', maxWidth: '500px' }}
      >
        <p className="text-lg md:text-xl font-medium text-venture-white mb-4">
          Fazer mais com Menos!
        </p>
        <p className="text-base md:text-lg">
          Combinamos <strong>práticas de mercado com inovações tecnológicas</strong>, para ofertar
          soluções de rápida implantação e baixo custo.
        </p>
        <p className="text-base md:text-lg mt-4">
          <strong>Integramos</strong> sua <strong>Estratégia</strong> aos <strong>Processos</strong>, com o suporte
          da <strong>Tecnologia e aplicação de Inteligência Artificial</strong>.
        </p>
      </div>
    </section>
  );
}
