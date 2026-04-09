/**
 * CSS-in-JS styles for the Upvote widget.
 * All styles are injected via JS to avoid conflicts with the host page.
 * Uses 'upvote-' prefix on all classes for isolation.
 * Uses CSS custom properties for theming (light/dark).
 */
export function getStyles(color: string): string {
  return `
    /* ---- CSS variables (light theme defaults) ---- */
    .upvote-widget-btn,
    .upvote-widget-panel,
    .upvote-widget-inline,
    .upvote-sidebar-tab {
      --upvote-primary: ${color};
      --upvote-surface: #ffffff;
      --upvote-on-surface: #1e293b;
      --upvote-on-surface-muted: #64748b;
      --upvote-input-bg: #f8fafc;
      --upvote-input-bg-focus: #ffffff;
      --upvote-border: #e2e8f0;
      --upvote-consent: #94a3b8;
      --upvote-success-text: #1e293b;
      --upvote-followup-bg: #f1f5f9;
      --upvote-error: #ef4444;
    }

    /* ---- Dark theme override (forced) ---- */
    .upvote-theme-dark.upvote-widget-btn,
    .upvote-theme-dark.upvote-widget-panel,
    .upvote-theme-dark.upvote-widget-inline,
    .upvote-theme-dark.upvote-sidebar-tab,
    .upvote-theme-dark .upvote-widget-panel,
    .upvote-theme-dark .upvote-widget-inline {
      --upvote-surface: #1e293b;
      --upvote-on-surface: #f1f5f9;
      --upvote-on-surface-muted: #94a3b8;
      --upvote-input-bg: #0f172a;
      --upvote-input-bg-focus: #1e293b;
      --upvote-border: #334155;
      --upvote-consent: #64748b;
      --upvote-success-text: #f1f5f9;
      --upvote-followup-bg: #0f172a;
    }

    /* ---- Dark theme via OS preference (auto) ---- */
    @media (prefers-color-scheme: dark) {
      .upvote-theme-auto.upvote-widget-btn,
      .upvote-theme-auto.upvote-widget-panel,
      .upvote-theme-auto.upvote-widget-inline,
      .upvote-theme-auto.upvote-sidebar-tab,
      .upvote-theme-auto .upvote-widget-panel,
      .upvote-theme-auto .upvote-widget-inline {
        --upvote-surface: #1e293b;
        --upvote-on-surface: #f1f5f9;
        --upvote-on-surface-muted: #94a3b8;
        --upvote-input-bg: #0f172a;
        --upvote-input-bg-focus: #1e293b;
        --upvote-border: #334155;
        --upvote-consent: #64748b;
        --upvote-success-text: #f1f5f9;
        --upvote-followup-bg: #0f172a;
      }
    }

    /* ---- Floating trigger button (FLOATING mode) ---- */
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
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }

    .upvote-widget-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
    }

    .upvote-widget-btn svg {
      width: 24px;
      height: 24px;
      fill: white;
      flex-shrink: 0;
    }

    /* -- Button style variants -- */

    /* SQUARE: rounded square instead of circle */
    .upvote-btn-square {
      border-radius: 14px !important;
    }

    /* PILL: wide pill with icon + label text */
    .upvote-btn-pill {
      border-radius: 100px !important;
      width: auto !important;
      height: 48px !important;
      padding: 0 20px !important;
      gap: 8px;
      min-width: 130px;
    }
    .upvote-btn-pill .upvote-btn-label {
      font-size: 14px;
      font-weight: 600;
      color: white;
      white-space: nowrap;
    }

    /* PILL_LABEL: smaller pill, text-first layout */
    .upvote-btn-pill-label {
      border-radius: 100px !important;
      width: auto !important;
      height: 44px !important;
      padding: 0 16px !important;
      gap: 8px;
    }
    .upvote-btn-pill-label svg {
      width: 18px !important;
      height: 18px !important;
    }
    .upvote-btn-pill-label .upvote-btn-label {
      font-size: 13px;
      font-weight: 600;
      color: white;
      white-space: nowrap;
    }

    /* HANDLE: wide but short, horizontal handle shape */
    .upvote-btn-handle {
      border-radius: 100px !important;
      width: 72px !important;
      height: 36px !important;
    }
    .upvote-btn-handle svg {
      width: 20px !important;
      height: 20px !important;
    }

    /* BUBBLE: speech-bubble shape (bottom-left corner cut) */
    .upvote-btn-bubble {
      border-radius: 50% 50% 50% 6px !important;
    }

    /* GRADIENT: circle with 2-tone gradient */
    .upvote-btn-gradient {
      background: linear-gradient(135deg, ${color}, var(--upvote-primary-dark, ${color})) !important;
    }

    /* PILL_COUNTER: pill with icon + label + count badge */
    .upvote-btn-pill-counter {
      border-radius: 100px !important;
      width: auto !important;
      height: 48px !important;
      padding: 0 16px !important;
      gap: 8px;
    }
    .upvote-btn-pill-counter .upvote-btn-label {
      font-size: 14px;
      font-weight: 600;
      color: white;
      white-space: nowrap;
    }
    .upvote-btn-counter-badge {
      background: rgba(255, 255, 255, 0.25);
      color: white;
      border-radius: 100px;
      padding: 2px 8px;
      font-size: 12px;
      font-weight: 700;
      line-height: 1.4;
    }

    /* ---- Feedback panel (FLOATING + SIDEBAR modes) ---- */
    .upvote-widget-panel {
      position: fixed;
      bottom: 92px;
      right: 24px;
      width: 360px;
      max-height: 480px;
      background: var(--upvote-surface);
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

    /* ---- SIDEBAR mode ---- */

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

    .upvote-sidebar-tab.upvote-sidebar-left {
      right: auto;
      left: 0;
      border-radius: 0 8px 8px 0;
      box-shadow: 2px 0 12px rgba(0, 0, 0, 0.12);
    }

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

    .upvote-widget-panel.upvote-mode-sidebar.upvote-sidebar-left {
      right: auto;
      left: 0;
      transform: translateX(-100%);
    }

    .upvote-widget-panel.upvote-mode-sidebar.upvote-sidebar-left.upvote-open {
      transform: translateX(0);
    }

    /* ---- INLINE mode ---- */

    .upvote-widget-inline {
      width: 100%;
      background: var(--upvote-surface);
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }

    /* ---- Header (shared by all modes) ---- */
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

    /* ---- Panel body ---- */
    .upvote-widget-body {
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      flex: 1;
      overflow-y: auto;
      background: var(--upvote-surface);
    }

    /* ---- Textarea ---- */
    .upvote-widget-textarea {
      width: 100%;
      min-height: 100px;
      padding: 12px;
      border: 1.5px solid var(--upvote-border);
      border-radius: 10px;
      font-family: inherit;
      font-size: 14px;
      line-height: 1.5;
      color: var(--upvote-on-surface);
      background: var(--upvote-input-bg);
      resize: vertical;
      transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
      box-sizing: border-box;
      outline: none;
    }

    .upvote-widget-textarea:focus {
      border-color: ${color};
      box-shadow: 0 0 0 3px ${color}22;
      background: var(--upvote-input-bg-focus);
    }

    .upvote-widget-textarea::placeholder {
      color: var(--upvote-consent);
    }

    /* ---- Submit button ---- */
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

    /* ---- Loading spinner ---- */
    .upvote-widget-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: upvote-spin 0.6s linear infinite;
    }

    /* ---- Consent text ---- */
    .upvote-widget-consent {
      font-size: 11px;
      color: var(--upvote-consent);
      text-align: center;
      line-height: 1.4;
      margin: 0;
      padding: 0 4px;
    }

    /* ---- Success state ---- */
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
      color: var(--upvote-success-text);
      margin: 0;
    }

    /* ---- Error message ---- */
    .upvote-widget-error {
      font-size: 13px;
      color: var(--upvote-error);
      text-align: center;
      margin: 0;
      padding: 4px 0;
    }

    /* ---- Follow-up question ---- */
    .upvote-widget-followup-question {
      font-size: 14px;
      color: var(--upvote-on-surface);
      line-height: 1.5;
      margin: 0;
      padding: 8px 12px;
      background: var(--upvote-followup-bg);
      border-radius: 8px;
      border-left: 3px solid ${color};
    }

    /* ---- Mobile responsive ---- */
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

    /* ---- Powered by Upvote branding ---- */
    .upvote-widget-branding {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 6px 0 2px;
      gap: 4px;
    }

    .upvote-widget-branding a {
      font-size: 10px;
      color: var(--upvote-consent);
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 3px;
      transition: color 0.15s ease;
    }

    .upvote-widget-branding a:hover {
      color: ${color};
    }

    /* ---- Animations ---- */
    @keyframes upvote-spin {
      to { transform: rotate(360deg); }
    }

    /* ---- Position overrides (FLOATING mode) ---- */
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
