import 'server-only';

import { DEFAULT_IMAGE_MODEL } from '@/features/characters/data/models';
import { uploadImageToStorage } from '@/lib/supabase/storage';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

type FluxResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type: string; image_url?: { url: string } }> | null;
      images?: Array<{ type: string; image_url?: { url: string } }>;
    };
  }>;
};

export async function generateImage(prompt: string, userId: string): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://savage-ai.vercel.app',
        'X-Title': 'SavageAI',
      },
      body: JSON.stringify({
        model: DEFAULT_IMAGE_MODEL,
        messages: [{ role: 'user', content: prompt }],
        modalities: ['image'],
      }),
    });

    if (!response.ok) {
      console.error(
        '[generateImage] HTTP error:',
        response.status,
        await response.text().catch(() => '')
      );
      return null;
    }

    const data = (await response.json()) as FluxResponse;
    const choice = data.choices?.[0];
    const messageContent = choice?.message?.content;
    const messageImages = choice?.message?.images;

    // Extract image — FLUX returns data in choice.message.images (not .content)
    // Fallback: content as string or content array with image_url parts
    let imageData: string | null = null;

    if (Array.isArray(messageImages) && messageImages.length > 0) {
      imageData = messageImages[0]?.image_url?.url ?? null;
    } else if (typeof messageContent === 'string') {
      imageData = messageContent.trim();
    } else if (Array.isArray(messageContent)) {
      const part = messageContent.find((p) => p.type === 'image_url' && p.image_url?.url);
      if (part?.image_url?.url) imageData = part.image_url.url;
    }

    if (!imageData) {
      console.error('[generateImage] No image data found in response');
      return null;
    }

    console.log('[generateImage] imageData prefix:', imageData.slice(0, 60));

    if (imageData.startsWith('data:image/')) {
      try {
        const publicUrl = await uploadImageToStorage(imageData, userId);
        console.log('[generateImage] Uploaded base64 to Supabase:', publicUrl);
        return publicUrl;
      } catch (uploadErr) {
        console.error(
          '[generateImage] Upload failed:',
          uploadErr instanceof Error ? uploadErr.message : uploadErr
        );
        return null;
      }
    }

    if (imageData.startsWith('http')) {
      console.log('[generateImage] Using direct URL:', imageData);
      return imageData;
    }

    return null;
  } catch (err) {
    console.error('[generateImage] Error:', err instanceof Error ? err.message : err);
    return null;
  }
}
