/// <reference types="vite/client" />

declare var pendo: {
  track(eventName: string, properties?: Record<string, unknown>): void;
} | undefined;
