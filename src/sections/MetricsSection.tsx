import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { PIN_PRIORITY } from '@/lib/scroll-pins';

gsap.registerPlugin(ScrollTrigger);

const metrics = [
  {
    value: '+40%',
    label: 'Eficiência operacional',
  },
  {
    value: '-30%',
    label: 'Custo de processos',
  },
  {
    value: '90 dias',
    label: 'Tempo médio para primeiros resultados',
  },
];

export default function MetricsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const subheadlineRef = useRef<HTMLParagraphElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const underlinesRef = useRef<(HTMLDivElement | null)[]>([]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=110%',
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          refreshPriority: PIN_PRIORITY.metrics,
        },
      });

      // ENTRANCE (0% - 30%)
      // Headline
      scrollTl.fromTo(
        headlineRef.current,
        { x: '-40vw', opacity: 0 },
        { x: 0, opacity: 1, duration: 0.22, ease: 'none' },
        0
      );

      // Subheadline
      scrollTl.fromTo(
        subheadlineRef.current,
        { x: '30vw', opacity: 0 },
        { x: 0, opacity: 1, duration: 0.22, ease: 'none' },
        0.08
      );

      // Metric cards (staggered)
      cardsRef.current.forEach((card, i) => {
        if (card) {
          scrollTl.fromTo(
            card,
            { y: '100vh', opacity: 0, scale: 0.96 },
            { y: 0, opacity: 1, scale: 1, duration: 0.2, ease: 'none' },
            0.12 + i * 0.05
          );
        }
      });

      // Accent underlines
      underlinesRef.current.forEach((line, i) => {
        if (line) {
          scrollTl.fromTo(
            line,
            { scaleX: 0 },
            { scaleX: 1, duration: 0.12, ease: 'none' },
            0.2 + i * 0.04
          );
        }
      });

      // SETTLE (30% - 70%) - hold

      // EXIT (70% - 100%)
      cardsRef.current.forEach((card) => {
        if (card) {
          scrollTl.fromTo(
            card,
            { y: 0, opacity: 1 },
            { y: '-50vh', opacity: 0, duration: 0.3, ease: 'power2.in' },
            0.7
          );
        }
      });

      scrollTl.fromTo(
        [headlineRef.current, subheadlineRef.current],
        { opacity: 1 },
        { opacity: 0, duration: 0.25, ease: 'power2.in' },
        0.75
      );

    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="section-pinned bg-venture-black z-40"
    >
      {/* Headline */}
      <div
        ref={headlineRef}
        className="absolute"
        style={{ left: '6vw', top: '14vh', width: '60vw' }}
      >
        <h2 className="headline-lg text-venture-white" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)' }}>
          <span className="block">Resultados</span>
          <span className="block">
            Re<span className="text-accent">ais</span>
          </span>
        </h2>
      </div>

      {/* Subheadline */}
      <p
        ref={subheadlineRef}
        className="absolute text-venture-gray text-base md:text-lg"
        style={{ left: '66vw', top: '14vh', width: '28vw', maxWidth: '320px' }}
      >
        Métricas típicas alcançadas em projetos de 90–120 dias.
      </p>

      {/* Metric Cards */}
      {metrics.map((metric, index) => {
        const leftPos = 6 + index * 30;

        return (
          <div
            key={index}
            ref={(el) => { cardsRef.current[index] = el; }}
            className="absolute card-border bg-venture-charcoal/30 backdrop-blur-sm flex flex-col justify-center items-center p-6 md:p-8"
            style={{
              left: `${leftPos}vw`,
              top: '42vh',
              width: '26vw',
              height: '48vh',
              maxWidth: '340px',
            }}
          >
            {/* Big Number */}
            <span className="font-display font-bold text-venture-white text-center mb-4" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)' }}>
              {metric.value}
            </span>

            {/* Accent Underline */}
            <div
              ref={(el) => { underlinesRef.current[index] = el; }}
              className="w-16 h-1 bg-accent mb-6 shrink-0"
              style={{ transformOrigin: 'left' }}
            />

            {/* Label */}
            <p className="text-venture-gray text-sm md:text-base text-center leading-relaxed">
              {metric.label}
            </p>
          </div>
        );
      })}
    </section>
  );
}
