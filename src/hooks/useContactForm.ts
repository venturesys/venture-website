import { useState, useCallback } from 'react';

interface ContactFormData {
  nome: string;
  email: string;
  empresa: string;
  telefone: string;
  mensagem: string;
}

/**
 * Envia para a função serverless em `/api/contato`, que fala com o provedor de e-mail.
 * Antes isso passava pelo Contact Form 7 do WordPress; agora o site não depende dele.
 */
export function useContactForm() {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (data: ContactFormData) => {
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/contato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; erro?: string };

      if (res.ok && body.ok) {
        setSuccess(true);
      } else {
        setError(body.erro || 'Erro ao enviar mensagem. Tente novamente.');
      }
    } catch {
      setError('Erro de conexão. Tente novamente mais tarde.');
    } finally {
      setSubmitting(false);
    }
  }, []);

  const reset = useCallback(() => {
    setSuccess(false);
    setError(null);
  }, []);

  return { submit, submitting, success, error, reset };
}
