import { useRef, useLayoutEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';
import { useContactForm } from '@/hooks/useContactForm';

const fieldIds = {
  nome: 'contact-nome',
  email: 'contact-email',
  empresa: 'contact-empresa',
  telefone: 'contact-telefone',
  mensagem: 'contact-mensagem',
} as const;

gsap.registerPlugin(ScrollTrigger);

export default function ContactSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    empresa: '',
    telefone: '',
    mensagem: '',
  });

  const { submit, submitting, success, error, reset } = useContactForm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submit(formData);
  };

  const handleReset = () => {
    setFormData({ nome: '', email: '', empresa: '', telefone: '', mensagem: '' });
    reset();
  };

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        headlineRef.current,
        { x: -60, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: headlineRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      gsap.fromTo(
        formRef.current,
        { x: 60, opacity: 0, rotateY: 6 },
        {
          x: 0,
          opacity: 1,
          rotateY: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: formRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      gsap.fromTo(
        detailsRef.current,
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: detailsRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#F6F6F6] z-[90] py-20 md:py-32"
    >
      <div className="px-[6vw] grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        {/* Left Column */}
        <div>
          {/* Headline */}
          <div ref={headlineRef} className="mb-8">
            <h2 className="headline-lg text-venture-black mb-4" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}>
              <span className="block">Vamos</span>
              <span className="block">
                Conver<span className="text-accent">sar</span>
              </span>
            </h2>
            <p className="text-[#6A6A6A] text-lg max-w-md">
              Conte-nos o desafio. Respondemos em até 48 horas.
            </p>
          </div>

          {/* Contact Details */}
          <div ref={detailsRef} className="space-y-4">
            <div className="flex items-center gap-3 text-venture-black">
              <Mail className="w-5 h-5 text-accent" />
              <a
                href="mailto:contato@venture.com.br"
                className="font-mono text-sm transition-colors hover:text-accent"
              >
                contato@venture.com.br
              </a>
            </div>
            <div className="flex items-start gap-3 text-venture-black">
              <Phone className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <a href="tel:+5521981054801" className="font-mono text-sm transition-colors hover:text-accent">
                  Sergio Teixeira de Jesus: +55 21 98105-4801
                </a>
                <a href="tel:+5521998872331" className="font-mono text-sm transition-colors hover:text-accent">
                  Nicolas Machado Yazbek: +55 21 99887-2331
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3 text-venture-black">
              <MapPin className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <span className="font-mono text-sm">Praia do Flamengo, 66 - Bloco B - Sala 803</span>
                <span className="font-mono text-sm">Flamengo - Rio de Janeiro - RJ - CEP 22210-030</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Form */}
        <div
          ref={formRef}
          className="bg-white rounded-lg p-6 md:p-8 shadow-card"
          style={{ perspective: '1000px' }}
        >
          {success ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center gap-4">
              <CheckCircle className="w-12 h-12 text-green-500" />
              <h3 className="text-venture-black font-display font-bold text-xl">
                Mensagem enviada!
              </h3>
              <p className="text-[#6A6A6A] text-base max-w-sm">
                Entraremos em contato em até 48 horas.
              </p>
              <button
                onClick={handleReset}
                className="mt-4 text-accent hover:text-venture-black transition-colors text-sm font-medium"
              >
                Enviar outra mensagem
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label htmlFor={fieldIds.nome} className="micro-label text-[#6A6A6A] block mb-2">Nome</label>
                <input
                  id={fieldIds.nome}
                  name="nome"
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-4 py-3 border border-[#E5E5E5] rounded-md text-venture-black focus:outline-none focus:border-accent transition-colors"
                  placeholder="Seu nome"
                  autoComplete="name"
                  required
                />
              </div>

              <div>
                <label htmlFor={fieldIds.email} className="micro-label text-[#6A6A6A] block mb-2">Email</label>
                <input
                  id={fieldIds.email}
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-[#E5E5E5] rounded-md text-venture-black focus:outline-none focus:border-accent transition-colors"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor={fieldIds.empresa} className="micro-label text-[#6A6A6A] block mb-2">Empresa</label>
                  <input
                    id={fieldIds.empresa}
                    name="empresa"
                    type="text"
                    value={formData.empresa}
                    onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                    className="w-full px-4 py-3 border border-[#E5E5E5] rounded-md text-venture-black focus:outline-none focus:border-accent transition-colors"
                    placeholder="Nome da empresa"
                    autoComplete="organization"
                  />
                </div>
                <div>
                  <label htmlFor={fieldIds.telefone} className="micro-label text-[#6A6A6A] block mb-2">Telefone</label>
                  <input
                    id={fieldIds.telefone}
                    name="telefone"
                    type="tel"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    className="w-full px-4 py-3 border border-[#E5E5E5] rounded-md text-venture-black focus:outline-none focus:border-accent transition-colors"
                    placeholder="(00) 00000-0000"
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div>
                <label htmlFor={fieldIds.mensagem} className="micro-label text-[#6A6A6A] block mb-2">Mensagem</label>
                <textarea
                  id={fieldIds.mensagem}
                  name="mensagem"
                  value={formData.mensagem}
                  onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
                  className="w-full px-4 py-3 border border-[#E5E5E5] rounded-md text-venture-black focus:outline-none focus:border-accent transition-colors resize-none"
                  rows={4}
                  placeholder="Descreva seu desafio..."
                  required
                />
              </div>

              {error && (
                /* Falha no envio não pode ser um beco sem saída: oferece o e-mail
                   direto, já com o que a pessoa digitou. */
                <div className="rounded-md bg-red-50 px-4 py-3 text-sm" role="alert" aria-live="polite">
                  <p className="text-red-700">{error}</p>
                  <a
                    href={buildMailto(formData)}
                    className="mt-2 inline-block font-medium text-red-800 underline underline-offset-4"
                  >
                    Enviar por e-mail para contato@venture.com.br
                  </a>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full btn-primary flex items-center justify-center gap-2 py-4 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span>{submitting ? 'Enviando...' : 'Enviar'}</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

/** Monta um mailto já preenchido, para o visitante não perder o que escreveu. */
function buildMailto(dados: {
  nome: string;
  email: string;
  empresa: string;
  telefone: string;
  mensagem: string;
}): string {
  const corpo = [
    `Nome: ${dados.nome}`,
    `E-mail: ${dados.email}`,
    dados.empresa ? `Empresa: ${dados.empresa}` : '',
    dados.telefone ? `Telefone: ${dados.telefone}` : '',
    '',
    dados.mensagem,
  ]
    .filter(Boolean)
    .join('\n');

  return `mailto:contato@venture.com.br?subject=${encodeURIComponent(
    `Contato pelo site — ${dados.nome || 'sem nome'}`
  )}&body=${encodeURIComponent(corpo)}`;
}
