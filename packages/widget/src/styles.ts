/**
 * Estilos CSS-in-JS para o widget Upvote
 * Todos os estilos são injetados via JS para evitar conflitos com a página host
 * Usa prefixo 'upvote-' em todas as classes para isolamento
 */
export function getStyles(color: string): string {
  return `
    /* Botão flutuante (modo FLOATING) */
    .upvote-widget-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background-color: ${color};
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      z-index: 99998;
      padding: 0;
    }

    .upvote-widget-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
    }

    .upvote-widget-btn svg {
      width: 24px;
      height: 24px;
      fill: white;
    }

    /* Painel de feedback (modos FLOATING e SIDEBAR) */
    .upvote-widget-panel {
      position: fixed;
      bottom: 92px;
      right: 24px;
      width: 360px;
      max-height: 480px;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1);
      z-index: 99999;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      opacity: 0;
      transform: translateY(12px) scale(0.96);
      transition: opacity 0.25s ease, transform 0.25s ease;
      pointer-events: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }

    .upvote-widget-panel.upvote-open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }

    /* ---- Modo SIDEBAR ---- */

    /* Tab clicável colada na borda */
    .upvote-sidebar-tab {
      position: fixed;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      background-color: ${color};
      color: white;
      border: none;
      border-radius: 8px 0 0 8px;
      padding: 12px 14px;
      cursor: pointer;
      z-index: 99998;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.3px;
      white-space: nowrap;
      box-shadow: -2px 0 12px rgba(0, 0, 0, 0.12);
      transition: padding 0.2s ease;
    }

    .upvote-sidebar-tab:hover {
      padding: 12px 18px;
    }

    /* Tab no lado esquerdo */
    .upvote-sidebar-tab.upvote-sidebar-left {
      right: auto;
      left: 0;
      border-radius: 0 8px 8px 0;
      box-shadow: 2px 0 12px rgba(0, 0, 0, 0.12);
    }

    /* Painel no modo sidebar — desliza da borda direita */
    .upvote-widget-panel.upvote-mode-sidebar {
      top: 0;
      right: 0;
      bottom: 0;
      left: auto;
      width: 360px;
      max-height: 100vh;
      height: 100%;
      border-radius: 0;
      transform: translateX(100%);
      opacity: 1;
      transition: transform 0.3s ease;
      pointer-events: none;
    }

    .upvote-widget-panel.upvote-mode-sidebar.upvote-open {
      transform: translateX(0);
      pointer-events: auto;
    }

    /* Painel sidebar no lado esquerdo */
    .upvote-widget-panel.upvote-mode-sidebar.upvote-sidebar-left {
      right: auto;
      left: 0;
      transform: translateX(-100%);
    }

    .upvote-widget-panel.upvote-mode-sidebar.upvote-sidebar-left.upvote-open {
      transform: translateX(0);
    }

    /* ---- Modo INLINE ---- */

    .upvote-widget-inline {
      width: 100%;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }

    /* Cabeçalho — compartilhado por todos os modos */
    .upvote-widget-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      background-color: ${color};
      color: white;
      flex-shrink: 0;
    }

    .upvote-widget-header h3 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      line-height: 1.3;
    }

    .upvote-widget-close {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      line-height: 1;
      transition: background 0.15s ease;
      padding: 0;
      flex-shrink: 0;
    }

    .upvote-widget-close:hover {
      background: rgba(255, 255, 255, 0.35);
    }

    /* Corpo do painel */
    .upvote-widget-body {
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      flex: 1;
      overflow-y: auto;
    }

    /* Área de texto */
    .upvote-widget-textarea {
      width: 100%;
      min-height: 100px;
      padding: 12px;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      font-family: inherit;
      font-size: 14px;
      line-height: 1.5;
      color: #1e293b;
      background: #f8fafc;
      resize: vertical;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
      box-sizing: border-box;
      outline: none;
    }

    .upvote-widget-textarea:focus {
      border-color: ${color};
      box-shadow: 0 0 0 3px ${color}22;
      background: #ffffff;
    }

    .upvote-widget-textarea::placeholder {
      color: #94a3b8;
    }

    /* Botão de enviar */
    .upvote-widget-submit {
      width: 100%;
      padding: 10px 16px;
      background-color: ${color};
      color: white;
      border: none;
      border-radius: 10px;
      font-family: inherit;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.15s ease, transform 0.1s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-height: 42px;
    }

    .upvote-widget-submit:hover:not(:disabled) {
      opacity: 0.9;
    }

    .upvote-widget-submit:active:not(:disabled) {
      transform: scale(0.98);
    }

    .upvote-widget-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Spinner de loading */
    .upvote-widget-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: upvote-spin 0.6s linear infinite;
    }

    /* Texto de consentimento */
    .upvote-widget-consent {
      font-size: 11px;
      color: #94a3b8;
      text-align: center;
      line-height: 1.4;
      margin: 0;
      padding: 0 4px;
    }

    /* Mensagem de sucesso */
    .upvote-widget-success {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 24px 20px;
      text-align: center;
    }

    .upvote-widget-success-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background-color: #10b981;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .upvote-widget-success-icon svg {
      width: 24px;
      height: 24px;
      fill: white;
    }

    .upvote-widget-success-text {
      font-size: 15px;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    /* Mensagem de erro */
    .upvote-widget-error {
      font-size: 13px;
      color: #ef4444;
      text-align: center;
      margin: 0;
      padding: 4px 0;
    }

    /* Pergunta de follow-up */
    .upvote-widget-followup-question {
      font-size: 14px;
      color: #334155;
      line-height: 1.5;
      margin: 0;
      padding: 8px 12px;
      background: #f1f5f9;
      border-radius: 8px;
      border-left: 3px solid ${color};
    }

    /* Responsividade mobile */
    @media (max-width: 480px) {
      .upvote-widget-panel:not(.upvote-mode-sidebar) {
        bottom: 0;
        right: 0;
        left: 0;
        width: 100%;
        max-height: 85vh;
        border-radius: 16px 16px 0 0;
        transform: translateY(100%);
      }

      .upvote-widget-panel:not(.upvote-mode-sidebar).upvote-open {
        transform: translateY(0);
        opacity: 1;
      }

      .upvote-widget-panel.upvote-mode-sidebar {
        width: 100%;
      }
    }

    /* Powered by Upvote branding */
    .upvote-widget-branding {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 6px 0 2px;
      gap: 4px;
    }

    .upvote-widget-branding a {
      font-size: 10px;
      color: #94a3b8;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 3px;
      transition: color 0.15s ease;
    }

    .upvote-widget-branding a:hover {
      color: ${color};
    }

    /* Animação de rotação */
    @keyframes upvote-spin {
      to { transform: rotate(360deg); }
    }

    /* Position overrides (modo FLOATING) — default (BOTTOM_RIGHT) já está no base CSS */
    .upvote-widget-btn.upvote-pos-bottom-left {
      right: auto;
      left: 24px;
    }
    .upvote-widget-panel.upvote-pos-bottom-left {
      right: auto;
      left: 24px;
    }

    .upvote-widget-btn.upvote-pos-top-right {
      bottom: auto;
      top: 24px;
    }
    .upvote-widget-panel.upvote-pos-top-right {
      bottom: auto;
      top: 92px;
    }

    .upvote-widget-btn.upvote-pos-top-left {
      bottom: auto;
      top: 24px;
      right: auto;
      left: 24px;
    }
    .upvote-widget-panel.upvote-pos-top-left {
      bottom: auto;
      top: 92px;
      right: auto;
      left: 24px;
    }
  `;
}
