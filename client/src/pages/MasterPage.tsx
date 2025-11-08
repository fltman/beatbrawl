import { useState, useEffect } from 'react';
import { Music, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import AIChat from '@/components/AIChat';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import GameControl from '@/components/GameControl';
import RevealScreen from '@/components/RevealScreen';
import WinnerScreen from '@/components/WinnerScreen';
import { socketService } from '@/lib/socket';
import type { GameState, RoundResult } from '@/types/game.types';

export default function MasterPage() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [preferences, setPreferences] = useState('');
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [isConnectingSpotify, setIsConnectingSpotify] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetch('/api/spotify/status')
      .then(res => res.json())
      .then(data => setSpotifyConnected(data.connected))
      .catch(console.error);

    const socket = socketService.connect();

    socketService.createGame((data) => {
      setGameState(data.gameState);
    });

    socketService.onGameStateUpdate((newState) => {
      setGameState(newState);
    });

    socketService.onGameStarted((newState) => {
      setGameState(newState);
    });

    socketService.onResultsRevealed((data) => {
      setResults(data.results);
      setGameState(data.gameState);
    });

    socketService.onRoundStarted((newState) => {
      setGameState(newState);
      setResults([]);
    });

    socketService.onError((message) => {
      toast({
        title: 'Fel',
        description: message,
        variant: 'destructive'
      });
    });

    return () => {
      socketService.disconnect();
    };
  }, [toast]);

  const handleAIChatConfirm = (pref: string) => {
    if (!preferences) {
      setPreferences(pref || 'rock music');
    }
    
    socketService.confirmPreferences(pref || preferences, (data) => {
      setGameState(data.gameState);
    });
  };

  const handleStartGame = () => {
    socketService.startGame();
  };

  const handleRevealResults = () => {
    socketService.revealResults();
  };

  const handleNextRound = () => {
    if (gameState?.phase === 'playing') {
      handleRevealResults();
    } else if (gameState?.phase === 'reveal') {
      socketService.nextRound();
    }
  };

  if (!gameState) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-xl">Skapar spel...</p>
      </div>
    );
  }

  if (gameState.phase === 'setup') {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <AIChat onPreferencesConfirmed={handleAIChatConfirm} />
      </div>
    );
  }

  if (gameState.phase === 'lobby') {
    return (
      <QRCodeDisplay
        gameCode={gameState.id}
        playerCount={gameState.players.length}
        onStartGame={handleStartGame}
      />
    );
  }

  if (gameState.phase === 'finished' && gameState.winner) {
    return (
      <WinnerScreen
        winner={gameState.winner}
        allPlayers={gameState.players}
        onNewGame={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold">HITSTER AI</h1>
            {!spotifyConnected && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsConnectingSpotify(true);
                  window.location.href = '/auth/spotify';
                }}
                disabled={isConnectingSpotify}
                className="gap-2"
                data-testid="button-connect-spotify"
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
            )}
          </div>
          <p className="text-muted-foreground text-center">
            Spelkod: <span className="font-mono font-bold">{gameState.id}</span>
            {spotifyConnected && <span className="ml-3 text-green-600">● Spotify Ansluten</span>}
          </p>
        </div>

        <GameControl
          currentSong={gameState.currentSong}
          roundNumber={gameState.roundNumber}
          players={gameState.players}
          phase={gameState.phase}
          onNextRound={handleNextRound}
          spotifyConnected={spotifyConnected}
        />

        {gameState.phase === 'reveal' && gameState.currentSong && (
          <RevealScreen
            song={gameState.currentSong}
            results={results}
            onContinue={handleNextRound}
          />
        )}
      </div>
    </div>
  );
}
