
export type Platform = 'Generic' | 'LinkedIn' | 'Facebook' | 'Reddit' | 'Twitter';

export interface Revision {
  id: string;
  content: string;
  timestamp: Date;
  platform: Platform;
}

export interface Suggestion {
  id: string;
  originalText: string;
  suggestedChange: string;
  reason: string;
}

export interface AttachedFile {
  name: string;
  type: string;
  content: string; // base64 encoded content
}
