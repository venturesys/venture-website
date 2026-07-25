import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import CapabilitiesSection from '@/sections/CapabilitiesSection';
import CaseAngloSection from '@/sections/CaseAngloSection';
import CaseValeSection from '@/sections/CaseValeSection';
import ContactSection from '@/sections/ContactSection';
import HeroSection from '@/sections/HeroSection';
import InsightsSection from '@/sections/InsightsSection';
import MetricsSection from '@/sections/MetricsSection';
import PartnersSection from '@/sections/PartnersSection';
import ProcessSection from '@/sections/ProcessSection';
import { useCases } from '@/hooks/useCases';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePageMeta } from '@/hooks/usePageMeta';
import { scheduleScrollRefresh } from '@/lib/scroll-pins';
import { scrollToHomeSection } from '@/lib/site-navigation';

gsap.registerPlugin(ScrollTrigger);

export default function HomePage() {
  const mainRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const isMobile = useIsMobile();
  const { vale, anglo, loading: casesLoading } = useCases();

  usePageMeta({
    title: 'Venture | Consultoria de alta performance',
    description:
      'Consultoria especializada em estratégia, transformação digital, performance e gestão de riscos com execução orientada a resultado.',
    canonical: '/',
    ogTitle: 'Venture | Consultoria de alta performance',
    ogDescription:
      'Estratégia, transformação digital, performance e gestão de projetos em páginas internas integradas ao WordPress.',
    ogImage: '/hero_portrait.jpg',
  });

  useEffect(() => {
    ScrollTrigger.config({
      limitCallbacks: true,
      ignoreMobileResize: true,
    });

    scheduleScrollRefresh();

    // Fontes e imagens mudam a altura dos cards depois do primeiro layout, e a
    // posição de cada pin depende dessa altura.
    if (document.readyState === 'complete') {
      return;
    }

    window.addEventListener('load', scheduleScrollRefresh);
    return () => window.removeEventListener('load', scheduleScrollRefresh);
  }, []);

  useEffect(() => {
    if (!casesLoading) {
      scheduleScrollRefresh();
    }
  }, [casesLoading]);

  useEffect(() => {
    scheduleScrollRefresh();
  }, [isMobile]);

  useEffect(() => {
    if (!location.hash) {
      return;
    }

    const sectionId = location.hash.replace('#', '');
    requestAnimationFrame(() => {
      scrollToHomeSection(sectionId);
    });
  }, [location.hash]);

  return (
    <div ref={mainRef} className="relative">
      {/* Ordem dos tópicos conforme pauta 3.1:
          1. Home  2. Nossa Abordagem / Porque a Venture  3. Consultoria – Serviços
          4. Resultados*  5. Cases*  6. Publicações*  7. Parcerias  8. Contato
          (* = "Fora MOBILE": não renderizadas no breakpoint mobile) */}
      <HeroSection />

      <ProcessSection />

      <div id="capabilities">
        <CapabilitiesSection />
      </div>

      {!isMobile && <MetricsSection />}

      {!isMobile && (
        <div id="cases">
          <CaseValeSection data={vale} loading={casesLoading} />
        </div>
      )}

      {!isMobile && <CaseAngloSection data={anglo} loading={casesLoading} />}

      {!isMobile && (
        <div id="insights">
          <InsightsSection />
        </div>
      )}

      <PartnersSection />

      <div id="contact">
        <ContactSection />
      </div>
    </div>
  );
}