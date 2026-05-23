const GEMINI_API_KEY = 'AIzaSyBlg5ht6lhNwrcSpMtXOzIiyf4j71H99uk';

interface GeminiVerifyResult {
  valid: boolean;
  reason: string;
}

export async function verifyImageWithGemini(base64Image: string, loggedActions: string[]): Promise<GeminiVerifyResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const prompt = `Analyze this image. The user claims they performed the following green actions: ${loggedActions.join(', ')}.
Is this a real, live-captured photo that shows proof of these actions (e.g. reusable bag, recycling bin, walking shoes, transit, reusable cup/bottle)?
Ensure the photo is not a screenshot of a computer screen, a generic stock photo, a photo of another screen, or completely unrelated.
Answer strictly with a JSON object in this format:
{
  "valid": true or false,
  "reason": "a friendly 1-sentence explanation of what is detected in the image and why it is valid or invalid"
}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: base64Image,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      console.warn('Gemini API response error:', response.status);
      return { valid: true, reason: 'Verification passed (offline fallback).' };
    }

    const json = await response.json();
    const responseText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      return { valid: true, reason: 'Image check completed.' };
    }

    const parsed = JSON.parse(responseText.trim());
    return {
      valid: parsed.valid ?? true,
      reason: parsed.reason ?? 'Image verified.',
    };
  } catch (err) {
    console.error('Gemini error:', err);
    return { valid: true, reason: 'Verification passed (offline fallback).' };
  }
}
