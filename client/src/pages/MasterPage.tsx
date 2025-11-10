import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import AIChat from '@/components/AIChat';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import GameControl from '@/components/GameControl';
import WinnerScreen from '@/components/WinnerScreen';
import { socketService } from '@/lib/socket';
import type { GameState, RoundResult } from '@/types/game.types';

export default function MasterPage() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [preferences, setPreferences] = useState('');
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [isDJPlaying, setIsDJPlaying] = useState(false);
  const { toast } = useToast();
  const gameStateRef = useRef<GameState | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

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

    socketService.onPlayerDisconnected((data) => {
      toast({
        title: 'Player Disconnected',
        description: `${data.playerName} lost connection and can reconnect`,
        duration: 5000
      });
    });

    socketService.onDJCommentary((base64Audio) => {
      console.log('DJ commentary received, playing...');
      setIsDJPlaying(true);
      
      const audioBlob = new Blob(
        [Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0))],
        { type: 'audio/mpeg' }
      );
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        console.log('DJ commentary finished, checking if we should continue...');
        setIsDJPlaying(false);
        URL.revokeObjectURL(audioUrl);
        
        // Vänta lite och kolla om spelet är finished innan vi går vidare
        setTimeout(() => {
          const currentState = gameStateRef.current;
          if (currentState && currentState.phase !== 'finished') {
            console.log('Auto-starting next round...');
            socketService.nextRound();
          } else {
            console.log('Game finished - not starting next round');
          }
        }, 1500);
      };
      
      audio.onerror = (e) => {
        console.error('DJ audio error:', e);
        setIsDJPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.play().catch(err => {
        console.error('Failed to play DJ audio:', err);
        setIsDJPlaying(false);
        URL.revokeObjectURL(audioUrl);
      });
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
      <div
        className="min-h-screen flex items-center justify-center relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: 'url(/fltman_red_abackground_black_illustrated_speakers_low_angle_pe_3c6fccde-fd77-41bb-a28a-528037b87b37_0.png)' }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="absolute top-12 left-12 z-20">
          <img src="/beatbrawl.png" alt="BeatBrawl Logo" className="h-48 w-auto" />
        </div>
        <p className="text-3xl text-white font-black relative z-10">Skapar spel...</p>
      </div>
    );
  }

  if (gameState.phase === 'setup') {
    if (!spotifyConnected) {
      window.location.href = '/?spotify_required=true';
      return null;
    }
    return <AIChat onPreferencesConfirmed={handleAIChatConfirm} />;
  }

  if (gameState.phase === 'lobby') {
    return (
      <QRCodeDisplay
        gameCode={gameState.id}
        playerCount={gameState.players.length}
        players={gameState.players}
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
    <div
      className="min-h-screen p-8 relative overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: 'url(/fltman_red_abackground_black_illustrated_speakers_low_angle_pe_3c6fccde-fd77-41bb-a28a-528037b87b37_0.png)' }}
    >
      <div className="absolute inset-0 bg-black/40 z-0"></div>

      {/* BeatBrawl Logo - Upper Left */}
      <div className="absolute top-8 left-8 z-50">
        <img
          src="/beatbrawl.png"
          alt="BeatBrawl Logo"
          className="h-24 w-auto"
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-30">
        <div className="mb-6 text-center">
          <p className="text-white text-xl">
            Game Code: <span className="font-mono font-black text-2xl">{gameState.id}</span>
          </p>
        </div>

        <GameControl
          currentSong={gameState.currentSong}
          roundNumber={gameState.roundNumber}
          players={gameState.players}
          phase={gameState.phase}
          onNextRound={handleNextRound}
          spotifyConnected={spotifyConnected}
          isDJPlaying={isDJPlaying}
          results={results}
        />

      </div>
    </div>
  );
}
