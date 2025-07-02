import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, X, MapPin, User, SlidersHorizontal, LogOut, RotateCcw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSpring, animated } from "react-spring";
import { useDrag } from "@use-gesture/react";
import FilterModal, { FilterSettings } from "@/components/FilterModal";
import { MatchAnimation } from "@/components/MatchAnimation";
import { supabase } from "@/integrations/supabase/client";
import { useSwipeHistory } from "@/hooks/useSwipeHistory";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useToast } from "@/hooks/use-toast";
import SettingsDropdown from "@/components/SettingsDropdown";

const Discovery = () => {
  const [currentPetIndex, setCurrentPetIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPet, setUserPet] = useState<any>(null);
  const [showMatchAnimation, setShowMatchAnimation] = useState(false);
  const [currentMatch, setCurrentMatch] = useState<any>(null);
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addSwipeAction, undoLastSwipe, canUndo } = useSwipeHistory();
  const { unreadCount } = useUnreadMessages();
  const [filters, setFilters] = useState<FilterSettings>({
    breed: "Any Breed",
    distance: 25,
    ageRange: [1, 10],
    gender: "any",
    verifiedOnly: false
  });

  const cardRef = useRef<HTMLDivElement>(null);
  
  // Load pets from database
  useEffect(() => {
    loadPets();
    loadUserPet();
  }, [user]);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const loadUserPet = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('pets')
        .select(`
          *,
          pet_photos(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      setUserPet({
        id: data.id,
        name: data.pet_name,
        photo: data.pet_photos?.[0]?.photo_url || 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=600&fit=crop'
      });
    } catch (error) {
      console.error('Error loading user pet:', error);
    }
  };

  const handleLike = async (likedPetId: string) => {
    if (!user || !userPet) return;

    addSwipeAction(likedPetId, 'like');

    try {
      // Create a like
      const { error } = await supabase
        .from('likes')
        .insert({
          liker_pet_id: userPet.id,
          liked_pet_id: likedPetId
        });

      if (error) throw error;

      // Check if a match was created
      await checkForMatch(userPet.id, likedPetId);
    } catch (error) {
      console.error('Error creating like:', error);
    }
  };

  const handleDislike = (dislikedPetId: string) => {
    addSwipeAction(dislikedPetId, 'dislike');
  };

  const handleRewind = () => {
    const lastAction = undoLastSwipe();
    if (lastAction && currentPetIndex > 0) {
      setCurrentPetIndex(prev => prev - 1);
      
      // If the last action was a like, remove it from database
      if (lastAction.action === 'like' && userPet) {
        supabase
          .from('likes')
          .delete()
          .eq('liker_pet_id', userPet.id)
          .eq('liked_pet_id', lastAction.petId)
          .then(() => {
            toast({
              title: "Rewound!",
              description: "Your last swipe has been undone.",
            });
          });
      } else {
        toast({
          title: "Rewound!",
          description: "Your last swipe has been undone.",
        });
      }
    }
  };

  const checkForMatch = async (userPetId: string, likedPetId: string) => {
    try {
      const { data: matches, error } = await supabase
        .from('matches')
        .select(`
          *,
          pet1:pets!matches_pet1_id_fkey(pet_name, pet_photos(*)),
          pet2:pets!matches_pet2_id_fkey(pet_name, pet_photos(*))
        `)
        .or(`and(pet1_id.eq.${userPetId},pet2_id.eq.${likedPetId}),and(pet1_id.eq.${likedPetId},pet2_id.eq.${userPetId})`);

      if (error) throw error;

      if (matches && matches.length > 0) {
        const match = matches[0];
        const matchedPet = match.pet1_id === userPetId ? match.pet2 : match.pet1;
        
        setCurrentMatch({
          id: match.id,
          matchedPet: {
            name: matchedPet.pet_name,
            photo: matchedPet.pet_photos?.[0]?.photo_url || 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=600&fit=crop'
          }
        });
        setShowMatchAnimation(true);
      }
    } catch (error) {
      console.error('Error checking for match:', error);
    }
  };

  const loadPets = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('pets')
        .select(`
          *,
          pet_photos(*)
        `)
        .order('created_at', { ascending: false });

      // Exclude current user's pets
      if (user) {
        query = query.neq('user_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get current user's location for distance calculation
      let userLocation: { lat: number; lon: number } | null = null;
      if (user) {
        const { data: userPet } = await supabase
          .from('pets')
          .select('latitude, longitude')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (userPet?.latitude && userPet?.longitude) {
          userLocation = { lat: userPet.latitude, lon: userPet.longitude };
        }
      }

      // Transform data to match the component's expected format
      const transformedPets = data?.map(pet => {
        let locationDisplay = pet.location || 'Location not specified';
        
        // Calculate distance if both user and pet have coordinates
        if (userLocation && pet.latitude && pet.longitude) {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lon,
            pet.latitude,
            pet.longitude
          );
          locationDisplay = `${distance.toFixed(1)} miles away`;
        }

        return {
          id: pet.id,
          name: pet.pet_name,
          breed: pet.breed || 'Mixed Breed',
          age: pet.age || 1,
          location: locationDisplay,
          description: pet.description || 'No description available.',
          photo: pet.pet_photos?.[0]?.photo_url || 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=600&fit=crop',
          verified: pet.verified || false,
          owner: pet.owner_name || 'Anonymous'
        };
      }) || [];

      setPets(transformedPets);
    } catch (error) {
      console.error('Error loading pets:', error);
      // Fallback to demo data if database fails
      setPets([
        {
          id: 1,
          name: "Luna",
          breed: "Golden Retriever",
          age: 3,
          location: "2.5 miles away",
          description: "Friendly and energetic, loves playing fetch and swimming. Looking for a companion for puppies.",
          photo: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=600&fit=crop",
          verified: true,
          owner: "Sarah M."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const [{ x, rotate, scale }, api] = useSpring(() => ({
    x: 0,
    rotate: 0,
    scale: 1,
    config: { mass: 1, tension: 300, friction: 40 }
  }));

  const currentPet = pets[currentPetIndex];

  const handleSwipe = (direction: 'left' | 'right') => {
    const isLike = direction === 'right';
    
    // Handle like/dislike
    if (currentPet) {
      if (isLike) {
        handleLike(currentPet.id);
      } else {
        handleDislike(currentPet.id);
      }
    }
    
    api.start({
      x: isLike ? 300 : -300,
      rotate: isLike ? 30 : -30,
      scale: 0.8,
      config: { duration: 400 }
    });
    
    setTimeout(() => {
      setCurrentPetIndex((prev) => (prev + 1) % pets.length);
      api.set({ x: 0, rotate: 0, scale: 1 });
    }, 400);
  };

  const bind = useDrag(
    ({ active, movement: [mx], direction: [xDir], velocity: [vx] }) => {
      const trigger = vx > 0.3 || Math.abs(mx) > 150;
      const dir = xDir < 0 ? -1 : 1;
      
      if (!active && trigger) {
        handleSwipe(dir > 0 ? 'right' : 'left');
      } else {
        api.start({
          x: active ? mx : 0,
          rotate: active ? mx / 8 : 0,
          scale: active ? 1.02 : 1,
          immediate: (name) => active && name === 'x'
        });
      }
    },
    { 
      axis: 'x',
      bounds: { left: -200, right: 200, top: 0, bottom: 0 },
      rubberband: 0.15
    }
  );

  const handleApplyFilters = (newFilters: FilterSettings) => {
    setFilters(newFilters);
    // In real app, this would trigger a new API call with filters
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/onboarding');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading pets...</p>
        </div>
      </div>
    );
  }

  if (!currentPet || pets.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">No more pets nearby!</h2>
          <p className="text-muted-foreground mb-4">Check back later for new matches</p>
          <Button onClick={() => navigate('/profile')} className="bg-gradient-primary">
            Create Your Pet Profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Link to="/profile">
          <Button variant="ghost" size="sm">
            <User className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          FluffyMatch
        </h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setIsFilterOpen(true)}>
            <SlidersHorizontal className="w-5 h-5" />
          </Button>
          <SettingsDropdown />
        </div>
      </div>

      {/* Card Stack */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative w-full max-w-sm">
          {/* Main Card */}
          <animated.div 
            ref={cardRef}
            {...bind()}
            style={{ x, rotate: rotate.to((r: number) => `${r}deg`), scale }}
            className="relative bg-gradient-card border border-border rounded-2xl overflow-hidden shadow-card touch-none select-none cursor-grab active:cursor-grabbing"
          >
            {/* Image */}
            <div className="relative h-96">
              <img
                src={currentPet.photo}
                alt={currentPet.name}
                className="w-full h-full object-cover"
              />
              
              {/* Verification Badge */}
              {currentPet.verified && (
                <Badge className="absolute top-4 right-4 bg-neon-green/20 text-neon-green border-neon-green">
                  ✓ Verified
                </Badge>
              )}

              {/* Gradient Overlay */}
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 to-transparent" />
            </div>

            {/* Pet Info */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <div className="flex items-baseline gap-2 mb-2">
                <h2 className="text-2xl font-bold">{currentPet.name}</h2>
                <span className="text-lg">{currentPet.age} years</span>
              </div>
              
              <div className="flex items-center gap-1 mb-2">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{currentPet.location}</span>
              </div>
              
              <p className="text-sm mb-2">{currentPet.breed}</p>
              <p className="text-sm opacity-90">{currentPet.description}</p>
              
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-300">Owner: {currentPet.owner}</span>
              </div>
            </div>
          </animated.div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mt-8">
            <Button
              onClick={handleRewind}
              disabled={!canUndo}
              size="lg"
              variant="outline"
              className="rounded-full w-16 h-16 border-accent text-accent hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-6 h-6" />
            </Button>
            
            <Button
              onClick={() => handleSwipe('left')}
              size="lg"
              variant="outline"
              className="rounded-full w-16 h-16 border-destructive text-destructive hover:bg-destructive hover:text-white"
            >
              <X className="w-6 h-6" />
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              className="rounded-full w-16 h-16 border-neon-yellow text-neon-yellow hover:bg-neon-yellow hover:text-black"
              title="Super Lick - Coming Soon!"
            >
              <div className="text-2xl">👅</div>
            </Button>
            
            <Button
              onClick={() => handleSwipe('right')}
              size="lg"
              className="rounded-full w-16 h-16 bg-gradient-primary hover:opacity-90 shadow-button"
            >
              <Heart className="w-6 h-6" />
            </Button>
          </div>

          {/* Bottom Navigation */}
          <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
            <div className="flex justify-around py-2">
              <Link to="/discovery" className="flex-1">
                <Button variant="ghost" className="w-full h-16 flex flex-col gap-1 text-accent">
                  <Heart className="w-5 h-5" />
                  <span className="text-xs">Discover</span>
                </Button>
              </Link>
              
              <Link to="/matches" className="flex-1">
                <Button variant="ghost" className="w-full h-16 flex flex-col gap-1 relative">
                  <div className="w-5 h-5 flex items-center justify-center">💬</div>
                  <span className="text-xs">Matches</span>
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 bg-destructive text-destructive-foreground text-xs flex items-center justify-center rounded-full">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </Link>
              
              <Link to="/who-liked-you" className="flex-1">
                <Button variant="ghost" className="w-full h-16 flex flex-col gap-1">
                  <div className="w-5 h-5 flex items-center justify-center">👀</div>
                  <span className="text-xs">Likes</span>
                </Button>
              </Link>
              
              <Link to="/premium" className="flex-1">
                <Button variant="ghost" className="w-full h-16 flex flex-col gap-1">
                  <div className="w-5 h-5 flex items-center justify-center">⭐</div>
                  <span className="text-xs">Premium</span>
                </Button>
              </Link>
              
              <Link to="/profile" className="flex-1">
                <Button variant="ghost" className="w-full h-16 flex flex-col gap-1">
                  <User className="w-5 h-5" />
                  <span className="text-xs">Profile</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={handleApplyFilters}
        currentFilters={filters}
      />

      {/* Match Animation */}
      {showMatchAnimation && currentMatch && userPet && (
        <MatchAnimation
          isVisible={showMatchAnimation}
          userPet={userPet}
          matchedPet={currentMatch.matchedPet}
          matchId={currentMatch.id}
          onKeepSwiping={() => setShowMatchAnimation(false)}
        />
      )}
    </div>
  );
};

export default Discovery;