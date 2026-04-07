import { getStyles } from './styles';
import { iniciarRastreamento, coletarContexto } from './context';

/**
 * Widget Upvote — captura minimalista de feedback
 *
 * Modos de exibição:
 *   FLOATING (padrão) — botão circular fixo no canto que abre painel popup
 *   SIDEBAR           — tab colada na borda da tela que desliza painel lateral
 *   INLINE            — form embedado diretamente no elemento alvo (data-container)
 *
 * Uso básico:
 * <script
 *   src="https://cdn.upvote.com/widget.js"
 *   data-api-key="upv_sua_chave_aqui"
 *   data-color="#6366f1"
 *   data-base-url="https://api.upvote.com"
 *   data-trigger="button"
 *   data-mode="floating"
 * ></script>
 *
 * Modo inline:
 * <script ... data-mode="inline" data-container="#meu-container"></script>
 */

declare global {
  interface Window {
    UpvoteWidget: {
      open: () => void;
      close: () => void;
    };
  }
}

(function () {
  const currentScript = document.currentScript as HTMLScriptElement;
  if (!currentScript) return;

  const apiKeyAttr = currentScript.getAttribute('data-api-key');
  const color = currentScript.getAttribute('data-color') || '#6366f1';
  const baseUrl = currentScript.getAttribute('data-base-url') || 'https://api.upvote.com';
  const triggerAttr = currentScript.getAttribute('data-trigger') || 'button';
  const modeAttr = (currentScript.getAttribute('data-mode') || 'floating').toUpperCase();
  const containerSelector = currentScript.getAttribute('data-container') || null;

  if (!apiKeyAttr) {
    console.error('[Upvote Widget] Atributo data-api-key é obrigatório');
    return;
  }

  const apiKey: string = apiKeyAttr;

  // Mutable config — initialized from script tag attrs, overridden by backend fetch
  let configColor = color;
  let configPosition = 'BOTTOM_RIGHT';
  let configTitle: string | null = null;
  let configPlaceholder: string | null = null;
  let configWhiteLabel = false;
  let configMode: 'FLOATING' | 'SIDEBAR' | 'INLINE' = (
    ['FLOATING', 'SIDEBAR', 'INLINE'].includes(modeAttr) ? modeAttr : 'FLOATING'
  ) as 'FLOATING' | 'SIDEBAR' | 'INLINE';

  iniciarRastreamento();

  const styleEl = document.createElement('style');
  styleEl.textContent = getStyles(color);
  document.head.appendChild(styleEl);

  // Widget state
  let isOpen = false;
  let isSubmitting = false;
  let currentTriggerType: 'button' | 'event' | 'always_visible' =
    triggerAttr === 'always' ? 'always_visible' : 'button';

  // DOM element refs — set/cleared by initWidgetDOM / destroyWidgetDOM
  let floatingBtn: HTMLButtonElement | null = null;
  let sidebarTab: HTMLButtonElement | null = null;
  let panel: HTMLDivElement | null = null;
  let bodyContainer: HTMLDivElement | null = null;
  let titleEl: HTMLHeadingElement | null = null;

  const chatIconSvg = `
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
    </svg>
  `;

  const checkIconSvg = `
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
    </svg>
  `;

  // Creates the shared panel element (header + body container) used by FLOATING and SIDEBAR modes.
  function createPanel(): HTMLDivElement {
    const p = document.createElement('div');
    p.className = 'upvote-widget-panel';
    p.setAttribute('data-upvote-widget', 'true');

    const header = document.createElement('div');
    header.className = 'upvote-widget-header';

    titleEl = document.createElement('h3');
    titleEl.textContent = configTitle || 'Feedback';
    header.appendChild(titleEl);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'upvote-widget-close';
    closeBtn.setAttribute('aria-label', 'Fechar');
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', fecharWidget);
    header.appendChild(closeBtn);

    p.appendChild(header);

    bodyContainer = document.createElement('div');
    bodyContainer.className = 'upvote-widget-body';
    p.appendChild(bodyContainer);

    return p;
  }

  // --- Mode-specific init functions ---

  function initFloating(): void {
    floatingBtn = document.createElement('button');
    floatingBtn.className = 'upvote-widget-btn';
    floatingBtn.setAttribute('aria-label', 'Enviar feedback');
    floatingBtn.setAttribute('data-upvote-widget', 'true');
    floatingBtn.innerHTML = chatIconSvg;
    document.body.appendChild(floatingBtn);

    panel = createPanel();
    document.body.appendChild(panel);

    renderizarFormulario();

    floatingBtn.addEventListener('click', () => {
      if (isOpen) fecharWidget();
      else abrirWidget('button');
    });

    if (triggerAttr === 'always') {
      const autoOpen = () => setTimeout(() => abrirWidget('always_visible'), 500);
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        autoOpen();
      } else {
        window.addEventListener('DOMContentLoaded', autoOpen);
      }
    }
  }

  function initSidebar(): void {
    const isLeft = configPosition === 'BOTTOM_LEFT' || configPosition === 'TOP_LEFT';

    sidebarTab = document.createElement('button');
    sidebarTab.className = `upvote-sidebar-tab${isLeft ? ' upvote-sidebar-left' : ''}`;
    sidebarTab.setAttribute('aria-label', 'Abrir feedback');
    sidebarTab.setAttribute('data-upvote-widget', 'true');
    sidebarTab.textContent = configTitle || 'Feedback';
    document.body.appendChild(sidebarTab);

    panel = createPanel();
    panel.classList.add('upvote-mode-sidebar');
    if (isLeft) panel.classList.add('upvote-sidebar-left');
    document.body.appendChild(panel);

    renderizarFormulario();

    sidebarTab.addEventListener('click', () => {
      if (isOpen) fecharWidget();
      else abrirWidget('button');
    });
  }

  function initInline(): void {
    if (!containerSelector) {
      console.warn('[Upvote Widget] Modo INLINE requer o atributo data-container. Usando FLOATING como fallback.');
      configMode = 'FLOATING';
      initFloating();
      return;
    }

    const target = document.querySelector(containerSelector);
    if (!target) {
      console.warn(`[Upvote Widget] Container "${containerSelector}" não encontrado. Usando FLOATING como fallback.`);
      configMode = 'FLOATING';
      initFloating();
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'upvote-widget-inline';
    wrapper.setAttribute('data-upvote-widget', 'true');

    const header = document.createElement('div');
    header.className = 'upvote-widget-header';

    titleEl = document.createElement('h3');
    titleEl.textContent = configTitle || 'Feedback';
    header.appendChild(titleEl);

    wrapper.appendChild(header);

    bodyContainer = document.createElement('div');
    bodyContainer.className = 'upvote-widget-body';
    wrapper.appendChild(bodyContainer);

    target.appendChild(wrapper);

    // Inline form is always visible
    isOpen = true;
    renderizarFormulario();
  }

  function initWidgetDOM(): void {
    if (configMode === 'SIDEBAR') initSidebar();
    else if (configMode === 'INLINE') initInline();
    else initFloating();
  }

  function destroyWidgetDOM(): void {
    document.querySelectorAll('[data-upvote-widget]').forEach(el => el.remove());
    floatingBtn = null;
    sidebarTab = null;
    panel = null;
    bodyContainer = null;
    titleEl = null;
    isOpen = false;
    isSubmitting = false;
  }

  initWidgetDOM();

  // Applies a corner-position class to the floating button and panel.
  // Only applies in FLOATING mode — BOTTOM_RIGHT is the CSS default (no class needed).
  function applyPosition(pos: string): void {
    if (configMode !== 'FLOATING' || !floatingBtn || !panel) return;
    const posClass = `upvote-pos-${pos.toLowerCase().replace(/_/g, '-')}`;
    const allPosClasses = ['upvote-pos-bottom-left', 'upvote-pos-top-right', 'upvote-pos-top-left'];
    floatingBtn.classList.remove(...allPosClasses);
    panel.classList.remove(...allPosClasses);
    if (pos !== 'BOTTOM_RIGHT') {
      floatingBtn.classList.add(posClass);
      panel.classList.add(posClass);
    }
  }

  // Fetches widget configuration from the backend and applies it.
  // Fire-and-forget — does not block initial render. Silently falls back to defaults on error.
  async function fetchConfig(): Promise<void> {
    try {
      const res = await fetch(`${baseUrl}/api/widget/config`, {
        method: 'GET',
        headers: { 'X-API-Key': apiKey },
      });
      if (!res.ok) return;
      const body = await res.json();
      const cfg = body?.data;
      if (!cfg) return;

      if (cfg.color && cfg.color !== configColor) {
        configColor = cfg.color;
        styleEl.textContent = getStyles(configColor);
      }
      if (cfg.position) {
        configPosition = cfg.position;
        applyPosition(configPosition);
      }
      if (cfg.title) {
        configTitle = cfg.title;
        if (titleEl) titleEl.textContent = configTitle;
        if (sidebarTab) sidebarTab.textContent = configTitle;
      }
      if (cfg.placeholder) {
        configPlaceholder = cfg.placeholder;
      }
      if (typeof cfg.whiteLabel === 'boolean') {
        configWhiteLabel = cfg.whiteLabel;
      }

      // Apply mode from backend — re-init the entire DOM if mode changed
      if (cfg.mode) {
        const newMode = cfg.mode as 'FLOATING' | 'SIDEBAR' | 'INLINE';
        if (newMode !== configMode && ['FLOATING', 'SIDEBAR', 'INLINE'].includes(newMode)) {
          configMode = newMode;
          destroyWidgetDOM();
          initWidgetDOM();
          applyPosition(configPosition);
        }
      }
    } catch {
      // Network error or invalid response — silently use defaults
    }
  }

  fetchConfig();

  // --- Open / close ---

  function abrirWidget(trigger?: 'button' | 'event' | 'always_visible') {
    if (isOpen || configMode === 'INLINE') return;
    isOpen = true;
    if (trigger) currentTriggerType = trigger;
    renderizarFormulario();
    panel?.classList.add('upvote-open');
  }

  function fecharWidget() {
    if (!isOpen || configMode === 'INLINE') return;
    isOpen = false;
    panel?.classList.remove('upvote-open');
    setTimeout(() => {
      if (!isOpen) {
        isSubmitting = false;
        renderizarFormulario();
      }
    }, 300);
  }

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') fecharWidget();
  });

  // --- Form rendering ---

  function renderizarFormulario() {
    if (!bodyContainer) return;
    bodyContainer.innerHTML = '';

    const textarea = document.createElement('textarea');
    textarea.className = 'upvote-widget-textarea';
    textarea.placeholder = configPlaceholder || 'Descreva seu feedback, bug ou sugestão...';
    textarea.setAttribute('rows', '4');

    const errorMsg = document.createElement('p');
    errorMsg.className = 'upvote-widget-error';
    errorMsg.style.display = 'none';

    const submitBtn = document.createElement('button');
    submitBtn.className = 'upvote-widget-submit';
    submitBtn.textContent = 'Enviar feedback';
    submitBtn.addEventListener('click', () => enviarFeedback(textarea, submitBtn, errorMsg));

    textarea.addEventListener('keydown', (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        enviarFeedback(textarea, submitBtn, errorMsg);
      }
    });

    const consent = document.createElement('p');
    consent.className = 'upvote-widget-consent';
    consent.textContent = 'Ao enviar, você concorda com nossa política de feedback';

    bodyContainer.appendChild(textarea);
    bodyContainer.appendChild(errorMsg);
    bodyContainer.appendChild(submitBtn);
    bodyContainer.appendChild(consent);

    if (!configWhiteLabel) {
      const branding = document.createElement('div');
      branding.className = 'upvote-widget-branding';
      branding.innerHTML = `<a href="https://upvote.pro" target="_blank" rel="noopener noreferrer">Powered by Upvote</a>`;
      bodyContainer.appendChild(branding);
    }

    // Don't auto-focus in inline mode (disruptive on page load)
    if (configMode !== 'INLINE') {
      setTimeout(() => textarea.focus(), 100);
    }
  }

  // --- Feedback submission ---

  async function enviarFeedback(
    textarea: HTMLTextAreaElement,
    submitBtn: HTMLButtonElement,
    errorMsg: HTMLParagraphElement
  ) {
    const message = textarea.value.trim();

    if (!message) {
      textarea.style.borderColor = '#ef4444';
      textarea.focus();
      setTimeout(() => { textarea.style.borderColor = ''; }, 2000);
      return;
    }

    if (isSubmitting) return;
    isSubmitting = true;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="upvote-widget-spinner"></span> Enviando...';
    errorMsg.style.display = 'none';

    const contexto = coletarContexto(currentTriggerType);
    const payload = { message, ...contexto };

    try {
      const response = await fetch(`${baseUrl}/api/widget/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      if (data.followUpQuestion && data.feedbackId) {
        renderizarFollowUp(data.followUpQuestion, data.feedbackId);
      } else {
        renderizarSucesso();
      }
    } catch (_err) {
      isSubmitting = false;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar feedback';
      errorMsg.textContent = 'Erro ao enviar. Tente novamente.';
      errorMsg.style.display = 'block';
    }
  }

  // --- Follow-up rendering ---

  function renderizarFollowUp(question: string, feedbackId: string) {
    if (!bodyContainer) return;
    bodyContainer.innerHTML = '';

    const questionEl = document.createElement('p');
    questionEl.className = 'upvote-widget-followup-question';
    questionEl.textContent = question;

    const textarea = document.createElement('textarea');
    textarea.className = 'upvote-widget-textarea';
    textarea.placeholder = 'Sua resposta (opcional)...';
    textarea.setAttribute('rows', '3');

    const errorMsg = document.createElement('p');
    errorMsg.className = 'upvote-widget-error';
    errorMsg.style.display = 'none';

    const submitBtn = document.createElement('button');
    submitBtn.className = 'upvote-widget-submit';
    submitBtn.textContent = 'Enviar resposta';
    submitBtn.addEventListener('click', () =>
      enviarFollowUp(textarea, submitBtn, errorMsg, feedbackId)
    );

    textarea.addEventListener('keydown', (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        enviarFollowUp(textarea, submitBtn, errorMsg, feedbackId);
      }
    });

    const skipBtn = document.createElement('button');
    skipBtn.className = 'upvote-widget-submit';
    skipBtn.style.background = 'transparent';
    skipBtn.style.color = '#64748b';
    skipBtn.style.fontWeight = '400';
    skipBtn.textContent = 'Pular';
    skipBtn.addEventListener('click', () => renderizarSucesso());

    bodyContainer.appendChild(questionEl);
    bodyContainer.appendChild(textarea);
    bodyContainer.appendChild(errorMsg);
    bodyContainer.appendChild(submitBtn);
    bodyContainer.appendChild(skipBtn);

    if (configMode !== 'INLINE') {
      setTimeout(() => textarea.focus(), 100);
    }
  }

  // --- Follow-up submission ---

  async function enviarFollowUp(
    textarea: HTMLTextAreaElement,
    submitBtn: HTMLButtonElement,
    errorMsg: HTMLParagraphElement,
    feedbackId: string
  ) {
    const answer = textarea.value.trim();
    if (!answer) {
      renderizarSucesso();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="upvote-widget-spinner"></span> Enviando...';
    errorMsg.style.display = 'none';

    try {
      const response = await fetch(`${baseUrl}/api/widget/feedback/${feedbackId}/follow-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      renderizarSucesso();
    } catch (_err) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar resposta';
      errorMsg.textContent = 'Erro ao enviar. Tente novamente.';
      errorMsg.style.display = 'block';
    }
  }

  // --- Success state ---

  function renderizarSucesso() {
    if (!bodyContainer) return;
    bodyContainer.innerHTML = '';

    const container = document.createElement('div');
    container.className = 'upvote-widget-success';

    const iconContainer = document.createElement('div');
    iconContainer.className = 'upvote-widget-success-icon';
    iconContainer.innerHTML = checkIconSvg;

    const text = document.createElement('p');
    text.className = 'upvote-widget-success-text';
    text.textContent = 'Feedback enviado! Obrigado.';

    container.appendChild(iconContainer);
    container.appendChild(text);
    bodyContainer.appendChild(container);

    if (configMode === 'INLINE') {
      // Reset to form after 3s (widget stays visible)
      setTimeout(() => {
        isSubmitting = false;
        renderizarFormulario();
      }, 3000);
    } else {
      setTimeout(() => fecharWidget(), 2000);
    }
  }

  // --- Public API ---

  window.UpvoteWidget = {
    open: () => abrirWidget('event'),
    close: () => fecharWidget(),
  };
})();
