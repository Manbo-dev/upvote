/**
 * Minimal ambient types for Apple Sign In JS SDK.
 * https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_js
 */
interface Window {
  AppleID?: {
    auth: {
      init: (config: AppleSignInConfig) => void;
      signIn: () => Promise<AppleSignInResponse>;
    };
  };
}

interface AppleSignInConfig {
  clientId: string;
  scope: string;
  redirectURI: string;
  state?: string;
  nonce?: string;
  usePopup: boolean;
}

interface AppleSignInResponse {
  authorization: {
    code: string;
    id_token: string;
    state?: string;
  };
  user?: {
    // Only present on the FIRST authorization — Apple does not send this on subsequent sign-ins
    name?: { firstName?: string; lastName?: string };
    email?: string;
  };
}
