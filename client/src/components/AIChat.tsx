import { useState } from "react";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface Message {
  role: 'user' | 'ai';
  content: string;
}

interface Song {
  title: string;
  artist: string;
  year: number;
}

interface StartYearRange {
  min: number;
  max: number;
}

interface AIChatProps {
  onPreferencesConfirmed?: (preferences: string) => void;
}

export default function AIChat({ onPreferencesConfirmed }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: 'Hej! Jag är din AI-spelledare. Berätta vilken typ av musik ni vill spela med idag. Till exempel "80-tals rock" eller "svensk pop från 90-talet"!' }
  ]);
  const [input, setInput] = useState('');
  const [lastPreference, setLastPreference] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [generatedSongs, setGeneratedSongs] = useState<Song[]>([]);
  const [startYearRange, setStartYearRange] = useState<StartYearRange | null>(null);

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;
    
    const userInput = input.trim();
    const userMessage: Message = { role: 'user', content: userInput };
    setMessages(prev => [...prev, userMessage]);
    setLastPreference(userInput);
    setInput('');
    setIsThinking(true);
    
    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.role === 'ai' ? 'assistant' : 'user',
        content: msg.content
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userInput,
          conversationHistory
        })
      });

      if (!response.ok) {
        throw new Error('Chat request failed');
      }

      const data = await response.json();
      const aiMessage: Message = { 
        role: 'ai', 
        content: data.response
      };
      setMessages(prev => [...prev, aiMessage]);
      
      // Save songs if AI generated any
      if (data.songs && data.songs.length > 0) {
        setGeneratedSongs(data.songs);
        console.log(`AI generated ${data.songs.length} songs`);
      }
      
      // Save start year range if provided
      if (data.startYearRange) {
        setStartYearRange(data.startYearRange);
        console.log(`AI suggested start year range: ${data.startYearRange.min}-${data.startYearRange.max}`);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const fallbackMessage: Message = { 
        role: 'ai', 
        content: `Perfekt! Jag har förberett ${userInput} för er. Klicka på "Bekräfta & Fortsätt" för att börja!` 
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-3xl font-bold">AI Spelledare</h2>
        <p className="text-muted-foreground mt-2">Berätta vilken musik ni vill ha</p>
      </div>

      <div className="flex-1 overflow-auto mb-6 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-gradient-to-br from-accent to-accent/70'
              }`}
              data-testid={`message-${msg.role}-${idx}`}
            >
              <p className="text-lg">{msg.content}</p>
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex justify-start">
            <div className="max-w-[80%] p-4 rounded-2xl bg-gradient-to-br from-accent to-accent/70">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          </div>
        )}
      </div>

      <Card className="p-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="T.ex. '80-tals rock' eller 'svensk pop'"
            className="text-lg"
            data-testid="input-music-preference"
          />
          <Button 
            size="lg" 
            onClick={handleSend} 
            disabled={isThinking}
            data-testid="button-send"
          >
            {isThinking ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
        <div className="mt-4">
          <Button 
            size="lg" 
            className="w-full" 
            variant="secondary"
            onClick={() => {
              setIsConfirming(true);
              // Pass preference and pre-generated songs + start year range
              const dataToSend = generatedSongs.length > 0 
                ? JSON.stringify({ 
                    songs: generatedSongs,
                    startYearRange: startYearRange || { min: 1950, max: 2020 }
                  })
                : lastPreference;
              onPreferencesConfirmed?.(dataToSend);
            }}
            disabled={!lastPreference || isConfirming}
            data-testid="button-confirm-preferences"
          >
            {isConfirming ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Söker låtar...
              </>
            ) : (
              'Bekräfta & Fortsätt'
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
