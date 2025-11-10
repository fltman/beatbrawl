import type { Song } from '../shared/types';

interface DJMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class ElevenLabsService {
  private apiKey: string;
  private voiceId = '38yEkwjgqOwvn7qykcx3'; // Custom voice
  private openRouterKey: string;
  private messageHistory: Map<string, DJMessage[]> = new Map();

  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY || '';
    this.openRouterKey = process.env.OPENROUTER_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('ELEVENLABS_API_KEY is not set - DJ voice will be disabled');
    }
    if (!this.openRouterKey) {
      console.warn('OPENROUTER_API_KEY is not set - DJ commentary will use templates');
    }
  }

  private async generateDJScriptWithLLM(
    song: Song, 
    isGameFinished: boolean, 
    winnerName?: string,
    gameId?: string,
    musicContext?: string
  ): Promise<string> {
    if (!this.openRouterKey) {
      return this.generateFallbackScript(song, isGameFinished, winnerName);
    }

    // Get or initialize message history for this game
    if (gameId && !this.messageHistory.has(gameId)) {
      this.messageHistory.set(gameId, []);
    }

    const history = gameId ? this.messageHistory.get(gameId)! : [];
    
    // Always refresh the system prompt at the start to keep context strong
    const systemPrompt = `You are an energetic radio DJ commentating on a music game where players guess the years of songs.${musicContext ? `\n\nMusic theme for this session: ${musicContext}` : ''} 
        
Your job is to:
- Comment on the song that just played in an enthusiastic and fun way
- Mention interesting facts about the song, artist, movie (if it's a film soundtrack) or the year
- Keep the energy high and create a festive atmosphere
- Speak naturally and casually
- Adapt your comments to the music theme when relevant
- When a song has film context: ALWAYS mention the movie in your comment!

Rules:
- Keep comments short: 2-3 sentences max (20-30 words total)
- Be VERY brief and concise
- Never longer than 40 words
- Use casual language
- Skip phrases like "Hey there!" or "Welcome" - go straight to the song
- Vary your style between rounds - be creative!`;

    // Replace the first system message every round to keep context fresh
    if (history.length > 0 && history[0].role === 'system') {
      history[0] = { role: 'system', content: systemPrompt };
    } else {
      history.unshift({ role: 'system', content: systemPrompt });
    }

    // Build song info with all available context
    let songInfo = `"${song.title}" by ${song.artist}`;
    if (song.movie) {
      songInfo += ` from the movie "${song.movie}"`;
    }
    songInfo += ` (${song.year})`;

    let userPrompt: string;
    if (isGameFinished && winnerName) {
      userPrompt = `The last song was ${songInfo}. ${winnerName} has won the game with 10 points! Congratulate the winner briefly and end the game in a festive way. Max 30 words.`;
    } else {
      // Build the prompt with trivia context if available
      let promptParts = [`Comment on the song: ${songInfo}.`];

      if (song.trivia) {
        promptParts.push(`Background facts (use creatively): ${song.trivia}`);
      }

      if (song.movie) {
        promptParts.push(`IMPORTANT: Mention the movie "${song.movie}" in your comment!`);
      }

      promptParts.push('Max 25 words.');
      userPrompt = promptParts.join(' ');
    }

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openRouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://hitster-ai.replit.app',
          'X-Title': 'HITSTER AI'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-sonnet-4.5',
          messages: [...history, { role: 'user', content: userPrompt }],
          max_tokens: 150,
          temperature: 0.8
        })
      });

      if (!response.ok) {
        console.error('OpenRouter API error:', response.status);
        return this.generateFallbackScript(song, isGameFinished, winnerName);
      }

      const data = await response.json();
      const script = data.choices[0]?.message?.content || this.generateFallbackScript(song, isGameFinished, winnerName);

      // Update message history
      if (gameId) {
        history.push({ role: 'user', content: userPrompt });
        history.push({ role: 'assistant', content: script });
        
        // Keep only last 6 rounds to keep context focused and LLM memory sharp
        if (history.length > 13) { // system + 6 rounds * 2 = 13
          this.messageHistory.set(gameId, [history[0], ...history.slice(-12)]);
        }
      }

      return script;
    } catch (error) {
      console.error('Error generating DJ script with LLM:', error);
      return this.generateFallbackScript(song, isGameFinished, winnerName);
    }
  }

  private generateFallbackScript(song: Song, isGameFinished: boolean, winnerName?: string): string {
    if (isGameFinished && winnerName) {
      return `Och där har vi det! "${song.title}" från ${song.year}! Grattis ${winnerName} som vann med 10 poäng! Vilken spelomgång!`;
    }
    
    const templates = [
      `"${song.title}" av ${song.artist} från ${song.year}! Vilken hit!`,
      `${song.artist}s "${song.title}", ${song.year}. Klassiker!`,
      `Det var "${song.title}" från ${song.year}. Nästa!`
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  clearHistory(gameId: string) {
    this.messageHistory.delete(gameId);
  }

  async generateDJCommentary(
    song: Song, 
    isGameFinished: boolean = false, 
    winnerName?: string,
    gameId?: string,
    musicContext?: string
  ): Promise<Buffer | null> {
    if (!this.apiKey) {
      console.log('ElevenLabs: API key not set, skipping DJ commentary');
      return null;
    }

    const script = await this.generateDJScriptWithLLM(song, isGameFinished, winnerName, gameId, musicContext);
    console.log(`ElevenLabs: Generating DJ commentary: "${script}"`);

    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey
        },
        body: JSON.stringify({
          text: script,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ElevenLabs: API error:', response.status, errorText);
        return null;
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      console.log(`ElevenLabs: Generated ${buffer.length} bytes of audio`);
      return buffer;

    } catch (error: any) {
      console.error('ElevenLabs: Error generating commentary:', error.message || error);
      return null;
    }
  }
}

export const elevenLabsService = new ElevenLabsService();
