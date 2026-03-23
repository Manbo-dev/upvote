import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

/**
 * Handles OAuth callbacks from Jira/ClickUp.
 * Receives code + state from the provider, calls backend to exchange tokens,
 * then redirects to settings page.
 */
export default function IntegrationCallbackPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { provider } = useParams<{ provider: string }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state || !provider) {
      setError('Missing OAuth parameters');
      return;
    }

    // Forward the callback to the backend
    api
      .get(`/integrations/${provider}/callback`, { params: { code, state } })
      .then(() => {
        navigate('/dashboard/settings', { replace: true });
      })
      .catch(() => {
        setError(t('integrations.callbackError'));
      });
  }, [searchParams, provider, navigate, t]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-center">
        {error ? (
          <div>
            <p className="mb-4 text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={() => navigate('/dashboard/settings')}
              className="text-primary-600 hover:underline"
            >
              {t('common.back')}
            </button>
          </div>
        ) : (
          <div>
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
            <p className="text-gray-600 dark:text-gray-400">{t('integrations.connecting')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
