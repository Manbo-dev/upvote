import { getStyles } from './styles';

/**
 * Widget Upvote — botão flutuante que abre o board público de sugestões
 *
 * Uso:
 * <script src="https://upvote.com/widget.js" data-product-slug="meu-produto" data-color="#6366f1"></script>
 */
(function () {
  // Busca o script tag atual para ler os atributos de configuração
  const currentScript = document.currentScript as HTMLScriptElement;
  if (!currentScript) return;

  const productSlug = currentScript.getAttribute('data-product-slug');
  const color = currentScript.getAttribute('data-color') || '#6366f1';
  const baseUrl = currentScript.getAttribute('data-base-url') || window.location.origin;

  if (!productSlug) {
    console.error('[Upvote Widget] Atributo data-product-slug é obrigatório');
    return;
  }

  // Injeta estilos
  const styleEl = document.createElement('style');
  styleEl.textContent = getStyles(color);
  document.head.appendChild(styleEl);

  // Cria o botão flutuante
  const button = document.createElement('button');
  button.className = 'upvote-widget-btn';
  button.setAttribute('aria-label', 'Enviar feedback');
  button.innerHTML = `
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
    </svg>
  `;
  document.body.appendChild(button);

  let isOpen = false;
  let overlay: HTMLDivElement | null = null;

  // Abre o modal com o iframe do board público
  function openWidget() {
    if (isOpen) return;
    isOpen = true;

    overlay = document.createElement('div');
    overlay.className = 'upvote-widget-overlay';

    const modal = document.createElement('div');
    modal.className = 'upvote-widget-modal';

    const header = document.createElement('div');
    header.className = 'upvote-widget-header';
    header.innerHTML = `<h2>Feedback</h2>`;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'upvote-widget-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = closeWidget;
    header.appendChild(closeBtn);

    const iframe = document.createElement('iframe');
    iframe.className = 'upvote-widget-iframe';
    iframe.src = `${baseUrl}/b/${productSlug}`;

    modal.appendChild(header);
    modal.appendChild(iframe);
    overlay.appendChild(modal);

    // Fecha ao clicar no overlay (fora do modal)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeWidget();
    });

    // Fecha com Escape
    document.addEventListener('keydown', handleEscape);

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
  }

  function closeWidget() {
    if (!isOpen || !overlay) return;
    isOpen = false;

    document.body.removeChild(overlay);
    overlay = null;
    document.body.style.overflow = '';
    document.removeEventListener('keydown', handleEscape);
  }

  function handleEscape(e: KeyboardEvent) {
    if (e.key === 'Escape') closeWidget();
  }

  button.addEventListener('click', openWidget);
})();
