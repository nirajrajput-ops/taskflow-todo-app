/// <reference types="vite/client" />

interface Pendo {
  trackAgent: (eventType: string, metadata: object) => void;
}

declare var pendo: Pendo;
