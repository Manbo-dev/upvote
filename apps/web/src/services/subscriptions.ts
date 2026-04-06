import api from './api';

export interface SubscriptionInfo {
  plano: 'FREE' | 'STARTER' | 'PRO' | 'BUSINESS';
  stripeStatus: string | null;
  currentPeriodEnd: string | null;
  limiteCanais: number;
  canaisAtivos: number;
  limiteSugestoesMes: number;
  sugestoesUsadasMes: number;
  widgetHabilitado: boolean;
  widgetCustomizationEnabled: boolean;
  integrationsEnabled: boolean;
  publicBoardEnabled: boolean;
}

interface ApiResult<T> {
  success: boolean;
  message?: string;
  data: T;
}

export async function getSubscription(): Promise<SubscriptionInfo> {
  const { data } = await api.get<ApiResult<SubscriptionInfo>>('/subscriptions');
  return data.data;
}

export async function createCheckoutSession(plano: string): Promise<string> {
  const { data } = await api.post<ApiResult<{ checkoutUrl: string }>>(
    '/subscriptions/checkout',
    { plano },
  );
  return data.data.checkoutUrl;
}

export async function createPortalSession(): Promise<string> {
  const { data } = await api.post<ApiResult<{ portalUrl: string }>>(
    '/subscriptions/portal',
  );
  return data.data.portalUrl;
}
