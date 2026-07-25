/**
 * Recebimento do formulário de contato — substitui o Contact Form 7 do WordPress.
 *
 * Roda como função serverless na Vercel. A chave do provedor de e-mail fica em
 * variável de ambiente do projeto (`RESEND_API_KEY`), nunca no repositório nem no
 * bundle do navegador.
 *
 * Variáveis esperadas na Vercel:
 *   RESEND_API_KEY   chave da API do Resend (resend.com)
 *   CONTATO_PARA     e-mail que recebe as mensagens
 *   CONTATO_DE       remetente verificado no provedor (ex.: site@venture.com.br)
 */

interface ContactPayload {
  nome?: string;
  email?: string;
  empresa?: string;
  telefone?: string;
  mensagem?: string;
  /** Campo isca: preenchido só por robô. */
  website?: string;
}

const LIMITES = { nome: 120, email: 160, empresa: 120, telefone: 40, mensagem: 5000 };

export async function POST(request: Request): Promise<Response> {
  let payload: ContactPayload;

  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return json({ erro: 'Requisição inválida.' }, 400);
  }

  // Honeypot: responde sucesso para não ensinar o robô, mas não envia nada.
  if (payload.website) {
    return json({ ok: true });
  }

  const nome = limpar(payload.nome, LIMITES.nome);
  const email = limpar(payload.email, LIMITES.email);
  const mensagem = limpar(payload.mensagem, LIMITES.mensagem);
  const empresa = limpar(payload.empresa, LIMITES.empresa);
  const telefone = limpar(payload.telefone, LIMITES.telefone);

  if (!nome || !email || !mensagem) {
    return json({ erro: 'Preencha nome, e-mail e mensagem.' }, 422);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return json({ erro: 'E-mail inválido.' }, 422);
  }

  const apiKey = process.env.RESEND_API_KEY;
  const para = process.env.CONTATO_PARA;
  const de = process.env.CONTATO_DE;

  if (!apiKey || !para || !de) {
    console.error('Envio de contato não configurado: faltam RESEND_API_KEY/CONTATO_PARA/CONTATO_DE');
    return json({ erro: 'Envio indisponível no momento. Tente por e-mail.' }, 503);
  }

  const linhas = [
    `Nome: ${nome}`,
    `E-mail: ${email}`,
    empresa ? `Empresa: ${empresa}` : null,
    telefone ? `Telefone: ${telefone}` : null,
    '',
    mensagem,
  ].filter((linha) => linha !== null);

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: de,
        to: [para],
        reply_to: email,
        subject: `Contato pelo site — ${nome}`,
        text: linhas.join('\n'),
      }),
    });

    if (!res.ok) {
      console.error('Provedor de e-mail recusou:', res.status, await res.text());
      return json({ erro: 'Não foi possível enviar agora. Tente novamente.' }, 502);
    }

    return json({ ok: true });
  } catch (error) {
    console.error('Falha ao contatar o provedor de e-mail:', error);
    return json({ erro: 'Não foi possível enviar agora. Tente novamente.' }, 502);
  }
}

function limpar(valor: string | undefined, max: number): string {
  return (valor ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
