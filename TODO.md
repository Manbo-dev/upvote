# TODOs do Projeto



### [ ] Roadmap Público (/b/:slug) — STARTER+

Parceiros no plano STARTER+ podem compartilhar uma URL pública com seus usuários onde eles veem os feedback groups agrupados por status (tipo roadmap). Usuários finais veem sem criar conta.

**Backend:**

1. Adicionar campo `publicBoardEnabled BOOLEAN DEFAULT FALSE` à tabela `canais` (nova migration)
2. Adicionar campo `publicBoardEnabled` na entidade `Canal.java`
3. Endpoint público (sem JWT): `GET /api/public/canais/{slug}/board`
   - Verificar que `canal.publicBoardEnabled == true` — se false, retornar 404 (não revelar existência)
   - Verificar que o plano do dono é STARTER+ — se não, retornar 404
   - Retornar grupos com: id, título, resumo, status, categoria, votoCount (sem dados PII)
4. Endpoint autenticado: `PATCH /api/canais/{id}/public-board` para ativar/desativar
   - Verificar plano STARTER+ antes de permitir ativação

**Frontend:**

1. Nova página `apps/web/src/pages/PublicBoardPage.tsx`
   - Rota `/b/:slug` em `App.tsx` (pública, sem ProtectedRoute)
   - Exibe grupos agrupados por status em lista (sem kanban drag-and-drop)
   - Sem ações de gestão — apenas leitura
   - Header com nome do canal, sem branding do dashboard
2. Na aba "Configurações" do canal (criada no passo 17), adicionar toggle para ativar board público
   - Mostra link compartilhável quando ativo: `app.upvote.pro/b/{slug}`
   - Bloqueado com upgrade CTA para usuários FREE

---

### [ ] Atualizar Landing Page e Billing Page com nova estrutura de planos

Após implementar os planos corretamente no backend, atualizar o frontend de marketing e gerenciamento.

**`apps/web/src/pages/LandingPage.tsx`** — seção `#precos`:
- Atualizar cards dos planos com os benefícios reais implementados
- FREE: 1 canal, 20 sugestões/mês, widget básico
- STARTER: 3 canais, 500 sugestões/mês, widget, integrações, roadmap público
- PRO: 20 canais, ilimitado, personalização do widget, membros de equipe
- BUSINESS: ilimitado, white-label, suporte dedicado

**`apps/web/src/pages/BillingPage.tsx`** — cards de plano:
- Atualizar feature lists para refletir o que realmente está implementado
- Garantir que os botões de upgrade/downgrade funcionam corretamente com BUSINESS

**i18n:** Atualizar `landing.pricing.*` em `pt-BR.json` e `en.json`.


Membros de equipe (múltiplos usuários por org) — feature grande, requer novo modelo de auth
Roadmap público /b/:slug — nova página pública
Widget sidebar/inline embed modes — tipos diferentes de widget
White-label widget (remover "Powered by Upvote") — BUSINESS only
IA avançada (prioridade automática, detecção de tendências, resumo executivo)
Enforce limite de sugestões na submissão (atualmente só rastreado)
Gate export PDF por plano
Atualizar landing page / billing page com novos planos
Stripe BUSINESS price ID e checkout
