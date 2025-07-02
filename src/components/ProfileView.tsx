import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, MapPin, Heart, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ProfileViewProps {
  isOpen: boolean;
  onClose: () => void;
  petId: string | null;
  onLike?: (petId: string) => void;
  showLikeButton?: boolean;
}

interface PetProfile {
  id: string;
  pet_name: string;
  owner_name: string;
  breed: string;
  age: number;
  gender: string;
  description: string;
  location: string;
  verified: boolean;
  pet_photos: { photo_url: string; is_primary: boolean }[];
  pet_preferences: {
    preferred_breeds: string;
    distance_range: number;
    min_age: number;
    max_age: number;
  }[];
}

const ProfileView = ({ isOpen, onClose, petId, onLike, showLikeButton = false }: ProfileViewProps) => {
  const [profile, setProfile] = useState<PetProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    if (isOpen && petId) {
      loadProfile();
    }
  }, [isOpen, petId]);

  const loadProfile = async () => {
    if (!petId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pets')
        .select(`
          *,
          pet_photos(*),
          pet_preferences(*)
        `)
        .eq('id', petId)
        .single();

      if (error) throw error;
      setProfile(data);
      setCurrentPhotoIndex(0);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevPhoto = () => {
    if (!profile) return;
    setCurrentPhotoIndex((prev) => 
      prev === 0 ? profile.pet_photos.length - 1 : prev - 1
    );
  };

  const handleNextPhoto = () => {
    if (!profile) return;
    setCurrentPhotoIndex((prev) => 
      prev === profile.pet_photos.length - 1 ? 0 : prev + 1
    );
  };

  const handleLike = () => {
    if (profile && onLike) {
      onLike(profile.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto bg-gradient-card border-border p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : profile ? (
          <div className="relative">
            {/* Photo Carousel */}
            <div className="relative h-96 bg-muted">
              {profile.pet_photos.length > 0 ? (
                <div className="relative h-full">
                  <img
                    src={profile.pet_photos[currentPhotoIndex]?.photo_url || 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop'}
                    alt={profile.pet_name}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Photo Navigation */}
                  {profile.pet_photos.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevPhoto}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-background/80 hover:bg-background rounded-full p-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleNextPhoto}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-background/80 hover:bg-background rounded-full p-2"
                      >
                        <ArrowLeft className="w-4 h-4 rotate-180" />
                      </button>
                      
                      {/* Photo Indicators */}
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1">
                        {profile.pet_photos.map((_, index) => (
                          <div
                            key={index}
                            className={`w-2 h-2 rounded-full ${
                              index === currentPhotoIndex ? 'bg-white' : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No photos available
                </div>
              )}
              
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 bg-background/80 hover:bg-background rounded-full p-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Info */}
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold">{profile.pet_name}</h2>
                    {profile.verified && (
                      <Badge className="bg-neon-green/20 text-neon-green border-neon-green">
                        ✓ Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-lg text-muted-foreground">{profile.owner_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Breed:</span>
                  <p className="font-medium">{profile.breed || 'Mixed'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Age:</span>
                  <p className="font-medium">{profile.age} years</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Gender:</span>
                  <p className="font-medium capitalize">{profile.gender}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Distance:</span>
                  <p className="font-medium">2.5 miles away</p>
                </div>
              </div>

              {profile.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.location}</span>
                </div>
              )}

              {profile.description && (
                <div>
                  <h3 className="font-semibold mb-2">About {profile.pet_name}</h3>
                  <p className="text-muted-foreground leading-relaxed">{profile.description}</p>
                </div>
              )}

              {profile.pet_preferences.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Looking For</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Breeds:</span>
                      <span className="capitalize">{profile.pet_preferences[0].preferred_breeds}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Age range:</span>
                      <span>{profile.pet_preferences[0].min_age}-{profile.pet_preferences[0].max_age} years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Distance:</span>
                      <span>Within {profile.pet_preferences[0].distance_range} miles</span>
                    </div>
                  </div>
                </div>
              )}

              {showLikeButton && (
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="flex-1 border-border"
                  >
                    Pass
                  </Button>
                  <Button
                    onClick={handleLike}
                    className="flex-1 bg-gradient-primary hover:opacity-90"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Like
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-96">
            <p className="text-muted-foreground">Profile not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProfileView;