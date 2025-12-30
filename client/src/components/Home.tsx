import { useState, useEffect } from "react";
import { Users, Sparkles, Music, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface HomeProps {
  onSelectMaster?: () => void;
  onSelectPlayer?: () => void;
}

export default function Home({ onSelectMaster, onSelectPlayer }: HomeProps) {
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [isCheckingSpotify, setIsCheckingSpotify] = useState(true);
  const [isConnectingSpotify, setIsConnectingSpotify] = useState(false);

  useEffect(() => {
    fetch('/api/spotify/status')
      .then(res => res.json())
      .then(data => {
        setSpotifyConnected(data.connected);
        setIsCheckingSpotify(false);
      })
      .catch(() => {
        setIsCheckingSpotify(false);
      });
  }, []);

  const handleConnectSpotify = () => {
    setIsConnectingSpotify(true);
    window.location.href = '/auth/spotify';
  };

  const handleSelectMaster = () => {
    if (spotifyConnected && onSelectMaster) {
      onSelectMaster();
    }
  };

  return (
    <div
      className="min-h-screen flex items-start justify-start p-8 relative overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: 'url(/fltman_red_abackground_black_illustrated_speakers_low_angle_pe_3c6fccde-fd77-41bb-a28a-528037b87b37_0.png)' }}
    >
      <div className="absolute inset-0 bg-black/40"></div>

      {/* BeatBrawl Logo - Upper Left - Extra Large */}
      <div className="absolute top-12 left-12 z-20">
        <img
          src="/beatbrawl.png"
          alt="BeatBrawl Logo"
          className="h-48 w-auto"
          data-testid="img-logo"
        />
      </div>

      {/* Spotify Button - Upper Right - Much Smaller */}
      <div className="absolute top-8 right-8 z-20">
        {!isCheckingSpotify && !spotifyConnected && (
          <Button
            onClick={handleConnectSpotify}
            disabled={isConnectingSpotify}
            className="gap-2 text-xs px-3 py-2 bg-black/80 hover:bg-black text-white font-medium shadow-lg border border-green-500 animate-pulse-glow"
            data-testid="button-connect-spotify-home"
          >
            {isConnectingSpotify ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Music className="w-3 h-3 text-green-500" />
            )}
            Connect Spotify
          </Button>
        )}

        {spotifyConnected && (
          <Button
            disabled
            className="gap-2 text-xs px-3 py-2 bg-black/80 text-white font-medium shadow-lg border border-white cursor-default"
            data-testid="button-spotify-connected"
          >
            <CheckCircle2 className="w-3 h-3 text-green-400" />
            Connected to Spotify
          </Button>
        )}
      </div>

      {/* Two Buttons - Left Side in Red Area - Street Style */}
      <div className="absolute left-12 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-6">
        {/* START GAME Button - Dark Red/Maroon with street aesthetic */}
        <button
          className={`relative text-4xl py-10 px-16 font-black uppercase tracking-wider transition-all duration-200 ${
            spotifyConnected
              ? 'cursor-pointer hover:scale-105 hover:-translate-y-1'
              : 'opacity-40 cursor-not-allowed'
          }`}
          style={{
            fontFamily: 'Impact, "Arial Black", sans-serif',
            transform: 'skewX(-3deg)',
            background: '#6b2020',
            color: '#c4956a',
            border: '4px solid #1a1a1a',
            boxShadow: `
              inset 2px 2px 0 rgba(255,255,255,0.1),
              inset -2px -2px 0 rgba(0,0,0,0.3),
              6px 6px 0 #1a1a1a
            `,
          }}
          disabled={!spotifyConnected}
          onClick={handleSelectMaster}
          data-testid="button-start-master"
        >
          {/* Corner scratches */}
          <span className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-black/40" style={{ transform: 'rotate(-5deg)' }}></span>
          <span className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-black/40" style={{ transform: 'rotate(5deg)' }}></span>
          <span className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-black/40" style={{ transform: 'rotate(5deg)' }}></span>
          <span className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-black/40" style={{ transform: 'rotate(-5deg)' }}></span>
          {/* Scratch lines */}
          <span className="absolute top-3 left-6 w-3 h-px bg-black/30" style={{ transform: 'rotate(-25deg)' }}></span>
          <span className="absolute top-4 right-6 w-3 h-px bg-black/30" style={{ transform: 'rotate(20deg)' }}></span>
          <span className="absolute bottom-4 left-8 w-2 h-px bg-black/30" style={{ transform: 'rotate(15deg)' }}></span>
          <span className="absolute bottom-3 right-8 w-2 h-px bg-black/30" style={{ transform: 'rotate(-20deg)' }}></span>
          <span style={{ transform: 'skewX(3deg)', display: 'block' }}>Start Game</span>
        </button>

        {/* JOIN GAME Button - Orange with street aesthetic */}
        <button
          className="relative text-4xl py-10 px-16 font-black uppercase tracking-wider transition-all duration-200 cursor-pointer hover:scale-105 hover:-translate-y-1"
          style={{
            fontFamily: 'Impact, "Arial Black", sans-serif',
            transform: 'skewX(-3deg)',
            background: '#d97706',
            color: 'white',
            border: '4px solid #1a1a1a',
            boxShadow: `
              inset 2px 2px 0 rgba(255,255,255,0.15),
              inset -2px -2px 0 rgba(0,0,0,0.2),
              6px 6px 0 #1a1a1a
            `,
          }}
          onClick={onSelectPlayer}
          data-testid="button-join-player"
        >
          {/* Corner scratches */}
          <span className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-black/30" style={{ transform: 'rotate(-5deg)' }}></span>
          <span className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-black/30" style={{ transform: 'rotate(5deg)' }}></span>
          <span className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-black/30" style={{ transform: 'rotate(5deg)' }}></span>
          <span className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-black/30" style={{ transform: 'rotate(-5deg)' }}></span>
          {/* Scratch lines */}
          <span className="absolute top-3 left-6 w-3 h-px bg-black/25" style={{ transform: 'rotate(-25deg)' }}></span>
          <span className="absolute top-4 right-6 w-3 h-px bg-black/25" style={{ transform: 'rotate(20deg)' }}></span>
          <span className="absolute bottom-4 left-8 w-2 h-px bg-black/25" style={{ transform: 'rotate(15deg)' }}></span>
          <span className="absolute bottom-3 right-8 w-2 h-px bg-black/25" style={{ transform: 'rotate(-20deg)' }}></span>
          <span style={{ transform: 'skewX(3deg)', display: 'block' }}>Join Game</span>
        </button>
      </div>
    </div>
  );
}
