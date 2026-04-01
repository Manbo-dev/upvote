import { useEffect, useState } from 'react';

interface Props {
  onCredential: (idToken: string, name?: string) => void;
}

const APPLE_SCRIPT_ID = 'apple-signin-script';
const APPLE_SCRIPT_SRC =
  'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';

/**
 * Renders an Apple Sign-In button using the Apple ID JS SDK.
 * Uses popup mode to avoid full-page redirects, consistent with Google GIS approach.
 * Only sends name on the first authorization — Apple does not include it on subsequent sign-ins.
 */
export default function AppleSignInButton({ onCredential }: Props) {
  const [loading, setLoading] = useState(false);
  const clientId = import.meta.env.VITE_APPLE_CLIENT_ID as string;

  const initApple = () => {
    window.AppleID?.auth.init({
      clientId,
      scope: 'name email',
      redirectURI: window.location.origin,
      usePopup: true,
    });
  };

  useEffect(() => {
    if (document.getElementById(APPLE_SCRIPT_ID)) {
      if (window.AppleID) initApple();
      return;
    }
    const script = document.createElement('script');
    script.id = APPLE_SCRIPT_ID;
    script.src = APPLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = initApple;
    document.head.appendChild(script);
  }, [clientId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClick = async () => {
    if (!window.AppleID) return;
    setLoading(true);
    try {
      const response = await window.AppleID.auth.signIn();
      const idToken = response.authorization.id_token;
      const firstName = response.user?.name?.firstName;
      const lastName = response.user?.name?.lastName;
      const name = [firstName, lastName].filter(Boolean).join(' ') || undefined;
      onCredential(idToken, name);
    } catch {
      // User dismissed the popup — not an error
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-50"
      aria-label="Continue with Apple"
    >
      <AppleIcon />
      <span>Continue with Apple</span>
    </button>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}
