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
            className="gap-2 text-xs px-3 py-2 bg-black/80 hover:bg-black text-white font-medium shadow-lg border border-white"
            data-testid="button-connect-spotify-home"
          >
            {isConnectingSpotify ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Music className="w-3 h-3 text-red-500" />
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

      {/* Two Buttons - Left Side in Red Area */}
      <div className="absolute left-12 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-6">
        <button
          className={`text-4xl py-10 px-16 bg-yellow-400 text-black font-black shadow-2xl uppercase tracking-wider transition-all duration-200 ${
            spotifyConnected
              ? 'cursor-pointer hover:scale-110 hover:shadow-[0_20px_50px_rgba(0,0,0,0.8)] hover:-translate-y-2'
              : 'opacity-40 cursor-not-allowed'
          }`}
          style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}
          disabled={!spotifyConnected}
          onClick={handleSelectMaster}
          data-testid="button-start-master"
        >
          Start Game
        </button>

        <button
          className="text-4xl py-10 px-16 bg-orange-500 text-white font-black shadow-2xl uppercase tracking-wider transition-all duration-200 cursor-pointer hover:scale-110 hover:shadow-[0_20px_50px_rgba(0,0,0,0.8)] hover:-translate-y-2"
          style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}
          onClick={onSelectPlayer}
          data-testid="button-join-player"
        >
          Join Game
        </button>
      </div>
    </div>
  );
}
