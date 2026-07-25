import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link, useLocation } from 'react-router-dom';

import { useIsMobile } from '@/hooks/use-mobile';
import { getHomeSectionHref, homeSectionLinks, scrollToHomeSection } from '@/lib/site-navigation';

// lucide-react 1.x removed brand/social logos, so we use inline SVGs.
// They use `currentColor` to keep the text-color hover transition working.
function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

gsap.registerPlugin(ScrollTrigger);

export default function FooterSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const isMobile = useIsMobile();

  const isHome = location.pathname === '/';
  const footerLinks = homeSectionLinks.filter((link) => !isMobile || !link.mobileHidden);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // Wordmark
      gsap.fromTo(
        wordmarkRef.current,
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: wordmarkRef.current,
            start: 'top 90%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Links
      gsap.fromTo(
        linksRef.current,
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: linksRef.current,
            start: 'top 90%',
            toggleActions: 'play none none reverse',
          },
          delay: 0.1,
        }
      );

      // Bottom
      gsap.fromTo(
        bottomRef.current,
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: bottomRef.current,
            start: 'top 95%',
            toggleActions: 'play none none reverse',
          },
          delay: 0.2,
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  const handleSectionClick = (sectionId: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isHome) {
      return;
    }

    event.preventDefault();
    scrollToHomeSection(sectionId);
  };

  return (
    <footer
      ref={sectionRef}
      className="relative bg-venture-black z-[100] py-12 md:py-16"
    >
      <div className="px-[6vw]">
        {/* Top Row */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
          {/* Wordmark */}
          <div ref={wordmarkRef}>
            <span className="font-display font-bold text-venture-white text-4xl md:text-5xl tracking-tight">
              VENTURE
            </span>
            <p className="text-venture-gray text-sm mt-2">
              Consultoria em Gestão de Processos e Gestão de Riscos
            </p>
          </div>

          {/* Navigation Links */}
          <div ref={linksRef} className="flex flex-wrap gap-6 md:gap-8">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                to={getHomeSectionHref(link.sectionId)}
                onClick={handleSectionClick(link.sectionId)}
                className="text-venture-gray hover:text-venture-white transition-colors text-sm font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="hairline h-px w-full mb-8" />

        {/* Bottom Row */}
        <div
          ref={bottomRef}
          className="flex flex-col md:flex-row justify-between items-center gap-4"
        >
          <p className="text-venture-gray text-xs">
            © 2026 Venture Consultoria. Todos os direitos reservados.
          </p>

          {/* Social Icons */}
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="text-venture-gray hover:text-accent transition-colors"
              aria-label="LinkedIn"
            >
              <LinkedinIcon className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="text-venture-gray hover:text-accent transition-colors"
              aria-label="Instagram"
            >
              <InstagramIcon className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
