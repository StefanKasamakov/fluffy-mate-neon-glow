import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, X, MapPin, Settings, User, SlidersHorizontal, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSpring, animated } from "react-spring";
import { useDrag } from "@use-gesture/react";
import FilterModal, { FilterSettings } from "@/components/FilterModal";
import { supabase } from "@/integrations/supabase/client";

const Discovery = () => {
  const [currentPetIndex, setCurrentPetIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
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
  }, [user]);

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

      // Transform data to match the component's expected format
      const transformedPets = data?.map(pet => ({
        id: pet.id,
        name: pet.pet_name,
        breed: pet.breed || 'Mixed Breed',
        age: pet.age || 1,
        location: pet.location || '2.5 miles away',
        description: pet.description || 'No description available.',
        photo: pet.pet_photos?.[0]?.photo_url || 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=600&fit=crop',
        verified: pet.verified || false,
        owner: pet.owner_name || 'Anonymous'
      })) || [];

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
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
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
          <div className="flex justify-center gap-6 mt-8">
            <Button
              onClick={() => handleSwipe('left')}
              size="lg"
              variant="outline"
              className="rounded-full w-16 h-16 border-destructive text-destructive hover:bg-destructive hover:text-white"
            >
              <X className="w-6 h-6" />
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
                <Button variant="ghost" className="w-full h-16 flex flex-col gap-1">
                  <Heart className="w-5 h-5" />
                  <span className="text-xs">Discover</span>
                </Button>
              </Link>
              
              <Link to="/matches" className="flex-1">
                <Button variant="ghost" className="w-full h-16 flex flex-col gap-1">
                  <div className="w-5 h-5 flex items-center justify-center">💬</div>
                  <span className="text-xs">Matches</span>
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
    </div>
  );
};

export default Discovery;