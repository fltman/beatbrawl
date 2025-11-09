import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { User, Palette, Loader2, Camera, Upload, Sparkles, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface PlayerProfile {
  id: string;
  displayName: string;
  avatarColor: string;
  artistName?: string;
  musicStyle?: string;
  profileImage?: string;
  originalPhoto?: string;
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
  const [existingProfile, setExistingProfile] = useState<PlayerProfile | null>(null);
  const [showRecreateOptions, setShowRecreateOptions] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [aiGeneratedProfile, setAiGeneratedProfile] = useState<{
    artistName: string;
    musicStyle: string;
    profileImage: string;
  } | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showAIOption, setShowAIOption] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

          // Show existing profile with options instead of auto-continuing
          setExistingProfile(profile);
          setIsLoading(false);
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

  const handleContinueWithExisting = () => {
    if (existingProfile) {
      onProfileReady(existingProfile);
    }
  };

  const handleRecreateProfile = () => {
    setShowRecreateOptions(true);
    setDisplayName(existingProfile?.displayName || '');
    setSelectedColor(existingProfile?.avatarColor || PRESET_COLORS[0]);
  };

  const handleDeleteProfile = () => {
    localStorage.removeItem(PROFILE_ID_KEY);
    setExistingProfile(null);
    setShowRecreateOptions(false);
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
      const profileData: any = {
        displayName: displayName.trim(),
        avatarColor: selectedColor,
      };

      // Include AI-generated data if available
      if (aiGeneratedProfile) {
        profileData.artistName = aiGeneratedProfile.artistName;
        profileData.musicStyle = aiGeneratedProfile.musicStyle;
        profileData.profileImage = aiGeneratedProfile.profileImage;
      }

      // Include original photo if uploaded
      if (uploadedPhoto) {
        profileData.originalPhoto = uploadedPhoto.split(',')[1]; // Remove data:image prefix
      }

      let profile: PlayerProfile;

      // If recreating existing profile, update it instead of creating new
      if (existingProfile && showRecreateOptions) {
        const response = await apiRequest('PATCH', `/api/profiles/${existingProfile.id}`, profileData);
        profile = await response.json() as PlayerProfile;

        toast({
          title: 'Profil uppdaterad! ✨',
          description: aiGeneratedProfile
            ? `Din nya profil: ${aiGeneratedProfile.artistName}!`
            : 'Profilen har uppdaterats!',
        });
      } else {
        const response = await apiRequest('POST', '/api/profiles', profileData);
        profile = await response.json() as PlayerProfile;

        // Save profile ID to localStorage
        localStorage.setItem(PROFILE_ID_KEY, profile.id);

        toast({
          title: 'Profil skapad! ✓',
          description: aiGeneratedProfile
            ? `Välkommen ${aiGeneratedProfile.artistName}!`
            : `Välkommen ${profile.displayName}!`,
        });
      }

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

  const resizeImage = (file: File, maxSize: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions maintaining aspect ratio
          if (width > height) {
            if (width > maxSize) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Convert to JPEG with 0.85 quality for good balance between size and quality
          const resizedBase64 = canvas.toDataURL('image/jpeg', 0.85);
          resolve(resizedBase64);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Ogiltigt filformat',
        description: 'Vänligen välj en bildfil',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Resize image to max 500px before uploading
      const resizedBase64 = await resizeImage(file, 500);
      setUploadedPhoto(resizedBase64);
      setShowAIOption(true);
    } catch (error) {
      console.error('Image resize error:', error);
      toast({
        title: 'Fel vid bildbehandling',
        description: 'Kunde inte bearbeta bilden. Försök med en annan bild.',
        variant: 'destructive'
      });
    }
  };

  const handleGenerateAIProfile = async () => {
    if (!displayName.trim() || !uploadedPhoto) {
      toast({
        title: 'Namn och foto krävs',
        description: 'Fyll i ditt namn och ladda upp ett foto först',
        variant: 'destructive'
      });
      return;
    }

    setIsGeneratingAI(true);
    try {
      // Extract base64 data from data URL
      const base64Data = uploadedPhoto.split(',')[1];

      const response = await apiRequest('POST', '/api/profiles/generate-ai', {
        name: displayName.trim(),
        photoBase64: base64Data
      });

      const result = await response.json();

      setAiGeneratedProfile({
        artistName: result.artistName,
        musicStyle: result.musicStyle,
        profileImage: result.profileImage
      });

      toast({
        title: 'AI-profil genererad! ✨',
        description: `Artistnamn: ${result.artistName}`,
        duration: 5000
      });
    } catch (error: any) {
      console.error('AI profile generation error:', error);
      toast({
        title: 'Kunde inte generera profil',
        description: 'Försök igen eller fortsätt utan AI',
        variant: 'destructive'
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleRegenerateAI = async () => {
    setAiGeneratedProfile(null);
    await handleGenerateAIProfile();
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

  // Show existing profile with options
  if (existingProfile && !showRecreateOptions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
                 style={{ backgroundColor: existingProfile.avatarColor }}>
              {existingProfile.profileImage ? (
                <img
                  src={`data:image/png;base64,${existingProfile.profileImage}`}
                  alt="Profil"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-white" />
              )}
            </div>
            <h1 className="text-3xl font-bold mb-2">Välkommen Tillbaka!</h1>
            <p className="text-xl">{existingProfile.displayName}</p>
            {existingProfile.artistName && (
              <p className="text-muted-foreground mt-1">
                aka "{existingProfile.artistName}"
              </p>
            )}
            {existingProfile.musicStyle && (
              <p className="text-sm text-muted-foreground mt-2">
                Musikstil: {existingProfile.musicStyle}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full"
              onClick={handleContinueWithExisting}
            >
              Fortsätt med Denna Profil
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="w-full"
              onClick={handleRecreateProfile}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Uppdatera med AI-Avatar
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={handleDeleteProfile}
            >
              Radera Profil & Skapa Ny
            </Button>
          </div>
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
          <h1 className="text-3xl font-bold mb-2">
            {showRecreateOptions ? 'Uppdatera Din Profil' : 'Skapa Din Profil'}
          </h1>
          <p className="text-muted-foreground">
            {showRecreateOptions
              ? 'Ladda upp ett foto för att få en AI-genererad tecknad avatar'
              : 'Din profil sparas på enheten för snabbare uppkoppling'}
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

          {/* Photo Upload Section */}
          <div>
            <Label className="text-base mb-3 block">
              Ladda upp foto (valfritt - för AI-profil)
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            {!uploadedPhoto ? (
              <Button
                type="button"
                variant="outline"
                className="w-full h-32 border-2 border-dashed"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm">Klicka för att ladda upp foto</p>
                </div>
              </Button>
            ) : (
              <div className="relative">
                <img
                  src={uploadedPhoto}
                  alt="Uppladdad"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setUploadedPhoto(null);
                    setAiGeneratedProfile(null);
                    setShowAIOption(false);
                  }}
                >
                  Ändra
                </Button>
              </div>
            )}
          </div>

          {/* AI Generation Button */}
          {showAIOption && !aiGeneratedProfile && (
            <Button
              type="button"
              variant="default"
              className="w-full"
              onClick={handleGenerateAIProfile}
              disabled={isGeneratingAI || !displayName.trim()}
            >
              {isGeneratingAI ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Genererar AI-profil...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generera AI-profil
                </>
              )}
            </Button>
          )}

          {/* AI Generated Profile Display */}
          {aiGeneratedProfile && (
            <Card className="p-4 bg-gradient-to-r from-primary/10 to-accent/10">
              <div className="flex items-center gap-4">
                <img
                  src={`data:image/png;base64,${aiGeneratedProfile.profileImage}`}
                  alt="AI-genererad avatar"
                  className="w-24 h-24 rounded-full object-cover"
                />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Artistnamn</p>
                  <p className="text-xl font-bold">{aiGeneratedProfile.artistName}</p>
                  <p className="text-sm text-muted-foreground mt-1">Musikstil</p>
                  <p className="text-base">{aiGeneratedProfile.musicStyle}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full mt-3"
                onClick={handleRegenerateAI}
                disabled={isGeneratingAI}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Generera ny profil
              </Button>
            </Card>
          )}

          {/* Only show color picker if no AI profile */}
          {!aiGeneratedProfile && (
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
          )}

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
