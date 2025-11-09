import { useState, useEffect } from "react";
import { Users, Sparkles, Music, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import logoUrl from "@assets/hitster logo_1762695517073.png";

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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-violet-800 to-fuchsia-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-5xl relative z-10">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-8 transform hover:scale-105 transition-transform duration-300">
            <img
              src={logoUrl}
              alt="HITSTER AI Logo"
              className="w-96 h-auto drop-shadow-2xl"
              data-testid="img-logo"
            />
          </div>
          <p className="text-3xl text-white/90 font-bold tracking-wide">
            🎵 Musikspelet med AI-driven musikval 🎵
          </p>
        </div>

        {!isCheckingSpotify && !spotifyConnected && (
          <Alert className="mb-10 bg-yellow-500/20 border-2 border-yellow-400/50 backdrop-blur-sm shadow-2xl" data-testid="alert-spotify-required">
            <Music className="h-7 w-7 text-yellow-300" />
            <AlertDescription className="text-lg">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="font-bold text-white">
                  🎧 Spotify Premium krävs för att spela HITSTER AI
                </span>
                <Button
                  onClick={handleConnectSpotify}
                  disabled={isConnectingSpotify}
                  className="gap-2 whitespace-nowrap text-lg px-6 py-6 bg-green-600 hover:bg-green-500 text-white font-bold shadow-xl transform hover:scale-105 transition-all"
                  data-testid="button-connect-spotify-home"
                >
                  {isConnectingSpotify ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Ansluter...
                    </>
                  ) : (
                    <>
                      <Music className="w-5 h-5" />
                      Anslut Spotify Premium
                    </>
                  )}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {spotifyConnected && (
          <Alert className="mb-10 bg-green-500/30 border-2 border-green-400/50 backdrop-blur-sm shadow-2xl" data-testid="alert-spotify-connected">
            <CheckCircle2 className="h-7 w-7 text-green-300" />
            <AlertDescription className="text-xl font-bold text-green-100">
              ✓ Spotify Premium är ansluten!
            </AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          <Card
            className={`p-12 bg-gradient-to-br from-purple-600/40 to-pink-600/40 backdrop-blur-md border-2 border-white/20 shadow-2xl ${
              spotifyConnected ? 'hover:scale-105 hover:shadow-purple-500/50 cursor-pointer transform transition-all duration-300' : 'opacity-60 cursor-not-allowed'
            }`}
            data-testid="card-master"
            onClick={handleSelectMaster}
          >
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-xl animate-pulse">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
              <div>
                <h2 className="text-4xl font-black mb-3 text-white drop-shadow-lg">Starta Spel</h2>
                <p className="text-white/90 text-lg font-semibold">
                  🎮 Bli spelledare och styra musiken med AI
                </p>
              </div>
              <Button
                size="lg"
                className="w-full text-xl py-7 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-black shadow-2xl transform hover:scale-105 transition-all border-2 border-white/30"
                disabled={!spotifyConnected}
                data-testid="button-start-master"
              >
                {spotifyConnected ? '🚀 Skapa Spelrum' : 'Kräver Spotify Premium'}
              </Button>
            </div>
          </Card>

          <Card className="p-12 bg-gradient-to-br from-blue-600/40 to-cyan-600/40 backdrop-blur-md border-2 border-white/20 shadow-2xl hover:scale-105 hover:shadow-blue-500/50 cursor-pointer transform transition-all duration-300" data-testid="card-player" onClick={onSelectPlayer}>
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center shadow-xl animate-pulse" style={{ animationDelay: '0.5s' }}>
                <Users className="w-12 h-12 text-white" />
              </div>
              <div>
                <h2 className="text-4xl font-black mb-3 text-white drop-shadow-lg">Gå Med</h2>
                <p className="text-white/90 text-lg font-semibold">
                  👥 Anslut till ett spel och tävla med andra
                </p>
              </div>
              <Button size="lg" className="w-full text-xl py-7 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white font-black shadow-2xl transform hover:scale-105 transition-all border-2 border-white/30" data-testid="button-join-player">
                📱 Skanna QR-kod
              </Button>
            </div>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <p className="text-2xl text-white/80 font-bold drop-shadow-lg">
            🏆 Först till 10 korrekta placeringar vinner! 🏆
          </p>
        </div>
      </div>
    </div>
  );
}
