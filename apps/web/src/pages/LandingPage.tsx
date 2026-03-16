import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useThemeStore } from '../store/themeStore';

// ─── Dados mockados ───────────────────────────────────────────────────────────

const STATS = [
  { valor: '+500', label: 'Canais monitorados' },
  { valor: '+12 mil', label: 'Feedbacks processados' },
  { valor: '98%', label: 'Satisfação dos parceiros' },
  { valor: '3x', label: 'Mais rápido que feedback manual' },
];

const PASSOS = [
  {
    numero: '01',
    titulo: 'Instale o widget',
    descricao:
      'Cole uma linha de script no seu produto. Pronto. Nenhuma configuração adicional necessária.',
    icone: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
      </svg>
    ),
  },
  {
    numero: '02',
    titulo: 'IA agrupa o feedback',
    descricao:
      'Nossa IA sintetiza, deduplica e agrupa feedbacks similares automaticamente. Sem ruído.',
    icone: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
      </svg>
    ),
  },
  {
    numero: '03',
    titulo: 'Tome decisões com dados',
    descricao:
      'Veja padrões acionáveis no dashboard. Saiba exatamente o que seus usuários mais precisam.',
    icone: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
  },
];

const FUNCIONALIDADES = [
  {
    titulo: 'Widget inteligente',
    descricao: 'Uma linha de código. O widget captura o contexto da página automaticamente — URL, elemento clicado, dispositivo.',
    icone: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    ),
  },
  {
    titulo: 'IA de deduplicação',
    descricao: 'Feedbacks similares são agrupados automaticamente. Sem duplicatas no backlog, sem análise manual.',
    icone: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
      </svg>
    ),
  },
  {
    titulo: 'Dashboard de padrões',
    descricao: 'Veja o que seus usuários mais relatam, com contexto: "8 relatos após botão Pagar esta semana".',
    icone: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
  },
  {
    titulo: 'Contexto automático',
    descricao: 'Cada feedback chega com URL, título da página, último elemento interagido e tipo de dispositivo.',
    icone: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
      </svg>
    ),
  },
  {
    titulo: 'Multi-canal',
    descricao: 'Gerencie vários canais em uma conta só. Cada canal tem seu dashboard e widget isolados.',
    icone: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 0 1-1.125-1.125v-3.75ZM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 0 1-1.125-1.125v-8.25ZM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 0 1-1.125-1.125v-2.25Z" />
      </svg>
    ),
  },
  {
    titulo: 'LGPD ready',
    descricao: 'Consentimento embutido no widget. Você é o controlador dos dados, o Upvote é o operador.',
    icone: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
  },
];

const DEPOIMENTOS = [
  {
    nome: 'Ana Lima',
    cargo: 'Product Manager',
    empresa: 'Fintech Startup',
    iniciais: 'AL',
    texto:
      'Antes gastava horas lendo feedback repetido. Hoje abro o dashboard e já sei o que priorizar. O Upvote mudou minha rotina de discovery.',
  },
  {
    nome: 'Carlos Mendes',
    cargo: 'Co-founder',
    empresa: 'SaaS B2B',
    iniciais: 'CM',
    texto:
      'O widget foi instalado em 5 minutos. Na semana seguinte já tínhamos insights que não sabíamos que existiam. Decisão mais fácil que já tomamos.',
  },
  {
    nome: 'Beatriz Santos',
    cargo: 'Head of Product',
    empresa: 'E-commerce',
    iniciais: 'BS',
    texto:
      'A IA que agrupa feedbacks similares é um diferencial absurdo. Nunca mais vimos duplicatas no backlog. Nosso sprint planning ficou 2x mais rápido.',
  },
];

