import { Trophy, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import WinnerConfetti from './WinnerConfetti';
import type { Player } from '@/types/game.types';

interface WinnerScreenProps {
  winner: Player;
  allPlayers: Player[];
  onNewGame?: () => void;
}

export default function WinnerScreen({ winner, allPlayers, onNewGame }: WinnerScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-accent/20 flex items-center justify-center p-6">
      <WinnerConfetti trigger={true} />
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          {winner.profileImage ? (
            <div className="inline-block mb-6 relative">
              <img
                src={`data:image/png;base64,${winner.profileImage}`}
                alt={winner.name}
                className="w-32 h-32 rounded-full object-cover ring-4 ring-primary"
                style={{ backgroundColor: winner.avatarColor || '#8B5CF6' }}
              />
              <div className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <Trophy className="w-6 h-6" />
              </div>
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-6">
              <Trophy className="w-12 h-12 text-primary" />
            </div>
          )}
          <h1 className="text-6xl font-bold mb-4">Grattis!</h1>
          <div className="inline-flex items-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <h2 className="text-4xl font-bold" data-testid="text-winner-name">{winner.name}</h2>
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          {winner.artistName && (
            <p className="text-2xl text-muted-foreground italic mb-2">
              "{winner.artistName}"
            </p>
          )}
          <p className="text-xl text-muted-foreground">vann spelet!</p>
        </div>

        <Card className="p-8 mb-6">
          <h3 className="text-2xl font-bold mb-4">Slutställning</h3>
          <div className="space-y-3">
            {allPlayers
              .sort((a, b) => b.score - a.score)
              .map((player, idx) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-4 rounded-xl ${
                    idx === 0 ? 'bg-primary/10' : 'bg-muted/50'
                  }`}
                  data-testid={`final-score-${idx}`}
                >
                  <div className="flex items-center gap-4">
                    {player.profileImage ? (
                      <div className="relative">
                        <img
                          src={`data:image/png;base64,${player.profileImage}`}
                          alt={player.name}
                          className="w-14 h-14 rounded-full object-cover"
                          style={{ backgroundColor: player.avatarColor || '#8B5CF6' }}
                        />
                        {idx === 0 && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                            🏆
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg ${
                          idx === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}
                        style={!player.profileImage && player.avatarColor ? { backgroundColor: player.avatarColor } : {}}
                      >
                        {idx === 0 ? '🏆' : idx + 1}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="font-semibold text-xl">{player.name}</span>
                      {player.artistName && (
                        <span className="text-sm text-muted-foreground italic">
                          "{player.artistName}"
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-4xl font-mono font-black">
                    {player.score}
                  </div>
                </div>
              ))}
          </div>
        </Card>

        <Button
          size="lg"
          className="w-full text-xl"
          onClick={onNewGame}
          data-testid="button-new-game"
        >
          Nytt Spel
        </Button>
      </div>
    </div>
  );
}
