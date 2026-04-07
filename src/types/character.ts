export interface Character {
  id: string;
  name: string;
  personality: string;
  systemPrompt: string;
  avatar: string;
  modelPreference?: string;
  ui: {
    emoji: string;
    colorClass: string;
    placeholder?: string;
  };
}