const PLANOS = [
  {
    nome: 'Free',
    preco: 'R$ 0',
    periodo: 'para sempre',
    destaque: false,
    recursos: ['1 canal', '50 sugestões/mês', 'Board público', 'Sem widget'],
    cta: 'Começar grátis',
  },
  {
    nome: 'Starter',
    preco: 'R$ 49',
    periodo: '/mês',
    destaque: false,
    recursos: ['3 canais', 'Sugestões ilimitadas', 'Widget básico', 'Dashboard de padrões'],
    cta: 'Começar',
  },
  {
    nome: 'Pro',
    preco: 'R$ 129',
    periodo: '/mês',
    destaque: true,
    recursos: ['10 canais', 'Changelog integrado', 'Roadmap público', 'IA avançada', 'Suporte prioritário'],
    cta: 'Começar',
  },
  {
    nome: 'Business',
    preco: 'R$ 299',
    periodo: '/mês',
    destaque: false,
    recursos: ['Canais ilimitados', 'SSO', 'API pública', 'White-label', 'SLA garantido'],
    cta: 'Falar com vendas',
  },
];

// ─── Navbar ───────────────────────────────────────────────────────────────────

function NavbarSection() {
  const [menuAberto, setMenuAberto] = useState(false);
  const { theme, toggle } = useThemeStore();

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <span className="text-xl font-bold text-indigo-600">Upvote</span>
          </div>

          {/* Links centrais — visíveis apenas em telas maiores */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#funcionalidades" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              Funcionalidades
            </a>
            <a href="#precos" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              Preços
            </a>
            <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              Blog
            </a>
            <Link to="/sandbox" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              Testar widget
            </Link>
          </div>

          {/* CTAs */}
          <div className="hidden md:flex items-center gap-3">
            {/* Toggle de tema */}
            <button
              onClick={toggle}
              aria-label="Alternar tema"
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
            >
              {theme === 'dark' ? (
                /* Ícone de sol */
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                /* Ícone de lua */
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            <Link
              to="/login"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Entrar
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Começar grátis
            </Link>
          </div>

          {/* Botão hamburger para mobile */}
          <button
            onClick={() => setMenuAberto(!menuAberto)}
            className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Abrir menu"
          >
            {menuAberto ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>

        {/* Menu mobile expandido */}
        {menuAberto && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
            <a href="#funcionalidades" onClick={() => setMenuAberto(false)} className="block text-sm text-gray-600 dark:text-gray-400 py-2">
              Funcionalidades
            </a>
            <a href="#precos" onClick={() => setMenuAberto(false)} className="block text-sm text-gray-600 dark:text-gray-400 py-2">
              Preços
            </a>
            <a href="#" className="block text-sm text-gray-600 dark:text-gray-400 py-2">
              Blog
            </a>
            <Link to="/sandbox" onClick={() => setMenuAberto(false)} className="block text-sm text-gray-600 dark:text-gray-400 py-2">
              Testar widget
            </Link>
            {/* Toggle de tema — mobile */}
            <button
              onClick={toggle}
              aria-label="Alternar tema"
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 py-2"
            >
              {theme === 'dark' ? (
                <>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                  </svg>
                  Modo claro
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  Modo escuro
                </>
              )}
            </button>

            <div className="flex flex-col gap-2 pt-2">
              <Link to="/login" className="text-sm font-medium text-center text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 py-2 rounded-lg">
                Entrar
              </Link>
              <Link to="/register" className="text-sm font-semibold text-center bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg">
                Começar grátis
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-white to-indigo-50 dark:from-gray-950 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Coluna de texto */}
          <div className="flex-1 text-center lg:text-left">
            {/* Badge de novidade */}
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-sm font-medium px-4 py-1.5 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Novo — Agrupamento por IA disponível
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              <span className="text-gray-900 dark:text-white">Feedback</span>
              <br />
              <span className="text-indigo-600">sem ruído.</span>
            </h1>

            <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto lg:mx-0">
              Instale o widget, a IA faz o resto. Padrões acionáveis, não
              comentários brutos. Decida com clareza o que construir a seguir.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-lg text-base transition-colors"
              >
                Começar grátis
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <Link
                to="/sandbox"
                className="inline-flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium px-6 py-3 rounded-lg text-base transition-colors"
              >
                Testar widget
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </Link>
            </div>

            {/* Prova social discreta */}
            <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
              Sem cartão de crédito · Plano Free para sempre disponível
            </p>
          </div>

          {/* Mockup do dashboard */}
          <div className="flex-1 w-full max-w-lg lg:max-w-none">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl bg-white dark:bg-gray-900 overflow-hidden">
              {/* Barra de título do mockup */}
              <div className="flex items-center gap-1.5 px-4 py-3 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <span className="w-3 h-3 rounded-full bg-red-400"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                <span className="w-3 h-3 rounded-full bg-green-400"></span>
                <span className="ml-3 text-xs text-gray-500 dark:text-gray-400 font-mono">app.upvote.com/dashboard</span>
              </div>

              {/* Conteúdo do mockup */}
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Padrões de feedback · Meu App</p>
                  <span className="text-xs text-gray-500 dark:text-gray-400">últimos 7 dias</span>
                </div>

                {/* Cards de feedback mockados */}
                {[
                  { votos: 14, titulo: 'Botão de pagamento não responde no mobile', status: 'Em análise', cor: 'orange' },
                  { votos: 9, titulo: 'Exportar relatórios em PDF', status: 'Planejado', cor: 'yellow' },
                  { votos: 6, titulo: 'Modo escuro para a tela de cadastro', status: 'Aberto', cor: 'blue' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex flex-col items-center gap-0.5 min-w-[36px]">
                      <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 17a.75.75 0 0 1-.75-.75V5.612L5.29 9.77a.75.75 0 0 1-1.08-1.04l5.25-5.5a.75.75 0 0 1 1.08 0l5.25 5.5a.75.75 0 1 1-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0 1 10 17Z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{item.votos}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{item.titulo}</p>
                      <div className="mt-1">
                        <span className={`inline-flex text-xs px-2 py-0.5 rounded-full font-medium
                          ${item.cor === 'orange' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : ''}
                          ${item.cor === 'yellow' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
                          ${item.cor === 'blue' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : ''}
                        `}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────

function StatsSection() {
  return (
    <section className="bg-indigo-600 dark:bg-indigo-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl sm:text-4xl font-extrabold text-white">{stat.valor}</p>
              <p className="mt-1 text-sm text-indigo-100">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Como funciona ────────────────────────────────────────────────────────────

function ComoFuncionaSection() {
  return (
    <section id="como-funciona" className="bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
            Como funciona
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Três passos para transformar o que seus usuários dizem em decisões de produto.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {PASSOS.map((passo, i) => (
            <div key={passo.numero} className="relative text-center">
              {/* Linha conectora entre passos */}
              {i < PASSOS.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[calc(50%+3rem)] right-0 border-t-2 border-dashed border-indigo-200 dark:border-indigo-900" />
              )}

              {/* Número decorativo de fundo */}
              <div className="relative inline-flex flex-col items-center">
                <span className="text-7xl font-extrabold text-indigo-50 dark:text-indigo-950 select-none absolute -top-4 left-1/2 -translate-x-1/2">
                  {passo.numero}
                </span>

                {/* Ícone */}
                <div className="relative z-10 inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                  {passo.icone}
                </div>
              </div>

              <h3 className="mt-6 text-xl font-semibold text-gray-900 dark:text-white">
                {passo.titulo}
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {passo.descricao}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Funcionalidades ──────────────────────────────────────────────────────────

function FuncionalidadesSection() {
  return (
    <section id="funcionalidades" className="bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
            Tudo que você precisa para ouvir seus usuários
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Do widget ao dashboard, cada detalhe foi pensado para reduzir o trabalho manual e ampliar a clareza.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FUNCIONALIDADES.map((item) => (
            <div
              key={item.titulo}
              className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mb-4">
                {item.icone}
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">{item.titulo}</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.descricao}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Depoimentos ─────────────────────────────────────────────────────────────

function DepoimentosSection() {
  return (
    <section className="bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
            Quem já usa, não volta atrás
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            PMs e fundadores brasileiros que transformaram o caos de feedback em clareza.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {DEPOIMENTOS.map((dep) => (
            <div
              key={dep.nome}
              className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex flex-col"
            >
              {/* Aspas decorativas */}
              <span className="text-4xl font-serif text-indigo-200 dark:text-indigo-800 leading-none select-none">"</span>

              <p className="mt-2 text-gray-700 dark:text-gray-300 text-sm leading-relaxed flex-1">
                {dep.texto}
              </p>

              {/* Identificação */}
              <div className="flex items-center gap-3 mt-6">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-semibold text-sm flex-shrink-0">
                  {dep.iniciais}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{dep.nome}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {dep.cargo} · {dep.empresa}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Preços ───────────────────────────────────────────────────────────────────

function PrecosSection() {
  return (
    <section id="precos" className="bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
            Preço justo para o mercado brasileiro
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Comece grátis. Escale conforme cresce.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANOS.map((plano) => (
            <div
              key={plano.nome}
              className={`relative p-6 rounded-xl border bg-white dark:bg-gray-900 flex flex-col ${
                plano.destaque
                  ? 'ring-2 ring-indigo-600 dark:ring-indigo-500 border-indigo-600 dark:border-indigo-500'
                  : 'border-gray-200 dark:border-gray-800'
              }`}
            >
              {/* Badge "Popular" no plano em destaque */}
              {plano.destaque && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Mais popular
                  </span>
                </div>
              )}

              {/* Nome */}
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {plano.nome}
              </p>

              {/* Preço */}
              <div className="mt-2 flex items-end gap-1">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{plano.preco}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">{plano.periodo}</span>
              </div>

              {/* Divisor */}
              <div className="my-4 border-t border-gray-100 dark:border-gray-800" />

              {/* Recursos */}
              <ul className="space-y-2 flex-1">
                {plano.recursos.map((recurso) => (
                  <li key={recurso} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    {recurso}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {plano.nome === 'Business' ? (
                <a
                  href="mailto:contato@upvote.com"
                  className="mt-6 block text-center text-sm font-semibold py-2.5 rounded-lg transition-colors border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  {plano.cta}
                </a>
              ) : (
                <Link
                  to="/register"
                  className={`mt-6 block text-center text-sm font-semibold py-2.5 rounded-lg transition-colors ${
                    plano.destaque || plano.nome === 'Free'
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {plano.cta}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA final ────────────────────────────────────────────────────────────────

function CtaFinalSection() {
  return (
    <section className="bg-gradient-to-br from-indigo-600 to-indigo-700 dark:from-indigo-700 dark:to-indigo-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
          Pronto para ouvir seus usuários de verdade?
        </h2>
        <p className="mt-4 text-lg text-indigo-100">
          Comece grátis. Sem cartão de crédito. Cancele quando quiser.
        </p>
        <div className="mt-8">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-white text-indigo-700 font-semibold px-8 py-3 rounded-lg hover:bg-indigo-50 transition-colors text-base"
          >
            Criar conta grátis
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function FooterSection() {
  const linksFooter = [
    {
      titulo: 'Produto',
      links: ['Funcionalidades', 'Preços', 'Changelog', 'Roadmap'],
    },
    {
      titulo: 'Empresa',
      links: ['Sobre', 'Blog', 'Carreiras'],
    },
    {
      titulo: 'Legal',
      links: ['Privacidade', 'Termos', 'LGPD'],
    },
    {
      titulo: 'Suporte',
      links: ['Documentação', 'Status', 'Contato'],
    },
  ];

  return (
    <footer className="bg-gray-900 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Logo e descrição */}
          <div className="col-span-2">
            <span className="text-xl font-bold text-indigo-400">Upvote</span>
            <p className="mt-3 text-sm text-gray-400 max-w-xs">
              Feedback sem ruído. A plataforma que transforma o que seus usuários dizem em decisões claras de produto.
            </p>
          </div>

          {/* Colunas de links */}
          {linksFooter.map((coluna) => (
            <div key={coluna.titulo}>
              <p className="text-sm font-semibold text-gray-300">{coluna.titulo}</p>
              <ul className="mt-3 space-y-2">
                {coluna.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-gray-400 hover:text-gray-300 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Rodapé inferior */}
        <div className="mt-12 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Upvote. Todos os direitos reservados.
          </p>
          <p className="text-sm text-gray-500">
            Feito com carinho no Brasil 🇧🇷 Pelo Engenheiro Guilherme Dias Cardoso
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <main>
      <NavbarSection />
      <HeroSection />
      <StatsSection />
      <ComoFuncionaSection />
      <FuncionalidadesSection />
      <DepoimentosSection />
      <PrecosSection />
      <CtaFinalSection />
      <FooterSection />
    </main>
  );
}
