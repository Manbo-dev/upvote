/**
 * Módulo de captura de contexto da página
 * Rastreia interações do usuário e coleta informações do ambiente
 */

/** Armazena a descrição legível do último elemento interagido */
let ultimaInteracao = '';

/**
 * Retorna uma descrição legível de um elemento HTML
 * Ex: "botão Pagar", "link Conta", "campo Email"
 */
function descreverElemento(el: HTMLElement): string {
  const tag = el.tagName.toLowerCase();
  const texto = (
    el.textContent?.trim().substring(0, 50) ||
    el.getAttribute('aria-label') ||
    el.getAttribute('title') ||
    el.getAttribute('alt') ||
    el.getAttribute('placeholder') ||
    ''
  ).trim();

  if (!texto) return '';

  // Mapeia tags para nomes legíveis em português
  if (tag === 'button' || el.getAttribute('role') === 'button') {
    return `botão ${texto}`;
  }
  if (tag === 'a') {
    return `link ${texto}`;
  }
  if (tag === 'input' || tag === 'textarea' || tag === 'select') {
    // Tenta encontrar o label associado
    const label = el.getAttribute('aria-label')
      || el.getAttribute('placeholder')
      || encontrarLabel(el)
      || texto;
    return `campo ${label}`;
  }
  if (tag === 'img') {
    return `imagem ${texto}`;
  }

  // Elemento genérico clicável
  return texto;
}

/**
 * Tenta encontrar o label associado a um input
 */
function encontrarLabel(el: HTMLElement): string {
  const id = el.getAttribute('id');
  if (id) {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label?.textContent) {
      return label.textContent.trim().substring(0, 50);
    }
  }
  // Verifica se o input está dentro de um label
  const parentLabel = el.closest('label');
  if (parentLabel?.textContent) {
    return parentLabel.textContent.trim().substring(0, 50);
  }
  return '';
}

/**
 * Inicia o rastreamento de cliques na página
 * Armazena o último elemento clicado antes da abertura do widget
 */
export function iniciarRastreamento(): void {
  document.addEventListener('click', (e: MouseEvent) => {
    const alvo = e.target as HTMLElement;
    if (!alvo) return;

    // Ignora cliques dentro do próprio widget
    if (alvo.closest('[data-upvote-widget]')) return;

    const descricao = descreverElemento(alvo);
    if (descricao) {
      ultimaInteracao = descricao;
    }
  }, true); // Usa capture para pegar antes de qualquer stopPropagation
}

/**
 * Retorna a última interação rastreada
 */
export function obterUltimaInteracao(): string {
  return ultimaInteracao;
}

/**
 * Detecta o tipo de dispositivo baseado na largura da janela
 */
export function detectarDispositivo(): 'mobile' | 'desktop' {
  return window.innerWidth < 768 ? 'mobile' : 'desktop';
}

/**
 * Coleta todo o contexto da página para enviar junto com o feedback
 */
export function coletarContexto(triggerType: 'button' | 'event' | 'always_visible') {
  return {
    pageUrl: window.location.href,
    pageTitle: document.title,
    triggerType,
    lastInteraction: obterUltimaInteracao(),
    deviceType: detectarDispositivo(),
  };
}
