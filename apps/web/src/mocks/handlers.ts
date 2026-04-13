import { http, HttpResponse } from 'msw';

const BASE = '/api';

const mockUser = {
  name: 'Guilherme',
  email: 'guilherme@gmail.com',
  plano: 'PRO',
};

const mockCanal = {
  id: '1',
  name: 'TechStore',
  slug: 'ter',
  apiKey: 'sk_mock_abc123',
  widgetColor: '#6366f1',
  widgetPosition: 'BOTTOM_RIGHT',
  widgetMode: 'FLOATING',
  widgetTitle: '',
  widgetPlaceholder: '',
  widgetTheme: 'auto',
  widgetLanguage: 'pt-BR',
  widgetButtonStyle: 'CIRCLE',
  publicBoardEnabled: false,
  createdAt: '2024-01-01T00:00:00Z',
};

const now = new Date();
const ago = (minutes: number) => new Date(now.getTime() - minutes * 60 * 1000).toISOString();

let feedbackGroups = [
  {
    id: 'fg-1',
    title: 'Botão de pagamento não responde no mobile',
    summary: 'Vários usuários relatam que o botão de pagar trava no iPhone após selecionar cartão.',
    voteCount: 14,
    status: 'OPEN',
    category: 'BUG',
    topContext: "após 'Confirmar pedido' na tela de checkout",
    createdAt: ago(60),
    updatedAt: ago(60),
  },
  {
    id: 'fg-2',
    title: 'Filtro por categoria no catálogo',
    summary: 'Usuários querem filtrar produtos por mais de uma categoria ao mesmo tempo.',
    voteCount: 10,
    status: 'OPEN',
    category: 'SUGGESTION',
    topContext: "na tela de Catálogo de Produtos",
    createdAt: ago(90),
    updatedAt: ago(90),
  },
  {
    id: 'fg-3',
    title: 'Tempo de carregamento muito alto na listagem',
    summary: 'A tela de listagem de produtos demora mais de 8s para carregar em conexões 4G.',
    voteCount: 8,
    status: 'PLANNED',
    category: 'COMPLAINT',
    topContext: "ao abrir a tela de Listagem",
    createdAt: ago(120),
    updatedAt: ago(30),
  },
  {
    id: 'fg-4',
    title: 'Checkout em uma etapa só ficou incrível',
    summary: 'Muitos elogios ao novo fluxo de checkout simplificado lançado na v2.',
    voteCount: 6,
    status: 'DONE',
    category: 'PRAISE',
    topContext: "após finalizar compra com sucesso",
    createdAt: ago(200),
    updatedAt: ago(10),
  },
  {
    id: 'fg-5',
    title: 'Notificação de rastreio por WhatsApp',
    summary: 'Usuários querem receber atualizações do pedido via WhatsApp ao invés de email.',
    voteCount: 5,
    status: 'IN_PROGRESS',
    category: 'SUGGESTION',
    topContext: "após 'Pedido confirmado' na tela de status",
    createdAt: ago(300),
    updatedAt: ago(20),
  },
  {
    id: 'fg-6',
    title: 'Erro 500 ao aplicar cupom expirado',
    summary: 'Cupons expirados retornam erro 500 em vez de mensagem amigável.',
    voteCount: 3,
    status: 'OPEN',
    category: 'BUG',
    topContext: "ao inserir cupom na tela de carrinho",
    createdAt: ago(400),
    updatedAt: ago(400),
  },
  {
    id: 'fg-7',
    title: 'Modo escuro no app mobile',
    summary: 'Pedido recorrente de dark mode principalmente para uso noturno.',
    voteCount: 1,
    status: 'OPEN',
    category: 'SUGGESTION',
    topContext: "na tela de Configurações",
    createdAt: ago(500),
    updatedAt: ago(500),
  },
];

const mockFeedbackDetails: Record<string, object[]> = {
  'fg-1': [
    {
      id: 'f-1a',
      rawMessage: 'O botão de pagar não funciona no meu iPhone, fica carregando infinito',
      synthesizedMessage: 'Botão de pagamento trava indefinidamente no iOS após seleção de método de pagamento',
      pageUrl: 'https://techstore.com/checkout',
      pageTitle: 'TechStore — Finalizar Compra',
      triggerType: 'button',
      lastInteraction: 'Confirmar pedido',
      deviceType: 'Mobile',
      createdAt: ago(60),
    },
    {
      id: 'f-1b',
      rawMessage: 'Tentei pagar 3 vezes e sempre trava, usando iPhone 13',
      synthesizedMessage: 'Falha repetida no fluxo de pagamento em dispositivo iOS (iPhone 13)',
      pageUrl: 'https://techstore.com/checkout',
      pageTitle: 'TechStore — Finalizar Compra',
      triggerType: 'automatic',
      lastInteraction: 'Selecionar cartão',
      deviceType: 'Mobile',
      createdAt: ago(75),
    },
  ],
  'fg-2': [
    {
      id: 'f-2a',
      rawMessage: 'Seria ótimo poder filtrar por eletrônicos E roupas ao mesmo tempo',
      synthesizedMessage: 'Solicitação de filtro multicategoria simultâneo no catálogo',
      pageUrl: 'https://techstore.com/catalogo',
      pageTitle: 'TechStore — Catálogo',
      triggerType: 'button',
      lastInteraction: 'Filtrar por categoria',
      deviceType: 'Desktop',
      createdAt: ago(90),
    },
  ],
};

