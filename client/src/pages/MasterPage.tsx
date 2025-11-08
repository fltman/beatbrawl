import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
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
  const { toast } = useToast();

  useEffect(() => {
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
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-bold mb-2">HITSTER AI</h1>
          <p className="text-muted-foreground">Spelkod: <span className="font-mono font-bold">{gameState.id}</span></p>
        </div>

        <GameControl
          currentSong={gameState.currentSong}
          roundNumber={gameState.roundNumber}
          players={gameState.players}
          phase={gameState.phase}
          onNextRound={handleNextRound}
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
