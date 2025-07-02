import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const WhoLikedYou = () => {
  const [likedByPets, setLikedByPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadLikedByPets = async () => {
    if (!user) return;
    
    try {
      // Get current user's pet
      const { data: userPets } = await supabase
        .from('pets')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (!userPets?.[0]) return;

      const userPetId = userPets[0].id;

      // Find pets that have liked the current user's pet
      const { data, error } = await supabase
        .from('likes')
        .select(`
          id,
          created_at,
          liker_pet:pets!likes_liker_pet_id_fkey(
            id,
            pet_name,
            owner_name,
            breed,
            age,
            verified,
            pet_photos(photo_url)
          )
        `)
        .eq('liked_pet_id', userPetId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedPets = data?.map((like) => ({
        id: like.liker_pet.id,
        petName: like.liker_pet.pet_name,
        ownerName: like.liker_pet.owner_name,
        breed: like.liker_pet.breed || 'Mixed Breed',
        age: like.liker_pet.age,
        photo: like.liker_pet.pet_photos?.[0]?.photo_url || 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=200&h=200&fit=crop',
        verified: like.liker_pet.verified || false,
        likedAt: new Date(like.created_at).toLocaleDateString()
      })) || [];

      setLikedByPets(formattedPets);
    } catch (error) {
      console.error('Error loading liked pets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLikeBack = async (petId: string) => {
    if (!user) return;

    try {
      // Get current user's pet
      const { data: userPets } = await supabase
        .from('pets')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (!userPets?.[0]) return;

      const userPetId = userPets[0].id;

      // Create a like back
      await supabase
        .from('likes')
        .insert({
          liker_pet_id: userPetId,
          liked_pet_id: petId
        });

      // Remove from the list since they've been liked back
      setLikedByPets(prev => prev.filter(pet => pet.id !== petId));
    } catch (error) {
      console.error('Error liking back:', error);
    }
  };

  useEffect(() => {
    loadLikedByPets();
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
        <div className="w-8" />
      </div>

      <div className="p-4">
        {likedByPets.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No likes yet</h3>
              <p className="text-muted-foreground mb-4">
                When pets like your pet, they'll appear here!
              </p>
              <Link to="/discovery">
                <Button className="bg-gradient-primary hover:opacity-90">
                  Start Swiping
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Heart className="w-5 h-5 text-neon-pink" />
                {likedByPets.length} pets liked you!
              </h2>
              <p className="text-muted-foreground text-sm">
                Like them back to create a match
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {likedByPets.map((pet) => (
                <Card key={pet.id} className="p-3 bg-gradient-card border-border">
                  <div className="relative mb-3">
                    <img
                      src={pet.photo}
                      alt={pet.petName}
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                    {pet.verified && (
                      <Badge className="absolute top-2 right-2 w-6 h-6 p-0 bg-neon-green text-black text-xs flex items-center justify-center">
                        ✓
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <h3 className="font-semibold text-foreground">{pet.petName}</h3>
                      <p className="text-sm text-muted-foreground">{pet.age ? `${pet.age} years old` : 'Age not specified'}</p>
                      <p className="text-xs text-muted-foreground">{pet.breed}</p>
                    </div>
                    
                    <Button
                      onClick={() => handleLikeBack(pet.id)}
                      className="w-full bg-gradient-primary hover:opacity-90 shadow-button"
                      size="sm"
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      Like Back
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WhoLikedYou;