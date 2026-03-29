/// <reference types="vite/client" />

interface PendoTrack {
  track(eventName: string, properties?: Record<string, unknown>): void;
}

declare const pendo: PendoTrack;
