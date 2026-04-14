export interface Character {
  id: string;
  name: string;
  personality: string;
  systemPrompt: string;
  avatar: string;
  modelPreference?: string;
  elevenLabsAgentId?: string;
  ui: {
    emoji: string;
    colorClass: string;
    placeholder?: string;
  };
}
