import { useState, useEffect } from "react";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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

const loadingMessages = [
  "Finding immortal tracks!",
  "Feeling the vibe and digging through the records",
  "Mixing the perfect playlist",
  "Dropping beats from every decade",
  "Tracking down the classics",
  "Let AI choose the bangers"
];

export default function AIChat({ onPreferencesConfirmed }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: 'Hey! I\'m your AI game master. Tell me what kind of music you want to play with today. For example "80s rock" or "Swedish pop from the 90s"!' }
  ]);
  const [input, setInput] = useState('');
  const [lastPreference, setLastPreference] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [generatedSongs, setGeneratedSongs] = useState<Song[]>([]);
  const [startYearRange, setStartYearRange] = useState<StartYearRange | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  // Rotate loading messages
  useEffect(() => {
    if (isConfirming) {
      const interval = setInterval(() => {
        setLoadingMessageIndex(prev => (prev + 1) % loadingMessages.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isConfirming]);

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
        content: `Perfect! I've prepared ${userInput} for you. Click "Confirm & Continue" to begin!` 
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsThinking(false);
    }
  };

  // Loading overlay when confirming
  if (isConfirming) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: 'url(/fltman_red_abackground_black_illustrated_speakers_low_angle_pe_3c6fccde-fd77-41bb-a28a-528037b87b37_0.png)' }}
      >
        <div className="absolute inset-0 bg-black/40 z-0"></div>
        <div className="absolute top-12 left-12 z-20">
          <img src="/beatbrawl.png" alt="BeatBrawl Logo" className="h-48 w-auto" />
        </div>

        {/* Large animated loading bubble */}
        <div className="relative z-30 text-center">
          <div className="bg-yellow-400 border-4 border-white rounded-3xl p-12 shadow-2xl mb-8 max-w-2xl">
            <p className="text-4xl font-black text-black uppercase tracking-wider" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
              {loadingMessages[loadingMessageIndex]}
            </p>
          </div>
          <Loader2 className="w-16 h-16 animate-spin text-yellow-400 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: 'url(/fltman_red_abackground_black_illustrated_speakers_low_angle_pe_3c6fccde-fd77-41bb-a28a-528037b87b37_0.png)' }}
    >
      <div className="absolute inset-0 bg-black/40 z-0"></div>

      {/* BeatBrawl Logo - Upper Left */}
      <div className="absolute top-12 left-12 z-20">
        <img
          src="/beatbrawl.png"
          alt="BeatBrawl Logo"
          className="h-48 w-auto"
        />
      </div>

      {/* Chat Container */}
      <div className="w-full max-w-4xl relative z-30 flex flex-col h-[80vh]">
        {/* Messages Area */}
        <div className="flex-1 overflow-auto mb-6 space-y-4 px-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] p-5 rounded-lg shadow-2xl border-2 border-white ${
                  msg.role === 'user'
                    ? 'bg-yellow-400 text-black'
                    : 'bg-black/90 text-white'
                }`}
                data-testid={`message-${msg.role}-${idx}`}
              >
                <p className="text-lg font-medium">{msg.content}</p>
              </div>
            </div>
          ))}
          {isThinking && (
            <div className="flex justify-start">
              <div className="max-w-[75%] p-5 rounded-lg bg-black/90 border-2 border-white shadow-2xl">
                <Loader2 className="w-5 h-5 animate-spin text-white" />
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-black/90 p-6 border-4 border-white shadow-2xl">
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="T.ex. '80-tals rock' eller 'svensk pop'"
              className="flex-1 text-lg py-6 px-4 bg-white border-2 border-white font-medium rounded-lg"
              data-testid="input-music-preference"
            />
            <Button
              size="lg"
              onClick={handleSend}
              disabled={isThinking}
              className="px-7 bg-yellow-400 hover:bg-yellow-300 text-black font-black shadow-xl"
              data-testid="button-send"
            >
              {isThinking ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          <button
            className={`w-full text-2xl py-7 px-12 bg-yellow-400 text-black font-black shadow-2xl uppercase tracking-wider transition-all duration-200 ${
              lastPreference && !isConfirming
                ? 'cursor-pointer hover:scale-105 hover:shadow-[0_20px_50px_rgba(0,0,0,0.8)] hover:-translate-y-1'
                : 'opacity-40 cursor-not-allowed'
            }`}
            style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}
            onClick={() => {
              setIsConfirming(true);
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
                <Loader2 className="w-5 h-5 mr-2 animate-spin inline" />
                Searching for songs...
              </>
            ) : (
              'Confirm & Continue'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
