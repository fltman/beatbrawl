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
          title: 'Profile Updated! ✨',
          description: aiGeneratedProfile
            ? `Your new profile: ${aiGeneratedProfile.artistName}!`
            : 'Profile has been updated!',
        });
      } else {
        const response = await apiRequest('POST', '/api/profiles', profileData);
        profile = await response.json() as PlayerProfile;

        // Save profile ID to localStorage
        localStorage.setItem(PROFILE_ID_KEY, profile.id);

        toast({
          title: 'Profile Created! ✓',
          description: aiGeneratedProfile
            ? `Welcome ${aiGeneratedProfile.artistName}!`
            : `Welcome ${profile.displayName}!`,
        });
      }

      onProfileReady(profile);
    } catch (error) {
      console.error('Failed to create profile:', error);
      toast({
        title: 'Error',
        description: 'Could not create profile. Please try again.',
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
        title: 'Image Processing Error',
        description: 'Could not process image. Try another image.',
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
        profileImage: result.profileImageUrl
      });

      toast({
        title: 'AI Profile Generated! ✨',
        description: `Artist Name: ${result.artistName}`,
        duration: 5000
      });
    } catch (error: any) {
      console.error('AI profile generation error:', error);
      toast({
        title: 'Could Not Generate Profile',
        description: 'Try again or continue without AI',
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
      <div
        className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: 'url(/fltman_red_abackground_black_illustrated_speakers_low_angle_pe_3c6fccde-fd77-41bb-a28a-528037b87b37_0.png)' }}
      >
        <div className="absolute inset-0 bg-black/40 z-0"></div>

        {/* BeatBrawl Logo - Upper Left */}
        <div className="absolute top-8 left-8 z-50">
          <img
            src="/beatbrawl.png"
            alt="BeatBrawl Logo"
            className="h-24 w-auto"
          />
        </div>

        <Card className="w-full max-w-md p-10 bg-black border-4 border-white shadow-2xl relative z-30 text-center">
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-red-500" />
          <p className="text-xl text-white font-bold">Loading your profile...</p>
        </Card>
      </div>
    );
  }

  // Show existing profile with options
  if (existingProfile && !showRecreateOptions) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: 'url(/fltman_red_abackground_black_illustrated_speakers_low_angle_pe_3c6fccde-fd77-41bb-a28a-528037b87b37_0.png)' }}
      >
        <div className="absolute inset-0 bg-black/40 z-0"></div>

        {/* BeatBrawl Logo - Upper Left */}
        <div className="absolute top-8 left-8 z-50">
          <img
            src="/beatbrawl.png"
            alt="BeatBrawl Logo"
            className="h-24 w-auto"
          />
        </div>

        <Card className="w-full max-w-md p-10 bg-black border-4 border-white shadow-2xl relative z-30">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full mb-6 border-4 border-white shadow-xl"
                 style={{ backgroundColor: existingProfile.avatarColor }}>
              {existingProfile.profileImage ? (
                <img
                  src={existingProfile.profileImage}
                  alt="Profil"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-16 h-16 text-white" />
              )}
            </div>
            <h1 className="text-4xl font-black mb-4 text-white" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
              WELCOME BACK!
            </h1>
            <p className="text-2xl text-white font-bold mb-2">{existingProfile.displayName}</p>
            {existingProfile.artistName && (
              <p className="text-white/70 text-lg italic mb-2">
                aka "{existingProfile.artistName}"
              </p>
            )}
            {existingProfile.musicStyle && (
              <p className="text-white/60 text-base">
                Music Style: {existingProfile.musicStyle}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full text-xl py-6 bg-red-500 hover:bg-red-600 text-white font-black border-4 border-white"
              onClick={handleContinueWithExisting}
            >
              Continue with This Profile
            </Button>

            <Button
              size="sm"
              className="w-full text-white/60 hover:text-white bg-transparent hover:bg-white/10"
              onClick={handleDeleteProfile}
            >
              Delete Profile & Create New
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: 'url(/fltman_red_abackground_black_illustrated_speakers_low_angle_pe_3c6fccde-fd77-41bb-a28a-528037b87b37_0.png)' }}
    >
      <div className="absolute inset-0 bg-black/40 z-0"></div>

      {/* BeatBrawl Logo - Upper Left */}
      <div className="absolute top-8 left-8 z-20">
        <img
          src="/beatbrawl.png"
          alt="BeatBrawl Logo"
          className="h-24 w-auto"
        />
      </div>

      <Card className="w-full max-w-md p-10 bg-black border-4 border-white shadow-2xl relative z-30">

        <div className="space-y-6">
          <div>
            <Label htmlFor="display-name" className="text-lg mb-2 block text-white font-bold">
              Your Name
            </Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
              className="text-lg bg-white text-black border-2 border-white h-12"
              data-testid="input-display-name"
              maxLength={20}
            />
          </div>

          {/* Photo Upload Section */}
          <div>
            <Label className="text-lg mb-3 block text-white font-bold">
              Upload Photo (Optional)
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
                className="w-full h-32 border-2 border-dashed border-white bg-white/10 hover:bg-white/20 text-white"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-white" />
                  <p className="text-sm font-bold">Click to upload photo</p>
                </div>
              </Button>
            ) : (
              <div className="relative">
                <img
                  src={uploadedPhoto}
                  alt="Uploaded"
                  className="w-full h-48 object-cover rounded-2xl border-4 border-white"
                />
                <Button
                  type="button"
                  size="sm"
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white border-2 border-white font-bold"
                  onClick={() => {
                    setUploadedPhoto(null);
                    setAiGeneratedProfile(null);
                    setShowAIOption(false);
                  }}
                >
                  Change
                </Button>
              </div>
            )}
          </div>

          {/* AI Generation Button */}
          {showAIOption && !aiGeneratedProfile && (
            <Button
              type="button"
              className="w-full text-xl py-6 bg-red-500 hover:bg-red-600 text-white font-black border-4 border-white"
              onClick={handleGenerateAIProfile}
              disabled={isGeneratingAI || !displayName.trim()}
            >
              {isGeneratingAI ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Create Profile
                </>
              )}
            </Button>
          )}

          {/* AI Generated Profile Display */}
          {aiGeneratedProfile && (
            <Card className="p-6 bg-white/10 border-2 border-white">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={aiGeneratedProfile.profileImage}
                  alt="AI-generated avatar"
                  className="w-24 h-24 rounded-full object-cover border-4 border-white"
                />
                <div className="flex-1">
                  <p className="text-sm text-white/70 font-bold">Artist Name</p>
                  <p className="text-2xl font-black text-white">{aiGeneratedProfile.artistName}</p>
                  <p className="text-sm text-white/70 font-bold mt-2">Music Style</p>
                  <p className="text-lg text-white">{aiGeneratedProfile.musicStyle}</p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                className="w-full bg-white/20 hover:bg-white/30 text-white border-2 border-white font-bold"
                onClick={handleRegenerateAI}
                disabled={isGeneratingAI}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate
              </Button>
            </Card>
          )}

          <div className="pt-4 space-y-3">
            {/* Only show Save button after AI profile is generated */}
            {aiGeneratedProfile && (
              <Button
                size="lg"
                className="w-full text-xl py-6 bg-red-500 hover:bg-red-600 text-white font-black border-4 border-white"
                onClick={handleCreateProfile}
                disabled={isSaving}
                data-testid="button-create-profile"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            )}

            <Button
              size="lg"
              className="w-full text-lg py-4 bg-white/20 hover:bg-white/30 text-white font-bold border-2 border-white"
              onClick={handleContinueAsGuest}
              disabled={isSaving}
              data-testid="button-continue-guest"
            >
              Continue as Guest
            </Button>
          </div>

        </div>
      </Card>
    </div>
  );
}
