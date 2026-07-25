import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export interface HomeSectionLink {
  label: string;
  sectionId: string;
  /** Seções "Fora MOBILE" (pauta 3.1) não são renderizadas no breakpoint mobile;
   * o link correspondente também é ocultado do menu e do rodapé. */
  mobileHidden?: boolean;
}

export const homeSectionLinks: HomeSectionLink[] = [
  { label: 'Serviços', sectionId: 'capabilities' },
  { label: 'Cases', sectionId: 'cases', mobileHidden: true },
  { label: 'Insights', sectionId: 'insights', mobileHidden: true },
  { label: 'Contato', sectionId: 'contact' },
];

const pinnedSectionOffsets: Record<string, number> = {
  capabilities: 0.16,
  cases: 0.5,
};

interface ScrollToHomeSectionOptions {
  behavior?: ScrollBehavior;
}

export function getHomeSectionHref(sectionId: string): string {
  return `/#${sectionId}`;
}

export function scrollToHomeSection(
  sectionId: string,
  options: ScrollToHomeSectionOptions = {}
): boolean {
  const target = document.getElementById(sectionId);

  if (!target) {
    return false;
  }

  ScrollTrigger.refresh();

  const targetTop = target.getBoundingClientRect().top + window.scrollY;
  const offsetProgress = pinnedSectionOffsets[sectionId];
  const sectionTrigger = findSectionScrollTrigger(target);
  const triggerStart = sectionTrigger?.start;
  const triggerEnd = sectionTrigger?.end;
  const hasMeasuredTrigger =
    typeof triggerStart === 'number' &&
    typeof triggerEnd === 'number' &&
    Number.isFinite(triggerStart) &&
    Number.isFinite(triggerEnd);
  const scrollTarget =
    offsetProgress != null && hasMeasuredTrigger
      ? triggerStart + (triggerEnd - triggerStart) * offsetProgress
      : targetTop + window.innerHeight * (offsetProgress ?? 0);

  window.history.replaceState(null, '', getHomeSectionHref(sectionId));
  window.scrollTo({ top: Math.max(0, scrollTarget), behavior: options.behavior ?? 'smooth' });

  return true;
}

function findSectionScrollTrigger(target: HTMLElement): ScrollTrigger | undefined {
  if (typeof Element === 'undefined') {
    return undefined;
  }

  return ScrollTrigger.getAll().find((trigger) => {
    const triggerElement = trigger.trigger;

    return triggerElement instanceof Element && target.contains(triggerElement);
  });
}
