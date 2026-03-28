/**
 * Minimal ambient types for Google Identity Services (GIS).
 * https://developers.google.com/identity/gsi/web/reference/js-reference
 */
interface Window {
  google?: {
    accounts: {
      id: {
        initialize: (config: {
          client_id: string;
          callback: (response: { credential: string }) => void;
          use_fedcm_for_prompt?: boolean;
        }) => void;
        prompt: () => void;
        renderButton: (
          element: HTMLElement,
          options: {
            theme?: 'outline' | 'filled_blue' | 'filled_black';
            size?: 'large' | 'medium' | 'small';
            width?: number;
            text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
            shape?: 'rectangular' | 'pill' | 'circle' | 'square';
          },
        ) => void;
      };
    };
  };
}
