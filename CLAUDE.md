# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HITSTER AI is a real-time multiplayer music timeline game built with React/TypeScript and Express. Players compete by correctly placing songs chronologically on a timeline. The game features AI-driven music selection, contextual DJ commentary with voice synthesis, and Spotify integration for full-track playback.

**Key characteristics:**
- Swedish-language first (all UI, prompts, commentary)
- Master/player device architecture (one controls, many play via QR code join)
- Real-time synchronization via Socket.io
- AI-powered content generation throughout gameplay

## Common Development Commands

### Development
```bash
npm run dev              # Start development server (runs server with tsx)
npm run build            # Build client (Vite) + server (esbuild)
npm start                # Start production build
npm run check            # TypeScript type checking
```

### Database
```bash
npm run db:push          # Push schema changes to database (Drizzle)
```

### Environment Requirements
The application requires these environment variables:
- `OPENROUTER_API_KEY` - For AI services (Gemini chat, Claude song generation/DJ commentary)
- `ELEVENLABS_API_KEY` - For Swedish text-to-speech (DJ commentary)
- `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` / `SPOTIFY_REDIRECT_URI` - For Spotify OAuth and playback
- `DATABASE_URL` - PostgreSQL connection string (Neon serverless)

## Architecture Overview

### Monorepo Structure
```
client/               # React/TypeScript frontend
├── src/
│   ├── pages/       # Page components (Home, Master, Player)
│   ├── components/  # Reusable UI components
│   ├── hooks/       # Custom React hooks
│   └── lib/         # Utility functions
server/              # Express backend
├── ai.ts            # OpenRouter integration (song generation)
├── elevenlabs.ts    # Text-to-speech for DJ commentary
├── spotify.ts       # Spotify API wrapper
├── spotifyAuth.ts   # OAuth flow handlers
├── game.ts          # Game class (state management)
├── gameManager.ts   # Singleton managing multiple games
├── socketHandlers.ts # Socket.io event handlers
└── routes.ts        # Express HTTP routes
shared/              # Shared TypeScript types
├── types.ts         # Game state, socket events, player/song interfaces
└── schema.ts        # Drizzle ORM database schema
```

### Path Aliases (Vite config)
- `@/` → `client/src/`
- `@shared/` → `shared/`
- `@assets/` → `attached_assets/`

### Real-time Communication Flow

**Socket.io Events** (defined in `shared/types.ts:SocketEvents`):

1. **Game Creation**: `createGame` → master gets `gameCreated` with game ID
2. **Player Join**: Players scan QR code → `joinGame` (with persistentId) → all receive `gameStateUpdate`
3. **Player Reconnection**: Player returns → `reconnectPlayer` (with persistentId) → receives `playerReconnected` → all receive `gameStateUpdate`
4. **AI Music Chat**: Master chats → `aiChat` → AI generates song list → `confirmPreferences` → Spotify searches songs → `preferencesConfirmed`
5. **Gameplay**: `startGame` → players `placeCard` → when all ready → auto `revealResults` → `djCommentary` (audio) → `nextRound`
6. **Winner**: After 10 correct placements, phase changes to 'finished'
7. **Disconnection**: Player disconnects → `playerDisconnected` → all receive notification → player marked as disconnected but kept in game

### Game State Management

**Phase Flow** (`shared/types.ts:GameState.phase`):
1. `setup` - Master in AI chat, selecting music preferences
2. `lobby` - QR code shown, players joining
3. `playing` - Active round, players placing cards
4. `reveal` - Results shown, DJ commentary plays
5. `finished` - Winner declared

**Server Authority**: Game state lives in `server/game.ts` and is synchronized to all clients via Socket.io. Clients never modify state directly.

### AI Integration Pipeline

**Three AI Systems:**

1. **Music Preference Chat** (OpenRouter → Google Gemini 2.5 Pro)
   - Location: `server/socketHandlers.ts:aiChat`
   - Natural language interaction for music preferences
   - Generates 20 song suggestions with years (1950-2024)
   - Includes optional film/movie context for soundtracks
   - Generates trivia (10-20 words per song) matching music theme

2. **Song Validation** (Spotify Web API)
   - Location: `server/spotify.ts`
   - Searches Spotify for each AI-suggested song
   - Matches year (±2 years tolerance)
   - Fetches track URI, album cover, preview URL
   - Requires ≥10 successful matches to proceed

3. **DJ Commentary** (OpenRouter → Claude Sonnet 4.5 + ElevenLabs)
   - Location: `server/elevenlabs.ts:generateCommentary`
   - Triggered automatically after all players place cards
   - Receives: music preferences, song details (including trivia), round results, game history
   - Generates contextual Swedish commentary (20-30 words max)
   - Includes winner announcement if player reaches 10 points
   - Text-to-speech via ElevenLabs "Adam" voice
   - Audio sent as base64 to clients

### Spotify Integration

**OAuth Flow** (`server/spotifyAuth.ts`):
- `/api/spotify/login` → Spotify authorization with state validation
- `/api/spotify/callback` → Token exchange, stores refresh token in database
- `/api/spotify/status` → Check connection status
- CSRF protection via state parameter

