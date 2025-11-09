import OpenAI from 'openai';
import { SongSuggestion } from '../shared/types';

interface AIResponse {
  songs: SongSuggestion[];
  startYearRange?: {
    min: number;
    max: number;
  };
}

export class AIService {
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

  async generateSongSuggestions(userPreference: string): Promise<{ songs: SongSuggestion[]; startYearRange: { min: number; max: number } }> {
    console.log(`AI: Generating song suggestions for "${userPreference}"`);

    const prompt = `You are a music expert. Based on the user's music preference, suggest 20 popular, well-known songs that match their taste.

User preference: "${userPreference}"

Requirements:
- Choose popular songs from 1950-2024
- Include a mix of classic hits and recognizable tracks
- Ensure variety in years within the genre/style
- Also determine an appropriate year range for player start years based on the music preference (e.g., if they want "80s music", suggest 1980-1989)
- Format your response as valid JSON only, no markdown or explanations

Return JSON in this exact format:
{
  "songs": [
    {"title": "Song Name", "artist": "Artist Name", "year": 1985},
    ...
  ],
  "startYearRange": {"min": 1980, "max": 1989}
}`;

    try {
      console.log('AI: Calling OpenRouter API with Claude Sonnet 4.5...');
      
      const completion = await this.client.chat.completions.create({
        model: 'anthropic/claude-sonnet-4.5',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const content = completion.choices[0]?.message?.content;

      if (!content) {
        console.error('AI: No content in response');
        throw new Error('No content in AI response');
      }

      console.log('AI raw response (first 300 chars):', content.substring(0, 300));

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('AI: Could not extract JSON from response');
        throw new Error('Could not extract JSON from AI response');
      }

      const parsed: AIResponse = JSON.parse(jsonMatch[0]);
      
      if (!parsed.songs || !Array.isArray(parsed.songs)) {
        console.error('AI: Invalid response format');
        throw new Error('Invalid AI response format');
      }

      const validSongs = parsed.songs
        .filter(s => s.title && s.artist && s.year >= 1950 && s.year <= 2024)
        .slice(0, 20);

      const startYearRange = parsed.startYearRange || { min: 1950, max: 2020 };

      console.log(`AI: Generated ${validSongs.length} song suggestions`);
      console.log(`AI: Suggested start year range: ${startYearRange.min}-${startYearRange.max}`);
      
      return { songs: validSongs, startYearRange };

    } catch (error: any) {
      console.error('AI service error:', error.message || error);
      throw new Error('Failed to generate song suggestions');
    }
  }
}

export const aiService = new AIService();
