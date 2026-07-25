import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { PIN_PRIORITY } from '@/lib/scroll-pins';
import type { CaseStudy } from '@/types/content';

gsap.registerPlugin(ScrollTrigger);

interface Props {
  data?: CaseStudy | null;
  loading?: boolean;
}

export default function CaseAngloSection({ data }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const hairlineRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);

  // Conteúdo de reserva caso o case saia do repositório.
  const client = data?.client ?? 'Anglo American';
  const headline = data?.headline ?? 'Integração de áreas e aprimoramento da gestão.';
  const body = data?.body ?? 'Resultados expressivos nos principais processos-chave da organização, com apoio e expertise direcionados.';
  const image = data?.image || '/case_anglo.jpg';
  // Sem o case no repositório não existe rota de destino: o CTA fica inerte em vez
  // de virar um link morto para "#".
  const link = data?.link;

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=120%',
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          refreshPriority: PIN_PRIORITY.caseAnglo,
        },
      });

      // ENTRANCE (0% - 30%)
      scrollTl.fromTo(
        textRef.current,
        { x: '-50vw', opacity: 0 },
        { x: 0, opacity: 1, duration: 0.28, ease: 'none' },
        0
      );

      scrollTl.fromTo(
        hairlineRef.current,
        { scaleY: 0 },
        { scaleY: 1, duration: 0.18, ease: 'none' },
        0.1
      );

      scrollTl.fromTo(
        imageRef.current,
        { x: '60vw', opacity: 0, scale: 1.06 },
        { x: 0, opacity: 1, scale: 1, duration: 0.28, ease: 'none' },
        0.08
      );

      scrollTl.fromTo(
        ctaRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.2, ease: 'none' },
        0.18
      );

      // EXIT (70% - 100%)
      scrollTl.fromTo(
        textRef.current,
        { x: 0, opacity: 1 },
        { x: '-30vw', opacity: 0, duration: 0.3, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        imageRef.current,
        { x: 0, opacity: 1 },
        { x: '30vw', opacity: 0, duration: 0.3, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        hairlineRef.current,
        { opacity: 1 },
        { opacity: 0, duration: 0.25, ease: 'power2.in' },
        0.75
      );

      scrollTl.fromTo(
        ctaRef.current,
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
      className="section-pinned bg-venture-black z-[60]"
    >
      {/* Left Text Block */}
      <div
        ref={textRef}
        className="absolute"
        style={{ left: '6vw', top: '12vh', width: '32vw', maxWidth: '400px' }}
      >
        <span className="micro-label text-accent block mb-4">Case</span>

        <h3 className="headline-lg text-venture-white mb-4" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 3rem)' }}>
          {client}
        </h3>

        <p className="text-venture-white text-lg md:text-xl font-medium mb-4 leading-snug">
          {headline}
        </p>

        <p className="text-venture-gray text-base leading-relaxed mb-8">
          {body}
        </p>

        <Link
          ref={ctaRef}
          to={link ?? '#'}
          aria-disabled={link ? undefined : true}
          onClick={(event) => {
            if (!link) {
              event.preventDefault();
            }
          }}
          className="inline-flex items-center gap-2 text-accent hover:text-white transition-colors group"
        >
          <span className="text-sm font-medium">Ler o case completo</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Vertical Hairline */}
      <div
        ref={hairlineRef}
        className="hairline absolute w-px"
        style={{ left: '40vw', top: '12vh', height: '76vh', transformOrigin: 'top' }}
      />

      {/* Large Case Image (Right) */}
      <div
        ref={imageRef}
        className="absolute overflow-hidden"
        style={{ right: '6vw', top: '12vh', width: '52vw', height: '76vh', maxWidth: '700px' }}
      >
        <img
          src={image}
          alt={`${client} Case Study`}
          className="w-full h-full object-cover"
          style={{ filter: 'grayscale(40%) contrast(1.1)' }}
        />
      </div>
    </section>
  );
}
