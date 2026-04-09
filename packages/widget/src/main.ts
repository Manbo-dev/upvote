import { getStyles } from './styles';
import { iniciarRastreamento, coletarContexto } from './context';

/**
 * Widget Upvote — minimalista feedback capture
 *
 * Display modes:
 *   FLOATING (default) — fixed circular button that opens a popup panel
 *   SIDEBAR            — vertical tab stuck to the screen edge that slides in a panel
 *   INLINE             — form embedded directly in the target element (data-container)
 *
 * Button styles (FLOATING only):
 *   CIRCLE (default), SQUARE, PILL, PILL_LABEL, HANDLE, BUBBLE, GRADIENT, PILL_COUNTER
 *
 * Theming:
 *   data-theme="auto"  (default) — follows OS prefers-color-scheme
 *   data-theme="light" — forces light mode
 *   data-theme="dark"  — forces dark mode
 *
 * Basic usage:
 * <script
 *   src="https://api.upvote.com/widget.js"
 *   data-api-key="upv_sua_chave_aqui"
 *   data-color="#6366f1"
 *   data-base-url="https://api.upvote.com"
 *   data-trigger="button"
 *   data-mode="floating"
 *   data-theme="auto"
 * ></script>
 *
 * Inline mode:
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

// ---------------------------------------------------------------------------
// Locales
// ---------------------------------------------------------------------------

const LOCALES = {
  'pt-BR': {
    placeholder: 'Descreva seu feedback, bug ou sugestão...',
    submit: 'Enviar feedback',
    sending: 'Enviando...',
    consent: 'Ao enviar, você concorda com nossa política de feedback',
    success: 'Feedback enviado! Obrigado.',
    error: 'Erro ao enviar. Tente novamente.',
    closeLabel: 'Fechar',
    openLabel: 'Abrir feedback',
    followUpPlaceholder: 'Sua resposta (opcional)...',
    followUpSubmit: 'Enviar resposta',
    followUpSkip: 'Pular',
  },
  en: {
    placeholder: 'Describe your feedback, bug or suggestion...',
    submit: 'Send feedback',
    sending: 'Sending...',
    consent: 'By submitting, you agree to our feedback policy',
    success: 'Feedback sent! Thank you.',
    error: 'Error sending. Please try again.',
    closeLabel: 'Close',
    openLabel: 'Open feedback',
    followUpPlaceholder: 'Your answer (optional)...',
    followUpSubmit: 'Send answer',
    followUpSkip: 'Skip',
  },
} as const;

type Locale = typeof LOCALES['pt-BR'];

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Darkens a hex color by reducing its HSL lightness by the given amount.
 * Used for gradient button style.
 */
function darkenColor(hex: string, amount: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  const newL = Math.max(0, l - amount / 100);
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  let rr, gg, bb;
  if (s === 0) {
    rr = gg = bb = newL;
  } else {
    const q = newL < 0.5 ? newL * (1 + s) : newL + s - newL * s;
    const p = 2 * newL - q;
    rr = hue2rgb(p, q, h + 1/3);
    gg = hue2rgb(p, q, h);
    bb = hue2rgb(p, q, h - 1/3);
  }
  const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0');
  return `#${toHex(rr)}${toHex(gg)}${toHex(bb)}`;
}

// ---------------------------------------------------------------------------
// IIFE
// ---------------------------------------------------------------------------

