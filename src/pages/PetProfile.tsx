import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Camera, Plus, X, MapPin, Locate, Settings, LogOut, Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/useTheme";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const PetProfile = () => {
  const [photos, setPhotos] = useState<string[]>([]);
  const [certificates, setCertificates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [petId, setPetId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    petName: "",
    ownerName: "",
    breed: "",
    age: "",
    gender: "",
    description: "",
    preferredBreeds: "",
    distance: "",
    minAge: "",
    maxAge: "",
    location: "",
    city: "",
    state: "",
    country: "",
    latitude: null as number | null,
    longitude: null as number | null
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  // Load existing pet profile if it exists
  useEffect(() => {
    if (user) {
      loadExistingProfile();
    }
  }, [user]);

  const loadExistingProfile = async () => {
    if (!user) return;
    
    try {
      const { data: pets, error } = await supabase
        .from('pets')
        .select(`
          *,
          pet_photos(*),
          pet_preferences(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (pets && pets.length > 0) {
        const pet = pets[0];
        setPetId(pet.id);
        setFormData({
          petName: pet.pet_name || "",
          ownerName: pet.owner_name || "",
          breed: pet.breed || "",
          age: pet.age?.toString() || "",
          gender: pet.gender || "",
          description: pet.description || "",
          preferredBreeds: pet.pet_preferences?.[0]?.preferred_breeds || "",
          distance: pet.pet_preferences?.[0]?.distance_range?.toString() || "",
          minAge: pet.pet_preferences?.[0]?.min_age?.toString() || "",
          maxAge: pet.pet_preferences?.[0]?.max_age?.toString() || "",
          location: pet.location || "",
          city: pet.city || "",
          state: pet.state || "",
          country: pet.country || "",
          latitude: pet.latitude,
          longitude: pet.longitude
        });
        
        const photoUrls = pet.pet_photos?.map((photo: any) => photo.photo_url) || [];
        setPhotos(photoUrls);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive"
      });
      return;
    }

    setLocationLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocoding to get address
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await response.json();
          
          const locationString = `${data.city || data.locality || 'Unknown City'}, ${data.principalSubdivision || data.countryName || 'Unknown'}`;
          
          setFormData(prev => ({
            ...prev,
            location: locationString,
            city: data.city || data.locality || '',
            state: data.principalSubdivision || '',
            country: data.countryName || '',
            latitude,
            longitude
          }));
          
          toast({
            title: "Location updated",
            description: `Location set to ${locationString}`
          });
        } catch (error) {
          console.error('Error getting address:', error);
          // Fallback to coordinates only
          setFormData(prev => ({
            ...prev,
            location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            latitude,
            longitude
          }));
          
          toast({
            title: "Location updated",
            description: "Location set using coordinates"
          });
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        setLocationLoading(false);
        
        let errorMessage = "Unable to get your location.";
        if (error.code === 1) {
          errorMessage = "Location access denied. Please enable location permissions.";
        } else if (error.code === 2) {
          errorMessage = "Location unavailable. Please try again.";
        } else if (error.code === 3) {
          errorMessage = "Location request timed out. Please try again.";
        }
        
        toast({
          title: "Location error",
          description: errorMessage,
          variant: "destructive"
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const uploadFile = async (file: File, bucket: string): Promise<string | null> => {
    if (!user) return null;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const addPhoto = async () => {
    if (photos.length >= 6) {
      toast({
        title: "Maximum photos reached",
        description: "You can only add up to 6 photos.",
        variant: "destructive"
      });
      return;
    }
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          setLoading(true);
          const photoUrl = await uploadFile(file, 'pet-photos');
          if (photoUrl) {
            setPhotos([...photos, photoUrl]);
            toast({
              title: "Photo uploaded",
              description: "Your pet photo has been uploaded successfully."
            });
          }
        } catch (error) {
          console.error('Error uploading photo:', error);
          toast({
            title: "Upload failed",
            description: "Failed to upload photo. Please try again.",
            variant: "destructive"
          });
        } finally {
          setLoading(false);
        }
      }
    };
    fileInput.click();
  };

  const removePhoto = async (index: number) => {
    const photoUrl = photos[index];
    setPhotos(photos.filter((_, i) => i !== index));
    
    // In a real app, you'd also delete from storage here
    toast({
      title: "Photo removed",
      description: "The photo has been removed from your profile."
    });
  };

  const addCertificate = async () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.jpg,.jpeg,.png';
    fileInput.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          setLoading(true);
          const certUrl = await uploadFile(file, 'pet-certificates');
          if (certUrl) {
            setCertificates([...certificates, certUrl]);
            toast({
              title: "Certificate uploaded",
              description: "Health certificate has been uploaded successfully."
            });
          }
        } catch (error) {
          console.error('Error uploading certificate:', error);
          toast({
            title: "Upload failed",
            description: "Failed to upload certificate. Please try again.",
            variant: "destructive"
          });
        } finally {
          setLoading(false);
        }
      }
    };
    fileInput.click();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "Please log in to save your profile.",
        variant: "destructive"
      });
      return;
    }

    // Validate required fields
    if (!formData.petName || !formData.ownerName) {
      toast({
        title: "Missing information",
        description: "Please fill in at least the pet name and owner name.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Save or update pet
      const petData = {
        user_id: user.id,
        pet_name: formData.petName,
        owner_name: formData.ownerName,
        breed: formData.breed || null,
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender || null,
        description: formData.description || null,
        location: formData.location || null,
        city: formData.city || null,
        state: formData.state || null,
        country: formData.country || null,
        latitude: formData.latitude,
        longitude: formData.longitude,
      };

      let currentPetId = petId;

      if (petId) {
        // Update existing pet
        const { error: petError } = await supabase
          .from('pets')
          .update(petData)
          .eq('id', petId);

        if (petError) throw petError;
      } else {
        // Create new pet
        const { data: newPet, error: petError } = await supabase
          .from('pets')
          .insert(petData)
          .select()
          .single();

        if (petError) throw petError;
        currentPetId = newPet.id;
        setPetId(currentPetId);
      }

      // Save pet photos
      if (currentPetId && photos.length > 0) {
        // Delete existing photos first
        await supabase
          .from('pet_photos')
          .delete()
          .eq('pet_id', currentPetId);

        // Insert new photos
        const photoData = photos.map((url, index) => ({
          pet_id: currentPetId,
          photo_url: url,
          is_primary: index === 0
        }));

        const { error: photoError } = await supabase
          .from('pet_photos')
          .insert(photoData);

        if (photoError) throw photoError;
      }

      // Save preferences
      if (currentPetId) {
        const preferencesData = {
          pet_id: currentPetId,
          preferred_breeds: formData.preferredBreeds || 'any',
          distance_range: formData.distance ? parseInt(formData.distance) : 25,
          min_age: formData.minAge ? parseInt(formData.minAge) : 1,
          max_age: formData.maxAge ? parseInt(formData.maxAge) : 10,
        };

        // Check if preferences exist
        const { data: existingPrefs } = await supabase
          .from('pet_preferences')
          .select('id')
          .eq('pet_id', currentPetId)
          .single();

        if (existingPrefs) {
          // Update existing preferences
          const { error: prefsError } = await supabase
            .from('pet_preferences')
            .update(preferencesData)
            .eq('pet_id', currentPetId);

          if (prefsError) throw prefsError;
        } else {
          // Create new preferences
          const { error: prefsError } = await supabase
            .from('pet_preferences')
            .insert(preferencesData);

          if (prefsError) throw prefsError;
        }
      }

      toast({
        title: "Profile saved",
        description: "Your pet profile has been saved successfully."
      });
      
      // Navigate back to discovery
      navigate('/discovery');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Save failed",
        description: "Failed to save profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Link to="/discovery">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold">Pet Profile</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <Settings className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover border-border">
            <DropdownMenuItem>
              <MapPin className="w-4 h-4 mr-2" />
              <span>Update Location</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            >
              {theme === 'light' ? <Moon className="w-4 h-4 mr-2" /> : <Sun className="w-4 h-4 mr-2" />}
              <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="p-4 space-y-6">
        {/* Photos Section */}
        <Card className="p-4 bg-gradient-card border-border">
          <h3 className="text-lg font-semibold mb-4">Photos</h3>
          <div className="grid grid-cols-3 gap-3">
            {photos.map((photo, index) => (
              <div key={index} className="relative aspect-square">
                <img
                  src={photo}
                  alt={`Pet photo ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  onClick={() => removePhoto(index)}
                  className="absolute -top-2 -right-2 bg-destructive rounded-full p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {photos.length < 6 && (
              <button
                onClick={addPhoto}
                className="aspect-square border-2 border-dashed border-border rounded-lg flex items-center justify-center hover:border-accent transition-colors"
              >
                <Plus className="w-6 h-6 text-muted-foreground" />
              </button>
            )}
          </div>
        </Card>

        {/* Basic Info */}
        <Card className="p-4 bg-gradient-card border-border">
          <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
          <div className="space-y-4">
            <Input 
              placeholder="Pet's name" 
              className="bg-secondary border-border"
              value={formData.petName}
              onChange={(e) => handleInputChange('petName', e.target.value)}
            />
            
            <Input 
              placeholder="Owner's name" 
              className="bg-secondary border-border"
              value={formData.ownerName}
              onChange={(e) => handleInputChange('ownerName', e.target.value)}
            />
            
            <Select value={formData.breed} onValueChange={(value) => handleInputChange('breed', value)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Breed" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50">
                <SelectItem value="golden-retriever">Golden Retriever</SelectItem>
                <SelectItem value="labrador">Labrador</SelectItem>
                <SelectItem value="persian-cat">Persian Cat</SelectItem>
                <SelectItem value="siamese-cat">Siamese Cat</SelectItem>
                <SelectItem value="bulldog">Bulldog</SelectItem>
              </SelectContent>
            </Select>

            <div className="grid grid-cols-2 gap-4">
              <Input 
                placeholder="Age (years)" 
                type="number" 
                className="bg-secondary border-border"
                value={formData.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
              />
              <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Textarea
              placeholder="Tell us about your pet's personality, traits, and what makes them special..."
              className="bg-secondary border-border min-h-[100px]"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
            />
          </div>
        </Card>

        {/* Location Section */}
        <Card className="p-4 bg-gradient-card border-border">
          <h3 className="text-lg font-semibold mb-4">Location</h3>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input 
                placeholder="Enter your location or city" 
                className="bg-secondary border-border flex-1"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
              />
              <Button
                onClick={getCurrentLocation}
                disabled={locationLoading}
                variant="outline"
                size="icon"
                className="border-border"
              >
                {locationLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                ) : (
                  <Locate className="w-4 h-4" />
                )}
              </Button>
            </div>
            {formData.location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{formData.location}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Click the location icon to use your current location, or manually enter your city/area.
            </p>
          </div>
        </Card>

        {/* Health & Verification */}
        <Card className="p-4 bg-gradient-card border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Health & Verification</h3>
            <Badge variant="secondary" className="bg-neon-green/20 text-neon-green border-neon-green">
              Verified
            </Badge>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Vaccination Records</label>
              <div className="grid grid-cols-2 gap-3">
                {certificates.map((cert, index) => (
                  <div key={index} className="relative">
                    <div className="aspect-[4/3] bg-secondary rounded-lg flex items-center justify-center border border-border">
                      <div className="text-center p-2">
                        <div className="w-8 h-8 mx-auto mb-1 bg-neon-green/20 rounded flex items-center justify-center">
                          <span className="text-neon-green text-xs">✓</span>
                        </div>
                        <span className="text-xs text-muted-foreground">Health Certificate</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setCertificates(certificates.filter((_, i) => i !== index))}
                      className="absolute -top-2 -right-2 bg-destructive rounded-full p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addCertificate}
                  className="aspect-[4/3] border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center hover:border-accent transition-colors"
                >
                  <Camera className="w-5 h-5 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Upload Document</span>
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Upload vaccination records, health certificates, and breeding documentation for verification.
              </p>
            </div>
          </div>
        </Card>

        {/* Preferences */}
        <Card className="p-4 bg-gradient-card border-border">
          <h3 className="text-lg font-semibold mb-4">Mate Preferences</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Preferred Breeds</label>
              <Select value={formData.preferredBreeds} onValueChange={(value) => handleInputChange('preferredBreeds', value)}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select preferred breeds" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  <SelectItem value="any">Any Breed</SelectItem>
                  <SelectItem value="same">Same Breed Only</SelectItem>
                  <SelectItem value="similar">Similar Breeds</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Distance Range</label>
              <Select value={formData.distance} onValueChange={(value) => handleInputChange('distance', value)}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select distance range" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  <SelectItem value="5">Within 5 miles</SelectItem>
                  <SelectItem value="10">Within 10 miles</SelectItem>
                  <SelectItem value="25">Within 25 miles</SelectItem>
                  <SelectItem value="50">Within 50 miles</SelectItem>
                  <SelectItem value="100">Within 100 miles</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Age Range</label>
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  placeholder="Min age" 
                  type="number" 
                  className="bg-secondary border-border"
                  value={formData.minAge}
                  onChange={(e) => handleInputChange('minAge', e.target.value)}
                />
                <Input 
                  placeholder="Max age" 
                  type="number" 
                  className="bg-secondary border-border"
                  value={formData.maxAge}
                  onChange={(e) => handleInputChange('maxAge', e.target.value)}
                />
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          <Button 
            className="w-full bg-gradient-primary hover:opacity-90 shadow-button"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Profile'}
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={async () => {
              await signOut();
              navigate('/onboarding');
            }}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PetProfile;