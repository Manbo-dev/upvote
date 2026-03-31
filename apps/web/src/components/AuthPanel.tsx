import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Zap, LayoutDashboard, Puzzle } from 'lucide-react';

const SLIDE_COUNT = 3;
const SLIDE_INTERVAL_MS = 5000;

// ─── Slide 0: SVG Illustration ────────────────────────────────────────────────

function FeedbackIllustration() {
  return (
    <svg viewBox="0 0 280 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-xs mx-auto">
      {/* Speech bubble 1 — top left */}
      <rect x="8" y="16" width="120" height="52" rx="12" fill="white" fillOpacity="0.18" />
      <rect x="8" y="16" width="120" height="52" rx="12" stroke="white" strokeOpacity="0.35" strokeWidth="1.5" />
      <rect x="20" y="30" width="64" height="6" rx="3" fill="white" fillOpacity="0.55" />
      <rect x="20" y="43" width="48" height="6" rx="3" fill="white" fillOpacity="0.35" />
      {/* Tail */}
      <path d="M28 68 L18 82 L42 68" fill="white" fillOpacity="0.18" />

      {/* Speech bubble 2 — top right */}
      <rect x="148" y="8" width="124" height="52" rx="12" fill="white" fillOpacity="0.18" />
      <rect x="148" y="8" width="124" height="52" rx="12" stroke="white" strokeOpacity="0.35" strokeWidth="1.5" />
      <rect x="160" y="22" width="72" height="6" rx="3" fill="white" fillOpacity="0.55" />
      <rect x="160" y="35" width="52" height="6" rx="3" fill="white" fillOpacity="0.35" />
      <rect x="160" y="48" width="36" height="6" rx="3" fill="white" fillOpacity="0.25" />
      {/* Tail */}
      <path d="M236 60 L248 76 L224 60" fill="white" fillOpacity="0.18" />

      {/* Speech bubble 3 — mid left */}
      <rect x="0" y="92" width="108" height="44" rx="12" fill="white" fillOpacity="0.12" />
      <rect x="0" y="92" width="108" height="44" rx="12" stroke="white" strokeOpacity="0.25" strokeWidth="1.5" />
      <rect x="12" y="104" width="56" height="6" rx="3" fill="white" fillOpacity="0.4" />
      <rect x="12" y="117" width="40" height="6" rx="3" fill="white" fillOpacity="0.25" />

      {/* Arrow funnel lines converging to center */}
      <line x1="108" y1="114" x2="148" y2="138" stroke="white" strokeOpacity="0.45" strokeWidth="1.5" strokeDasharray="4 3" />
      <line x1="128" y1="42" x2="152" y2="108" stroke="white" strokeOpacity="0.45" strokeWidth="1.5" strokeDasharray="4 3" />
      <line x1="148" y1="42" x2="160" y2="108" stroke="white" strokeOpacity="0.45" strokeWidth="1.5" strokeDasharray="4 3" />

      {/* Center "synthesized" card */}
      <rect x="72" y="108" width="136" height="72" rx="14" fill="white" fillOpacity="0.92" />
      <rect x="72" y="108" width="136" height="72" rx="14" stroke="white" strokeWidth="1" />
      {/* Checkmark circle */}
      <circle cx="94" cy="128" r="10" fill="#0D9488" fillOpacity="0.85" />
      <path d="M89 128 L93 132 L100 124" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Card text lines */}
      <rect x="110" y="122" width="82" height="7" rx="3.5" fill="#0D9488" fillOpacity="0.7" />
      <rect x="110" y="135" width="60" height="5" rx="2.5" fill="#0D9488" fillOpacity="0.35" />
      {/* Tag pill */}
      <rect x="86" y="154" width="50" height="16" rx="8" fill="#0D9488" fillOpacity="0.15" />
      <rect x="86" y="154" width="50" height="16" rx="8" stroke="#0D9488" strokeOpacity="0.3" strokeWidth="1" />
      <rect x="94" y="159" width="34" height="5" rx="2.5" fill="#0D9488" fillOpacity="0.5" />
      {/* Vote count */}
      <rect x="148" y="154" width="46" height="16" rx="8" fill="#0D9488" fillOpacity="0.12" />
      <rect x="156" y="159" width="30" height="5" rx="2.5" fill="#0D9488" fillOpacity="0.4" />

      {/* Sparkle dots */}
      <circle cx="248" cy="108" r="4" fill="white" fillOpacity="0.5" />
      <circle cx="262" cy="130" r="2.5" fill="white" fillOpacity="0.35" />
      <circle cx="16" cy="148" r="3" fill="white" fillOpacity="0.35" />
      <circle cx="36" cy="168" r="2" fill="white" fillOpacity="0.25" />
    </svg>
  );
}

