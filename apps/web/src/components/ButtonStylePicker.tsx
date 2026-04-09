import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface ButtonStylePickerProps {
  value: string;
  onChange: (style: string) => void;
  color: string;
}

const BUTTON_STYLES = [
  { id: 'CIRCLE', labelKey: 'canal.buttonStyleCircle' },
  { id: 'SQUARE', labelKey: 'canal.buttonStyleSquare' },
  { id: 'PILL', labelKey: 'canal.buttonStylePill' },
  { id: 'PILL_LABEL', labelKey: 'canal.buttonStylePillLabel' },
  { id: 'HANDLE', labelKey: 'canal.buttonStyleHandle' },
  { id: 'BUBBLE', labelKey: 'canal.buttonStyleBubble' },
  { id: 'GRADIENT', labelKey: 'canal.buttonStyleGradient' },
  { id: 'PILL_COUNTER', labelKey: 'canal.buttonStylePillCounter' },
] as const;

type StyleId = (typeof BUTTON_STYLES)[number]['id'];

function ButtonStylePreview({ id, color }: { id: StyleId; color: string }) {
  const ChatIcon = () => (
    <svg
      viewBox="0 0 24 24"
      style={{ width: '14px', height: '14px', fill: 'white', flexShrink: 0 }}
    >
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
    </svg>
  );

  const base: React.CSSProperties = {
    background: color,
    color: 'white',
    border: 'none',
    cursor: 'default',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    flexShrink: 0,
    pointerEvents: 'none',
  };

  if (id === 'SQUARE') {
    return (
      <div style={{ ...base, width: '36px', height: '36px', borderRadius: '10px' }}>
        <ChatIcon />
      </div>
    );
  }
  if (id === 'PILL') {
    return (
      <div style={{ ...base, borderRadius: '100px', height: '32px', padding: '0 10px', gap: '4px' }}>
        <ChatIcon />
        <span style={{ fontSize: '9px', fontWeight: 600 }}>Feedback</span>
      </div>
    );
  }
  if (id === 'PILL_LABEL') {
    return (
      <div style={{ ...base, borderRadius: '100px', height: '30px', padding: '0 10px', gap: '4px' }}>
        <span style={{ fontSize: '9px', fontWeight: 600 }}>Feedback</span>
        <ChatIcon />
      </div>
    );
  }
  if (id === 'HANDLE') {
    return (
      <div style={{ ...base, borderRadius: '100px', width: '48px', height: '24px' }}>
        <ChatIcon />
      </div>
    );
  }
  if (id === 'BUBBLE') {
    return (
      <div style={{ ...base, width: '36px', height: '36px', borderRadius: '50% 50% 50% 4px' }}>
        <ChatIcon />
      </div>
    );
  }
  if (id === 'GRADIENT') {
    return (
      <div
        style={{
          ...base,
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 60%, black))`,
        }}
      >
        <ChatIcon />
      </div>
    );
  }
  if (id === 'PILL_COUNTER') {
    return (
      <div style={{ ...base, borderRadius: '100px', height: '32px', padding: '0 8px', gap: '4px' }}>
        <ChatIcon />
        <span style={{ fontSize: '9px', fontWeight: 600 }}>Feedback</span>
        <span
          style={{
            background: 'rgba(255,255,255,0.25)',
            borderRadius: '100px',
            padding: '1px 5px',
            fontSize: '8px',
            fontWeight: 700,
          }}
        >
          42
        </span>
      </div>
    );
  }
  // CIRCLE default
  return (
    <div style={{ ...base, width: '36px', height: '36px', borderRadius: '50%' }}>
      <ChatIcon />
    </div>
  );
}

export function ButtonStylePicker({ value, onChange, color }: ButtonStylePickerProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-4 gap-2">
      {BUTTON_STYLES.map(({ id, labelKey }) => {
        const selected = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              'flex flex-col items-center gap-2 rounded-xl border p-3 transition-all',
              'hover:border-primary/50 hover:bg-accent/50',
              selected
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border bg-card'
            )}
          >
            <div className="flex h-12 w-full items-center justify-center">
              <ButtonStylePreview id={id} color={color} />
            </div>
            <span className="text-center text-[10px] leading-tight text-muted-foreground">
              {t(labelKey)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
