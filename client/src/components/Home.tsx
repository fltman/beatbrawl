import { useState, useEffect } from "react";
import { Music2, Users, Sparkles, Music, Loader2, CheckCircle2 } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-accent/20 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-6">
            <Music2 className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            HITSTER AI
          </h1>
          <p className="text-xl text-muted-foreground font-medium">
            Musikspelet med AI-driven musikval
          </p>
        </div>

        {!isCheckingSpotify && !spotifyConnected && (
          <Alert className="mb-8 bg-primary/5 border-primary/20" data-testid="alert-spotify-required">
            <Music className="h-5 w-5 text-primary" />
            <AlertDescription className="text-base">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="font-medium">
                  Spotify Premium krävs för att spela HITSTER AI
                </span>
                <Button
                  onClick={handleConnectSpotify}
                  disabled={isConnectingSpotify}
                  className="gap-2 whitespace-nowrap"
                  data-testid="button-connect-spotify-home"
                >
                  {isConnectingSpotify ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Ansluter...
                    </>
                  ) : (
                    <>
                      <Music className="w-4 h-4" />
                      Anslut Spotify Premium
                    </>
                  )}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {spotifyConnected && (
          <Alert className="mb-8 bg-green-500/10 border-green-500/20" data-testid="alert-spotify-connected">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-base font-medium text-green-600">
              Spotify Premium är ansluten!
            </AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <Card 
            className={`p-8 ${spotifyConnected ? 'hover-elevate cursor-pointer' : 'opacity-60 cursor-not-allowed'}`} 
            data-testid="card-master" 
            onClick={handleSelectMaster}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Starta Spel</h2>
                <p className="text-muted-foreground">
                  Bli spelledare och styra musiken med AI
                </p>
              </div>
              <Button 
                size="lg" 
                className="w-full" 
                disabled={!spotifyConnected}
                data-testid="button-start-master"
              >
                {spotifyConnected ? 'Skapa Spelrum' : 'Kräver Spotify Premium'}
              </Button>
            </div>
          </Card>

          <Card className="p-8 hover-elevate cursor-pointer" data-testid="card-player" onClick={onSelectPlayer}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Gå Med</h2>
                <p className="text-muted-foreground">
                  Anslut till ett spel och tävla med andra
                </p>
              </div>
              <Button size="lg" variant="secondary" className="w-full" data-testid="button-join-player">
                Skanna QR-kod
              </Button>
            </div>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Först till 10 korrekta placeringar vinner!
          </p>
        </div>
      </div>
    </div>
  );
}