// ─── Slide content definitions ────────────────────────────────────────────────

interface SlideProps {
  active: boolean;
}

function Slide0({ active }: SlideProps) {
  const { t } = useTranslation();
  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center px-10 text-center transition-opacity duration-700 ${active ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      <FeedbackIllustration />
      <h2 className="mt-8 text-3xl font-bold text-white leading-tight">
        {t('auth.panel.slide0.tagline')}
      </h2>
      <p className="mt-3 text-base text-white/75 leading-relaxed">
        {t('auth.panel.slide0.subtitle')}
      </p>
    </div>
  );
}

const featureIcons = [Zap, CheckCircle, LayoutDashboard, Puzzle];

function Slide1({ active }: SlideProps) {
  const { t } = useTranslation();
  const features = [
    t('auth.panel.slide1.feature0'),
    t('auth.panel.slide1.feature1'),
    t('auth.panel.slide1.feature2'),
    t('auth.panel.slide1.feature3'),
  ];

  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center px-10 transition-opacity duration-700 ${active ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      <h2 className="text-2xl font-bold text-white text-center mb-8">
        {t('auth.panel.slide1.title')}
      </h2>
      <ul className="w-full space-y-4 max-w-xs">
        {features.map((feature, i) => {
          const Icon = featureIcons[i];
          return (
            <li key={i} className="flex items-center gap-4">
              <span className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm">
                <Icon className="w-4 h-4 text-white" />
              </span>
              <span className="text-white/90 text-sm font-medium">{feature}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Slide2({ active }: SlideProps) {
  const { t } = useTranslation();
  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center px-10 text-center transition-opacity duration-700 ${active ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      {/* Large decorative quote mark */}
      <span className="text-[7rem] leading-none font-serif text-white/20 select-none -mb-6">&ldquo;</span>
      <blockquote className="text-lg font-medium text-white leading-relaxed">
        {t('auth.panel.slide2.quote')}
      </blockquote>
      <p className="mt-6 text-sm text-white/60 font-medium">
        {t('auth.panel.slide2.author')}
      </p>
    </div>
  );
}

// ─── Main AuthPanel ───────────────────────────────────────────────────────────

export default function AuthPanel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDE_COUNT);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative flex flex-col h-full w-full overflow-hidden bg-gradient-to-br from-primary-400 via-primary-600 to-primary-800 dark:from-primary-600 dark:via-primary-800 dark:to-primary-950">
      {/* Decorative blurred blobs */}
      <div className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 right-0 w-64 h-64 rounded-full bg-black/10 blur-3xl" />

      {/* Logo */}
      <div className="relative z-10 px-10 pt-10">
        <Link to="/" className="text-2xl font-bold text-white tracking-tight hover:opacity-80 transition-opacity">Upvote</Link>
      </div>

      {/* Slides */}
      <div className="relative flex-1 z-10">
        <Slide0 active={current === 0} />
        <Slide1 active={current === 1} />
        <Slide2 active={current === 2} />
      </div>

      {/* Dot indicators */}
      <div className="relative z-10 flex items-center justify-center gap-2 pb-10">
        {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrent(i)}
            aria-label={`Slide ${i + 1}`}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? 'w-6 h-2 bg-white'
                : 'w-2 h-2 bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
