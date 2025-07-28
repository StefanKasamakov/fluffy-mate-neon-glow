import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import BottomNavigation from "@/components/discovery/BottomNavigation";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

const WhoLikedYou = () => {
  const [likes, setLikes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const subscription = useSubscription();
  const { user } = useAuth();
  const { unreadCount } = useUnreadMessages();

  const loadLikes = async () => {
    if (!user) return;
    
    try {
      // Get all pets that belong to the current user
      const { data: userPets } = await supabase
        .from('pets')
        .select('id')
        .eq('user_id', user.id);

      if (!userPets?.length) return;

      const petIds = userPets.map(pet => pet.id);

      // Get all likes where user's pets were liked
      const { data, error } = await supabase
        .from('likes')
        .select(`
          id,
          created_at,
          liker_pet:pets!likes_liker_pet_id_fkey(
            pet_name,
            owner_name,
            breed,
            verified,
            pet_photos(photo_url)
          )
        `)
        .in('liked_pet_id', petIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedLikes = data?.map((like) => ({
        id: like.id,
        petName: like.liker_pet.pet_name,
        ownerName: like.liker_pet.owner_name,
        breed: like.liker_pet.breed || 'Mixed Breed',
        photo: like.liker_pet.pet_photos?.[0]?.photo_url || 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=200&h=200&fit=crop',
        verified: like.liker_pet.verified || false,
        likedAt: new Date(like.created_at).toLocaleDateString()
      })) || [];

      setLikes(formattedLikes);
    } catch (error) {
      console.error('Error loading likes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLikes();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading likes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Link to="/discovery">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold">Who Liked You</h1>
        <div className="w-8" /> {/* Spacer */}
      </div>

      {/* Premium Banner */}
      {!subscription.canSeeWhoLikedYou && likes.length > 0 && (
        <div className="p-4 bg-gradient-accent/10 border-b border-border">
          <div className="flex items-center justify-center gap-2">
            <Crown className="w-5 h-5 text-neon-yellow" />
            <span className="text-sm font-medium">Upgrade to Premium to see who liked you!</span>
          </div>
        </div>
      )}

      {/* Likes Grid */}
      <div className="p-4">
        {likes.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No likes yet</h3>
              <p className="text-muted-foreground mb-4">
                Keep your profile active to get more likes!
              </p>
              <Link to="/discovery">
                <Button className="bg-gradient-primary hover:opacity-90">
                  Start Swiping
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {likes.map((like) => (
              <Card 
                key={like.id} 
                className={`p-4 bg-gradient-card border-border ${
                  !subscription.canSeeWhoLikedYou ? 'relative overflow-hidden' : ''
                }`}
              >
                <div className="text-center">
                  <div className="relative mb-3">
                    <img
                      src={like.photo}
                      alt={subscription.canSeeWhoLikedYou ? like.petName : "Premium required"}
                      className={`w-20 h-20 object-cover rounded-full mx-auto ${
                        !subscription.canSeeWhoLikedYou ? 'blur-md' : ''
                      }`}
                    />
                    {like.verified && subscription.canSeeWhoLikedYou && (
                      <Badge className="absolute -top-1 -right-1 w-6 h-6 p-0 bg-neon-green text-black text-xs flex items-center justify-center">
                        ✓
                      </Badge>
                    )}
                    {!subscription.canSeeWhoLikedYou && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Crown className="w-8 h-8 text-neon-yellow" />
                      </div>
                    )}
                  </div>
                  
                  <h3 className={`font-medium mb-1 ${!subscription.canSeeWhoLikedYou ? 'blur-sm' : ''}`}>
                    {subscription.canSeeWhoLikedYou ? like.petName : '••••••'}
                  </h3>
                  <p className={`text-sm text-muted-foreground mb-1 ${!subscription.canSeeWhoLikedYou ? 'blur-sm' : ''}`}>
                    {subscription.canSeeWhoLikedYou ? like.breed : '••••••••'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {like.likedAt}
                  </p>
                </div>

                {!subscription.canSeeWhoLikedYou && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <Link to="/premium">
                      <Button size="sm" className="bg-gradient-primary hover:opacity-90">
                        <Crown className="w-4 h-4 mr-2" />
                        Premium
                      </Button>
                    </Link>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomNavigation unreadCount={unreadCount} />
    </div>
  );
};

export default WhoLikedYou;