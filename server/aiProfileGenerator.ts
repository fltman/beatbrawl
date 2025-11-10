import OpenAI from 'openai';
import { imageStorage } from './imageStorage';

interface AIProfileResult {
  artistName: string;
  musicStyle: string;
  profileImageUrl: string; // URL to the saved image
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
              text: `Analyze the person in the image and their name "${name}".

Based on their appearance, style, age, and name - determine:
1. Which music style suits them best (e.g. "Rock", "Hip-Hop", "Electronic", "R&B", "Reggae", "Punk", "Metal", etc.)
2. A COOL and EDGY artist name that matches their vibe and music style

IMPORTANT for the artist name:
- Make it COOL and STREET - think real artist names like Notorious B.I.G., Dr. Dre, The Weeknd, Billie Eilish
- Use cool prefixes: "Lil", "Big", "Young", "MC", "DJ", "The"
- Or use suffixes: "Beats", "Flow", "Wave", "Soul"
- Or create unique names with attitude that sound like real artist stage names
- AVOID: generic names like "DJ ${name}", being too formal or boring
- FOCUS: On creating something that sounds like a REAL artist name with edge and personality

Respond ONLY with JSON in this format:
{
  "musicStyle": "music style here",
  "artistName": "cool artist name here",
  "reasoning": "brief explanation in English"
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

    // Step 2: Generate GTA/Rockstar-style portrait based on photo and music style
    const imagePrompt = `Create a portrait in the iconic GTA (Grand Theft Auto) / Rockstar Games art style based on the person in the photo.
Style: ${analysis.musicStyle} music artist
Aesthetic: Bold comic book style with thick black outlines, cel-shaded look, vibrant saturated colors
Details: Strong angular features, dramatic shadows and highlights, thick contour lines around features. Maintain the person's key characteristics but stylize them in the signature GTA cover art style - think loading screen character portraits from GTA V.
Background: Solid bold color or simple gradient (no complex details)
Art direction: Comic book meets street art, bold and iconic, highly recognizable silhouette, professional game art quality.`;

    console.log('AI Profile: Generating GTA/Rockstar-style portrait...');

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
      modalities: ['image', 'text'] as any
    });

    // Extract image from response
    let generatedImageBase64: string | null = null;

    const message = imageResponse.choices[0]?.message;
    console.log('AI Profile: Image response structure:', JSON.stringify(message, null, 2).substring(0, 500));
    
    if (message) {
      // Check if there are images in the message
      if ((message as any).images && Array.isArray((message as any).images)) {
        console.log(`AI Profile: Found ${(message as any).images.length} images in response`);
        for (const imageData of (message as any).images) {
          console.log('AI Profile: Image data type:', imageData.type);
          if (imageData.type === "image_url" && imageData.image_url?.url?.startsWith("data:image")) {
            const dataUrl = imageData.image_url.url;
            // Extract base64 data from data URL (format: data:image/png;base64,<base64_data>)
            const parts = dataUrl.split(',');
            if (parts.length > 1) {
              generatedImageBase64 = parts[1];
              console.log('AI Profile: Successfully extracted base64 image data');
            }
            break;
          }
        }
      } else {
        console.log('AI Profile: No images array found in message. Message keys:', Object.keys(message));
      }
    }

    if (!generatedImageBase64) {
      console.error('AI Profile: Failed to extract image. Full response:', JSON.stringify(imageResponse, null, 2).substring(0, 1000));
      throw new Error('Failed to generate profile image');
    }

    console.log('AI Profile: Image generated successfully');

    // Save image to database and get image ID
    const imageId = await imageStorage.saveImage(generatedImageBase64, 'image/png');
    const imageUrl = `/api/profiles/images/${imageId}`;

    return {
      artistName: analysis.artistName,
      musicStyle: analysis.musicStyle,
      profileImageUrl: imageUrl
    };
  }
}

export const aiProfileGenerator = new AIProfileGenerator();
