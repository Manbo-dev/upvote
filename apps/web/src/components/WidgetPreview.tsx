import { useTranslation } from 'react-i18next';

interface WidgetPreviewProps {
  color: string;
  position: string;
  mode: string;
  title: string | null;
  placeholder: string | null;
  theme: string;
  language: string;
  buttonStyle: string;
}

const STRINGS = {
  'pt-BR': {
    placeholder: 'Descreva seu feedback, bug ou sugestão...',
    submit: 'Enviar feedback',
    consent: 'Ao enviar, você concorda com nossa política de feedback',
    poweredBy: 'Powered by Upvote',
    feedbackLabel: 'Feedback',
  },
  en: {
    placeholder: 'Describe your feedback, bug or suggestion...',
    submit: 'Send feedback',
    consent: 'By submitting, you agree to our feedback policy',
    poweredBy: 'Powered by Upvote',
    feedbackLabel: 'Feedback',
  },
};

type LangKey = keyof typeof STRINGS;

export function WidgetPreview({
  color,
  position,
  mode,
  title,
  placeholder,
  theme,
  language,
  buttonStyle,
}: WidgetPreviewProps) {
  const { t } = useTranslation();
  const strings = STRINGS[(language as LangKey)] ?? STRINGS['pt-BR'];

  const isDark =
    theme === 'dark' ||
    (theme === 'auto' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);

  const surface = isDark ? '#1e293b' : '#ffffff';
  const onSurface = isDark ? '#f1f5f9' : '#1e293b';
  const muted = isDark ? '#94a3b8' : '#94a3b8';
  const inputBg = isDark ? '#0f172a' : '#f8fafc';
  const border = isDark ? '#334155' : '#e2e8f0';
  const frameBackground = isDark ? '#0f172a' : '#f1f5f9';
  const frameBorder = isDark ? '#1e293b' : '#e2e8f0';

  // Panel content (shared by floating/sidebar)
  const PanelContent = () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '220px',
        background: surface,
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        fontSize: '11px',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: color,
          color: 'white',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontWeight: 600, fontSize: '12px' }}>
          {title || strings.feedbackLabel}
        </span>
        <span
          style={{
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '4px',
            width: '18px',
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            cursor: 'default',
          }}
        >
          ×
        </span>
      </div>
      {/* Body */}
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <textarea
          readOnly
          placeholder={placeholder || strings.placeholder}
          rows={3}
          style={{
            width: '100%',
            background: inputBg,
            border: `1.5px solid ${border}`,
            borderRadius: '7px',
            color: onSurface,
            fontSize: '10px',
            padding: '7px 8px',
            resize: 'none',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
            outline: 'none',
          }}
        />
        <button
          style={{
            background: color,
            color: 'white',
            border: 'none',
            borderRadius: '7px',
            padding: '7px',
            fontWeight: 600,
            fontSize: '10px',
            cursor: 'default',
          }}
        >
          {strings.submit}
        </button>
        <span style={{ color: muted, fontSize: '9px', textAlign: 'center', lineHeight: 1.4 }}>
          {strings.consent}
        </span>
      </div>
    </div>
  );

  // Trigger button by style
  const TriggerButton = () => {
    const baseStyle: React.CSSProperties = {
      background: color,
      color: 'white',
      border: 'none',
      cursor: 'default',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
      flexShrink: 0,
    };

    const ChatIcon = () => (
      <svg
        viewBox="0 0 24 24"
        style={{ width: '16px', height: '16px', fill: 'white', flexShrink: 0 }}
      >
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
      </svg>
    );

    if (buttonStyle === 'SQUARE') {
      return (
        <button style={{ ...baseStyle, width: '40px', height: '40px', borderRadius: '10px' }}>
          <ChatIcon />
        </button>
      );
    }
    if (buttonStyle === 'PILL') {
      return (
        <button style={{ ...baseStyle, borderRadius: '100px', height: '36px', padding: '0 14px', gap: '6px' }}>
          <ChatIcon />
          <span style={{ fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }}>
            {title || strings.submit}
          </span>
        </button>
      );
    }
    if (buttonStyle === 'PILL_LABEL') {
      return (
        <button style={{ ...baseStyle, borderRadius: '100px', height: '34px', padding: '0 12px', gap: '5px' }}>
          <span style={{ fontSize: '10px', fontWeight: 600, whiteSpace: 'nowrap' }}>
            {title || strings.submit}
          </span>
          <ChatIcon />
        </button>
      );
    }
    if (buttonStyle === 'HANDLE') {
      return (
        <button style={{ ...baseStyle, borderRadius: '100px', width: '52px', height: '26px' }}>
          <ChatIcon />
        </button>
      );
    }
    if (buttonStyle === 'BUBBLE') {
      return (
        <button style={{ ...baseStyle, width: '40px', height: '40px', borderRadius: '50% 50% 50% 4px' }}>
          <ChatIcon />
        </button>
      );
    }
    if (buttonStyle === 'GRADIENT') {
      return (
        <button
          style={{
            ...baseStyle,
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 70%, black))`,
          }}
        >
          <ChatIcon />
        </button>
      );
    }
    if (buttonStyle === 'PILL_COUNTER') {
      return (
        <button style={{ ...baseStyle, borderRadius: '100px', height: '36px', padding: '0 12px', gap: '6px' }}>
          <ChatIcon />
          <span style={{ fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }}>
            {title || strings.submit}
          </span>
          <span
            style={{
              background: 'rgba(255,255,255,0.25)',
              color: 'white',
              borderRadius: '100px',
              padding: '1px 6px',
              fontSize: '10px',
              fontWeight: 700,
            }}
          >
            42
          </span>
        </button>
      );
    }
    // CIRCLE (default)
    return (
      <button style={{ ...baseStyle, width: '40px', height: '40px', borderRadius: '50%' }}>
        <ChatIcon />
      </button>
    );
  };

  // Inline mode preview
  if (mode === 'INLINE') {
    return (
      <div>
        <p className="text-xs text-muted-foreground mb-3">{t('canal.widgetPreviewLabel')}</p>
        <div
          style={{
            background: frameBackground,
            border: `1px solid ${frameBorder}`,
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <PanelContent />
        </div>
      </div>
    );
  }

  // Sidebar mode preview
  if (mode === 'SIDEBAR') {
    const isLeft = position === 'BOTTOM_LEFT' || position === 'TOP_LEFT';
    return (
      <div>
        <p className="text-xs text-muted-foreground mb-3">{t('canal.widgetPreviewLabel')}</p>
        <div
          style={{
            background: frameBackground,
            border: `1px solid ${frameBorder}`,
            borderRadius: '12px',
            height: '240px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Sidebar tab */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              [isLeft ? 'left' : 'right']: 0,
              transform: 'translateY(-50%)',
              background: color,
              color: 'white',
              padding: '8px 10px',
              borderRadius: isLeft ? '0 6px 6px 0' : '6px 0 0 6px',
              fontSize: '10px',
              fontWeight: 600,
              cursor: 'default',
              boxShadow: isLeft
                ? '2px 0 8px rgba(0,0,0,0.12)'
                : '-2px 0 8px rgba(0,0,0,0.12)',
              zIndex: 2,
            }}
          >
            {title || strings.feedbackLabel}
          </div>
          {/* Panel slightly visible from edge */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              [isLeft ? 'left' : 'right']: 0,
              width: '120px',
              background: surface,
              transform: isLeft ? 'translateX(-70%)' : 'translateX(70%)',
              borderLeft: isLeft ? 'none' : `1px solid ${border}`,
              borderRight: isLeft ? `1px solid ${border}` : 'none',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              opacity: 0.6,
            }}
          >
            <div style={{ background: color, padding: '8px 10px', color: 'white', fontSize: '10px', fontWeight: 600 }}>
              {title || strings.feedbackLabel}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Floating mode (default)
  const isLeft = position === 'BOTTOM_LEFT' || position === 'TOP_LEFT';
  const isTop = position === 'TOP_RIGHT' || position === 'TOP_LEFT';

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-3">{t('canal.widgetPreviewLabel')}</p>
      <div
        style={{
          background: frameBackground,
          border: `1px solid ${frameBorder}`,
          borderRadius: '12px',
          height: '240px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Mock page content */}
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', opacity: 0.35 }}>
          <div style={{ height: '8px', background: onSurface, borderRadius: '4px', width: '60%' }} />
          <div style={{ height: '6px', background: onSurface, borderRadius: '4px', width: '80%' }} />
          <div style={{ height: '6px', background: onSurface, borderRadius: '4px', width: '45%' }} />
        </div>

        {/* Panel — open by default in preview */}
        <div
          style={{
            position: 'absolute',
            [isTop ? 'top' : 'bottom']: isTop ? '56px' : '56px',
            [isLeft ? 'left' : 'right']: '12px',
          }}
        >
          <PanelContent />
        </div>

        {/* Trigger button */}
        <div
          style={{
            position: 'absolute',
            [isTop ? 'top' : 'bottom']: '12px',
            [isLeft ? 'left' : 'right']: '12px',
          }}
        >
          <TriggerButton />
        </div>
      </div>
    </div>
  );
}