**Playback** (`server/spotify.ts`):
- Requires Spotify Premium for full-track playback
- Uses Spotify Web Playback SDK on master device
- Automatically pauses during DJ commentary
- Track URIs stored in game state for playback control

### Database Schema

**Current Tables** (`shared/schema.ts`):
- `users` - Basic user authentication (id, username, password)
- `spotify_credentials` - OAuth tokens (refresh_token, access_token, expiresAt)

**Game State**: Stored in-memory only (not persisted to database). Games are ephemeral sessions.

## Key Implementation Patterns

### Type-Safe Socket Communication
Socket events are fully typed via `shared/types.ts:SocketEvents`. When adding new events:
1. Define event types in `SocketEvents` interface
2. Implement server handler in `server/socketHandlers.ts`
3. Emit events with proper typing from client

### Player Timeline Logic
Each player maintains a chronological timeline of songs (`Player.timeline`). Placement validation:
- Player chooses position (0 = before all cards, n = after nth card)
- Correct if song year fits chronologically (or within existing cards if equal years)
- Scoring: +1 for correct, 0 for incorrect
- Win condition: First to 10 points

### Component Architecture
- **Master Device** (`client/src/pages/MasterPage.tsx`): Orchestrates game flow, shows QR code, controls Spotify, displays all player states
- **Player Device** (`client/src/pages/PlayerPage.tsx`): Personal timeline view, card placement interface, score display
- **Shared Components**: `AIChat`, `GameControl`, `Timeline`, `RevealScreen`, `WinnerScreen`

### UI/UX Conventions
- **Typography**: Poppins (headings/body), JetBrains Mono (years/scores)
- **Styling**: Tailwind CSS with heavy use of rounded corners (rounded-2xl, rounded-3xl)
- **Colors**: Energetic gradients, vibrant gaming aesthetic (see `design_guidelines.md`)
- **Components**: shadcn/ui (Radix UI primitives) for accessible, consistent UI

## Common Development Tasks

### Adding a New AI Prompt
1. Update system prompt in `server/ai.ts` or `server/elevenlabs.ts`
2. Ensure Swedish language in all prompts
3. For DJ commentary: keep response under 30 words to maintain pacing

### Modifying Game Phases
1. Update `shared/types.ts:GameState.phase` union type
2. Add phase logic in `server/game.ts`
3. Update UI conditionals in master/player pages
4. Emit `gameStateUpdate` to synchronize all clients

### Extending Song Metadata
1. Add field to `shared/types.ts:Song` interface
2. Update AI generation prompts to include new field
3. Modify Spotify search logic in `server/spotify.ts` if needed
4. Update UI components to display new field

### Testing Multiplayer Locally
1. Run `npm run dev`
2. Open master device: `http://localhost:5000/master`
3. Scan QR code with phone or open player URL in another browser tab
4. For multiple players: use multiple browser windows/devices

## Deployment

The project is configured for Replit deployment (`.replit` file):
- Build command: `npm run build`
- Start command: `npm run start`
- Ports: 5000 (main), 42289 (dev server)
- Autoscale deployment target

## Player Reconnection System

**Overview**: Players can seamlessly reconnect if they lose connection or accidentally close their browser.

**Implementation Details**:
- Each player receives a `persistentId` stored in localStorage when joining
- Session info (gameCode, playerName, persistentId) cached for 2 hours
- Disconnected players marked as `connected: false` but remain in game
- Only connected players count toward "all ready" checks
- Disconnected players shown with gray overlay and "Frånkopplad" badge on master

**Reconnection Flow**:
1. Player page checks localStorage on mount
2. If session found, shows "Välkommen Tillbaka!" screen with saved game info
3. Player clicks "Återanslut till Spel" → `reconnectPlayer` event
4. Server updates player's socket ID and sets `connected: true`
5. Player receives full game state and resumes from current position

**Session Management** (`client/src/lib/socket.ts`):
- `savePlayerSession()` - Save after successful join
- `getPlayerSession()` - Retrieve on page load
- `clearPlayerSession()` - Clear when starting new game
- Sessions expire after 2 hours

**Edge Cases Handled**:
- Invalid persistentId → error message
- Game no longer exists → error message
- Master disconnect → game ends (no reconnection)
- Multiple reconnection attempts → latest socket ID wins

## Important Notes

### Swedish Language Requirements
All user-facing text must be in Swedish with natural, conversational tone. This includes:
- UI labels and instructions
- AI chat responses
- DJ commentary
- Error messages

### Performance Considerations
- DJ commentary generation is synchronous and blocks game flow (~2-3 seconds)
- Spotify search can timeout if too many songs fail to match
- WebSocket reconnection handling is critical for smooth multiplayer
- Audio playback uses Howler.js for reliable cross-browser support

### Known Limitations
- Games are not persisted to database (in-memory only, but players can reconnect)
- Spotify Premium required for full-track playback
- DJ commentary limited to Swedish (ElevenLabs voice "Adam")
- Reconnection sessions expire after 2 hours
