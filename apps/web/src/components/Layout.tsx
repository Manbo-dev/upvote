import { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutGrid,
  Key,
  CreditCard,
  Puzzle,
  Settings,
  LogOut,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useThemeStore } from '../store/themeStore';
import { useLanguageStore } from '../store/languageStore';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

/**
 * Main dashboard layout with sidebar and header
 */
export default function Layout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggle } = useThemeStore();
  const { language, setLanguage } = useLanguageStore();
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const MAIN_NAV: NavItem[] = [
    {
      to: '/dashboard',
      label: t('nav.channels'),
      icon: <LayoutGrid className="h-5 w-5 flex-shrink-0" />,
    },
    {
      to: '/dashboard/integrations',
      label: t('nav.integrations'),
      icon: <Puzzle className="h-5 w-5 flex-shrink-0" />,
    },
  ];

  const ACCOUNT_NAV: NavItem[] = [
    {
      to: '/dashboard/api-keys',
      label: t('nav.apiKeys'),
      icon: <Key className="h-5 w-5 flex-shrink-0" />,
    },
    {
      to: '/dashboard/billing',
      label: t('nav.subscription'),
      icon: <CreditCard className="h-5 w-5 flex-shrink-0" />,
    },
    {
      to: '/dashboard/settings',
      label: t('nav.settings'),
      icon: <Settings className="h-5 w-5 flex-shrink-0" />,
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname.match(/^\/dashboard\/[^/]+$/);
    }
    return location.pathname.startsWith(path);
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderNavItem = (item: NavItem) => {
    const active = isActive(item.to);
    const linkContent = (
      <Link
        to={item.to}
        onClick={() => setMobileMenuOpen(false)}
        className={cn(
          'flex items-center rounded-lg py-2.5 text-sm font-medium transition-colors',
          sidebarOpen ? 'gap-3 px-3' : 'justify-center px-2',
          active
            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
            : 'text-warm-600 hover:bg-warm-100 hover:text-warm-900 dark:text-warm-400 dark:hover:bg-warm-800 dark:hover:text-warm-200'
        )}
      >
        {item.icon}
        {sidebarOpen && <span className="truncate">{item.label}</span>}
      </Link>
    );

    if (!sidebarOpen) {
      return (
        <Tooltip key={item.to}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      );
    }

    return <li key={item.to}>{linkContent}</li>;
  };

  const renderNavGroup = (label: string, items: NavItem[]) => (
    <div>
      {sidebarOpen && (
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-warm-400 dark:text-warm-500">
          {label}
        </p>
      )}
      <ul className="space-y-1">{items.map(renderNavItem)}</ul>
    </div>
  );

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen bg-background">
        {/* Mobile backdrop */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex flex-shrink-0 flex-col border-r border-warm-200 bg-white transition-all duration-300 dark:border-warm-700 dark:bg-warm-900',
            'md:relative md:z-auto',
            sidebarOpen ? 'w-64' : 'w-16',
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          )}
        >
          {/* Sidebar header */}
          <div
            className={cn(
              'flex h-16 flex-shrink-0 items-center border-b border-warm-200 px-3 dark:border-warm-700',
              sidebarOpen ? 'justify-between' : 'justify-center'
            )}
          >
            {sidebarOpen && (
              <Link to="/dashboard" className="ml-1 text-xl font-bold text-primary-600">
                Upvote
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={t('nav.toggleSidebar')}
              className="text-warm-500 hover:text-warm-700 dark:text-warm-400 dark:hover:text-warm-200"
            >
              {sidebarOpen ? (
                <PanelLeftClose className="h-5 w-5" />
              ) : (
                <PanelLeftOpen className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-6">
            {renderNavGroup(t('nav.groupMain'), MAIN_NAV)}
            <Separator className="bg-warm-200 dark:bg-warm-700" />
            {renderNavGroup(t('nav.groupAccount'), ACCOUNT_NAV)}
          </nav>

          {/* Profile section at bottom */}
          <div className="mt-auto border-t border-warm-200 p-3 dark:border-warm-700">
            {/* Theme + Language toggles */}
            <div
              className={cn(
                'mb-3 flex items-center',
                sidebarOpen ? 'gap-1' : 'flex-col gap-1'
              )}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={toggle}
                aria-label={t('nav.toggleTheme')}
                className="h-8 w-8 text-warm-500 hover:text-warm-700 dark:text-warm-400 dark:hover:text-warm-200"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLanguage(language === 'pt-BR' ? 'en' : 'pt-BR')}
                className="h-8 px-2 text-xs font-semibold text-warm-500 hover:text-warm-700 dark:text-warm-400 dark:hover:text-warm-200"
              >
                {language === 'pt-BR' ? 'EN' : 'PT'}
              </Button>
            </div>

            <Separator className="mb-3 bg-warm-200 dark:bg-warm-700" />

            {/* User profile */}
            <div
              className={cn(
                'flex items-center',
                sidebarOpen ? 'gap-3' : 'flex-col gap-2'
              )}
            >
              <Avatar className="h-9 w-9 border border-warm-200 dark:border-warm-700">
                {user?.avatar && (
                  <AvatarImage src={user.avatar} alt={user?.name} className="object-cover" />
                )}
                <AvatarFallback className="bg-primary-100 text-sm font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>

              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-warm-900 dark:text-warm-100">
                    {user?.name}
                  </p>
                  <p className="truncate text-xs text-warm-500 dark:text-warm-400">
                    {user?.email}
                  </p>
                </div>
              )}

              {sidebarOpen ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="h-8 w-8 flex-shrink-0 text-warm-500 hover:text-red-600 dark:text-warm-400 dark:hover:text-red-400"
                  aria-label={t('nav.logout')}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleLogout}
                      className="h-8 w-8 text-warm-500 hover:text-red-600 dark:text-warm-400 dark:hover:text-red-400"
                      aria-label={t('nav.logout')}
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">{t('nav.logout')}</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <header className="flex h-14 items-center justify-between border-b border-warm-200 bg-white px-4 dark:border-warm-700 dark:bg-warm-900 md:px-6">
            <div className="flex items-center gap-3">
              {/* Hamburger — mobile only */}
              <Button
                variant="ghost"
                size="icon"
                className="text-warm-500 md:hidden"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h2 className="text-lg font-semibold text-foreground">Dashboard</h2>
            </div>
          </header>

          {/* Content area */}
          <main className="flex-1 overflow-y-auto p-3 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
