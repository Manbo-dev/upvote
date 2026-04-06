# TODOs do Projeto



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
