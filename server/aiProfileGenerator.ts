import OpenAI from 'openai';

interface AIProfileResult {
  artistName: string;
  musicStyle: string;
  profileImage: string; // base64
}

export class AIProfileGenerator {
  private client: OpenAI;

  constructor() {
    const apiKey = process.env.OPENROUTER_API_KEY || '';
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is not set');
    }

    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: apiKey,
      defaultHeaders: {
        'HTTP-Referer': 'https://hitster-ai.replit.app',
        'X-Title': 'HITSTER AI'
      }
    });
  }

  async generateProfile(name: string, photoBase64: string): Promise<AIProfileResult> {
    console.log(`AI Profile: Generating profile for ${name}`);

    // Step 1: Analyze the person and determine music style + artist name
    const analysisResponse = await this.client.chat.completions.create({
      model: 'google/gemini-2.5-pro',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analysera personen på bilden och deras namn "${name}".

Baserat på deras utseende, stil, ålder, och namn - bestäm:
1. Vilken musikstil som passar dem bäst (t.ex. "Rock", "Pop", "Hip-Hop", "Jazz", "Elektronisk", "Klassisk", etc.)
2. Ett kreativt artistnamn som passar deras vibe och musikstil

Svara ENDAST med JSON i detta format:
{
  "musicStyle": "musikstil här",
  "artistName": "artistnamn här",
  "reasoning": "kort förklaring på svenska"
}`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${photoBase64}`
              }
            }
          ]
        }
      ],
      temperature: 0.8
    });

    const analysisText = analysisResponse.choices[0]?.message?.content || '{}';
    console.log('AI Analysis:', analysisText);

    let analysis: { musicStyle: string; artistName: string; reasoning?: string };
    try {
      // Remove markdown code blocks if present
      const cleanedText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleanedText);
    } catch (error) {
      console.error('Failed to parse analysis:', analysisText);
      // Fallback
      analysis = {
        musicStyle: 'Pop',
        artistName: `DJ ${name}`,
        reasoning: 'Default fallback'
      };
    }

    console.log(`AI Profile: Determined style="${analysis.musicStyle}", artist="${analysis.artistName}"`);

    // Step 2: Generate Pixar-style avatar based on photo and music style
    const imagePrompt = `Skapa en Pixar-stil avatar baserat på personen på bilden.
Stil: ${analysis.musicStyle} musik artist
Känsla: Färgglad, vänlig, karaktäristisk Pixar-animation
Detaljer: Behåll personens grundläggande drag men gör det i typisk Pixar-stil med stora ögon, uttrycksfull, och musikaliska element som passar ${analysis.musicStyle}-stilen.
Bakgrund: Enkel gradient eller enfärgad bakgrund.`;

    console.log('AI Profile: Generating Pixar-style image...');

    const imageResponse = await this.client.chat.completions.create({
      model: 'google/gemini-2.5-flash-image',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Generate an image: ${imagePrompt}`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${photoBase64}`
              }
            }
          ]
        }
      ],
    });

    // Extract image from response
    let generatedImageBase64: string | null = null;

    const message = imageResponse.choices[0]?.message;
    if (message) {
      // Check if there are images in the message
      if ((message as any).images && Array.isArray((message as any).images)) {
        for (const imageData of (message as any).images) {
          if (imageData.type === "image_url" && imageData.image_url?.url?.startsWith("data:image")) {
            const dataUrl = imageData.image_url.url;
            // Extract base64 data from data URL (format: data:image/png;base64,<base64_data>)
            generatedImageBase64 = dataUrl.split(',', 1)[1];
            break;
          }
        }
      }
    }

    if (!generatedImageBase64) {
      throw new Error('Failed to generate profile image');
    }

    console.log('AI Profile: Image generated successfully');

    return {
      artistName: analysis.artistName,
      musicStyle: analysis.musicStyle,
      profileImage: generatedImageBase64
    };
  }
}

export const aiProfileGenerator = new AIProfileGenerator();
