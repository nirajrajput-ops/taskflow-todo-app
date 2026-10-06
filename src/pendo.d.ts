interface PendoMetadata {
  id: string;
  [key: string]: string | number | boolean | string[];
}

interface PendoIdentity {
  visitor: PendoMetadata;
  account?: PendoMetadata;
}

declare const pendo: {
  initialize: (options: PendoIdentity) => void;
  identify: (identity: PendoIdentity) => void;
  clearSession: () => void;
  track: (eventName: string, properties?: Record<string, string | number | boolean>) => void;
};
