import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { randomBytes } from "crypto";
import { setupSocketHandlers } from "./socketHandlers";
import { spotifyAuthService } from "./spotifyAuth";

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

VIKTIGT: Du ska ALDRIG nämna eller avslöja vilka låtar som kommer att spelas. Du hjälper bara användaren att beskriva vad de vill ha.

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
- Ge konkreta förslag: "Ska vi fokusera på klassisk svensk pop eller vill ni ha mer blandning?"

När de verkar nöjda med valet, säg något som "Perfekt! Klicka på Bekräfta så fixar jag resten!" 

Använd ALDRIG fraser som "jag har valt", "jag har förberett", "låtarna är klara" eller liknande.`
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
          model: 'anthropic/claude-sonnet-4.5',
          messages,
          max_tokens: 200,
          temperature: 0.8
        })
      });

      if (!response.ok) {
        console.error('OpenRouter API error:', response.status);
        return res.status(500).json({ error: 'AI service error' });
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content;

      if (!aiResponse) {
        return res.status(500).json({ error: 'No response from AI' });
      }

      res.json({ response: aiResponse });
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ error: 'Internal server error' });
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
