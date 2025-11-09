import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { User, Palette, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface PlayerProfile {
  id: string;
  displayName: string;
  avatarColor: string;
  createdAt: string;
  lastUsedAt: string;
}

interface ProfileSetupProps {
  onProfileReady: (profile: PlayerProfile | null) => void;
}

const PROFILE_ID_KEY = 'hitster_profile_id';

const PRESET_COLORS = [
  '#8B5CF6', // purple (default)
  '#EC4899', // pink
  '#10B981', // green
  '#3B82F6', // blue
  '#F59E0B', // orange
  '#EF4444', // red
  '#14B8A6', // teal
  '#FBBF24', // yellow
];

export default function ProfileSetup({ onProfileReady }: ProfileSetupProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadExistingProfile();
  }, []);

  const loadExistingProfile = async () => {
    try {
      const savedProfileId = localStorage.getItem(PROFILE_ID_KEY);
      
      if (savedProfileId) {
        const response = await fetch(`/api/profiles/${savedProfileId}`);
        
        if (response.ok) {
          const profile = await response.json();
          
          // Update lastUsedAt
          await fetch(`/api/profiles/${savedProfileId}/mark-used`, {
            method: 'POST',
          });
          
          onProfileReady(profile);
          return;
        } else {
          // Profile not found, clear invalid ID
          localStorage.removeItem(PROFILE_ID_KEY);
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProfile = async () => {
    if (!displayName.trim()) {
      toast({
        title: 'Namn krävs',
        description: 'Vänligen ange ett namn för din profil',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await apiRequest('POST', '/api/profiles', {
        displayName: displayName.trim(),
        avatarColor: selectedColor,
      });

      const profile = await response.json() as PlayerProfile;

      // Save profile ID to localStorage
      localStorage.setItem(PROFILE_ID_KEY, profile.id);

      toast({
        title: 'Profil skapad! ✓',
        description: `Välkommen ${profile.displayName}!`,
      });

      onProfileReady(profile);
    } catch (error) {
      console.error('Failed to create profile:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte skapa profil. Försök igen.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleContinueAsGuest = () => {
    onProfileReady(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-8 text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg text-muted-foreground">Laddar din profil...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <User className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Skapa Din Profil</h1>
          <p className="text-muted-foreground">
            Din profil sparas på enheten för snabbare uppkoppling
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <Label htmlFor="display-name" className="text-base mb-2 block">
              Ditt Namn
            </Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ange ditt namn"
              className="text-lg"
              data-testid="input-display-name"
              maxLength={20}
            />
          </div>

          <div>
            <Label className="text-base mb-3 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Välj Färg
            </Label>
            <div className="grid grid-cols-4 gap-3">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-full aspect-square rounded-lg transition-all hover-elevate active-elevate-2 ${
                    selectedColor === color
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                      : ''
                  }`}
                  style={{ backgroundColor: color }}
                  data-testid={`color-${color}`}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <Button
              size="lg"
              className="w-full"
              onClick={handleCreateProfile}
              disabled={isSaving || !displayName.trim()}
              data-testid="button-create-profile"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Skapar profil...
                </>
              ) : (
                'Skapa Profil'
              )}
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="w-full"
              onClick={handleContinueAsGuest}
              disabled={isSaving}
              data-testid="button-continue-guest"
            >
              Fortsätt som Gäst
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Med profil sparas ditt namn och favoritfärg för snabbare uppkoppling
          </p>
        </div>
      </Card>
    </div>
  );
}
