declare const pendo: {
  track: (eventName: string, properties?: Record<string, string | number | boolean>) => void;
  // Optional: older Pendo agents and install snippets do not define trackAgent
  trackAgent?: (
    eventType: 'prompt' | 'agent_response' | 'user_reaction',
    metadata: {
      agentId: string;
      conversationId: string;
      messageId: string;
      content: string;
      modelUsed?: string;
      suggestedPrompt?: boolean;
      toolsUsed?: string[];
      fileUploaded?: boolean;
    }
  ) => void;
};
