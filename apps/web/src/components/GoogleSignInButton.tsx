import { useEffect, useRef } from 'react';

interface Props {
  onCredential: (idToken: string) => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
}

const GIS_SCRIPT_ID = 'google-gis-script';
const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const GIS_INIT_FLAG = 'google-gis-initialized';

/**
 * Renders Google's official sign-in button via Google Identity Services (GIS).
 * Loads the GIS script once and uses renderButton() for the official branded UI.
 */
export default function GoogleSignInButton({ onCredential, text = 'continue_with' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;

  useEffect(() => {
    const initGIS = () => {
      if (!containerRef.current || !clientId) return;
      // Only initialize once globally — multiple instances just render their buttons
      if (!document.getElementById(GIS_INIT_FLAG)) {
        const flag = document.createElement('meta');
        flag.id = GIS_INIT_FLAG;
        document.head.appendChild(flag);
        window.google?.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => onCredential(response.credential),
          use_fedcm_for_prompt: true,
        });
      }
      window.google?.accounts.id.renderButton(containerRef.current, {
        theme: 'outline',
        size: 'large',
        text,
        width: 368,
      });
    };

    if (document.getElementById(GIS_SCRIPT_ID)) {
      if (window.google) initGIS();
      return;
    }

    const script = document.createElement('script');
    script.id = GIS_SCRIPT_ID;
    script.src = GIS_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = initGIS;
    document.head.appendChild(script);
  }, [clientId, onCredential, text]);

  return <div ref={containerRef} className="flex justify-center" />;
}
