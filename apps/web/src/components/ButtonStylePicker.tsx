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

const ChatIcon = () => (
  <svg
    viewBox="0 0 24 24"
    style={{ width: '12px', height: '12px', fill: 'white', flexShrink: 0 }}
  >
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
  </svg>
);

function ButtonStylePreview({ id, color }: { id: StyleId; color: string }) {
  const base: React.CSSProperties = {
    background: color,
    color: 'white',
    border: 'none',
    cursor: 'default',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    maxWidth: '100%',
  };

  if (id === 'SQUARE') {
    return (
      <div style={{ ...base, width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0 }}>
        <ChatIcon />
      </div>
    );
  }
  if (id === 'PILL') {
    return (
      <div style={{ ...base, borderRadius: '100px', height: '26px', padding: '0 8px', gap: '3px', fontSize: '8px', fontWeight: 600, whiteSpace: 'nowrap' }}>
        <ChatIcon />
        <span>Feedback</span>
      </div>
    );
  }
  if (id === 'PILL_LABEL') {
    return (
      <div style={{ ...base, borderRadius: '100px', height: '26px', padding: '0 8px', gap: '3px', fontSize: '8px', fontWeight: 600, whiteSpace: 'nowrap' }}>
        <span>Feedback</span>
        <ChatIcon />
      </div>
    );
  }
  if (id === 'HANDLE') {
    return (
      <div style={{ ...base, borderRadius: '100px', width: '40px', height: '20px', flexShrink: 0 }}>
        <ChatIcon />
      </div>
    );
  }
  if (id === 'BUBBLE') {
    return (
      <div style={{ ...base, width: '30px', height: '30px', borderRadius: '50% 50% 50% 4px', flexShrink: 0 }}>
        <ChatIcon />
      </div>
    );
  }
  if (id === 'GRADIENT') {
    return (
      <div
        style={{
          ...base,
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          flexShrink: 0,
          background: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 60%, black))`,
        }}
      >
        <ChatIcon />
      </div>
    );
  }
  if (id === 'PILL_COUNTER') {
    return (
      <div style={{ ...base, borderRadius: '100px', height: '26px', padding: '0 6px', gap: '3px', fontSize: '8px', fontWeight: 600, whiteSpace: 'nowrap' }}>
        <ChatIcon />
        <span>Feed</span>
        <span
          style={{
            background: 'rgba(255,255,255,0.3)',
            borderRadius: '100px',
            padding: '0 4px',
            fontSize: '7px',
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
    <div style={{ ...base, width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0 }}>
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
              'flex flex-col items-center gap-1.5 rounded-xl border px-1.5 py-2.5 transition-all',
              'hover:border-primary/50 hover:bg-accent/50',
              selected
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border bg-card'
            )}
          >
            {/* Fixed-height container, clip overflow so pills don't bleed */}
            <div className="flex h-10 w-full items-center justify-center overflow-hidden">
              <ButtonStylePreview id={id} color={color} />
            </div>
            <span className="w-full text-center text-[9px] leading-tight text-muted-foreground">
              {t(labelKey)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
