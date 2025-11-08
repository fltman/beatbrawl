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
    gameId?: string
  ): Promise<string> {
    if (!this.openRouterKey) {
      return this.generateFallbackScript(song, isGameFinished, winnerName);
    }

    // Get or initialize message history for this game
    if (gameId && !this.messageHistory.has(gameId)) {
      this.messageHistory.set(gameId, [{
        role: 'system',
        content: `Du är en energisk svensk radio-DJ som kommenterar ett musikspel där spelare gissar årtal på låtar. 
        
Ditt jobb är att:
- Kommentera låten som just spelades på ett entusiastiskt och roligt sätt
- Nämn intressanta fakta om låten, artisten eller årtalet
- Hålla energin uppe och skapa en festlig stämning
- Tala svenska naturligt och vardagligt

Regler:
- Håll kommentarerna korta: 2-3 meningar max (20-30 ord totalt)
- Var MYCKET kortfattad och koncis
- Aldrig längre än 40 ord
- Använd vardagligt svenskt språk
- Skippa fraser som "Hej där!" eller "Välkomna" - gå direkt på låten
- Variera din stil mellan rundor - var kreativ!`
      }]);
    }

    const history = gameId ? this.messageHistory.get(gameId)! : [];

    let userPrompt: string;
    if (isGameFinished && winnerName) {
      userPrompt = `Sista låten var "${song.title}" av ${song.artist} (${song.year}). ${winnerName} har vunnit spelet med 10 poäng! Grattulera vinnaren kort och avsluta spelet på ett festligt sätt. Max 30 ord.`;
    } else {
      userPrompt = `Kommentera låten: "${song.title}" av ${song.artist} (${song.year}). Max 25 ord.`;
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
          model: 'anthropic/claude-sonnet-4-20250514',
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
        
        // Keep only last 10 messages (5 rounds) to avoid too long context
        if (history.length > 21) { // system + 10 rounds * 2
          this.messageHistory.set(gameId, [history[0], ...history.slice(-20)]);
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
    gameId?: string
  ): Promise<Buffer | null> {
    if (!this.apiKey) {
      console.log('ElevenLabs: API key not set, skipping DJ commentary');
      return null;
    }

    const script = await this.generateDJScriptWithLLM(song, isGameFinished, winnerName, gameId);
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
