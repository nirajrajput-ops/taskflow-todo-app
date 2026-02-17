/// <reference types="vite/client" />

declare const pendo: {
  initialize: (options: { visitor: Record<string, string | number | boolean> }) => void;
  track: (eventName: string, properties?: Record<string, string | number | boolean>) => void;
};
