import type { ChatMessage } from '@/lib/openrouter/client';

// Keywords that indicate the user wants image generation (Bulgarian + English, Cyrillic + Latin)
const IMAGE_KEYWORDS = [
  // English
  'image',
  'picture',
  'photo',
  'draw',
  'drawing',
  'paint',
  'painting',
  'illustration',
  'artwork',
  'generate',
  'visualize',
  'show me',
  'create a',
  // Bulgarian Cyrillic
  'снимка',
  'снимки',
  'образ',
  'изображение',
  'картина',
  'рисунка',
  'рисувай',
  'нарисувай',
  'нарисуй',
  'генери',
  'генерирай',
  'покажи',
  'илюстрация',
  // Bulgarian/Macedonian Latin transliteration (users often type without Cyrillic)
  'snimka',
  'snimki',
  'kartina',
  'risunka',
  'risuvaj',
  'narisuvaj',
  'narisuj',
  'generiraj',
  'generaj',
  'generira',
  'pokaji',
  'izobrazhenie',
  'ilustracia',
  'slikaj',
  'slika',
];

export function detectImageIntent(messages: ChatMessage[]): boolean {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  if (!lastUser) return false;
  const lower = lastUser.content.toLowerCase();
  return IMAGE_KEYWORDS.some((kw) => lower.includes(kw));
}
