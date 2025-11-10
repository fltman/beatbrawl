import { useEffect } from 'react';
import { Play, SkipForward, Trophy, Disc3, AlertCircle, Radio, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSpotifyPlayer } from '@/hooks/useSpotifyPlayer';
import MusicEqualizer from './MusicEqualizer';
import type { Player, Song } from '@/types/game.types';

interface GameControlProps {
  currentSong: Song | null;
  roundNumber: number;
  players: Player[];
  onNextRound?: () => void;
  phase: 'playing' | 'reveal' | 'finished';
  spotifyConnected?: boolean;
  isDJPlaying?: boolean;
}

export default function GameControl({ currentSong, roundNumber, players, onNextRound, phase, isDJPlaying = false }: GameControlProps) {
  const spotify = useSpotifyPlayer();

  useEffect(() => {
    if (isDJPlaying && spotify.isPlaying) {
      spotify.pausePlayback();
      return;
    }

    if (phase !== 'playing' || !currentSong) {
      if (spotify.isPlaying) {
        spotify.pausePlayback();
      }
      return;
    }

    if (spotify.isConnected && spotify.isReady && currentSong.id && !spotify.isPlaying && !isDJPlaying) {
      const trackUri = `spotify:track:${currentSong.id}`;
      spotify.playTrack(trackUri);
    }
  }, [currentSong, phase, spotify.isConnected, spotify.isReady, isDJPlaying]);

  const togglePlayback = () => {
    if (!spotify.isConnected || !spotify.isReady) return;

    if (spotify.isPlaying) {
      spotify.pausePlayback();
    } else if (currentSong) {
      spotify.playTrack(`spotify:track:${currentSong.id}`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6">
      {/* VÄNSTER KOLUMN: Spelare */}
      <Card className="p-6 h-fit">
        <div className="space-y-3">
          {players
            .sort((a, b) => b.score - a.score)
            .map((player, idx) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-4 rounded-xl border-2 ${
                  idx === 0 ? 'border-yellow-400 bg-yellow-400/10' : 'border-white/20 bg-white/5'
                } ${!player.connected ? 'opacity-60' : ''}`}
                data-testid={`player-score-${idx}`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {player.profileImage ? (
                    <div className="relative flex-shrink-0">
                      <img
                        src={player.profileImage}
                        alt={player.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white"
                        style={{ backgroundColor: player.avatarColor || '#8B5CF6' }}
                      />
                      {idx === 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-yellow-400 text-black flex items-center justify-center text-xs font-bold border-2 border-white">
                          1
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 ${
                        idx === 0 ? 'ring-2 ring-yellow-400' : ''
                      }`}
                      style={{ backgroundColor: player.avatarColor || '#8B5CF6' }}
                    >
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-bold text-lg truncate">{player.name}</span>
                    {player.artistName && (
                      <span className="text-sm text-muted-foreground italic truncate">
                        "{player.artistName}"
                      </span>
                    )}
                    <div className="flex gap-2 mt-1">
                      {!player.connected && (
                        <Badge variant="destructive" className="text-xs flex items-center gap-1">
                          <WifiOff className="w-3 h-3" />
                          Frånkopplad
                        </Badge>
                      )}
                      {player.connected && player.isReady && (
                        <Badge variant="secondary" className="text-xs bg-green-500 text-white">Klar</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-3xl font-mono font-black flex-shrink-0 ml-2">
                  {player.score}
                </div>
              </div>
            ))}
        </div>
      </Card>

      {/* HÖGER KOLUMN: Spelkort och kontroller */}
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold">Runda {Math.min(roundNumber, 10)}/10</h2>
              <p className="text-muted-foreground text-lg">Spelare placerar sina kort</p>
            </div>
            <Badge variant="secondary" className="text-2xl font-mono px-6 py-3">
              {players.filter(p => p.connected && p.isReady).length}/{players.filter(p => p.connected).length} klara
            </Badge>
          </div>

        {currentSong && (
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-8 mb-6">
            {isDJPlaying ? (
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center py-6">
                  <Radio className="w-16 h-16 text-primary mb-3 animate-pulse" />
                  <p className="text-2xl font-bold text-primary mb-1">DJ ON AIR</p>
                  <p className="text-lg text-muted-foreground">Din energiska radio-DJ kommenterar...</p>
                </div>
                <div className="flex items-center gap-6 bg-background/50 rounded-xl p-6">
                  {currentSong.albumCover && (
                    <img 
                      src={currentSong.albumCover} 
                      alt={currentSong.title}
                      className="w-24 h-24 rounded-xl shadow-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1">{currentSong.title}</h3>
                    <p className="text-lg text-muted-foreground mb-2">{currentSong.artist}</p>
                    <Badge className="text-xl font-mono font-bold px-3 py-1">
                      {currentSong.year}
                    </Badge>
                  </div>
                </div>
              </div>
            ) : phase === 'playing' ? (
              <div className="relative overflow-hidden">
                {spotify.isPlaying && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 animate-pulse" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-64 h-64 bg-primary/10 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-48 bg-accent/10 rounded-full animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.3s' }} />
                    </div>
                  </>
                )}
                <div className="relative flex flex-col items-center justify-center py-12">
                  <div className={`text-9xl font-bold mb-4 ${spotify.isPlaying ? 'text-primary animate-pulse' : 'text-primary/30'}`}>?</div>
                  {spotify.isConnected && spotify.isReady ? (
                    <>
                      <div className="flex items-center gap-4 mb-2">
                        <Disc3 className={`w-6 h-6 ${spotify.isPlaying ? 'text-primary animate-spin' : 'text-muted-foreground'}`} />
                        <p className="text-2xl font-semibold text-muted-foreground">
                          Spelar via Spotify
                        </p>
                        <Badge variant="secondary" className="ml-2">Premium</Badge>
                      </div>
                      <div className="mb-3">
                        <MusicEqualizer isPlaying={spotify.isPlaying} barCount={7} />
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

          {phase === 'reveal' && (
            <Button
              size="lg"
              className="w-full text-xl"
              onClick={onNextRound}
              data-testid="button-next-round"
            >
              <SkipForward className="w-6 h-6 mr-2" />
              Nästa Runda
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
}
