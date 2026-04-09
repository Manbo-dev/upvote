import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface ButtonStylePickerProps {
  value: string;
  onChange: (style: string) => void;
  color: string;
}

const BUTTON_STYLES = [
  { id: 'CIRCLE',       labelKey: 'canal.buttonStyleCircle' },
  { id: 'SQUARE',       labelKey: 'canal.buttonStyleSquare' },
  { id: 'PILL',         labelKey: 'canal.buttonStylePill' },
  { id: 'PILL_LABEL',   labelKey: 'canal.buttonStylePillLabel' },
  { id: 'HANDLE',       labelKey: 'canal.buttonStyleHandle' },
  { id: 'BUBBLE',       labelKey: 'canal.buttonStyleBubble' },
  { id: 'GRADIENT',     labelKey: 'canal.buttonStyleGradient' },
  { id: 'PILL_COUNTER', labelKey: 'canal.buttonStylePillCounter' },
] as const;

type StyleId = (typeof BUTTON_STYLES)[number]['id'];

const ChatIcon = () => (
  <svg viewBox="0 0 24 24" style={{ width: '13px', height: '13px', fill: 'white', flexShrink: 0 }}>
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
  };

  if (id === 'CIRCLE') return (
    <div style={{ ...base, width: '38px', height: '38px', borderRadius: '50%' }}>
      <ChatIcon />
    </div>
  );

  if (id === 'SQUARE') return (
    <div style={{ ...base, width: '38px', height: '38px', borderRadius: '10px' }}>
      <ChatIcon />
    </div>
  );

  if (id === 'PILL') return (
    <div style={{ ...base, borderRadius: '100px', height: '34px', padding: '0 14px', gap: '6px' }}>
      <ChatIcon />
      <span style={{ fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }}>Feedback</span>
    </div>
  );

  if (id === 'PILL_LABEL') return (
    <div style={{ ...base, borderRadius: '100px', height: '34px', padding: '0 14px', gap: '6px' }}>
      <span style={{ fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }}>Feedback</span>
      <ChatIcon />
    </div>
  );

  if (id === 'HANDLE') return (
    <div style={{ ...base, borderRadius: '100px', width: '56px', height: '28px' }}>
      <ChatIcon />
    </div>
  );

  if (id === 'BUBBLE') return (
    <div style={{ ...base, width: '38px', height: '38px', borderRadius: '50% 50% 50% 5px' }}>
      <ChatIcon />
    </div>
  );

  if (id === 'GRADIENT') return (
    <div style={{
      ...base,
      width: '38px', height: '38px', borderRadius: '50%',
      background: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 55%, black))`,
    }}>
      <ChatIcon />
    </div>
  );

  if (id === 'PILL_COUNTER') return (
    <div style={{ ...base, borderRadius: '100px', height: '34px', padding: '0 10px', gap: '5px' }}>
      <ChatIcon />
      <span style={{ fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }}>Feedback</span>
      <span style={{
        background: 'rgba(255,255,255,0.28)',
        borderRadius: '100px',
        padding: '1px 6px',
        fontSize: '10px',
        fontWeight: 700,
      }}>42</span>
    </div>
  );

  return null;
}

export function ButtonStylePicker({ value, onChange, color }: ButtonStylePickerProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 gap-2">
      {BUTTON_STYLES.map(({ id, labelKey }) => {
        const selected = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              'flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all text-left',
              'hover:border-primary/50 hover:bg-accent/50',
              selected
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border bg-card'
            )}
          >
            {/* Preview — fixed width so the label aligns consistently */}
            <div className="flex w-14 shrink-0 items-center justify-center">
              <ButtonStylePreview id={id} color={color} />
            </div>
            <span className="text-xs font-medium text-foreground">
              {t(labelKey)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
