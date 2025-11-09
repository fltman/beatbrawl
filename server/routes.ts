import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { randomBytes } from "crypto";
import { setupSocketHandlers } from "./socketHandlers";
import { spotifyAuthService } from "./spotifyAuth";
import { storage } from "./storage";
import { insertPlayerProfileSchema, updatePlayerProfileSchema } from "@shared/schema";
import { aiProfileGenerator } from "./aiProfileGenerator";

export async function registerRoutes(app: Express): Promise<Server> {
  // Spotify OAuth endpoints
  app.get('/auth/spotify', (req: Request, res: Response) => {
    const state = randomBytes(32).toString('hex');
    req.session.spotifyOAuthState = state;
    const authUrl = spotifyAuthService.getAuthorizationUrl(state);
    res.redirect(authUrl);
  });

  app.get('/auth/spotify/callback', async (req: Request, res: Response) => {
    const { code, error, state } = req.query;

    if (error || !code) {
      return res.redirect('/?error=spotify_auth_failed');
    }

    if (!state || state !== req.session.spotifyOAuthState) {
      console.error('OAuth state mismatch - possible CSRF attack');
      return res.redirect('/?error=spotify_csrf_detected');
    }

    delete req.session.spotifyOAuthState;

    try {
      const { accessToken, refreshToken, expiresIn } = await spotifyAuthService.handleCallback(code as string);
      
      req.session.spotifyAccessToken = accessToken;
      req.session.spotifyRefreshToken = refreshToken;
      req.session.spotifyTokenExpiry = Date.now() + expiresIn * 1000;

      res.redirect('/?spotify_connected=true');
    } catch (error) {
      console.error('Spotify OAuth callback error:', error);
      res.redirect('/?error=spotify_token_failed');
    }
  });

  app.get('/api/spotify/status', (req: Request, res: Response) => {
    const isConnected = !!(req.session.spotifyAccessToken && 
                          req.session.spotifyTokenExpiry && 
                          req.session.spotifyTokenExpiry > Date.now());
    
    res.json({ connected: isConnected });
  });

  app.get('/api/spotify/token', async (req: Request, res: Response) => {
    if (!req.session.spotifyAccessToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (req.session.spotifyTokenExpiry && req.session.spotifyTokenExpiry < Date.now()) {
      if (req.session.spotifyRefreshToken) {
        try {
          const { accessToken, expiresIn } = await spotifyAuthService.refreshAccessToken(req.session.spotifyRefreshToken);
          req.session.spotifyAccessToken = accessToken;
          req.session.spotifyTokenExpiry = Date.now() + expiresIn * 1000;
        } catch (error) {
          console.error('Token refresh failed:', error);
          return res.status(401).json({ error: 'Token refresh failed' });
        }
      } else {
        return res.status(401).json({ error: 'Token expired' });
      }
    }

    res.json({ accessToken: req.session.spotifyAccessToken });
  });

  app.post('/api/spotify/disconnect', (req: Request, res: Response) => {
    req.session.spotifyAccessToken = undefined;
    req.session.spotifyRefreshToken = undefined;
    req.session.spotifyTokenExpiry = undefined;
    
    res.json({ success: true });
  });

  // AI Chat endpoint
  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      const { message, conversationHistory } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'AI service not configured' });
      }

      const messages = [
        {
          role: 'system' as const,
          content: `Du är en entusiastisk och hjälpsam AI-spelledare för musikspelet HITSTER. Din uppgift är att hjälpa spelarna formulera sina musikpreferenser genom en trevlig konversation.

VIKTIGT: Du ska ALDRIG nämna eller avslöja vilka låtar som kommer att spelas i ditt chattsvar. Du hjälper bara användaren att beskriva vad de vill ha.

Beteende:
- Var vänlig, kort och entusiastisk
- Ställ följdfrågor om användaren är osäker
- Ge konkreta förslag baserat på deras svar
- Håll svaren korta (2-3 meningar max)
- Tala naturlig svenska
- Fokusera på att hjälpa dem BESKRIVA vad de vill ha, inte vad de kommer FÅ

Exempel på bra interaktioner:
- Om de säger "80-tal" → "Coolt! Vill ni ha rock, pop, eller disco från 80-talet?"
- Om de säger "svensk musik" → "Nice! Vilken period eller genre kör vi? 90-talets pop eller kanske moderna hits?"

När de verkar nöjda med valet, säg något som "Perfekt! Klicka på Bekräfta så fixar jag resten!"

Du ska returnera JSON i detta exakta format:
{
  "message": "Ditt chattsvar här (som användaren ser)",
  "songs": [
    {
      "title": "Song Name", 
      "artist": "Artist Name", 
      "year": 1985, 
      "movie": "Film Title (om filmmusik)",
      "trivia": "En intressant fakta om låten som passar musiktemat"
    },
    ...
  ],
  "startYearRange": {"min": 1980, "max": 1989}
}

I "songs"-arrayen ska du baserat på konversationen välja 20 populära låtar som matchar vad användaren verkar vilja ha.
I "startYearRange" ska du välja ett lämpligt årsintervall för spelarnas startår baserat på musikvalet (t.ex. om de vill ha 80-talsmusik: min: 1980, max: 1989).

VIKTIGT: 
- Lägg BARA till låtar och startYearRange när användaren har gett tillräckligt med kontext. Vid första svaret kan du ha en tom array och null för startYearRange om användaren inte varit specifik nog ännu.
- Alla låtar måste vara UNIKA - ingen låt får förekomma två gånger i listan. Kontrollera att varje kombination av titel och artist är unik.
- Om det är filmmusik eller soundtracks: lägg till "movie"-fältet med filmens titel (t.ex. "movie": "Livet är en schlager"). Detta är FRIVILLIGT och ska endast inkluderas för filmmusik.
- För VARJE låt: lägg till "trivia"-fält med en kort (10-20 ord) intressant fakta/kuriosa om låten som tar hänsyn till användarens kontext. Till exempel: om de vill ha filmmusik, fokusera på filmen; om de vill ha 80-tal, nämn 80-talskontext; om svensk musik, nämn svensk popkultur osv. Var specifik och relevant för just den låten.`
        },
        ...(conversationHistory || []),
        { role: 'user' as const, content: message }
      ];

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://hitster-ai.replit.app',
          'X-Title': 'HITSTER AI'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-pro',
          messages,
          temperature: 0.8
        })
      });

      if (!response.ok) {
        console.error('OpenRouter API error:', response.status);
        return res.status(500).json({ error: 'AI service error' });
      }

      const data = await response.json();
      const aiContent = data.choices[0]?.message?.content;

      if (!aiContent) {
        return res.status(500).json({ error: 'No response from AI' });
      }

      // Parse JSON response - remove markdown code blocks if present
      try {
        // Remove markdown code blocks (```json and ```)
        let cleanedContent = aiContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        
        const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          // Fallback if no JSON
          return res.json({ 
            response: aiContent,
            songs: []
          });
        }

        const parsed = JSON.parse(jsonMatch[0]);
        res.json({ 
          response: parsed.message || aiContent,
          songs: parsed.songs || [],
          startYearRange: parsed.startYearRange || null
        });
      } catch (parseError) {
        // Fallback if JSON parsing fails
        console.error('Failed to parse AI JSON:', parseError);
        res.json({ 
          response: aiContent,
          songs: []
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Player Profile endpoints
  app.get('/api/profiles/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const profile = await storage.getPlayerProfile(id);
      
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      
      res.json(profile);
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/profiles', async (req: Request, res: Response) => {
    try {
      const validated = insertPlayerProfileSchema.parse(req.body);
      const profile = await storage.createPlayerProfile(validated);
      
      res.status(201).json(profile);
    } catch (error: any) {
      console.error('Create profile error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid profile data', details: error.errors });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.patch('/api/profiles/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validated = updatePlayerProfileSchema.parse(req.body);
      const profile = await storage.updatePlayerProfile(id, validated);
      
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      
      res.json(profile);
    } catch (error: any) {
      console.error('Update profile error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid profile data', details: error.errors });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/profiles/:id/mark-used', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.updateLastUsed(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Mark profile used error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // AI Profile Generation endpoint
  app.post('/api/profiles/generate-ai', async (req: Request, res: Response) => {
    try {
      const { name, photoBase64 } = req.body;

      if (!name || !photoBase64) {
        return res.status(400).json({ error: 'Name and photo are required' });
      }

      console.log(`Generating AI profile for: ${name}`);

      const result = await aiProfileGenerator.generateProfile(name, photoBase64);

      res.json(result);
    } catch (error: any) {
      console.error('AI profile generation error:', error);
      res.status(500).json({
        error: 'Failed to generate AI profile',
        details: error.message
      });
    }
  });

  const httpServer = createServer(app);

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === "production" 
        ? false 
        : ["http://localhost:5000", "http://localhost:5173"],
      credentials: true
    }
  });

  setupSocketHandlers(io);

  return httpServer;
}
