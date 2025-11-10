import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Song } from '@/types/game.types';

interface CardPlacementProps {
  song: Song;
  selectedPosition: number | null;
  onConfirm?: () => void;
}

export default function CardPlacement({ song, selectedPosition, onConfirm }: CardPlacementProps) {
  const isSelected = selectedPosition !== null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-6">
      <div className="max-w-md mx-auto">
        <Button
          size="lg"
          className={`w-full text-xl py-8 font-black border-4 border-white shadow-2xl transition-all ${
            isSelected
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-gray-500 text-gray-300 cursor-not-allowed'
          }`}
          disabled={!isSelected}
          onClick={onConfirm}
          data-testid="button-confirm-placement"
        >
          {isSelected ? 'Confirm Placement' : 'Choose a Position'}
        </Button>
      </div>
    </div>
  );
}
