import WinnerScreen from '../WinnerScreen'

export default function WinnerScreenExample() {
  const mockPlayers = [
    { id: '1', name: 'Anna', score: 10, isReady: true, connected: true, timeline: [], startYear: 1985 },
    { id: '2', name: 'Erik', score: 8, isReady: true, connected: true, timeline: [], startYear: 1992 },
    { id: '3', name: 'Sofia', score: 9, isReady: true, connected: true, timeline: [], startYear: 1978 },
  ];

  return (
    <WinnerScreen
      winner={mockPlayers[0]}
      allPlayers={mockPlayers}
      onNewGame={() => console.log('New game')}
    />
  )
}
