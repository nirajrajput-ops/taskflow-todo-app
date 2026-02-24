/// <reference types="vite/client" />

declare const pendo: {
  track: (eventName: string, properties?: Record<string, unknown>) => void;
};
