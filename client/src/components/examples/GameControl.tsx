import GameControl from '../GameControl'

export default function GameControlExample() {
  const mockPlayers = [
    { id: '1', name: 'Anna', score: 7, isReady: true, timeline: [], startYear: 1985 },
    { id: '2', name: 'Erik', score: 5, isReady: false, timeline: [], startYear: 1992 },
    { id: '3', name: 'Sofia', score: 6, isReady: true, timeline: [], startYear: 1978 },
  ];

  const mockSong = {
    id: '1',
    title: 'Dancing Queen',
    artist: 'ABBA',
    year: 1976,
    albumCover: 'https://picsum.photos/seed/album1/400/400'
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-4">Playing Phase (spelarna ser detta)</h2>
          <GameControl
            currentSong={mockSong}
            roundNumber={8}
            players={mockPlayers}
            phase="playing"
            onNextRound={() => console.log('Next round')}
          />
        </div>
      </div>
    </div>
  )
}
