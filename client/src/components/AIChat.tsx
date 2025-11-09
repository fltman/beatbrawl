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
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-400 border-4 border-white mb-5 shadow-xl">
          <Sparkles className="w-10 h-10 text-black" />
        </div>
        <h2 className="text-4xl font-black text-white mb-2">AI Spelledare</h2>
        <p className="text-white/80 text-xl font-bold">Berätta vilken musik ni vill ha</p>
      </div>

      <div className="flex-1 overflow-auto mb-8 space-y-5">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-5 rounded-2xl shadow-xl ${
                msg.role === 'user'
                  ? 'bg-yellow-400 text-black border-3 border-white'
                  : 'bg-black text-white border-3 border-white'
              }`}
              data-testid={`message-${msg.role}-${idx}`}
            >
              <p className="text-lg font-medium">{msg.content}</p>
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex justify-start">
            <div className="max-w-[85%] p-5 rounded-2xl bg-black border-3 border-white shadow-xl">
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            </div>
          </div>
        )}
      </div>

      <Card className="p-5 bg-black border-4 border-white shadow-2xl">
        <div className="flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="T.ex. '80-tals rock' eller 'svensk pop'"
            className="text-lg py-6 bg-white border-2 border-white/50 font-medium"
            data-testid="input-music-preference"
          />
          <Button
            size="lg"
            onClick={handleSend}
            disabled={isThinking}
            className="px-7 bg-yellow-400 hover:bg-yellow-300 text-black font-black border-3 border-white shadow-xl"
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
            className="w-full text-xl py-7 bg-yellow-400 hover:bg-yellow-300 text-black font-black shadow-xl border-3 border-white"
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
