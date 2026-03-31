import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  getIntegrations,
  getJiraAuthorizationUrl,
  getClickUpAuthorizationUrl,
  disconnectIntegration,
  type IntegrationResponse,
} from '../services/integrations';

const PROVIDERS = [
  {
    key: 'JIRA' as const,
    name: 'Jira',
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.571 11.513H0a5.218 5.218 0 005.232 5.215h2.13v2.057A5.215 5.215 0 0012.575 24V12.518a1.005 1.005 0 00-1.005-1.005zm5.723-5.756H5.736a5.215 5.215 0 005.215 5.214h2.129v2.058a5.218 5.218 0 005.215 5.214V6.758a1.001 1.001 0 00-1.001-1.001zM23.013 0H11.455a5.215 5.215 0 005.215 5.215h2.129v2.057A5.215 5.215 0 0024.013 12.5V1.005A1.005 1.005 0 0023.013 0z" />
      </svg>
    ),
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  {
    key: 'CLICKUP' as const,
    name: 'ClickUp',
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3.678 7.395l3.63 2.768c1.328-1.735 3.286-2.755 5.446-2.755s4.103 1.005 5.39 2.725l3.66-2.727C19.312 4.367 16.06 2.662 12.754 2.662c-3.338 0-6.545 1.723-9.076 4.733zM12.727 14.63a3.77 3.77 0 01-2.894-1.35l-3.63 2.77c1.94 2.54 4.988 4.287 6.524 4.287s4.596-1.747 6.535-4.29l-3.66-2.726a3.78 3.78 0 01-2.875 1.31z" />
      </svg>
    ),
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
];

export default function IntegrationsSettings() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);

  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn: getIntegrations,
  });

  const disconnectMutation = useMutation({
    mutationFn: disconnectIntegration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });

  const getConnectedIntegration = (provider: string): IntegrationResponse | undefined => {
    return integrations.find((i) => i.provider === provider);
  };

  const handleConnect = async (provider: 'JIRA' | 'CLICKUP') => {
    setConnectingProvider(provider);
    try {
      const url =
        provider === 'JIRA'
          ? await getJiraAuthorizationUrl()
          : await getClickUpAuthorizationUrl();
      window.location.href = url;
    } catch {
      setConnectingProvider(null);
    }
  };

  const handleDisconnect = (integrationId: string) => {
    disconnectMutation.mutate(integrationId);
  };

  return (
    <div className="max-w-2xl rounded-xl border border-border bg-card p-6">
      <h2 className="mb-1 text-lg font-semibold text-foreground">
        {t('integrations.title')}
      </h2>
      <p className="mb-5 text-sm text-muted-foreground">
        {t('integrations.description')}
      </p>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      ) : (
        <div className="space-y-4">
          {PROVIDERS.map((provider) => {
            const connected = getConnectedIntegration(provider.key);
            const isConnecting = connectingProvider === provider.key;
            const isDisconnecting =
              disconnectMutation.isPending &&
              disconnectMutation.variables === connected?.id;

            return (
              <div
                key={provider.key}
                className={`flex items-center gap-4 rounded-lg border p-4 transition-all ${
                  connected
                    ? `${provider.borderColor} ${provider.bgColor}`
                    : 'border-warm-200 bg-warm-50 dark:border-warm-700 dark:bg-warm-800'
                }`}
              >
                <div className={`flex-shrink-0 ${provider.color}`}>
                  {provider.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-foreground">
                    {provider.name}
                  </h3>
                  {connected ? (
                    <p className="truncate text-sm text-muted-foreground">
                      {t('integrations.connectedTo')} {connected.siteUrl}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {t('integrations.notConnected')}
                    </p>
                  )}
                </div>

                {connected ? (
                  <button
                    onClick={() => handleDisconnect(connected.id)}
                    disabled={isDisconnecting}
                    className="flex-shrink-0 rounded-lg border border-red-200 bg-card px-4 py-2 text-sm font-medium text-red-600 transition-all hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    {isDisconnecting ? t('common.loading') : t('integrations.disconnect')}
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnect(provider.key)}
                    disabled={isConnecting}
                    className="flex-shrink-0 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-primary-700 disabled:opacity-50"
                  >
                    {isConnecting ? t('common.loading') : t('integrations.connect')}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
