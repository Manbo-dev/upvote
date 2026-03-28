import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { getCanais, CanalResponse } from '../services/canais';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: canais } = useQuery({ queryKey: ['canais'], queryFn: getCanais });

  const firstCanal = canais?.[0];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</h1>

      <div className="max-w-2xl space-y-6">
        {/* Profile */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('settings.profile')}</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('settings.name')}
              </label>
              <input
                type="text"
                value={user?.name || ''}
                readOnly
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('settings.email')}
              </label>
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Widget installation guide */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('settings.widgetSection')}</h2>
            <Link
              to="/dashboard/api-keys"
              className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              {t('settings.widget.viewApiKeys')} →
            </Link>
          </div>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">{t('settings.widgetDescription')}</p>

          {/* Steps */}
          <div className="mb-6 space-y-4">
            <Step
              title={t('settings.widget.step1Title')}
              description={t('settings.widget.step1Description')}
            />
            {firstCanal ? (
              <SnippetBlock canal={firstCanal} />
            ) : (
              <p className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                {t('settings.widget.noCanal')}{' '}
                <Link to="/dashboard" className="text-indigo-600 hover:underline dark:text-indigo-400">
                  {t('nav.channels')}
                </Link>
              </p>
            )}
            <Step
              title={t('settings.widget.step2Title')}
              description={t('settings.widget.step2Description')}
            />
            <Step
              title={t('settings.widget.step3Title')}
              description={t('settings.widget.step3Description')}
              highlight
            />
          </div>

          {/* Auto-captured context */}
          <div className="mb-6 rounded-lg bg-indigo-50 p-4 dark:bg-indigo-900/20">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
              {t('settings.widget.contextTitle')}
            </p>
            <ul className="space-y-1">
              {(['contextUrl', 'contextInteraction', 'contextDevice'] as const).map((key) => (
                <li key={key} className="flex items-center gap-2 text-sm text-indigo-700 dark:text-indigo-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                  {t(`settings.widget.${key}`)}
                </li>
              ))}
            </ul>
          </div>

          {/* Advanced options */}
          <AdvancedOptions />
        </div>
      </div>
    </div>
  );
}

function Step({ title, description, highlight }: { title: string; description: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg p-3 ${highlight ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
      <p className={`text-sm font-semibold ${highlight ? 'text-green-700 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
        {title}
      </p>
      <p className={`text-sm ${highlight ? 'text-green-600 dark:text-green-500' : 'text-gray-500 dark:text-gray-400'}`}>
        {description}
      </p>
    </div>
  );
}

function SnippetBlock({ canal }: { canal: CanalResponse }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const snippet = `<script
  src="https://api.upvote.pro/widget.js"
  data-api-key="${canal.apiKey}"
  data-base-url="https://api.upvote.pro"
  data-color="${canal.widgetColor}"
  data-trigger="button"
></script>`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-green-400">{snippet}</pre>
      <button
        onClick={handleCopy}
        className="absolute right-3 top-3 rounded-md bg-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-600 transition-colors"
      >
        {copied ? t('settings.widget.copied') : t('settings.widget.copySnippet')}
      </button>
    </div>
  );
}

function AdvancedOptions() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-gray-100 pt-4 dark:border-gray-800">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
      >
        <svg
          className={`h-4 w-4 transition-transform ${open ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        {t('settings.widget.advancedTitle')}
      </button>
      {open && (
        <ul className="mt-3 space-y-2">
          {(['advancedTriggerButton', 'advancedTriggerAlways', 'advancedProgrammatic'] as const).map((key) => (
            <li key={key} className="rounded-lg bg-gray-50 px-3 py-2 font-mono text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {t(`settings.widget.${key}`)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
