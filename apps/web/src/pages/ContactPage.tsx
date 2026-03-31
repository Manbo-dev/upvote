import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send, CheckCircle } from 'lucide-react';

// ─── Configure the contact email here ────────────────────────────────────────
const CONTACT_EMAIL = 'guilhermedicasil@gmail.com';
// ─────────────────────────────────────────────────────────────────────────────

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent(`[Upvote] Mensagem de ${form.name}`);
    const body = encodeURIComponent(
      `Nome: ${form.name}\nEmail: ${form.email}\n\n${form.message}`
    );
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    setSent(true);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <span className="text-muted-foreground/40">|</span>
          <a href="/" className="text-lg font-bold text-primary-600 hover:opacity-80 transition-opacity">
            Upvote
          </a>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-10">
          <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-3">Contato</p>
          <h1 className="text-4xl font-bold text-foreground mb-4">Fala com a gente</h1>
          <p className="text-muted-foreground leading-relaxed">
            Tem uma dúvida, sugestão ou quer saber mais sobre o Upvote? Manda uma mensagem — respondemos em até 24 horas.
          </p>
        </div>

        {sent ? (
          <div className="p-8 rounded-2xl bg-card border border-border text-center">
            <div className="w-14 h-14 rounded-full bg-primary-50 dark:bg-primary-900 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Mensagem enviada!</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Seu cliente de email foi aberto com a mensagem preenchida. Se não abriu automaticamente,
              escreva diretamente para{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary-600 hover:underline">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
            <button
              onClick={() => setSent(false)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Enviar outra mensagem
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">
                Nome
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="Seu nome"
                className="w-full rounded-lg border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="seu@email.com"
                className="w-full rounded-lg border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-foreground mb-1.5">
                Mensagem
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={6}
                value={form.message}
                onChange={handleChange}
                placeholder="Como podemos ajudar?"
                className="w-full rounded-lg border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
            >
              <Send className="w-4 h-4" />
              Enviar mensagem
            </button>

            <p className="text-xs text-muted-foreground text-center">
              Ou escreva diretamente para{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary-600 hover:underline">
                {CONTACT_EMAIL}
              </a>
            </p>
          </form>
        )}
      </main>
    </div>
  );
}
