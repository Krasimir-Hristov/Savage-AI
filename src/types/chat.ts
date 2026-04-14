export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model: string | null;
  image_url: string | null;
  created_at: string | null;
}

export interface Conversation {
  id: string;
  user_id: string;
  character_id: string;
  title: string | null;
  created_at: string | null;
  updated_at: string | null;
}
