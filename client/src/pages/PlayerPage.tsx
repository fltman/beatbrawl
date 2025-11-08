import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Timeline from '@/components/Timeline';
import CardPlacement from '@/components/CardPlacement';
import ScoreDisplay from '@/components/ScoreDisplay';
import WinnerScreen from '@/components/WinnerScreen';
import { socketService } from '@/lib/socket';
import type { GameState, Player, Song } from '@/types/game.types';

export default function PlayerPage() {
  const params = useParams<{ gameCode?: string }>();
  const [phase, setPhase] = useState<'join' | 'lobby' | 'playing'>('join');
  const [playerName, setPlayerName] = useState('');
  const [gameCode, setGameCode] = useState(params.gameCode || '');
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myPlayer, setMyPlayer] = useState<Player | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (phase !== 'join') {
      const socket = socketService.connect();

      socketService.onGameStateUpdate((newState) => {
        setGameState(newState);
        const player = newState.players.find(p => p.id === socket?.id);
        if (player) {
          setMyPlayer(player);
        }
        
        if (newState.phase === 'playing' && phase !== 'playing') {
          setPhase('playing');
        }
      });

      socketService.onGameStarted((newState) => {
        setGameState(newState);
        setPhase('playing');
      });

      socketService.onRoundStarted((newState) => {
        setGameState(newState);
        setSelectedPosition(null);
      });

      socketService.onError((message) => {
        toast({
          title: 'Fel',
          description: message,
          variant: 'destructive'
        });
      });
    }

    return () => {
      if (phase !== 'join') {
        socketService.disconnect();
      }
    };
  }, [phase, toast]);

  const handleJoin = () => {
    if (!playerName || !gameCode) return;

    socketService.connect();
    socketService.joinGame(gameCode.toUpperCase(), playerName, (data) => {
      setMyPlayer(data.player);
      setGameState(data.gameState);
      setPhase('lobby');
    });
  };

  const handleConfirmPlacement = () => {
    if (selectedPosition === null) return;
    socketService.placeCard(selectedPosition);
    setSelectedPosition(null);
  };

  if (phase === 'join') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-8">
          <h1 className="text-3xl font-bold mb-6 text-center">Gå Med i Spel</h1>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Ditt Namn</label>
              <Input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Ange ditt namn"
                className="text-lg"
                data-testid="input-player-name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Spelkod</label>
              <Input
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                placeholder="Ange spelkod"
                className="text-lg font-mono"
                data-testid="input-game-code"
              />
            </div>
            <Button
              size="lg"
              className="w-full"
              onClick={handleJoin}
              disabled={!playerName || !gameCode}
              data-testid="button-join"
            >
              Gå Med
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (phase === 'lobby' || !myPlayer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Välkommen, {playerName}!</h1>
          <p className="text-lg text-muted-foreground">Väntar på att spelet ska starta...</p>
        </Card>
      </div>
    );
  }

  if (gameState?.phase === 'finished' && gameState.winner) {
    return (
      <WinnerScreen
        winner={gameState.winner}
        allPlayers={gameState.players}
        onNewGame={() => window.location.reload()}
      />
    );
  }

  const hiddenSong: Song = {
    id: gameState?.currentSong?.id || '?',
    title: '?',
    artist: '?',
    year: 0
  };

  return (
    <div className="min-h-screen bg-background pb-80">
      <div className="p-6">
        <ScoreDisplay
          playerName={myPlayer.name}
          score={myPlayer.score}
          timelineLength={myPlayer.timeline.length}
        />
      </div>

      <Timeline
        timeline={myPlayer.timeline}
        startYear={myPlayer.startYear}
        highlightPosition={selectedPosition ?? undefined}
        onPlaceCard={setSelectedPosition}
      />

      {gameState?.phase === 'playing' && (
        <CardPlacement
          song={hiddenSong}
          selectedPosition={selectedPosition}
          onConfirm={handleConfirmPlacement}
        />
      )}
    </div>
  );
}
