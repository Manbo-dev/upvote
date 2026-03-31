import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../store/themeStore';
import { useLanguageStore } from '../store/languageStore';

// ─── Step and Feature icons (language-independent) ───────────────────────────

const STEP_ICONS = [
  (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
    </svg>
  ),
  (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
    </svg>
  ),
  (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  ),
];

const FEATURE_ICONS = [
  (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  ),
  (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
    </svg>
  ),
  (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  ),
  (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
    </svg>
  ),
  (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 0 1-1.125-1.125v-3.75ZM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 0 1-1.125-1.125v-8.25ZM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 0 1-1.125-1.125v-2.25Z" />
    </svg>
  ),
  (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  ),
];

const MOCKUP_COLORS = ['orange', 'yellow', 'blue'] as const;
const MOCKUP_VOTES = [14, 9, 6];

// ─── Navbar ───────────────────────────────────────────────────────────────────

function NavbarSection() {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggle } = useThemeStore();
  const { language, setLanguage } = useLanguageStore();

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <span className="text-xl font-bold text-primary-600">Upvote</span>
          </div>

          {/* Center links — desktop only */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#funcionalidades" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t('landing.nav.features')}
            </a>
            <a href="#precos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t('landing.nav.pricing')}
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t('landing.nav.blog')}
            </a>
            <Link to="/sandbox" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t('landing.nav.tryWidget')}
            </Link>
          </div>

          {/* CTAs — desktop */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language toggle */}
            <button
              onClick={() => setLanguage(language === 'pt-BR' ? 'en' : 'pt-BR')}
              className="rounded-lg px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-accent transition-colors"
            >
              {language === 'pt-BR' ? 'EN' : 'PT'}
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggle}
              aria-label={theme === 'dark' ? t('landing.nav.lightMode') : t('landing.nav.darkMode')}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent transition-colors"
            >
              {theme === 'dark' ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            <Link
              to="/login"
              className="text-sm font-medium text-foreground hover:text-foreground transition-colors"
            >
              {t('landing.nav.signIn')}
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {t('landing.nav.startFree')}
            </Link>
          </div>

          {/* Hamburger button — mobile */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
            aria-label={t('landing.nav.openMenu')}
          >
            {menuOpen ? (
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

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden py-4 border-t border-border space-y-3">
            <a href="#funcionalidades" onClick={() => setMenuOpen(false)} className="block text-sm text-muted-foreground py-2">
              {t('landing.nav.features')}
            </a>
            <a href="#precos" onClick={() => setMenuOpen(false)} className="block text-sm text-muted-foreground py-2">
              {t('landing.nav.pricing')}
            </a>
            <a href="#" className="block text-sm text-muted-foreground py-2">
              {t('landing.nav.blog')}
            </a>
            <Link to="/sandbox" onClick={() => setMenuOpen(false)} className="block text-sm text-muted-foreground py-2">
              {t('landing.nav.tryWidget')}
            </Link>

            {/* Language toggle — mobile */}
            <button
              onClick={() => setLanguage(language === 'pt-BR' ? 'en' : 'pt-BR')}
              className="flex items-center gap-2 text-sm text-muted-foreground py-2"
            >
              {language === 'pt-BR' ? 'EN' : 'PT'}
            </button>

            {/* Theme toggle — mobile */}
            <button
              onClick={toggle}
              className="flex items-center gap-2 text-sm text-muted-foreground py-2"
            >
              {theme === 'dark' ? (
                <>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                  </svg>
                  {t('landing.nav.lightMode')}
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  {t('landing.nav.darkMode')}
                </>
              )}
            </button>

            <div className="flex flex-col gap-2 pt-2">
              <Link to="/login" className="text-sm font-medium text-center text-foreground border border-input py-2 rounded-lg">
                {t('landing.nav.signIn')}
              </Link>
              <Link to="/register" className="text-sm font-semibold text-center bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg">
                {t('landing.nav.startFree')}
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
  const { t } = useTranslation();
  const mockupItems = t('landing.hero.mockup.items', { returnObjects: true }) as Array<{ title: string; status: string }>;

  return (
    <section className="bg-gradient-to-br from-warm-50 to-primary-50 dark:from-warm-950 dark:to-warm-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Text column */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-sm font-medium px-4 py-1.5 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              {t('landing.hero.badge')}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              <span className="text-foreground">{t('landing.hero.title1')}</span>
              <br />
              <span className="text-primary-600">{t('landing.hero.title2')}</span>
            </h1>

            <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
              {t('landing.hero.subtitle')}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-lg text-base transition-colors"
              >
                {t('landing.hero.startFree')}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <Link
                to="/sandbox"
                className="inline-flex items-center justify-center gap-2 border border-input text-foreground hover:bg-accent font-medium px-6 py-3 rounded-lg text-base transition-colors"
              >
                {t('landing.hero.tryWidget')}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </Link>
            </div>

            <p className="mt-6 text-sm text-muted-foreground">
              {t('landing.hero.noCreditCard')}
            </p>
          </div>

          {/* Dashboard mockup */}
          <div className="flex-1 w-full max-w-lg lg:max-w-none">
            <div className="rounded-2xl border border-border shadow-2xl bg-card overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 py-3 bg-warm-100 dark:bg-warm-800 border-b border-border">
                <span className="w-3 h-3 rounded-full bg-red-400"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                <span className="w-3 h-3 rounded-full bg-green-400"></span>
                <span className="ml-3 text-xs text-muted-foreground font-mono">app.upvote.com/dashboard</span>
              </div>

              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-foreground">{t('landing.hero.mockup.patterns')}</p>
                  <span className="text-xs text-muted-foreground">{t('landing.hero.mockup.lastDays')}</span>
                </div>

                {mockupItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-warm-100 dark:border-warm-800 bg-warm-50 dark:bg-warm-800/50">
                    <div className="flex flex-col items-center gap-0.5 min-w-[36px]">
                      <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 17a.75.75 0 0 1-.75-.75V5.612L5.29 9.77a.75.75 0 0 1-1.08-1.04l5.25-5.5a.75.75 0 0 1 1.08 0l5.25 5.5a.75.75 0 1 1-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0 1 10 17Z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs font-bold text-primary-600 dark:text-indigo-400">{MOCKUP_VOTES[i]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                      <div className="mt-1">
                        <span className={`inline-flex text-xs px-2 py-0.5 rounded-full font-medium
                          ${MOCKUP_COLORS[i] === 'orange' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : ''}
                          ${MOCKUP_COLORS[i] === 'yellow' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
                          ${MOCKUP_COLORS[i] === 'blue' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : ''}
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
  const { t } = useTranslation();
  const stats = t('landing.stats', { returnObjects: true }) as Array<{ value: string; label: string }>;

  return (
    <section className="bg-primary-600 dark:bg-primary-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl sm:text-4xl font-extrabold text-white">{stat.value}</p>
              <p className="mt-1 text-sm text-primary-100">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How it works ─────────────────────────────────────────────────────────────

function HowItWorksSection() {
  const { t } = useTranslation();
  const steps = t('landing.howItWorks.steps', { returnObjects: true }) as Array<{ number: string; title: string; description: string }>;

  return (
    <section id="como-funciona" className="bg-card/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">
            {t('landing.howItWorks.title')}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('landing.howItWorks.subtitle')}
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, i) => (
            <div key={step.number} className="relative text-center">
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[calc(50%+3rem)] right-0 border-t-2 border-dashed border-indigo-200 dark:border-indigo-900" />
              )}

              <div className="relative inline-flex flex-col items-center">
                <span className="text-7xl font-extrabold text-indigo-50 dark:text-indigo-950 select-none absolute -top-4 left-1/2 -translate-x-1/2">
                  {step.number}
                </span>
                <div className="relative z-10 inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-primary-600 dark:text-indigo-400">
                  {STEP_ICONS[i]}
                </div>
              </div>

              <h3 className="mt-6 text-xl font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

function FeaturesSection() {
  const { t } = useTranslation();
  const features = t('landing.features.items', { returnObjects: true }) as Array<{ title: string; description: string }>;

  return (
    <section id="funcionalidades" className="bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">
            {t('landing.features.title')}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('landing.features.subtitle')}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((item, i) => (
            <div
              key={item.title}
              className="p-6 rounded-xl border border-border bg-card hover:border-primary-300 dark:hover:border-primary-600 transition-colors"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-primary-600 dark:text-indigo-400 mb-4">
                {FEATURE_ICONS[i]}
              </div>
              <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

function TestimonialsSection() {
  const { t } = useTranslation();
  const testimonials = t('landing.testimonials.items', { returnObjects: true }) as Array<{
    name: string; role: string; company: string; initials: string; text: string;
  }>;

  return (
    <section className="bg-card/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">
            {t('landing.testimonials.title')}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t('landing.testimonials.subtitle')}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((dep) => (
            <div
              key={dep.name}
              className="p-6 rounded-xl border border-border bg-warm-50 dark:bg-warm-800/50 flex flex-col"
            >
              <span className="text-4xl font-serif text-indigo-200 dark:text-indigo-800 leading-none select-none">"</span>

              <p className="mt-2 text-foreground text-sm leading-relaxed flex-1">
                {dep.text}
              </p>

              <div className="flex items-center gap-3 mt-6">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-semibold text-sm flex-shrink-0">
                  {dep.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{dep.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {dep.role} · {dep.company}
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

// ─── Pricing ──────────────────────────────────────────────────────────────────

function PricingSection() {
  const { t } = useTranslation();
  const plans = t('landing.pricing.plans', { returnObjects: true }) as Array<{
    name: string; price: string; period: string; features: string[]; cta: string;
  }>;

  return (
    <section id="precos" className="bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">
            {t('landing.pricing.title')}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t('landing.pricing.subtitle')}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const isHighlighted = plan.name === 'Pro';
            return (
              <div
                key={plan.name}
                className={`relative p-6 rounded-xl border bg-card flex flex-col ${
                  isHighlighted
                    ? 'ring-2 ring-primary-600 dark:ring-primary-500 border-primary-600 dark:border-primary-500'
                    : 'border-border'
                }`}
              >
                {isHighlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      {t('landing.pricing.mostPopular')}
                    </span>
                  </div>
                )}

                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {plan.name}
                </p>

                <div className="mt-2 flex items-end gap-1">
                  <span className="text-4xl font-extrabold text-foreground">{plan.price}</span>
                  <span className="text-sm text-muted-foreground mb-1">{plan.period}</span>
                </div>

                <div className="my-4 border-t border-warm-100 dark:border-warm-800" />

                <ul className="space-y-2 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-foreground">
                      <svg className="w-4 h-4 text-primary-600 dark:text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                {plan.name === 'Business' ? (
                  <a
                    href="mailto:contato@upvote.com"
                    className="mt-6 block text-center text-sm font-semibold py-2.5 rounded-lg transition-colors border border-input text-foreground hover:bg-accent"
                  >
                    {plan.cta}
                  </a>
                ) : (
                  <Link
                    to="/register"
                    className={`mt-6 block text-center text-sm font-semibold py-2.5 rounded-lg transition-colors ${
                      isHighlighted || plan.name === 'Free'
                        ? 'bg-primary-600 hover:bg-primary-700 text-white'
                        : 'border border-input text-foreground hover:bg-accent'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────

function CtaFinalSection() {
  const { t } = useTranslation();

  return (
    <section className="bg-gradient-to-br from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
          {t('landing.cta.title')}
        </h2>
        <p className="mt-4 text-lg text-primary-100">
          {t('landing.cta.subtitle')}
        </p>
        <div className="mt-8">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-white text-primary-700 font-semibold px-8 py-3 rounded-lg hover:bg-primary-50 transition-colors text-base"
          >
            {t('landing.cta.startFree')}
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
  const { t } = useTranslation();

  const footerGroups = [
    {
      title: t('landing.footer.product'),
      links: [t('landing.footer.features'), t('landing.footer.pricing'), t('landing.footer.changelog')],
    },
    {
      title: t('landing.footer.company'),
      links: [t('landing.footer.blog'), t('landing.footer.about'), t('landing.footer.contact')],
    },
    {
      title: t('landing.footer.legal'),
      links: [t('landing.footer.privacy'), t('landing.footer.terms')],
    },
  ];

  return (
    <footer className="bg-warm-900 dark:bg-warm-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Logo and tagline */}
          <div className="col-span-2">
            <span className="text-xl font-bold text-primary-400">Upvote</span>
            <p className="mt-3 text-sm text-warm-400 max-w-xs">
              {t('landing.footer.tagline')}
            </p>
          </div>

          {/* Link columns */}
          {footerGroups.map((group) => (
            <div key={group.title}>
              <p className="text-sm font-semibold text-warm-300">{group.title}</p>
              <ul className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-warm-400 hover:text-warm-300 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-warm-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-warm-500">
            © {new Date().getFullYear()} Upvote. {t('landing.footer.rights')}
          </p>
          <p className="text-sm text-warm-500">
            Feito com carinho no Brasil 🇧🇷 Pelo Engenheiro Guilherme Dias Cardoso
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <main>
      <NavbarSection />
      <HeroSection />
      <StatsSection />
      <HowItWorksSection />
      <FeaturesSection />
      <TestimonialsSection />
      <PricingSection />
      <CtaFinalSection />
      <FooterSection />
    </main>
  );
}
