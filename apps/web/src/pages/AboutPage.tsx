import { Link } from 'react-router-dom';
import { ArrowLeft, Zap, Shield, BarChart2, Users } from 'lucide-react';

export default function AboutPage() {
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero */}
        <div className="mb-16">
          <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-3">Sobre o projeto</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight mb-6">
            Feedback sem ruído,<br />
            <span className="text-primary-600">decisões com clareza.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            O Upvote nasceu da frustração de abrir um canal de feedback e encontrar centenas de mensagens
            sem saber o que realmente importa. A IA faz o trabalho pesado — você foca nas decisões.
          </p>
        </div>

        {/* Origin story */}
        <section className="mb-16 prose prose-neutral max-w-none">
          <h2 className="text-2xl font-bold text-foreground mb-4">A origem</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Todo PM e founder já viveu isso: você abre o canal de feedback e encontra 200 mensagens.
              Metade é duplicata. Um terço é reclamação sem contexto. O resto parece urgente, mas você
              não sabe quantas pessoas realmente sentiram o mesmo problema.
            </p>
            <p>
              Ferramentas existentes ou são caras demais para o mercado brasileiro, ou te obrigam a
              categorizar tudo manualmente, ou simplesmente jogam uma lista de comentários na sua cara
              e te desejam boa sorte.
            </p>
            <p>
              O Upvote foi construído para resolver exatamente isso: transformar o caos de feedback em
              padrões acionáveis, sem trabalho manual.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-8">O que nos guia</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                icon: Zap,
                title: 'Simplicidade acima de tudo',
                description: 'Uma linha de código para instalar o widget. Zero configuração. O produto deve funcionar sem manual.',
              },
              {
                icon: BarChart2,
                title: 'Dados, não opiniões',
                description: 'Padrões gerados por IA, não por feeling. Cada decisão de produto apoiada em evidência real.',
              },
              {
                icon: Shield,
                title: 'Privacidade por padrão',
                description: 'Você é o controlador dos dados dos seus usuários. O Upvote é o operador. LGPD no DNA do produto.',
              },
              {
                icon: Users,
                title: 'Feito para o Brasil',
                description: 'Preço acessível, suporte em português, e foco nas necessidades reais de founders e PMs brasileiros.',
              },
            ].map(({ icon: Icon, title, description }) => (
              <div key={title} className="p-6 rounded-xl border border-border bg-card hover:border-primary-300 dark:hover:border-primary-600 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Founder */}
        <section className="mb-16 p-8 rounded-2xl bg-card border border-border">
          <h2 className="text-2xl font-bold text-foreground mb-6">Quem está por trás</h2>
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-primary-700 dark:text-primary-300">G</span>
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">Guilherme Dias Cardoso</p>
              <p className="text-sm text-muted-foreground mb-3">Fundador &amp; Engenheiro de Software</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Engenheiro de software brasileiro apaixonado por produto. Construiu o Upvote para aprender
                todo o ciclo de desenvolvimento moderno — do código ao deploy — e para resolver um problema
                real que via founders e PMs enfrentarem todos os dias.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
          >
            Começar grátis
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">Sem cartão de crédito · Plano Free para sempre</p>
        </div>
      </main>
    </div>
  );
}
