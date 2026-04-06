import { getStyles } from './styles';
import { iniciarRastreamento, coletarContexto } from './context';

/**
 * Widget Upvote — captura minimalista de feedback
 *
 * O usuário escreve livremente (bugs, sugestões, reclamações)
 * e o backend faz o trabalho pesado com IA.
 *
 * Uso:
 * <script
 *   src="https://cdn.upvote.com/widget.js"
 *   data-api-key="upv_sua_chave_aqui"
 *   data-color="#6366f1"
 *   data-base-url="https://api.upvote.com"
 *   data-trigger="button"
 * ></script>
 */

// Tipagem para a API pública exposta no window
declare global {
  interface Window {
    UpvoteWidget: {
      open: () => void;
      close: () => void;
    };
  }
}

(function () {
  // Busca o script tag atual para ler os atributos de configuração
  const currentScript = document.currentScript as HTMLScriptElement;
  if (!currentScript) return;

  const apiKeyAttr = currentScript.getAttribute('data-api-key');
  const color = currentScript.getAttribute('data-color') || '#6366f1';
  const baseUrl = currentScript.getAttribute('data-base-url') || 'https://api.upvote.com';
  const triggerAttr = currentScript.getAttribute('data-trigger') || 'button';

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

  // Inicia o rastreamento de interações do usuário na página
  iniciarRastreamento();

  // Injeta estilos
  const styleEl = document.createElement('style');
  styleEl.textContent = getStyles(color);
  document.head.appendChild(styleEl);

  // Estado do widget
  let isOpen = false;
  let isSubmitting = false;
  let currentTriggerType: 'button' | 'event' | 'always_visible' =
    triggerAttr === 'always' ? 'always_visible' : 'button';

  // Referências dos elementos
  let panel: HTMLDivElement;
  let bodyContainer: HTMLDivElement;

  // --- Ícone SVG de chat/feedback ---
  const chatIconSvg = `
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
    </svg>
  `;

  // --- Ícone SVG de check (sucesso) ---
  const checkIconSvg = `
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
    </svg>
  `;

  // --- Cria o botão flutuante ---
  const floatingBtn = document.createElement('button');
  floatingBtn.className = 'upvote-widget-btn';
  floatingBtn.setAttribute('aria-label', 'Enviar feedback');
  floatingBtn.setAttribute('data-upvote-widget', 'true');
  floatingBtn.innerHTML = chatIconSvg;
  document.body.appendChild(floatingBtn);

  // --- Cria o painel ---
  panel = document.createElement('div');
  panel.className = 'upvote-widget-panel';
  panel.setAttribute('data-upvote-widget', 'true');

  // Cabeçalho
  const header = document.createElement('div');
  header.className = 'upvote-widget-header';

  const title = document.createElement('h3');
  title.textContent = configTitle || 'Feedback';
  header.appendChild(title);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'upvote-widget-close';
  closeBtn.setAttribute('aria-label', 'Fechar');
  closeBtn.innerHTML = '&times;';
  closeBtn.addEventListener('click', fecharWidget);
  header.appendChild(closeBtn);

  panel.appendChild(header);

  // Corpo do painel (conteúdo dinâmico)
  bodyContainer = document.createElement('div');
  bodyContainer.className = 'upvote-widget-body';
  panel.appendChild(bodyContainer);

  document.body.appendChild(panel);

  // Renderiza o formulário inicial
  renderizarFormulario();

  // Applies a position class to button and panel, overriding the default bottom-right CSS.
  // BOTTOM_RIGHT is the base CSS default — no class needed for it.
  function applyPosition(pos: string): void {
    const posClass = `upvote-pos-${pos.toLowerCase().replace('_', '-')}`;
    const allPosClasses = [
      'upvote-pos-bottom-left',
      'upvote-pos-top-right',
      'upvote-pos-top-left',
    ];
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
        title.textContent = configTitle;
      }
      if (cfg.placeholder) {
        configPlaceholder = cfg.placeholder;
      }
    } catch {
      // Network error or invalid response — silently use defaults
    }
  }

  // Load backend config asynchronously after initial render
  fetchConfig();

  // --- Funções de abertura/fechamento ---

  function abrirWidget(trigger?: 'button' | 'event' | 'always_visible') {
    if (isOpen) return;
    isOpen = true;

    if (trigger) {
      currentTriggerType = trigger;
    }

    // Reseta o formulário ao abrir
    renderizarFormulario();
    panel.classList.add('upvote-open');
  }

  function fecharWidget() {
    if (!isOpen) return;
    isOpen = false;
    panel.classList.remove('upvote-open');

    // Reseta o estado após a animação de fechamento
    setTimeout(() => {
      if (!isOpen) {
        isSubmitting = false;
        renderizarFormulario();
      }
    }, 300);
  }

  // Fecha com Escape
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') fecharWidget();
  });

  // Evento do botão flutuante
  floatingBtn.addEventListener('click', () => {
    if (isOpen) {
      fecharWidget();
    } else {
      abrirWidget('button');
    }
  });

  // --- Renderização do formulário principal ---

  function renderizarFormulario() {
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

    // Permite enviar com Ctrl+Enter / Cmd+Enter
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

    // Foca na textarea ao abrir
    setTimeout(() => textarea.focus(), 100);
  }

  // --- Envio do feedback ---

  async function enviarFeedback(
    textarea: HTMLTextAreaElement,
    submitBtn: HTMLButtonElement,
    errorMsg: HTMLParagraphElement
  ) {
    const message = textarea.value.trim();

    // Validação: não permite mensagem vazia
    if (!message) {
      textarea.style.borderColor = '#ef4444';
      textarea.focus();
      setTimeout(() => {
        textarea.style.borderColor = '';
      }, 2000);
      return;
    }

    // Prevenção de duplo envio
    if (isSubmitting) return;
    isSubmitting = true;

    // Estado de loading
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="upvote-widget-spinner"></span> Enviando...';
    errorMsg.style.display = 'none';

    // Coleta o contexto da página
    const contexto = coletarContexto(currentTriggerType);

    const payload = {
      message,
      ...contexto,
    };

    try {
      const response = await fetch(
        `${baseUrl}/api/widget/feedback`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Verifica se há pergunta de follow-up
      if (data.followUpQuestion && data.feedbackId) {
        renderizarFollowUp(data.followUpQuestion, data.feedbackId);
      } else {
        renderizarSucesso();
      }
    } catch (_err) {
      // Erro de rede ou resposta inválida
      isSubmitting = false;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar feedback';
      errorMsg.textContent = 'Erro ao enviar. Tente novamente.';
      errorMsg.style.display = 'block';
    }
  }

  // --- Renderização do follow-up ---

  function renderizarFollowUp(question: string, feedbackId: string) {
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

    // Permite enviar com Ctrl+Enter / Cmd+Enter
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
    skipBtn.addEventListener('click', () => {
      renderizarSucesso();
    });

    bodyContainer.appendChild(questionEl);
    bodyContainer.appendChild(textarea);
    bodyContainer.appendChild(errorMsg);
    bodyContainer.appendChild(submitBtn);
    bodyContainer.appendChild(skipBtn);

    // Foca na textarea
    setTimeout(() => textarea.focus(), 100);
  }

  // --- Envio da resposta de follow-up ---

  async function enviarFollowUp(
    textarea: HTMLTextAreaElement,
    submitBtn: HTMLButtonElement,
    errorMsg: HTMLParagraphElement,
    feedbackId: string
  ) {
    const answer = textarea.value.trim();

    if (!answer) {
      // Se vazio, trata como pular
      renderizarSucesso();
      return;
    }

    // Prevenção de duplo envio
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="upvote-widget-spinner"></span> Enviando...';
    errorMsg.style.display = 'none';

    try {
      const response = await fetch(
        `${baseUrl}/api/widget/feedback/${feedbackId}/follow-up`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answer }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      renderizarSucesso();
    } catch (_err) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar resposta';
      errorMsg.textContent = 'Erro ao enviar. Tente novamente.';
      errorMsg.style.display = 'block';
    }
  }

  // --- Renderização da mensagem de sucesso ---

  function renderizarSucesso() {
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

    // Fecha automaticamente após 2 segundos
    setTimeout(() => {
      fecharWidget();
    }, 2000);
  }

  // --- API pública ---

  window.UpvoteWidget = {
    open: () => abrirWidget('event'),
    close: () => fecharWidget(),
  };

  // --- Auto-abertura para trigger "always" ---

  if (triggerAttr === 'always') {
    // Abre automaticamente quando o DOM estiver pronto
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(() => abrirWidget('always_visible'), 500);
    } else {
      window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => abrirWidget('always_visible'), 500);
      });
    }
  }
})();
