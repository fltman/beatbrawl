# BeatBrawl TV (tvOS)

Native Apple TV app that acts as the game **master** — it creates the game, shows the QR code, scoreboard, reveals and plays DJ commentary. Players still join with their phones via the web client, exactly like before.

## Architecture

```
Apple TV (this app) ──socket.io──┐
                                 ├── BeatBrawl server (game state, AI, ElevenLabs, Spotify OAuth)
Player phones (web, unchanged) ──┘
```

- The app is a Socket.io client speaking the same protocol as the web master (`shared/types.ts`).
- **Music playback** uses Spotify Connect: the app fetches an access token from the server (socket event `getSpotifyToken`, master-only) and tells the Spotify Web API to play on a chosen Connect device — e.g. the Spotify app on the same Apple TV, or any speaker.
- **DJ commentary** (base64 MP3 over the socket) plays through the TV speakers via AVAudioPlayer.
- **AI music chat** in the setup phase calls the server's `POST /api/chat`, same as the web.

## Requirements

- Xcode 16+ (tvOS 17 deployment target)
- The server must be reachable over **https** (default: `https://beatbrawl.bjarby.com`)
- Spotify must be connected once via the web app (the OAuth flow persists a refresh token in the database that this app uses)
- A Spotify Connect device to play on (e.g. the Spotify app installed on the Apple TV)

## Build & run

Open `tvos/BeatBrawlTV.xcodeproj` in Xcode and run on a tvOS simulator or Apple TV. Dependencies (socket.io-client-swift) resolve automatically via Swift Package Manager.

CLI build:

```bash
xcodebuild -project tvos/BeatBrawlTV.xcodeproj -scheme BeatBrawlTV \
  -destination 'generic/platform=tvOS Simulator' build
```

To run on a physical Apple TV you need an Apple Developer account and a development team set in Signing & Capabilities.

## Changing the server URL

The URL defaults to `https://beatbrawl.bjarby.com`. Override it via UserDefaults (e.g. in Xcode scheme arguments: `-serverURL https://other.example.com`). Note that plain `http://` for local dev requires an App Transport Security exception in the Info.plist.

## Game flow on the TV

1. **Setup** — describe the music in the AI chat (the Apple TV keyboard supports typing from your iPhone), then confirm.
2. **Lobby** — QR code appears; pick a Spotify Connect speaker; start the game when everyone joined.
3. **Playing** — mystery song plays on the chosen speaker; scoreboard shows who has placed their card.
4. **Reveal** — song + results shown, DJ commentary plays, next round starts automatically.
5. **Winner** — final scoreboard and "new game" button.
