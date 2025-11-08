interface SongSuggestion {
  title: string;
  artist: string;
  year: number;
}

interface AIResponse {
  songs: SongSuggestion[];
}

export class AIService {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY is not set');
    }
  }

  async generateSongSuggestions(userPreference: string): Promise<SongSuggestion[]> {
    console.log(`AI: Generating song suggestions for "${userPreference}"`);

    const prompt = `You are a music expert. Based on the user's music preference, suggest 20 popular, well-known songs that match their taste.

User preference: "${userPreference}"

Requirements:
- Choose popular songs from 1950-2024
- Include a mix of classic hits and recognizable tracks
- Ensure variety in years within the genre/style
- Format your response as valid JSON only, no markdown or explanations

Return JSON in this exact format:
{
  "songs": [
    {"title": "Song Name", "artist": "Artist Name", "year": 1985},
    ...
  ]
}`;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://hitster-ai.replit.app',
          'X-Title': 'HITSTER AI'
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.1-8b-instruct:free',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API error:', response.status, errorText);
        throw new Error(`OpenRouter API returned ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content in AI response');
      }

      console.log('AI raw response:', content);

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not extract JSON from AI response');
      }

      const parsed: AIResponse = JSON.parse(jsonMatch[0]);
      
      if (!parsed.songs || !Array.isArray(parsed.songs)) {
        throw new Error('Invalid AI response format');
      }

      const validSongs = parsed.songs
        .filter(s => s.title && s.artist && s.year >= 1950 && s.year <= 2024)
        .slice(0, 20);

      console.log(`AI: Generated ${validSongs.length} song suggestions`);
      return validSongs;

    } catch (error) {
      console.error('AI service error:', error);
      throw new Error('Failed to generate song suggestions');
    }
  }
}

export const aiService = new AIService();
