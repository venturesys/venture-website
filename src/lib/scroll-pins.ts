/**
 * Ordem de recálculo das seções fixadas (pin) da home.
 *
 * O ScrollTrigger só ordena a fila antes de remedir posições quando pelo menos um
 * trigger declara `refreshPriority` (ScrollTrigger.js: `_sort && ScrollTrigger.sort()`).
 * Sem isso ele remede na ordem de criação — que aqui depende de quando cada seção
 * recebe os dados do WordPress — e uma seção medida antes de outra que está acima
 * dela na página herda um `start` defasado pela altura do pin-spacer que ainda não
 * havia sido aplicado. Era isso que fazia Parcerias começar no meio de Insights.
 *
 * Prioridade maior = remedida primeiro; mantenha os valores em ordem decrescente,
 * igual à ordem de renderização em HomePage.
 */
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export const PIN_PRIORITY = {
  hero: 80,
  process: 70,
  capabilities: 60,
  metrics: 50,
  caseVale: 40,
  caseAnglo: 30,
  insights: 20,
  partners: 10,
} as const;

let pendingRefresh: number | null = null;

/**
 * Agenda um único recálculo global, agrupando chamadas próximas.
 *
 * Cada seção recebe seus dados do WordPress num momento diferente e recria o próprio
 * trigger quando isso acontece. Se cada uma disparar seu próprio `refresh()`, um deles
 * roda no meio da recriação de outra e a seção de baixo acaba medida contra um
 * pin-spacer que ainda vai crescer — exatamente a defasagem que o `refreshPriority`
 * existe para evitar. Esperar o silêncio e recalcular uma vez só fecha essa janela.
 */
export function scheduleScrollRefresh(): void {
  if (pendingRefresh !== null) {
    window.clearTimeout(pendingRefresh);
  }

  pendingRefresh = window.setTimeout(() => {
    pendingRefresh = null;
    ScrollTrigger.refresh();
  }, 150);
}
