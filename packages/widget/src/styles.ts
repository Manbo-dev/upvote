/**
 * Estilos CSS-in-JS para o widget Upvote
 * Todos os estilos são injetados via JS para evitar conflitos com a página host
 */
export function getStyles(color: string): string {
  return `
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
      transition: transform 0.2s, box-shadow 0.2s;
      z-index: 99998;
    }

    .upvote-widget-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
    }

    .upvote-widget-btn svg {
      width: 24px;
      height: 24px;
      fill: white;
    }

    .upvote-widget-overlay {
      position: fixed;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: upvote-fade-in 0.2s ease-out;
    }

    .upvote-widget-modal {
      width: 90%;
      max-width: 480px;
      height: 80vh;
      max-height: 700px;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
      animation: upvote-slide-up 0.3s ease-out;
    }

    .upvote-widget-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #e5e7eb;
      background-color: ${color};
      color: white;
    }

    .upvote-widget-header h2 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .upvote-widget-close {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      transition: background 0.2s;
    }

    .upvote-widget-close:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .upvote-widget-iframe {
      flex: 1;
      width: 100%;
      border: none;
    }

    @keyframes upvote-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes upvote-slide-up {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `;
}
