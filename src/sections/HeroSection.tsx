import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';

import { useIsMobile } from '@/hooks/use-mobile';
import { PIN_PRIORITY } from '@/lib/scroll-pins';
import { scrollToHomeSection } from '@/lib/site-navigation';

gsap.registerPlugin(ScrollTrigger);

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const subheadlineRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const hairlineRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const wordsRef = useRef<HTMLSpanElement[]>([]);
  const isMobile = useIsMobile();

  const handleStartProject = () => scrollToHomeSection('contact');

  // Mobile: entrada simples, sem pin nem scroll-jacking (scroll normal do documento).
  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section || !isMobile) return;

    const ctx = gsap.context(() => {
      const entranceTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      entranceTl.fromTo(labelRef.current, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, 0);

      wordsRef.current.forEach((word, i) => {
        if (word) {
          entranceTl.fromTo(
            word,
            { y: 40, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.7 },
            0.1 + i * 0.1
          );
        }
      });

      entranceTl.fromTo(subheadlineRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, 0.35);
      entranceTl.fromTo(ctaRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, 0.45);
      entranceTl.fromTo(imageRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, 0.3);
    }, section);

    return () => ctx.revert();
  }, [isMobile]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section || isMobile) return;

    const ctx = gsap.context(() => {
      // ============================================
      // FASE 1: ENTRADA INICIAL (sem scroll)
      // Animação que roda uma vez quando a página carrega
      // ============================================
      const entranceTl = gsap.timeline({
        defaults: { ease: 'power3.out' },
      });

      // Label
      entranceTl.fromTo(
        labelRef.current,
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 },
        0
      );

      // Headline words (staggered)
      wordsRef.current.forEach((word, i) => {
        if (word) {
          entranceTl.fromTo(
            word,
            { y: 80, opacity: 0, rotateX: 20 },
            { y: 0, opacity: 1, rotateX: 0, duration: 0.9 },
            0.1 + i * 0.12
          );
        }
      });

      // Subheadline
      entranceTl.fromTo(
        subheadlineRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7 },
        0.4
      );

      // CTA
      entranceTl.fromTo(
        ctaRef.current,
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.6 },
        0.5
      );

      // Image
      entranceTl.fromTo(
        imageRef.current,
        { x: 80, opacity: 0, scale: 1.05 },
        { x: 0, opacity: 1, scale: 1, duration: 1 },
        0.2
      );

      // Hairline
      entranceTl.fromTo(
        hairlineRef.current,
        { scaleY: 0 },
        { scaleY: 1, duration: 0.8, transformOrigin: 'top' },
        0.3
      );

      // ============================================
      // FASE 2: ANIMAÇÃO DE SCROLL
      // Controla a saída quando o usuário scrolla.
      //
      // Precisa ser criada de forma síncrona, junto das demais seções fixadas: se
      // nascer depois (num onComplete, por exemplo) o pin-spacer do Hero entra na
      // página com todas as seções abaixo já medidas, e o ScrollTrigger passa a
      // trabalhar com posições defasadas. Os tweens usam .to() — o estado inicial é
      // lido só no primeiro scroll, então a entrada acima continua livre para rodar.
      // ============================================
      const scrollTl = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=140%',
          pin: true,
          scrub: 1.2,
          refreshPriority: PIN_PRIORITY.hero,
        },
      });

      // ============================================
      // SAÍDA
      // Mantém a primeira dobra estável antes de começar a transição.
      // ============================================
      scrollTl.to({}, { duration: 0.55 });
      scrollTl.addLabel('exit');

      // Headline sai para a esquerda
      scrollTl.to(
        headlineRef.current,
        {
          x: '-50vw',
          opacity: 0,
          duration: 0.9
        },
        'exit'
      );

      // Image sai para a direita
      scrollTl.to(
        imageRef.current,
        {
          x: '30vw',
          opacity: 0,
          duration: 0.9
        },
        'exit'
      );

      // Hairline desaparece
      scrollTl.to(
        hairlineRef.current,
        {
          scaleY: 0,
          opacity: 0,
          duration: 0.7
        },
        'exit+=0.1'
      );

      // Subheadline e CTA saem para cima
      scrollTl.to(
        [subheadlineRef.current, ctaRef.current, labelRef.current],
        {
          y: -60,
          opacity: 0,
          duration: 0.7
        },
        'exit+=0.25'
      );

      // Se a entrada terminou sem ninguém ter rolado a página, relê os valores
      // iniciais da saída a partir do estado já assentado.
      entranceTl.eventCallback('onComplete', () => {
        if (scrollTl.progress() === 0) {
          scrollTl.invalidate();
        }
      });
    }, section);

    return () => ctx.revert();
  }, [isMobile]);

  if (isMobile) {
    return (
      <section
        ref={sectionRef}
        className="relative bg-venture-black flex flex-col pt-32 pb-16 px-6"
        style={{
          background: 'radial-gradient(ellipse at center, #141416 0%, #0B0B0C 70%)',
        }}
      >
        <span ref={labelRef} className="micro-label text-venture-gray">
          O que fazemos
        </span>

        <div ref={headlineRef} className="mt-6">
          <h1 className="headline-xl text-venture-white" style={{ fontSize: 'clamp(2.25rem, 10vw, 3.25rem)' }}>
            <span ref={(el) => { if (el) wordsRef.current[0] = el; }} className="block">
              Transformação
            </span>
            <span ref={(el) => { if (el) wordsRef.current[1] = el; }} className="block">
              Digi<span className="text-accent">tal</span>
            </span>
            <span
              ref={(el) => { if (el) wordsRef.current[2] = el; }}
              className="block"
              style={{ fontSize: '0.55em', marginTop: '0.2em' }}
            >
              acelerada
            </span>
          </h1>
        </div>

        <div ref={imageRef} className="mt-8 overflow-hidden rounded-md aspect-[4/3]">
          <img
            src="/hero_portrait.jpg"
            alt="Business Professional"
            className="w-full h-full object-cover"
            style={{ filter: 'grayscale(40%) contrast(1.1)' }}
          />
        </div>

        <p ref={subheadlineRef} className="mt-8 text-venture-gray text-base leading-relaxed">
          Estratégia, operações, e aprimoramento e automatização de processos com inteligência artificial.
        </p>

        <button
          ref={ctaRef}
          onClick={handleStartProject}
          className="btn-primary mt-8 flex items-center justify-center gap-3 group self-start"
        >
          Iniciar um projeto
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </button>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="section-pinned bg-venture-black z-10 flex items-center"
      style={{
        background: 'radial-gradient(ellipse at center, #141416 0%, #0B0B0C 70%)'
      }}
    >
      {/* Micro Label */}
      <span
        ref={labelRef}
        className="micro-label text-venture-gray absolute z-10"
        style={{ left: '6vw', top: '14vh' }}
      >
        O que fazemos
      </span>

      {/* Headline Block */}
      <div
        ref={headlineRef}
        className="absolute z-10"
        style={{ left: '6vw', top: '24vh', width: '48vw' }}
      >
        <h1 className="headline-xl text-venture-white" style={{ fontSize: 'clamp(2rem, 6.5vw, 5.5rem)' }}>
          <span
            ref={(el) => { if (el) wordsRef.current[0] = el; }}
            className="block"
          >
            Transformação
          </span>
          <span
            ref={(el) => { if (el) wordsRef.current[1] = el; }}
            className="block"
          >
            Digi<span className="text-accent">tal</span>
          </span>
          <span
            ref={(el) => { if (el) wordsRef.current[2] = el; }}
            className="block"
            style={{ fontSize: '0.55em', marginTop: '0.2em' }}
          >
            acelerada
          </span>
        </h1>
      </div>

      {/* Subheadline */}
      <p
        ref={subheadlineRef}
        className="absolute text-venture-gray text-lg md:text-xl leading-relaxed z-10"
        style={{ left: '6vw', top: '64vh', width: '38vw', maxWidth: '480px' }}
      >
        Estratégia, operações, e aprimoramento e automatização de processos com inteligência artificial.
      </p>

      {/* CTA Button */}
      <button
        ref={ctaRef}
        onClick={handleStartProject}
        className="btn-primary absolute flex items-center gap-3 group z-10"
        style={{ left: '6vw', top: '78vh' }}
      >
        Iniciar um projeto
        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
      </button>

      {/* Hero Image */}
      <div
        ref={imageRef}
        className="absolute overflow-hidden z-0"
        style={{ right: '6vw', top: '24vh', width: '34vw', height: '62vh', maxWidth: '500px' }}
      >
        <img
          src="/hero_portrait.jpg"
          alt="Business Professional"
          className="w-full h-full object-cover"
          style={{ filter: 'grayscale(40%) contrast(1.1)' }}
        />
      </div>

      {/* Hairline Divider */}
      <div
        ref={hairlineRef}
        className="hairline absolute w-px"
        style={{ left: '56vw', top: '24vh', height: '62vh' }}
      />
    </section>
  );
}
