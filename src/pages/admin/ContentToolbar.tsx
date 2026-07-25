import type { RefObject } from 'react';
import { Bold, Italic, Heading2, Link2, List, Quote } from 'lucide-react';

/**
 * Barra de formatação sobre o textarea de HTML.
 *
 * Não é um editor visual — envolve a seleção na tag correspondente. Resolve o caso
 * real (quem escreve o post não sabe HTML) sem trazer uma dependência de editor só
 * para isso, e o conteúdo continua sendo o mesmo HTML que o WordPress já guarda.
 */

interface Props {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onChange: (next: string) => void;
}

interface Action {
  label: string;
  icon: typeof Bold;
  /** Recebe o texto selecionado e devolve o trecho já formatado. */
  apply: (selection: string) => string | null;
  /** Deslocamento do cursor a partir do fim do trecho inserido, quando não há seleção. */
  caretBack?: number;
}

const ACTIONS: Action[] = [
  { label: 'Negrito', icon: Bold, apply: (s) => `<strong>${s}</strong>`, caretBack: 9 },
  { label: 'Itálico', icon: Italic, apply: (s) => `<em>${s}</em>`, caretBack: 5 },
  { label: 'Título', icon: Heading2, apply: (s) => `\n<h2>${s}</h2>\n`, caretBack: 6 },
  { label: 'Citação', icon: Quote, apply: (s) => `\n<blockquote>${s}</blockquote>\n`, caretBack: 14 },
  {
    label: 'Lista',
    icon: List,
    apply: (s) => {
      const items = s
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      const body = items.length > 0 ? items.map((item) => `  <li>${item}</li>`).join('\n') : '  <li></li>';
      return `\n<ul>\n${body}\n</ul>\n`;
    },
    caretBack: 12,
  },
  {
    label: 'Link',
    icon: Link2,
    apply: (selection) => {
      const url = window.prompt('Endereço do link:', 'https://');
      if (!url) {
        return null;
      }
      return `<a href="${url}">${selection || 'texto do link'}</a>`;
    },
    caretBack: 4,
  },
];

export default function ContentToolbar({ textareaRef, onChange }: Props) {
  const run = (action: Action) => {
    const area = textareaRef.current;
    if (!area) return;

    const { selectionStart, selectionEnd, value } = area;
    const selection = value.slice(selectionStart, selectionEnd);
    const replacement = action.apply(selection);

    if (replacement === null) {
      return;
    }

    onChange(value.slice(0, selectionStart) + replacement + value.slice(selectionEnd));

    // Devolve o foco com o cursor dentro da tag, para continuar digitando.
    const caret = selection
      ? selectionStart + replacement.length
      : selectionStart + replacement.length - (action.caretBack ?? 0);

    requestAnimationFrame(() => {
      area.focus();
      area.setSelectionRange(caret, caret);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-t-md border border-b-0 border-slate-300 bg-slate-50 px-2 py-1.5">
      {ACTIONS.map((action) => (
        <button
          key={action.label}
          type="button"
          title={action.label}
          onClick={() => run(action)}
          className="rounded p-1.5 text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900"
        >
          <action.icon className="w-4 h-4" />
          <span className="sr-only">{action.label}</span>
        </button>
      ))}
    </div>
  );
}