(function () {
  const currentScript = document.currentScript as HTMLScriptElement;
  if (!currentScript) return;

  const apiKeyAttr = currentScript.getAttribute('data-api-key');
  const color = currentScript.getAttribute('data-color') || '#6366f1';
  const baseUrl = currentScript.getAttribute('data-base-url') || 'https://api.upvote.com';
  const triggerAttr = currentScript.getAttribute('data-trigger') || 'button';
  const modeAttr = (currentScript.getAttribute('data-mode') || 'floating').toUpperCase();
  const containerSelector = currentScript.getAttribute('data-container') || null;
  const themeAttr = currentScript.getAttribute('data-theme') || 'auto';

  if (!apiKeyAttr) {
    console.error('[Upvote Widget] data-api-key attribute is required');
    return;
  }

  const apiKey: string = apiKeyAttr;

  // ---- Mutable config — initialized from script attrs, overridden by backend fetch ----
  let configColor = color;
  let configPosition = 'BOTTOM_RIGHT';
  let configTitle: string | null = null;
  let configPlaceholder: string | null = null;
  let configWhiteLabel = false;
  let configTheme: 'light' | 'dark' | 'auto' = (['light', 'dark', 'auto'].includes(themeAttr)
    ? themeAttr
    : 'auto') as 'light' | 'dark' | 'auto';
  let configLanguage: keyof typeof LOCALES = 'pt-BR';
  let configButtonStyle: string = 'CIRCLE';
  let configFeedbackCount: number | null = null;
  let configMode: 'FLOATING' | 'SIDEBAR' | 'INLINE' = (
    ['FLOATING', 'SIDEBAR', 'INLINE'].includes(modeAttr) ? modeAttr : 'FLOATING'
  ) as 'FLOATING' | 'SIDEBAR' | 'INLINE';

  let strings: Locale = LOCALES['pt-BR'];

  iniciarRastreamento();

  const styleEl = document.createElement('style');
  styleEl.textContent = getStyles(color);
  document.head.appendChild(styleEl);

  // ---- Widget state ----
  let isOpen = false;
  let isSubmitting = false;
  let currentTriggerType: 'button' | 'event' | 'always_visible' =
    triggerAttr === 'always' ? 'always_visible' : 'button';

  // ---- DOM element refs — set/cleared by initWidgetDOM / destroyWidgetDOM ----
  let floatingBtn: HTMLButtonElement | null = null;
  let sidebarTab: HTMLButtonElement | null = null;
  let panel: HTMLDivElement | null = null;
  let bodyContainer: HTMLDivElement | null = null;
  let titleEl: HTMLHeadingElement | null = null;
  let inlineWrapper: HTMLDivElement | null = null;

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

  // ---- Theme application ----

  /**
   * Applies the current theme class to all root widget elements.
   * Forces dark/light or uses media query (auto).
   */
  function applyTheme(): void {
    const elements: (HTMLElement | null)[] = [floatingBtn, panel, sidebarTab, inlineWrapper];
    elements.forEach(el => {
      if (!el) return;
      el.classList.remove('upvote-theme-dark', 'upvote-theme-auto', 'upvote-theme-light');
      if (configTheme === 'dark') {
        el.classList.add('upvote-theme-dark');
      } else if (configTheme === 'auto') {
        el.classList.add('upvote-theme-auto');
      }
      // 'light' is the CSS default — no extra class needed
    });
  }

  // ---- Button creation by style ----

  /**
   * Creates the floating trigger button for the given style.
   * SIDEBAR mode ignores buttonStyle and uses its own tab.
   */
  function createTriggerButton(): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.setAttribute('aria-label', strings.openLabel);
    btn.setAttribute('data-upvote-widget', 'true');

    const style = configButtonStyle;
    const darkColor = darkenColor(configColor, 20);

    // Set CSS variable for gradient
    btn.style.setProperty('--upvote-primary-dark', darkColor);

    // Base class
    btn.className = 'upvote-widget-btn';

    if (style === 'SQUARE') {
      btn.classList.add('upvote-btn-square');
      btn.innerHTML = chatIconSvg;

    } else if (style === 'PILL') {
      btn.classList.add('upvote-btn-pill');
      const label = document.createElement('span');
      label.className = 'upvote-btn-label';
      label.textContent = configTitle || strings.submit;
      btn.appendChild(document.createRange().createContextualFragment(chatIconSvg));
      btn.appendChild(label);

    } else if (style === 'PILL_LABEL') {
      btn.classList.add('upvote-btn-pill-label');
      const label = document.createElement('span');
      label.className = 'upvote-btn-label';
      label.textContent = configTitle || strings.submit;
      btn.appendChild(label);
      btn.appendChild(document.createRange().createContextualFragment(chatIconSvg));

    } else if (style === 'HANDLE') {
      btn.classList.add('upvote-btn-handle');
      btn.innerHTML = chatIconSvg;

    } else if (style === 'BUBBLE') {
      btn.classList.add('upvote-btn-bubble');
      btn.innerHTML = chatIconSvg;

    } else if (style === 'GRADIENT') {
      btn.classList.add('upvote-btn-gradient');
      btn.innerHTML = chatIconSvg;

    } else if (style === 'PILL_COUNTER') {
      btn.classList.add('upvote-btn-pill-counter');
      btn.appendChild(document.createRange().createContextualFragment(chatIconSvg));
      const label = document.createElement('span');
      label.className = 'upvote-btn-label';
      label.textContent = configTitle || strings.submit;
      btn.appendChild(label);
      if (configFeedbackCount !== null && configFeedbackCount > 0) {
        const badge = document.createElement('span');
        badge.className = 'upvote-btn-counter-badge';
        badge.textContent = String(configFeedbackCount);
        btn.appendChild(badge);
      }

    } else {
      // CIRCLE (default)
      btn.innerHTML = chatIconSvg;
    }

    return btn;
  }

  // ---- Panel creation ----

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
    closeBtn.setAttribute('aria-label', strings.closeLabel);
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', fecharWidget);
    header.appendChild(closeBtn);

    p.appendChild(header);

    bodyContainer = document.createElement('div');
    bodyContainer.className = 'upvote-widget-body';
    p.appendChild(bodyContainer);

    return p;
  }

  // ---- Mode-specific init functions ----

  function initFloating(): void {
    floatingBtn = createTriggerButton();
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
    sidebarTab.setAttribute('aria-label', strings.openLabel);
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
      console.warn('[Upvote Widget] INLINE mode requires the data-container attribute. Falling back to FLOATING.');
      configMode = 'FLOATING';
      initFloating();
      return;
    }

    const target = document.querySelector(containerSelector);
    if (!target) {
      console.warn(`[Upvote Widget] Container "${containerSelector}" not found. Falling back to FLOATING.`);
      configMode = 'FLOATING';
      initFloating();
      return;
    }

    inlineWrapper = document.createElement('div');
    inlineWrapper.className = 'upvote-widget-inline';
    inlineWrapper.setAttribute('data-upvote-widget', 'true');

    const header = document.createElement('div');
    header.className = 'upvote-widget-header';

    titleEl = document.createElement('h3');
    titleEl.textContent = configTitle || 'Feedback';
    header.appendChild(titleEl);

    inlineWrapper.appendChild(header);

    bodyContainer = document.createElement('div');
    bodyContainer.className = 'upvote-widget-body';
    inlineWrapper.appendChild(bodyContainer);

    target.appendChild(inlineWrapper);

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
    inlineWrapper = null;
    isOpen = false;
    isSubmitting = false;
  }

  initWidgetDOM();
  applyTheme();

  // ---- Position application ----

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

  // ---- Config fetch ----

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
      if (cfg.language && cfg.language in LOCALES) {
        configLanguage = cfg.language as keyof typeof LOCALES;
        strings = LOCALES[configLanguage];
      }
      if (cfg.feedbackCount !== null && cfg.feedbackCount !== undefined) {
        configFeedbackCount = cfg.feedbackCount;
      }

      // Apply theme from backend if it changed
      if (cfg.theme && cfg.theme !== configTheme) {
        configTheme = cfg.theme as 'light' | 'dark' | 'auto';
        applyTheme();
      }

      // Button style or mode change — rebuild DOM
      const buttonStyleChanged = cfg.buttonStyle && cfg.buttonStyle !== configButtonStyle;
      const modeChanged = cfg.mode &&
        ['FLOATING', 'SIDEBAR', 'INLINE'].includes(cfg.mode) &&
        cfg.mode !== configMode;

      if (modeChanged) configMode = cfg.mode as 'FLOATING' | 'SIDEBAR' | 'INLINE';
      if (buttonStyleChanged) configButtonStyle = cfg.buttonStyle;

      if (modeChanged || buttonStyleChanged) {
        destroyWidgetDOM();
        initWidgetDOM();
        applyPosition(configPosition);
        applyTheme();
      }

    } catch {
      // Network error or invalid response — silently use defaults
    }
  }

  fetchConfig();

  // ---- Open / close ----

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

  // ---- Form rendering ----

  function renderizarFormulario() {
    if (!bodyContainer) return;
    bodyContainer.innerHTML = '';

    const textarea = document.createElement('textarea');
    textarea.className = 'upvote-widget-textarea';
    textarea.placeholder = configPlaceholder || strings.placeholder;
    textarea.setAttribute('rows', '4');

    const errorMsg = document.createElement('p');
    errorMsg.className = 'upvote-widget-error';
    errorMsg.style.display = 'none';

    const submitBtn = document.createElement('button');
    submitBtn.className = 'upvote-widget-submit';
    submitBtn.textContent = strings.submit;
    submitBtn.addEventListener('click', () => enviarFeedback(textarea, submitBtn, errorMsg));

    textarea.addEventListener('keydown', (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        enviarFeedback(textarea, submitBtn, errorMsg);
      }
    });

    const consent = document.createElement('p');
    consent.className = 'upvote-widget-consent';
    consent.textContent = strings.consent;

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

  // ---- Feedback submission ----

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
    submitBtn.innerHTML = `<span class="upvote-widget-spinner"></span> ${strings.sending}`;
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
      submitBtn.textContent = strings.submit;
      errorMsg.textContent = strings.error;
      errorMsg.style.display = 'block';
    }
  }

  // ---- Follow-up rendering ----

  function renderizarFollowUp(question: string, feedbackId: string) {
    if (!bodyContainer) return;
    bodyContainer.innerHTML = '';

    const questionEl = document.createElement('p');
    questionEl.className = 'upvote-widget-followup-question';
    questionEl.textContent = question;

    const textarea = document.createElement('textarea');
    textarea.className = 'upvote-widget-textarea';
    textarea.placeholder = strings.followUpPlaceholder;
    textarea.setAttribute('rows', '3');

    const errorMsg = document.createElement('p');
    errorMsg.className = 'upvote-widget-error';
    errorMsg.style.display = 'none';

    const submitBtn = document.createElement('button');
    submitBtn.className = 'upvote-widget-submit';
    submitBtn.textContent = strings.followUpSubmit;
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
    skipBtn.textContent = strings.followUpSkip;
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

  // ---- Follow-up submission ----

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
    submitBtn.innerHTML = `<span class="upvote-widget-spinner"></span> ${strings.sending}`;
    errorMsg.style.display = 'none';

    try {
      const response = await fetch(`${baseUrl}/api/widget/feedback/${feedbackId}/follow-up`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({ answer }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      renderizarSucesso();
    } catch (_err) {
      submitBtn.disabled = false;
      submitBtn.textContent = strings.followUpSubmit;
      errorMsg.textContent = strings.error;
      errorMsg.style.display = 'block';
    }
  }

  // ---- Success state ----

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
    text.textContent = strings.success;

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

  // ---- Public API ----

  window.UpvoteWidget = {
    open: () => abrirWidget('event'),
    close: () => fecharWidget(),
  };
})();
