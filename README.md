# BeatBrawl

[![Support me on Patreon](https://img.shields.io/badge/Patreon-Support%20my%20work-FF424D?style=flat&logo=patreon&logoColor=white)](https://www.patreon.com/AndersBjarby)

Ett realtidsbaserat multiplayer-musikspel (Hitster-stil) där spelarna tävlar om att placera låtar i rätt kronologisk ordning på en tidslinje. En masterenhet styr spelet och spelare ansluter via QR-kod. Först till tio rätt placerade låtar vinner. AI sköter musikval, trivia och DJ-kommentarer, med svensk röstsyntes och full låtuppspelning via Spotify.

## Funktioner

- Master/spelare-arkitektur: en enhet styr, många ansluter via QR-kod
- Realtidssynkronisering via Socket.io
- AI-driven musikselektion och kontextuell trivia (anpassas efter tema, t.ex. filmmusik, 80-tal, svensk musik)
- DJ-kommentarer med ElevenLabs text-till-tal på svenska
- Spotify-integration (OAuth) för uppspelning av hela låtar
- Persistenta spelarprofiler i PostgreSQL
- Svenskt gränssnitt först (UI, prompts och kommentarer)

## Kom igång

Krävda miljövariabler: `OPENROUTER_API_KEY`, `ELEVENLABS_API_KEY`, `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REDIRECT_URI`, `DATABASE_URL`.

```bash
npm install
npm run db:push     # pusha databasschema (Drizzle)
npm run dev         # starta utvecklingsservern
npm run build       # bygg klient (Vite) + server (esbuild)
npm start           # kör produktionsbygget
npm run check       # TypeScript-typkontroll
```

## Teknik

React + TypeScript + Vite + Tailwind, Express, Socket.io, Drizzle ORM + PostgreSQL (Neon serverless), OpenRouter (AI), ElevenLabs (TTS), Spotify Web API.
