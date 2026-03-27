import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useThemeStore } from '../store/themeStore';
import { useLanguageStore } from '../store/languageStore';

const ToggleIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} />
    <line x1="9" y1="3" x2="9" y2="21" strokeWidth={2} />
  </svg>
);

/**
 * Main dashboard layout with sidebar and header
 */
export default function Layout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggle } = useThemeStore();
  const { language, setLanguage } = useLanguageStore();
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);

  const NAV_ITEMS = [
    {
      to: '/dashboard',
      label: t('nav.channels'),
      icon: (
        <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      to: '/dashboard/api-keys',
      label: t('nav.apiKeys'),
      icon: (
        <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      ),
    },
    {
      to: '/dashboard/billing',
      label: t('nav.subscription'),
      icon: (
        <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      to: '/dashboard/integrations',
      label: t('nav.integrations'),
      icon: (
        <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
        </svg>
      ),
    },
    {
      to: '/dashboard/settings',
      label: t('nav.settings'),
      icon: (
        <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 md:relative md:z-auto ${sidebarOpen ? 'md:w-64' : 'md:w-14'} ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} flex flex-shrink-0 flex-col border-r border-gray-200 bg-white transition-all duration-300 dark:border-gray-800 dark:bg-gray-900`}
      >
        {/* Sidebar header */}
        <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-gray-200 px-3 dark:border-gray-800">
          {sidebarOpen && (
            <Link to="/dashboard" className="ml-1 text-xl font-bold text-primary-600">
              Upvote
            </Link>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={t('nav.toggleSidebar')}
            className={`rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 ${!sidebarOpen ? 'mx-auto' : ''}`}
          >
            <ToggleIcon />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  title={!sidebarOpen ? item.label : undefined}
                  className={`flex items-center rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-700 dark:text-gray-300 dark:hover:bg-primary-900/20 dark:hover:text-primary-400 ${sidebarOpen ? 'gap-3 px-3' : 'justify-center px-2'}`}
                >
                  {item.icon}
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900 md:px-6">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 md:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Dashboard</h2>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <span className="hidden text-sm text-gray-600 dark:text-gray-400 sm:inline">{user?.name}</span>

            {/* Language toggle — hidden on mobile */}
            <button
              onClick={() => setLanguage(language === 'pt-BR' ? 'en' : 'pt-BR')}
              className="hidden rounded-lg px-2 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 sm:flex"
              title={language === 'pt-BR' ? 'Switch to English' : 'Mudar para Português'}
            >
              {language === 'pt-BR' ? 'EN' : 'PT'}
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggle}
              aria-label={t('nav.toggleTheme')}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
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

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="rounded-lg p-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <span className="hidden sm:inline">{t('nav.logout')}</span>
              {/* Icon-only on mobile */}
              <svg className="h-5 w-5 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto p-3 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
