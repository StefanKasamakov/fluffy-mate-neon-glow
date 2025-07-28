
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSpring, animated } from "react-spring";
import { useDrag } from "@use-gesture/react";
import FilterModal, { FilterSettings } from "@/components/FilterModal";
import { MatchAnimation } from "@/components/MatchAnimation";
import ProfileView from "@/components/ProfileView";
import { supabase } from "@/integrations/supabase/client";
import { useSwipeHistory } from "@/hooks/useSwipeHistory";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useToast } from "@/hooks/use-toast";
import { useDailyLimits } from "@/hooks/useDailyLimits";
import { SuperLikeAnimation } from "@/components/SuperLikeAnimation";
import { LimitReachedModal } from "@/components/LimitReachedModal";
import DiscoveryHeader from "@/components/discovery/DiscoveryHeader";
import PetCard from "@/components/discovery/PetCard";
import ActionButtons from "@/components/discovery/ActionButtons";
import BottomNavigation from "@/components/discovery/BottomNavigation";
import EmptyState from "@/components/discovery/EmptyState";
import LoadingState from "@/components/discovery/LoadingState";

const Discovery = () => {
  const [currentPetIndex, setCurrentPetIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | 'up' | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPet, setUserPet] = useState<any>(null);
  const [showMatchAnimation, setShowMatchAnimation] = useState(false);
  const [currentMatch, setCurrentMatch] = useState<any>(null);
  const [profileViewOpen, setProfileViewOpen] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [showSuperLikeAnimation, setShowSuperLikeAnimation] = useState(false);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [limitModalType, setLimitModalType] = useState<'superLike' | 'rewind'>('superLike');
  const { user } = useAuth();
  const { toast } = useToast();
  const { addSwipeAction, undoLastSwipe, canUndo } = useSwipeHistory();
  const { unreadCount } = useUnreadMessages();
  const {
    canUseSuperLike,
    canUseRewind,
    useSuperLike,
    useRewind,
    superLikesRemaining,
    rewindsRemaining,
    subscriptionTier
  } = useDailyLimits();
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
    if (!canUseRewind) {
      setLimitModalType('rewind');
      setLimitModalOpen(true);
      return;
    }

    const canRewind = useRewind();
    if (!canRewind) return;

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
              description: `Your last swipe has been undone. ${rewindsRemaining - 1} rewinds left today.`,
            });
          });
      } else {
        toast({
          title: "Rewound!",
          description: `Your last swipe has been undone. ${rewindsRemaining - 1} rewinds left today.`,
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

  const [{ x, y, rotate, scale }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    rotate: 0,
    scale: 1,
    config: { mass: 1, tension: 300, friction: 40 }
  }));

  const [{ x: nextX, scale: nextScale }, nextApi] = useSpring(() => ({
    x: 0,
    scale: 0.95,
    config: { mass: 1, tension: 300, friction: 40 }
  }));

  const currentPet = pets[currentPetIndex];
  const nextPet = pets[currentPetIndex + 1];

  const handleSwipe = (direction: 'left' | 'right' | 'up') => {
    const isLike = direction === 'right';
    const isSuperLike = direction === 'up';
    setSwipeDirection(direction);
    
    // Handle super like
    if (isSuperLike) {
      if (!canUseSuperLike) {
        setLimitModalType('superLike');
        setLimitModalOpen(true);
        setSwipeDirection(null);
        return;
      }
      
      const canSuperLike = useSuperLike();
      if (!canSuperLike) return;
      
      setShowSuperLikeAnimation(true);
      if (currentPet) {
        handleLike(currentPet.id);
      }
      
      api.start({
        y: -window.innerHeight,
        rotate: 0,
        scale: 1.1,
        config: { mass: 0.3, tension: 400, friction: 40 }
      });
    } else {
      // Handle like/dislike with full screen animation
      if (currentPet) {
        if (isLike) {
          handleLike(currentPet.id);
        } else {
          handleDislike(currentPet.id);
        }
      }
      
      api.start({
        x: isLike ? window.innerWidth * 1.5 : -window.innerWidth * 1.5,
        y: isLike ? -50 : 50,
        rotate: isLike ? 30 : -30,
        scale: 0.9,
        config: { mass: 0.4, tension: 350, friction: 30 }
      });
    }

    // Animate next card smoothly
    nextApi.start({
      scale: 1,
      x: 0,
      config: { mass: 0.8, tension: 200, friction: 30 }
    });
    
    setTimeout(() => {
      setCurrentPetIndex((prev) => (prev + 1) % pets.length);
      api.set({ x: 0, y: 0, rotate: 0, scale: 1 });
      nextApi.set({ scale: 0.95, x: 0 });
      setSwipeDirection(null);
    }, isSuperLike ? 1000 : 600);
  };

  const handleSuperLike = () => {
    handleSwipe('up');
  };

  const bind = useDrag(
    ({ active, movement: [mx, my], direction: [xDir, yDir], velocity: [vx, vy], tap }) => {
      const triggerX = vx > 0.2 || Math.abs(mx) > 50;
      const triggerY = vy > 0.2 || Math.abs(my) > 50;
      const xDir_normalized = xDir < 0 ? -1 : 1;
      
      if (!active && triggerY && my < -50) {
        // Super like (swipe up)
        handleSwipe('up');
      } else if (!active && triggerX) {
        // Regular swipe left/right
        handleSwipe(xDir_normalized > 0 ? 'right' : 'left');
      } else {
        api.start({
          x: active ? mx : 0,
          y: active ? my : 0,
          rotate: active ? mx / 12 : 0,
          scale: active ? 1.02 : 1,
          immediate: (name) => active && (name === 'x' || name === 'y')
        });

        // Animate next card on drag
        if (active && (Math.abs(mx) > 30 || Math.abs(my) > 30)) {
          nextApi.start({
            scale: 0.98,
            x: mx * 0.08,
            config: { tension: 300, friction: 30 }
          });
        } else if (!active) {
          nextApi.start({
            scale: 0.95,
            x: 0,
            config: { tension: 300, friction: 30 }
          });
        }
      }
    },
    { 
      bounds: { left: -200, right: 200, top: -200, bottom: 200 },
      rubberband: 0.1,
      filterTaps: true
    }
  );

  const handleApplyFilters = (newFilters: FilterSettings) => {
    setFilters(newFilters);
    // In real app, this would trigger a new API call with filters
  };

  const handleProfileClick = () => {
    setSelectedPetId(currentPet.id);
    setProfileViewOpen(true);
  };

  if (loading) {
    return <LoadingState />;
  }

  if (!currentPet || pets.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="min-h-screen bg-background">
      <DiscoveryHeader onFilterOpen={() => setIsFilterOpen(true)} />

      {/* Card Stack */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="relative w-full max-w-sm mb-6">
          {/* Next Card (Preview) */}
          {nextPet && (
            <animated.div 
              style={{ 
                transform: nextX.to(x => `translateX(${x}px)`),
                scale: nextScale,
                zIndex: 1
              }}
              className="absolute inset-0 bg-gradient-card border border-border rounded-2xl overflow-hidden shadow-card opacity-60"
            >
              <img
                src={nextPet.photo}
                alt={nextPet.name}
                className="w-full h-96 object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-xl font-bold">{nextPet.name}</h3>
                <p className="text-sm opacity-90">{nextPet.age} years • {nextPet.breed}</p>
              </div>
            </animated.div>
          )}

          {/* Main Card */}
          <PetCard
            pet={currentPet}
            style={{ x, y, rotate: rotate.to((r: number) => `${r}deg`), scale }}
            bind={bind}
            cardRef={cardRef}
            onClick={handleProfileClick}
            zIndex={2}
          />

        </div>
        
        {/* Action Buttons */}
        <ActionButtons
          onRewind={handleRewind}
          onDislike={() => handleSwipe('left')}
          onSuperLike={handleSuperLike}
          onLike={() => handleSwipe('right')}
          canUndo={canUndo}
          canUseRewind={canUseRewind}
          canUseSuperLike={canUseSuperLike}
          rewindsRemaining={rewindsRemaining}
          superLikesRemaining={superLikesRemaining}
        />

        <BottomNavigation unreadCount={unreadCount} />
      </div>

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={handleApplyFilters}
        currentFilters={filters}
      />

      {/* Profile View */}
      <ProfileView
        isOpen={profileViewOpen}
        onClose={() => setProfileViewOpen(false)}
        petId={selectedPetId}
        onLike={handleLike}
        onDislike={handleDislike}
        showLikeButton={true}
      />

      {/* Super Like Animation */}
      <SuperLikeAnimation
        isVisible={showSuperLikeAnimation}
        onComplete={() => setShowSuperLikeAnimation(false)}
      />

      {/* Limit Reached Modal */}
      <LimitReachedModal
        isOpen={limitModalOpen}
        onClose={() => setLimitModalOpen(false)}
        type={limitModalType}
        subscriptionTier={subscriptionTier}
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
