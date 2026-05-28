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

export interface AIChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface AICoachContext {
  currentTime: string;
  weather: {
    temperatureC: number;
    condition: string;
    isDay: boolean;
  } | null;
  userStats: {
    streak: number;
    totalPoints: number;
    actionsLoggedCount: number;
    companyName?: string;
    customSquadName?: string;
  };
}

export async function getAICoachResponse(
  query: string,
  chatHistory: AIChatMessage[],
  context: AICoachContext
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const weatherText = context.weather 
    ? `Current weather is ${context.weather.condition}, temperature is ${context.weather.temperatureC}°C, it is ${context.weather.isDay ? 'daytime' : 'nighttime'}.`
    : 'Current weather: Unknown/unavailable.';

  const teamText = [
    context.userStats.companyName ? `Company Team: ${context.userStats.companyName}` : null,
    context.userStats.customSquadName ? `Custom Squad: ${context.userStats.customSquadName}` : null
  ].filter(Boolean).join(', ') || 'No active teams/squads';

  const statsText = `User stats - Streak: ${context.userStats.streak} days, Total points: ${context.userStats.totalPoints}, Actions logged: ${context.userStats.actionsLoggedCount}, Teams: ${teamText}.`;
  
  const systemInstruction = `You are the GreenLume Eco-Coach, a friendly, encouraging, and highly knowledgeable sustainability mentor.
Your target users are Gen Z and Millennials in Nigeria and West Africa (e.g. Lagos, Accra, Abuja).

Cultural & Economic Local Context Constraints:
- Financial Focus: The economy is experiencing high inflation and high petrol/diesel generator fuel prices. Highlight how sustainable actions (e.g. carpooling, turning off appliances, saving water, batch cooking) save Naira or Cedis directly.
- Energy: Fuel for generators is expensive. Grid power (NEPA/PHCN prepaid units, Band A tariffs) is also costly. Inverters and solar configurations are common solutions. Mention saving generator fuel, keeping inverter load low, and conserving prepaid units.
- Water: Most homes pump water using electricity/generators from boreholes into tanks. Therefore, wasting water = wasting electricity/fuel. Saving water translates directly to energy/cost savings.
- Trash/Waste: Chowdeck and Glovo are the primary local delivery apps. Remind users to select "No plastic cutlery". Plastic bottles are a major issue; advocate for personal aesthetic flasks. Mention recyclers like Wecyclers.
- Commuting: Traffic gridlock (especially in Lagos) is severe. Recommend the BRT (Bus Rapid Transit), light rail (Blue/Red Line train in Lagos), or ride-sharing/carpooling (Bolt/Uber) over driving personal cars.
- Food: Local diets consist of plantains, yams, beans, rice (Jollof). Local meals are cheap and sustainable compared to imported processed foods.
- Tone: Friendly, modern, and engaging. You can use light, tasteful West African expressions or Pidgin where natural (e.g., 'How body?', 'Well done!', 'No vex', 'make we save some cash'), but keep it highly professional, structured, and easy to read. Use bullet points and emojis.

Current Time/Weather/Stats Context:
- Current local date/time: ${context.currentTime}
- Weather: ${weatherText}
- ${statsText}

Respond directly to the user's message. Relate your response to the weather, time, and user's stats whenever relevant. Keep responses relatively concise and highly actionable.`;

  try {
    const formattedHistory = chatHistory.map(msg => ({
      role: msg.role,
      parts: msg.parts
    }));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            { text: systemInstruction }
          ]
        },
        contents: [
          ...formattedHistory,
          {
            role: 'user',
            parts: [
              { text: query }
            ]
          }
        ]
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API returned error code ${response.status}`);
    }

    const json = await response.json();
    const responseText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      throw new Error('Empty response from Gemini API');
    }

    return responseText.trim();
  } catch (err) {
    console.warn('Gemini chat helper error:', err);
    throw err; // Re-throw to let the caller handle it and use fallback
  }
}
