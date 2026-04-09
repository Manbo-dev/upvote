import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getSubscription, createCheckoutSession, createPortalSession } from '../services/subscriptions';

/**
 * Subscription and billing management page.
 * Detects return from Stripe checkout via query params and polls
 * until the webhook processes the subscription update.
 */
export default function BillingPage() {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [banner, setBanner] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: getSubscription,
    refetchInterval: isPolling ? 2000 : false,
  });

  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success === 'true') {
      setBanner({ type: 'success', message: t('billing.banners.success') });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      setIsPolling(true);
      setSearchParams({}, { replace: true });
    } else if (canceled === 'true') {
      setBanner({ type: 'info', message: t('billing.banners.canceled') });
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, queryClient, t]);

  const stopPollingIfUpdated = useCallback(() => {
    if (isPolling && subscription && subscription.plano !== 'FREE') {
      setIsPolling(false);
      setBanner({ type: 'success', message: t('billing.banners.successFinal') });
    }
  }, [isPolling, subscription, t]);

  useEffect(() => {
    stopPollingIfUpdated();
  }, [stopPollingIfUpdated]);

  useEffect(() => {
    if (!isPolling) return;
    const timeout = setTimeout(() => {
      setIsPolling(false);
      if (subscription?.plano === 'FREE') {
        setBanner({ type: 'info', message: t('billing.banners.processing') });
      }
    }, 30000);
    return () => clearTimeout(timeout);
  }, [isPolling, subscription?.plano, t]);

  const handleCheckout = async (plano: string) => {
    setLoading(plano);
    setError('');
    try {
      const url = await createCheckoutSession(plano);
      window.location.href = url;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || t('billing.errors.checkout'));
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
      setError(e.response?.data?.message || t('billing.errors.portal'));
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
  const isPago = planoAtual === 'STARTER' || planoAtual === 'PRO' || planoAtual === 'BUSINESS';

  const planoLabels: Record<string, string> = {
    FREE: 'Free',
    STARTER: 'Starter',
    PRO: 'Pro',
    BUSINESS: 'Business',
  };

  const locale = i18n.language === 'pt-BR' ? 'pt-BR' : 'en-US';

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{t('billing.title')}</h1>

      {/* Checkout feedback banner */}
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

      {/* Current plan */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{t('billing.currentPlan')}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
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
                {subscription.stripeStatus === 'ACTIVE'
                  ? t('billing.stripeStatus.ACTIVE')
                  : subscription.stripeStatus === 'PAST_DUE'
                    ? t('billing.stripeStatus.PAST_DUE')
                    : subscription.stripeStatus}
              </span>
            )}
          </div>
          {isPago && (
            <button
              onClick={handlePortal}
              disabled={loading === 'portal'}
              className="rounded-lg border border-input px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
            >
              {loading === 'portal' ? t('billing.opening') : t('billing.manageSubscription')}
            </button>
          )}
        </div>

        {subscription.currentPeriodEnd && (
          <p className="mt-3 text-sm text-muted-foreground">
            {t('billing.renewsOn')} {new Date(subscription.currentPeriodEnd).toLocaleDateString(locale)}
          </p>
        )}
      </div>

      {/* Current usage */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">{t('billing.currentUsage')}</h2>
        <div className="space-y-4">
          {/* Channels */}
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('billing.channels')}</span>
              <span className="font-medium text-foreground">
                {subscription.canaisAtivos} de {subscription.limiteCanais}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-warm-100 dark:bg-warm-800">
              <div
                className="h-full rounded-full bg-primary-600 transition-all"
                style={{ width: `${Math.min((subscription.canaisAtivos / subscription.limiteCanais) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Suggestions (only if has limit) */}
          {subscription.limiteSugestoesMes < 2147483647 && (
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('billing.suggestionsThisMonth')}</span>
                <span className="font-medium text-foreground">
                  {subscription.sugestoesUsadasMes} de {subscription.limiteSugestoesMes}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-warm-100 dark:bg-warm-800">
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

      {/* Upgrade cards (if not on PRO or BUSINESS) */}
      {planoAtual !== 'PRO' && planoAtual !== 'BUSINESS' && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            {planoAtual === 'FREE' ? t('billing.doUpgrade') : t('billing.upgradeAvailable')}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Starter */}
            {planoAtual === 'FREE' && (
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-lg font-bold text-foreground">Starter</h3>
                <p className="mt-1 text-3xl font-bold text-foreground">
                  R$49<span className="text-base font-normal text-muted-foreground">{t('billing.perMonth')}</span>
                </p>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {(t('billing.plans.starter.features', { returnObjects: true }) as string[]).map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleCheckout('STARTER')}
                  disabled={loading === 'STARTER'}
                  className="mt-6 w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
                >
                  {loading === 'STARTER' ? t('billing.redirecting') : `${t('billing.subscribeTo')} Starter`}
                </button>
              </div>
            )}

            {/* Pro */}
            <div className="rounded-xl border-2 border-primary-600 bg-card p-6">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-foreground">Pro</h3>
                <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                  {t('billing.plans.pro.popular')}
                </span>
              </div>
              <p className="mt-1 text-3xl font-bold text-foreground">
                R$129<span className="text-base font-normal text-muted-foreground">{t('billing.perMonth')}</span>
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {(t('billing.plans.pro.features', { returnObjects: true }) as string[]).map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={isPago ? handlePortal : () => handleCheckout('PRO')}
                disabled={isPago ? loading === 'portal' : loading === 'PRO'}
                className="mt-6 w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
              >
                {isPago
                  ? (loading === 'portal' ? t('billing.opening') : t('billing.upgradeViaPortal'))
                  : (loading === 'PRO' ? t('billing.redirecting') : `${t('billing.subscribeTo')} Pro`)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Business plan */}
      {planoAtual !== 'BUSINESS' && (
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-foreground">Business</h3>
              <p className="mt-1 text-3xl font-bold text-foreground">
                R$299<span className="text-base font-normal text-muted-foreground">{t('billing.perMonth')}</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('billing.plans.business.description')}
              </p>
            </div>
            <button
              onClick={isPago ? handlePortal : () => handleCheckout('BUSINESS')}
              disabled={isPago ? loading === 'portal' : loading === 'BUSINESS'}
              className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
            >
              {isPago
                ? (loading === 'portal' ? t('billing.opening') : t('billing.upgradeViaPortal'))
                : (loading === 'BUSINESS' ? t('billing.redirecting') : `${t('billing.subscribeTo')} Business`)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
