import QRCodeDisplay from '../QRCodeDisplay'
import type { Player } from '@shared/types'

const mockPlayers: Player[] = [
  {
    id: '1',
    name: 'Anna',
    artistName: 'Pop Queen',
    avatarColor: '#FF6B9D',
    timeline: [],
    startYear: 1980,
    score: 0,
    isReady: false,
    connected: true
  },
  {
    id: '2',
    name: 'Erik',
    artistName: 'Rock Star',
    profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Erik',
    timeline: [],
    startYear: 1980,
    score: 0,
    isReady: false,
    connected: true
  },
  {
    id: '3',
    name: 'Lisa',
    avatarColor: '#4CAF50',
    timeline: [],
    startYear: 1980,
    score: 0,
    isReady: false,
    connected: true
  }
]

export default function QRCodeDisplayExample() {
  return (
    <QRCodeDisplay
      gameCode="ABC123"
      playerCount={3}
      players={mockPlayers}
      onStartGame={() => console.log('Starting game')}
    />
  )
}
