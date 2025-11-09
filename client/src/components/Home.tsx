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
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: 'url(/fltman_red_abackground_black_illustrated_speakers_low_angle_pe_3c6fccde-fd77-41bb-a28a-528037b87b37_0.png)' }}
    >
      <div className="absolute inset-0 bg-black/40"></div>

      <div className="w-full max-w-5xl relative z-10">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <img
              src={logoUrl}
              alt="HITSTER AI Logo"
              className="w-80 h-auto"
              data-testid="img-logo"
            />
          </div>
          <p className="text-2xl text-white font-bold tracking-wide">
            Musikspelet med AI-driven musikval
          </p>
        </div>

        {!isCheckingSpotify && !spotifyConnected && (
          <Alert className="mb-10 bg-black border-4 border-yellow-400 shadow-2xl" data-testid="alert-spotify-required">
            <Music className="h-6 w-6 text-yellow-400" />
            <AlertDescription className="text-lg">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="font-bold text-white text-xl">
                  Spotify Premium krävs för att spela HITSTER AI
                </span>
                <Button
                  onClick={handleConnectSpotify}
                  disabled={isConnectingSpotify}
                  className="gap-2 whitespace-nowrap text-lg px-6 py-6 bg-green-600 hover:bg-green-500 text-white font-bold shadow-xl border-2 border-white"
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
          <Alert className="mb-10 bg-black border-4 border-green-400 shadow-2xl" data-testid="alert-spotify-connected">
            <CheckCircle2 className="h-6 w-6 text-green-400" />
            <AlertDescription className="text-xl font-bold text-white">
              Spotify Premium är ansluten
            </AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <Card
            className={`p-12 bg-black border-4 border-white shadow-2xl ${
              spotifyConnected ? 'hover:border-yellow-400 cursor-pointer transition-all duration-200' : 'opacity-40 cursor-not-allowed'
            }`}
            data-testid="card-master"
            onClick={handleSelectMaster}
          >
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-yellow-400 flex items-center justify-center shadow-xl border-4 border-white">
                <Sparkles className="w-10 h-10 text-black" />
              </div>
              <div>
                <h2 className="text-3xl font-black mb-2 text-white">Starta Spel</h2>
                <p className="text-white/90 text-base font-medium">
                  Bli spelledare och styra musiken med AI
                </p>
              </div>
              <Button
                size="lg"
                className="w-full text-xl py-7 bg-yellow-400 hover:bg-yellow-300 text-black font-black shadow-xl border-3 border-white"
                disabled={!spotifyConnected}
                data-testid="button-start-master"
              >
                {spotifyConnected ? 'Skapa Spelrum' : 'Kräver Spotify Premium'}
              </Button>
            </div>
          </Card>

          <Card className="p-12 bg-black border-4 border-white shadow-2xl hover:border-yellow-400 cursor-pointer transition-all duration-200" data-testid="card-player" onClick={onSelectPlayer}>
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-orange-500 flex items-center justify-center shadow-xl border-4 border-white">
                <Users className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-black mb-2 text-white">Gå Med</h2>
                <p className="text-white/90 text-base font-medium">
                  Anslut till ett spel och tävla med andra
                </p>
              </div>
              <Button size="lg" className="w-full text-xl py-7 bg-orange-500 hover:bg-orange-400 text-white font-black shadow-xl border-3 border-white" data-testid="button-join-player">
                Skanna QR-kod
              </Button>
            </div>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <p className="text-xl text-white/80 font-bold">
            Först till 10 korrekta placeringar vinner
          </p>
        </div>
      </div>
    </div>
  );
}
