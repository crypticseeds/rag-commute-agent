
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}
