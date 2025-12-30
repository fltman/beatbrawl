import OpenAI from 'openai';
import { SongSuggestion } from '../shared/types';

interface AIResponse {
  songs: SongSuggestion[];
  startYearRange?: {
    min: number;
    max: number;
  };
}

interface SpotifySearchQuery {
  query: string;
  yearMin?: number;
  yearMax?: number;
}

interface SearchQueriesResponse {
  queries: SpotifySearchQuery[];
  startYearRange: {
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

    const prompt = `You are a music expert. Based on the user's music preference, suggest 25 popular, well-known songs that match their taste.

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
        temperature: 1.0,
        max_tokens: 3000
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
        .slice(0, 25);

      const startYearRange = parsed.startYearRange || { min: 1950, max: 2020 };

      console.log(`AI: Generated ${validSongs.length} song suggestions`);
      console.log(`AI: Suggested start year range: ${startYearRange.min}-${startYearRange.max}`);
      
      return { songs: validSongs, startYearRange };

    } catch (error: any) {
      console.error('AI service error:', error.message || error);
      throw new Error('Failed to generate song suggestions');
    }
  }

  async generateSpotifySearchQueries(userPreference: string): Promise<SearchQueriesResponse> {
    console.log(`AI: Generating Spotify search queries for "${userPreference}"`);

    const prompt = `You are a music expert helping to find songs on Spotify. Based on the user's music preference, create search queries that will find a diverse variety of songs.

User preference: "${userPreference}"

Your task:
1. Analyze what the user wants (genre, era, mood, artists, etc.)
2. Create 8-12 different Spotify search queries that will return varied results
3. Each query should target different aspects: specific artists, genres, decade combinations, moods
4. Include year ranges when the user mentions specific eras
5. Determine an appropriate year range for player start cards based on the preference

Query tips for variety:
- Mix specific artists with genre searches
- Use decade filters like "year:1980-1989"
- Combine genres with moods: "rock happy", "pop sad"
- Search for specific subgenres
- Include both popular and slightly obscure terms

Return JSON in this exact format (no markdown):
{
  "queries": [
    {"query": "genre:rock year:1980-1989", "yearMin": 1980, "yearMax": 1989},
    {"query": "Michael Jackson", "yearMin": 1979, "yearMax": 1991},
    {"query": "80s dance hits"},
    {"query": "genre:new-wave 1980s"},
    ...
  ],
  "startYearRange": {"min": 1980, "max": 1989}
}`;

    try {
      console.log('AI: Calling OpenRouter API for search queries...');

      const completion = await this.client.chat.completions.create({
        model: 'google/gemini-2.5-flash-preview',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.9,
        max_tokens: 1500
      });

      const content = completion.choices[0]?.message?.content;

      if (!content) {
        console.error('AI: No content in response');
        throw new Error('No content in AI response');
      }

      console.log('AI raw response (first 500 chars):', content.substring(0, 500));

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('AI: Could not extract JSON from response');
        throw new Error('Could not extract JSON from AI response');
      }

      const parsed: SearchQueriesResponse = JSON.parse(jsonMatch[0]);

      if (!parsed.queries || !Array.isArray(parsed.queries)) {
        console.error('AI: Invalid response format');
        throw new Error('Invalid AI response format');
      }

      const validQueries = parsed.queries
        .filter(q => q.query && q.query.trim().length > 0)
        .slice(0, 12);

      const startYearRange = parsed.startYearRange || { min: 1950, max: 2020 };

      console.log(`AI: Generated ${validQueries.length} search queries`);
      console.log(`AI: Queries:`, validQueries.map(q => q.query).join(', '));
      console.log(`AI: Start year range: ${startYearRange.min}-${startYearRange.max}`);

      return { queries: validQueries, startYearRange };

    } catch (error: any) {
      console.error('AI service error:', error.message || error);
      throw new Error('Failed to generate search queries');
    }
  }
}

export const aiService = new AIService();
export type { SpotifySearchQuery, SearchQueriesResponse };
