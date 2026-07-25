import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import { useIsMobile } from '@/hooks/use-mobile';
import { getHomeSectionHref, homeSectionLinks, scrollToHomeSection } from '@/lib/site-navigation';

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();

  const isHome = location.pathname === '/';
  const menuLinks = homeSectionLinks.filter((link) => !isMobile || !link.mobileHidden);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (sectionId: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isHome) {
      setIsMenuOpen(false);
      return;
    }

    event.preventDefault();
    scrollToHomeSection(sectionId);
    setIsMenuOpen(false);
  };

  const handleLogoClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isHome) {
      setIsMenuOpen(false);
      return;
    }

    event.preventDefault();
    window.history.replaceState(null, '', '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Fixed Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-[1000] overflow-x-clip transition-all duration-500 ${isScrolled
            ? 'bg-venture-black/90 backdrop-blur-md py-4'
            : 'bg-transparent py-6'
          }`}
      >
        <div className="w-full min-w-0 px-[6vw] flex items-center justify-between">
          {/* Logo */}
          <Link to="/" onClick={handleLogoClick} className="flex min-w-0 max-w-[60vw] items-center gap-2">
            <img
              src="/logo-250x60.png"
              alt="Venture"
              className="h-10 max-w-full object-contain md:h-12"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {menuLinks.map((link) => (
              <Link
                key={link.label}
                to={getHomeSectionHref(link.sectionId)}
                onClick={handleNavClick(link.sectionId)}
                className="text-venture-gray hover:text-venture-white transition-colors text-sm font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex shrink-0 items-center gap-2 text-venture-white hover:text-accent transition-colors"
          >
            <span className="text-sm font-medium hidden md:inline">Menu</span>
            <div className="relative w-6 h-6">
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </div>
            <span className="hidden w-2 h-2 rounded-full bg-accent md:block" />
          </button>
        </div>
      </nav>

      {/* Full Screen Menu */}
      <div
        className={`fixed inset-0 z-[999] overflow-x-clip bg-venture-black transition-all duration-500 ${isMenuOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
          }`}
      >
        <div className="h-full flex flex-col justify-center items-center">
          {menuLinks.map((link, index) => (
            <Link
              key={link.label}
              to={getHomeSectionHref(link.sectionId)}
              onClick={handleNavClick(link.sectionId)}
              className={`headline-lg text-venture-white hover:text-accent transition-all duration-300 py-4 ${isMenuOpen
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-8'
                }`}
              style={{
                fontSize: 'clamp(2rem, 6vw, 4rem)',
                transitionDelay: `${index * 0.1}s`,
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
