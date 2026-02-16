interface TurnstileOptions {
  sitekey: string;
  callback: (token: string) => void;
  'error-callback'?: () => void;
  size?: 'invisible' | 'normal' | 'compact';
}

interface Turnstile {
  render: (container: string | HTMLElement, options: TurnstileOptions) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
}

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

export {};
