/// <reference types="vite/client" />

declare global {
  interface Window {
    pendo: {
      track: (eventName: string, properties?: Record<string, unknown>) => void;
    };
  }
}

declare const pendo: {
  track: (eventName: string, properties?: Record<string, unknown>) => void;
};
