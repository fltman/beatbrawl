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
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: 'url(/fltman_red_abackground_black_illustrated_speakers_low_angle_pe_3c6fccde-fd77-41bb-a28a-528037b87b37_0.png)' }}
    >
      <div className="absolute inset-0 bg-black/40"></div>

      <div className="w-full max-w-3xl relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black mb-3 text-white">Väntar på Spelare</h1>
          <p className="text-2xl text-white/90 font-bold">Skanna QR-koden för att gå med</p>
        </div>

        <Card className="p-14 text-center bg-black border-4 border-white shadow-2xl">
          <div className="mb-8">
            <div className="inline-flex items-center gap-3 px-8 py-3 rounded-full bg-yellow-400 border-4 border-white mb-8 shadow-xl">
              <Users className="w-7 h-7 text-black" />
              <span className="font-mono font-black text-2xl text-black" data-testid="text-player-count">
                {playerCount} spelare anslutna
              </span>
            </div>
          </div>

          <div className="inline-block p-8 bg-white rounded-2xl shadow-2xl mb-8">
            <QRCodeSVG
              value={joinUrl}
              size={280}
              level="H"
              includeMargin={true}
            />
          </div>

          <div className="space-y-5">
            <div>
              <p className="text-lg text-white/80 font-bold mb-2">Spelkod</p>
              <Badge className="text-5xl font-mono font-black px-10 py-3 bg-yellow-400 text-black border-4 border-white shadow-2xl">
                {gameCode}
              </Badge>
            </div>

            <div className="pt-4">
              <Button
                size="lg"
                className="w-full text-xl py-7 bg-yellow-400 hover:bg-yellow-300 text-black font-black shadow-xl border-3 border-white"
                onClick={onStartGame}
                disabled={playerCount === 0}
                data-testid="button-start-game"
              >
                Starta Spel ({playerCount} spelare)
              </Button>
            </div>
          </div>
        </Card>

        <p className="text-center text-lg text-white/70 font-medium mt-6">
          Spelare kan också gå till {window.location.origin} och ange koden manuellt
        </p>
      </div>
    </div>
  );
}
