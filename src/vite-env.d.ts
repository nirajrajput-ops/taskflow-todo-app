/// <reference types="vite/client" />

interface PendoAgent {
  track(eventName: string, properties?: Record<string, unknown>): void;
}

declare var pendo: PendoAgent | undefined;
