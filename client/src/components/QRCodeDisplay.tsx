import { QRCodeSVG } from 'qrcode.react';
import { Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface QRCodeDisplayProps {
  gameCode: string;
  playerCount: number;
  onStartGame?: () => void;
}

export default function QRCodeDisplay({ gameCode, playerCount, onStartGame }: QRCodeDisplayProps) {
  const joinUrl = `${window.location.origin}/join/${gameCode}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-violet-800 to-fuchsia-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-3xl relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-black mb-4 text-white drop-shadow-2xl">Väntar på Spelare</h1>
          <p className="text-3xl text-white/90 font-bold">📱 Skanna QR-koden för att gå med</p>
        </div>

        <Card className="p-16 text-center bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg border-2 border-white/20 shadow-2xl">
          <div className="mb-8">
            <div className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-purple-500/30 to-pink-500/30 backdrop-blur-sm border-2 border-white/30 mb-8 shadow-xl">
              <Users className="w-8 h-8 text-white animate-pulse" />
              <span className="font-mono font-black text-3xl text-white" data-testid="text-player-count">
                {playerCount} spelare anslutna
              </span>
            </div>
          </div>

          <div className="inline-block p-10 bg-white rounded-3xl shadow-2xl mb-10 transform hover:scale-105 transition-transform duration-300">
            <QRCodeSVG
              value={joinUrl}
              size={320}
              level="H"
              includeMargin={true}
            />
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-xl text-white/80 font-bold mb-3">Spelkod</p>
              <Badge className="text-6xl font-mono font-black px-12 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-2 border-white/30 shadow-2xl">
                {gameCode}
              </Badge>
            </div>

            <div className="pt-6">
              <Button
                size="lg"
                className="w-full text-2xl py-8 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-black shadow-2xl transform hover:scale-105 transition-all border-2 border-white/30"
                onClick={onStartGame}
                disabled={playerCount === 0}
                data-testid="button-start-game"
              >
                🚀 Starta Spel ({playerCount} spelare)
              </Button>
            </div>
          </div>
        </Card>

        <p className="text-center text-xl text-white/70 font-semibold mt-8 drop-shadow-lg">
          💻 Spelare kan också gå till {window.location.origin} och ange koden manuellt
        </p>
      </div>
    </div>
  );
}
