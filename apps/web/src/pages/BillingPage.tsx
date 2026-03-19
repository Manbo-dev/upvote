import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { getSubscription, createCheckoutSession, createPortalSession } from '../services/subscriptions';

/**
 * Página de gerenciamento de assinatura e billing.
 * Detecta retorno do Stripe checkout via query params e faz polling
 * até o webhook processar a atualização da assinatura.
 */
export default function BillingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [banner, setBanner] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: getSubscription,
    // Polling a cada 2s quando retorna do checkout, para aguardar o webhook processar
    refetchInterval: isPolling ? 2000 : false,
  });

  // Detecta retorno do Stripe checkout via query params
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success === 'true') {
      setBanner({ type: 'success', message: 'Assinatura ativada com sucesso! Atualizando dados...' });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      setIsPolling(true);
      // Limpa query params da URL
      setSearchParams({}, { replace: true });
    } else if (canceled === 'true') {
      setBanner({ type: 'info', message: 'Checkout cancelado. Você pode tentar novamente quando quiser.' });
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, queryClient]);

  // Para o polling quando a assinatura mudar de FREE para um plano pago
  const stopPollingIfUpdated = useCallback(() => {
    if (isPolling && subscription && subscription.plano !== 'FREE') {
      setIsPolling(false);
      setBanner({ type: 'success', message: 'Assinatura ativada com sucesso!' });
    }
  }, [isPolling, subscription]);

  useEffect(() => {
    stopPollingIfUpdated();
  }, [stopPollingIfUpdated]);

  // Timeout de segurança: para o polling após 15s
  useEffect(() => {
    if (!isPolling) return;
    const timeout = setTimeout(() => {
      setIsPolling(false);
      if (subscription?.plano === 'FREE') {
        setBanner({ type: 'info', message: 'Processando assinatura... Atualize a página em alguns instantes.' });
      }
    }, 30000);
    return () => clearTimeout(timeout);
  }, [isPolling, subscription?.plano]);

  const handleCheckout = async (plano: string) => {
    setLoading(plano);
    setError('');
    try {
      const url = await createCheckoutSession(plano);
      window.location.href = url;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Erro ao iniciar checkout');
      setLoading(null);
    }
  };

  const handlePortal = async () => {
    setLoading('portal');
    setError('');
    try {
      const url = await createPortalSession();
      window.location.href = url;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Erro ao abrir portal');
      setLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!subscription) return null;

  const planoAtual = subscription.plano;
  const isPago = planoAtual === 'STARTER' || planoAtual === 'PRO';

  const planoLabels: Record<string, string> = {
    FREE: 'Free',
    STARTER: 'Starter',
    PRO: 'Pro',
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Assinatura</h1>

      {/* Banner de feedback do checkout */}
      {banner && (
        <div className={`rounded-lg p-4 text-sm ${
          banner.type === 'success'
            ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
            : banner.type === 'error'
              ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
              : 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
        }`}>
          <div className="flex items-center justify-between">
            <span>{banner.message}</span>
            <button
              onClick={() => setBanner(null)}
              className="ml-4 text-current opacity-60 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Plano atual */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Plano atual</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              {planoLabels[planoAtual] || planoAtual}
            </p>
            {subscription.stripeStatus && (
              <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                subscription.stripeStatus === 'ACTIVE'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : subscription.stripeStatus === 'PAST_DUE'
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
              }`}>
                {subscription.stripeStatus === 'ACTIVE' ? 'Ativa' :
                 subscription.stripeStatus === 'PAST_DUE' ? 'Pagamento pendente' :
                 subscription.stripeStatus}
              </span>
            )}
          </div>
          {isPago && (
            <button
              onClick={handlePortal}
              disabled={loading === 'portal'}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {loading === 'portal' ? 'Abrindo...' : 'Gerenciar assinatura'}
            </button>
          )}
        </div>

        {subscription.currentPeriodEnd && (
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Renova em {new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}
          </p>
        )}
      </div>

      {/* Uso atual */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Uso atual</h2>
        <div className="space-y-4">
          {/* Canais */}
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Canais</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {subscription.canaisAtivos} de {subscription.limiteCanais}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className="h-full rounded-full bg-primary-600 transition-all"
                style={{ width: `${Math.min((subscription.canaisAtivos / subscription.limiteCanais) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Sugestoes (apenas se tem limite) */}
          {subscription.limiteSugestoesMes < 2147483647 && (
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Sugestoes este mes</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {subscription.sugestoesUsadasMes} de {subscription.limiteSugestoesMes}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className={`h-full rounded-full transition-all ${
                    subscription.sugestoesUsadasMes >= subscription.limiteSugestoesMes
                      ? 'bg-red-500'
                      : 'bg-primary-600'
                  }`}
                  style={{ width: `${Math.min((subscription.sugestoesUsadasMes / subscription.limiteSugestoesMes) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cards de upgrade (se não está no PRO) */}
      {planoAtual !== 'PRO' && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            {planoAtual === 'FREE' ? 'Faça upgrade' : 'Upgrade disponível'}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Starter */}
            {planoAtual === 'FREE' && (
              <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Starter</h3>
                <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
                  R$49<span className="text-base font-normal text-gray-500 dark:text-gray-400">/mes</span>
                </p>
                <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    3 canais
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Sugestoes ilimitadas
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Widget basico
                  </li>
                </ul>
                <button
                  onClick={() => handleCheckout('STARTER')}
                  disabled={loading === 'STARTER'}
                  className="mt-6 w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
                >
                  {loading === 'STARTER' ? 'Redirecionando...' : 'Assinar Starter'}
                </button>
              </div>
            )}

            {/* Pro */}
            <div className="rounded-xl border-2 border-primary-600 bg-white p-6 dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Pro</h3>
                <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                  Popular
                </span>
              </div>
              <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
                R$129<span className="text-base font-normal text-gray-500 dark:text-gray-400">/mes</span>
              </p>
              <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  10 canais
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Sugestoes ilimitadas
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  IA avancada + Changelog
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Suporte prioritario
                </li>
              </ul>
              <button
                onClick={() => handleCheckout('PRO')}
                disabled={loading === 'PRO'}
                className="mt-6 w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
              >
                {loading === 'PRO' ? 'Redirecionando...' : 'Assinar Pro'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plano Business */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Business</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Canais ilimitados, SSO, API, white-label e SLA dedicado.
            </p>
          </div>
          <a
            href="mailto:contato@upvote.com"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Fale conosco
          </a>
        </div>
      </div>
    </div>
  );
}
