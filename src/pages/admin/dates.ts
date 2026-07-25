/**
 * Conversão entre o `<input type="datetime-local">` e a data guardada no conteúdo.
 *
 * O agendamento é gravado em ISO com fuso (UTC), porque quem lê é o navegador do
 * visitante, que pode estar em qualquer lugar: o instante precisa ser absoluto. O
 * input, por outro lado, trabalha no fuso de quem está editando.
 */

/** `2026-08-01T10:00` (hora local de quem edita) → ISO em UTC. */
export function toIsoFromInput(inputValue: string): string | null {
  if (!inputValue) return null;

  const date = new Date(inputValue);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** ISO em UTC → `2026-08-01T10:00` no fuso de quem edita. */
export function toLocalInputValue(iso?: string | null): string {
  if (!iso) return '';

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}
