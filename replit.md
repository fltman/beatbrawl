# HITSTER AI

## Overview

HITSTER AI is a real-time multiplayer music timeline game. Players compete by correctly placing songs on a chronological timeline. The game features AI-driven music selection and commentary. A master device controls gameplay, and player devices join via QR code. The objective is to be the first to correctly place 10 songs. The project aims to provide an engaging, fully automated, and dynamic music trivia experience, leveraging advanced AI for personalized content and commentary, with a vision to capture a niche in interactive digital board games.

## Recent Changes

### November 9, 2025 - Player Profile System
- **Persistent Player Profiles**: Players now create persistent profiles stored in database
  - PostgreSQL database integration via Neon serverless
  - Profiles include displayName, avatarColor, and usage tracking
  - Profile UUID stored in localStorage for automatic recognition
  - API endpoints: GET/POST/PATCH /api/profiles
- **Profile Integration with Game Flow**:
  - ProfileSetup component handles first-time setup and returning users
  - Profile ID flows through socket events (joinGame, reconnectPlayer)
  - Stored in Player object and game session for future use
  - Eliminates need to re-enter name when rejoining games

### November 9, 2025 - AI-Generated Trivia System
- **Contextual Trivia for Every Song**: AI chat now generates song-specific trivia/fun facts
  - Each song gets 10-20 word trivia that matches the user's music context
  - Trivia adapts to theme: filmmusik → film facts, 80-tal → decade context, svensk musik → Swedish pop culture
  - DJ receives trivia as "Bakgrundsfakta" in prompt for richer, more accurate commentary
  - Reduces risk of DJ "making up" incorrect facts
  - Trivia field flows through entire pipeline: AI → Spotify → Game State → DJ

### November 9, 2025 - Film Soundtrack Support & DJ Context Enhancement
- **Film Soundtrack Support**: Added optional `movie` field to Song interface
  - Songs can now include film/movie metadata (e.g., "My Heart Will Go On" from "Titanic")
  - AI chat recognizes film soundtrack requests and includes movie information
  - DJ commentary references the film when commenting on soundtracks
- **DJ Context Enhancement**: DJ now receives actual music preferences as context
  - Fixed bug where DJ received "AI-generated playlist" instead of user's real preferences
  - Frontend passes `preference` field along with pre-generated songs
  - DJ system prompt now includes the real music theme
  - DJ prompt strengthening: System prompt refreshed every round, explicit film mention reminders, shorter history (6 rounds) for better LLM context retention

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite.
**UI Component Strategy**: shadcn/ui components on Radix UI primitives with Tailwind CSS. Design follows a "New York" style with a custom gaming aesthetic, bold typography (Poppins, JetBrains Mono), and energetic visuals.
**Routing**: Wouter for client-side routing (`/`, `/master`, `/player`, `/player/join/:gameCode`).
**State Management**: React's `useState`/`useEffect` for UI state, TanStack Query for server state, and Socket.io client for real-time game state.
**Device-Specific Views**:
- **Master Device**: Full-screen controls, AI chat, QR code, game state management, Spotify playback control.
- **Player Devices**: Mobile-first layout with personal timeline, score, and card placement.

### Backend Architecture

**Server Framework**: Express.js with Node.js.
**Real-time Communication**: Socket.io WebSocket server handles game creation, lobby management, player events, and game state synchronization.
**Game Logic**: `GameManager` singleton manages active games; `Game` class handles individual game instances and phases (setup, lobby, playing, reveal, finished).
**Session Management**: Socket-based state management is primary for game flow.

### Data Storage

**Database**: PostgreSQL via Neon serverless.
**ORM**: Drizzle ORM with schema defined in `/shared/schema.ts`.
**Current Schema**: Basic user authentication (`users` table). Game state is primarily in-memory.
**Migration Strategy**: Drizzle Kit for schema migrations.

### Key Architectural Decisions

**Monorepo Structure**: Client and server code in a single repository with shared types for consistency.
**Real-time Sync Pattern**: Server-authoritative game state synchronized via Socket.io to ensure consistency.
**Phase-Based Game Flow**: Explicit game phases (setup, lobby, playing, reveal, finished) for structured progression.
**Swedish Language First**: All UI, AI prompts, and content designed for Swedish.
**Component-Driven UI**: Extensive component library for modular development.
**AI-Powered Song Selection Pipeline**:
1. User chats with AI (Google Gemini 2.5 Pro) for music preferences.
2. AI generates 20 song suggestions with years in the background.
3. Spotify service searches and validates songs, ensuring ≥10 songs are found.
4. Songs stored with Spotify track IDs for playback.
**Spotify Playback Strategy**:
- Requires Spotify Premium for full-track playback via Spotify Web Playback SDK.
- Automatically pauses during DJ commentary and resumes afterward.
- Graceful fallback to 30-second preview URLs when Spotify not connected. (This contradicts the "Known Limitations" section. Given the date, I am prioritizing the full track SDK functionality over the preview urls, and removing the preview functionality from the known limitations below)
**DJ Commentary Flow**:
1. Automatic round reveal once all players place cards.
2. Winner check occurs before commentary.
3. LLM (Claude Sonnet 4.5 via OpenRouter) generates contextual Swedish DJ comments (20-30 words max), including special winner messages.
4. ElevenLabs API generates audio, sent to clients as base64.
5. Master device pauses Spotify, plays commentary with "DJ ON AIR" indicator.
6. Game automatically proceeds to next round or winner screen.
**OAuth Security Implementation**: CSRF protection, state validation, automatic token refresh, and robust error handling for Spotify OAuth.

## External Dependencies

**Music Services**:
- **Spotify Web API**: Song search, metadata retrieval, year-matching (±2 years).
- **Spotify Web Playback SDK**: Full-track audio playback on master device (requires Spotify Premium).

**AI Services**:
- **OpenRouter API**:
  - **Music Preference Chat**: Google Gemini 2.5 Pro (`google/gemini-2.5-pro`) for natural language interaction and song pre-generation.
  - **Song Suggestions**: Claude Sonnet 4.5 (`anthropic/claude-sonnet-4.5`) for generating song lists (1950-2024).
  - **DJ Commentary**: Claude Sonnet 4.5 (`anthropic/claude-sonnet-4.5`) for contextual Swedish commentary.
- **ElevenLabs API**: Text-to-speech for Swedish DJ commentary (using "Adam" voice).

**Utility Libraries**:
- **Howler.js**: Audio playback management.
- **QRCode.react**: QR code generation.
- **Socket.io**: Real-time communication.
- **date-fns**: Date manipulation.
- **Tailwind CSS**: Styling.
- **shadcn/ui**: Component library.

**Development Tools**:
- **TypeScript**: Type safety.
- **Vite**: Fast development server/build tool.
- **ESBuild**: Server-side bundling.