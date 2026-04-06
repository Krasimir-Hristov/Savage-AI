export interface Character {
  id: string;
  name: string;
  nameEn: string;
  personality: string;
  systemPrompt: string;
  avatar: string;
  modelPreference?: string;
}
