import { useEffect } from 'react';
import { Play, SkipForward, Trophy, Disc3, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSpotifyPlayer } from '@/hooks/useSpotifyPlayer';
import type { Player, Song } from '@/types/game.types';

interface GameControlProps {
  currentSong: Song | null;
  roundNumber: number;
  players: Player[];
  onNextRound?: () => void;
  phase: 'playing' | 'reveal' | 'finished';
  spotifyConnected?: boolean;
}

export default function GameControl({ currentSong, roundNumber, players, onNextRound, phase }: GameControlProps) {
  const spotify = useSpotifyPlayer();

  useEffect(() => {
    if (phase !== 'playing' || !currentSong) {
      if (spotify.isPlaying) {
        spotify.pausePlayback();
      }
      return;
    }

    if (spotify.isConnected && spotify.isReady && currentSong.id && !spotify.isPlaying) {
      const trackUri = `spotify:track:${currentSong.id}`;
      spotify.playTrack(trackUri);
    }
  }, [currentSong, phase, spotify.isConnected, spotify.isReady]);

  const togglePlayback = () => {
    if (!spotify.isConnected || !spotify.isReady) return;

    if (spotify.isPlaying) {
      spotify.pausePlayback();
    } else if (currentSong) {
      spotify.playTrack(`spotify:track:${currentSong.id}`);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Runda {Math.min(roundNumber, 10)}/10</h2>
            <p className="text-muted-foreground">Spelare placerar sina kort</p>
          </div>
          <Badge variant="secondary" className="text-xl font-mono px-4 py-2">
            {players.filter(p => p.isReady).length}/{players.length} klara
          </Badge>
        </div>

        {currentSong && (
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-8 mb-6">
            {phase === 'playing' ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="text-9xl font-bold text-primary/30 mb-4">?</div>
                {spotify.isConnected && spotify.isReady ? (
                  <>
                    <div className="flex items-center gap-3 mb-2">
                      <Disc3 className={`w-6 h-6 ${spotify.isPlaying ? 'text-primary animate-spin' : 'text-muted-foreground'}`} />
                      <p className="text-2xl font-semibold text-muted-foreground">
                        Spelar via Spotify
                      </p>
                      <Badge variant="secondary" className="ml-2">Premium</Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={togglePlayback}
                      className="mb-3"
                      data-testid="button-toggle-audio"
                    >
                      {spotify.isPlaying ? 'Pausa' : 'Spela'}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <AlertCircle className="w-6 h-6 text-muted-foreground" />
                      <p className="text-2xl font-semibold text-muted-foreground">
                        Anslut Spotify för att spela musik
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Klicka på "Anslut Spotify Premium" längst upp för att aktivera musikuppspelning
                    </p>
                  </>
                )}
                <p className="text-lg text-muted-foreground mt-4">Väntar på att alla placerar sina kort...</p>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                {currentSong.albumCover && (
                  <img 
                    src={currentSong.albumCover} 
                    alt={currentSong.title}
                    className="w-32 h-32 rounded-xl shadow-lg"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-1">{currentSong.title}</h3>
                  <p className="text-xl text-muted-foreground mb-2">{currentSong.artist}</p>
                  <Badge className="text-2xl font-mono font-bold px-4 py-1">
                    {currentSong.year}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        )}

        <Button 
          size="lg" 
          className="w-full text-xl"
          onClick={onNextRound}
          disabled={phase === 'playing' && players.some(p => !p.isReady)}
          data-testid="button-next-round"
        >
          {phase === 'reveal' ? (
            <>
              <SkipForward className="w-6 h-6 mr-2" />
              Nästa Runda
            </>
          ) : (
            <>
              <Play className="w-6 h-6 mr-2" />
              Visa Resultat
            </>
          )}
        </Button>
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          Poängställning
        </h3>
        <div className="space-y-3">
          {players
            .sort((a, b) => b.score - a.score)
            .map((player, idx) => (
              <div 
                key={player.id}
                className="flex items-center justify-between p-3 rounded-xl hover-elevate"
                data-testid={`player-score-${idx}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    idx === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    {idx + 1}
                  </div>
                  <span className="font-semibold text-lg">{player.name}</span>
                  {player.isReady && (
                    <Badge variant="secondary" className="text-xs">Klar</Badge>
                  )}
                </div>
                <div className="text-3xl font-mono font-black">
                  {player.score}
                </div>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}
