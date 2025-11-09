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
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-orange-500 mb-6 shadow-xl animate-pulse">
          <Sparkles className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-5xl font-black text-white drop-shadow-lg mb-3">✨ AI Spelledare</h2>
        <p className="text-white/80 text-2xl font-bold">Berätta vilken musik ni vill ha</p>
      </div>

      <div className="flex-1 overflow-auto mb-8 space-y-5">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-6 rounded-3xl shadow-xl ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-orange-500 to-yellow-500 text-white border-2 border-orange-400/40'
                  : 'bg-gradient-to-br from-red-500/40 to-orange-500/40 backdrop-blur-md text-white border-2 border-red-400/30'
              }`}
              data-testid={`message-${msg.role}-${idx}`}
            >
              <p className="text-xl font-semibold">{msg.content}</p>
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex justify-start">
            <div className="max-w-[85%] p-6 rounded-3xl bg-gradient-to-br from-red-500/40 to-orange-500/40 backdrop-blur-md border-2 border-red-400/30 shadow-xl">
              <Loader2 className="w-6 h-6 animate-spin text-white" />
            </div>
          </div>
        )}
      </div>

      <Card className="p-6 bg-gradient-to-br from-black/60 to-red-900/40 backdrop-blur-lg border-2 border-red-500/30 shadow-2xl">
        <div className="flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="T.ex. '80-tals rock' eller 'svensk pop'"
            className="text-xl py-6 bg-white/90 border-2 border-white/50 font-semibold"
            data-testid="input-music-preference"
          />
          <Button
            size="lg"
            onClick={handleSend}
            disabled={isThinking}
            className="px-8 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 text-white border-2 border-red-400/40 shadow-xl"
            data-testid="button-send"
          >
            {isThinking ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Send className="w-6 h-6" />
            )}
          </Button>
        </div>
        <div className="mt-5">
          <Button
            size="lg"
            className="w-full text-xl py-7 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 text-white font-black shadow-2xl transform hover:scale-105 transition-all border-2 border-orange-400/40"
            onClick={() => {
              setIsConfirming(true);
              // Pass preference and pre-generated songs + start year range
              const dataToSend = generatedSongs.length > 0
                ? JSON.stringify({
                    preference: lastPreference,
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
                <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                🎵 Söker låtar...
              </>
            ) : (
              '✓ Bekräfta & Fortsätt'
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