export const handlers = [
  // Auth
  http.post(`${BASE}/auth/login`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        token: 'mock-jwt-token-dev',
        user: mockUser,
      },
    });
  }),

  http.get(`${BASE}/auth/me`, () => {
    return HttpResponse.json({ success: true, data: mockUser });
  }),

  // Canais
  http.get(`${BASE}/canais`, () => {
    return HttpResponse.json({ success: true, data: [mockCanal] });
  }),

  http.get(`${BASE}/canais/:slug`, () => {
    return HttpResponse.json({ success: true, data: mockCanal });
  }),

  http.post(`${BASE}/canais`, async ({ request }) => {
    const body = await request.json() as { name: string; slug: string };
    const newCanal = { ...mockCanal, id: '2', name: body.name, slug: body.slug };
    return HttpResponse.json({ success: true, data: newCanal }, { status: 201 });
  }),

  // Feedback groups
  http.get(`${BASE}/canais/:slug/feedback-groups`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const category = url.searchParams.get('category');
    let filtered = feedbackGroups;
    if (status) {
      filtered = filtered.filter((g) => g.status === status);
    } else {
      // Default: exclude ARCHIVED (matches backend behavior)
      filtered = filtered.filter((g) => g.status !== 'ARCHIVED');
    }
    if (category) {
      filtered = filtered.filter((g) => g.category === category);
    }
    return HttpResponse.json({ success: true, data: filtered });
  }),

  http.get(`${BASE}/feedback-groups/:groupId/feedbacks`, ({ params }) => {
    const details = mockFeedbackDetails[params.groupId as string] ?? [];
    return HttpResponse.json({ success: true, data: details });
  }),

  http.patch(`${BASE}/feedback-groups/:groupId/status`, async ({ params, request }) => {
    const body = await request.json() as { status: string };
    feedbackGroups = feedbackGroups.map((g) =>
      g.id === params.groupId ? { ...g, status: body.status, updatedAt: new Date().toISOString() } : g
    );
    const updated = feedbackGroups.find((g) => g.id === params.groupId);
    return HttpResponse.json({ success: true, data: updated });
  }),

  // Archive all done
  http.post(`${BASE}/canais/:slug/feedback-groups/archive-done`, () => {
    let count = 0;
    feedbackGroups = feedbackGroups.map((g) => {
      if (g.status === 'DONE') {
        count++;
        return { ...g, status: 'ARCHIVED', updatedAt: new Date().toISOString() };
      }
      return g;
    });
    return HttpResponse.json({ success: true, data: { archivedCount: count }, message: `${count} feedback group(s) archived` });
  }),

  // Archive single
  http.post(`${BASE}/feedback-groups/:groupId/archive`, ({ params }) => {
    feedbackGroups = feedbackGroups.map((g) =>
      g.id === params.groupId ? { ...g, status: 'ARCHIVED', updatedAt: new Date().toISOString() } : g
    );
    const updated = feedbackGroups.find((g) => g.id === params.groupId);
    return HttpResponse.json({ success: true, data: updated, message: 'Feedback group archived' });
  }),

  // Restore
  http.post(`${BASE}/feedback-groups/:groupId/restore`, ({ params }) => {
    feedbackGroups = feedbackGroups.map((g) =>
      g.id === params.groupId ? { ...g, status: 'DONE', updatedAt: new Date().toISOString() } : g
    );
    const updated = feedbackGroups.find((g) => g.id === params.groupId);
    return HttpResponse.json({ success: true, data: updated, message: 'Feedback group restored' });
  }),

  http.patch(`${BASE}/feedback-groups/:groupId/category`, async ({ params, request }) => {
    const body = await request.json() as { category: string };
    feedbackGroups = feedbackGroups.map((g) =>
      g.id === params.groupId ? { ...g, category: body.category, updatedAt: new Date().toISOString() } : g
    );
    const updated = feedbackGroups.find((g) => g.id === params.groupId);
    return HttpResponse.json({ success: true, data: updated });
  }),

  // Subscriptions
  http.get(`${BASE}/subscriptions`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        plano: 'PRO',
        stripeStatus: 'ACTIVE',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        limiteCanais: 20,
        canaisAtivos: 1,
        limiteSugestoesMes: -1,
        sugestoesUsadasMes: 42,
        widgetHabilitado: true,
        widgetCustomizationEnabled: true,
        integrationsEnabled: true,
        publicBoardEnabled: true,
        pdfReportEnabled: true,
        cancelAtPeriodEnd: false,
      },
    });
  }),
];
