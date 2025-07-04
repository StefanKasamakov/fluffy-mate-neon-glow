import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, MessageCircle, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import SettingsDropdown from "@/components/SettingsDropdown";
import ProfileView from "@/components/ProfileView";
import BottomNavigation from "@/components/discovery/BottomNavigation";

const Matches = () => {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileViewOpen, setProfileViewOpen] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const { user } = useAuth();
  const { unreadCount } = useUnreadMessages();

  const loadMatches = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          id,
          created_at,
          pet1:pets!matches_pet1_id_fkey(
            id,
            pet_name,
            owner_name,
            breed,
            verified,
            user_id,
            pet_photos(photo_url)
          ),
          pet2:pets!matches_pet2_id_fkey(
            id,
            pet_name,
            owner_name,
            breed,
            verified,
            user_id,
            pet_photos(photo_url)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedMatches = await Promise.all(data?.map(async (match) => {
        // Determine which pet is the other user's pet
        const otherPet = match.pet1.user_id === user.id ? match.pet2 : match.pet1;
        
        // Get all messages for this match to check for unread ones
        const { data: messages } = await supabase
          .from('messages')
          .select('message_text, created_at, sender_user_id, is_read')
          .eq('match_id', match.id)
          .order('created_at', { ascending: false });

        const lastMessage = messages?.[0];
        
        // Check for unread messages sent by the other user
        const unreadMessages = messages?.filter(msg => 
          msg.sender_user_id !== user.id && !msg.is_read
        ) || [];
        
        const matchedAt = new Date(match.created_at);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - matchedAt.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let timeAgo = '';
        if (diffDays === 1) {
          timeAgo = 'Today';
        } else if (diffDays === 2) {
          timeAgo = 'Yesterday';
        } else if (diffDays <= 7) {
          timeAgo = `${diffDays - 1} days ago`;
        } else {
          timeAgo = matchedAt.toLocaleDateString();
        }

        return {
          id: match.id,
          petId: otherPet.id,
          petName: otherPet.pet_name,
          ownerName: otherPet.owner_name,
          breed: otherPet.breed || 'Mixed Breed',
          photo: otherPet.pet_photos?.[0]?.photo_url || 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=200&h=200&fit=crop',
          matchedAt: timeAgo,
          lastMessage: lastMessage?.message_text || 'Say hello!',
          unread: unreadMessages.length > 0,
          verified: otherPet.verified || false
        };
      }) || []);

      setMatches(formattedMatches);
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading matches...</p>
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
        <h1 className="text-lg font-semibold">Matches</h1>
        <SettingsDropdown />
      </div>

      {/* New Matches Section */}
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5 text-neon-pink" />
          New Matches
        </h2>
        
        <div className="flex gap-3 overflow-x-auto pb-2 mb-6">
          {matches.slice(0, 6).map((match) => (
            <div key={match.id} className="relative flex-shrink-0">
              <div 
                className="w-16 h-16 rounded-full border-3 border-neon-pink/50 p-0.5 cursor-pointer"
                onClick={() => {
                  setSelectedPetId(match.petId);
                  setProfileViewOpen(true);
                }}
              >
                <img
                  src={match.photo}
                  alt={match.petName}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              {match.verified && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 bg-neon-green text-black text-xs flex items-center justify-center rounded-full">
                  ✓
                </Badge>
              )}
              <p className="text-xs text-center mt-1 text-foreground truncate w-16">
                {match.petName}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Messages Section */}
      <div className="px-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-neon-cyan" />
          Messages
        </h2>
        
        <div className="space-y-3">
          {matches.map((match) => (
            <Link key={match.id} to={`/chat/${match.id}`}>
              <Card className="p-4 bg-gradient-card border-border hover:border-accent transition-colors">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={match.photo}
                      alt={match.petName}
                      className="w-12 h-12 object-cover rounded-full"
                    />
                    {match.verified && (
                      <Badge className="absolute -top-1 -right-1 w-4 h-4 p-0 bg-neon-green text-black text-xs flex items-center justify-center">
                        ✓
                      </Badge>
                    )}
                    {match.unread && (
                      <div className="absolute -top-1 -left-1 w-3 h-3 bg-neon-pink rounded-full" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p 
                        className="font-medium cursor-pointer hover:text-accent"
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedPetId(match.petId);
                          setProfileViewOpen(true);
                        }}
                      >
                        {match.petName}
                      </p>
                      <span className="text-xs text-muted-foreground">•</span>
                      <p className="text-sm text-muted-foreground">{match.ownerName}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{match.breed}</p>
                    <p className={`text-sm truncate ${match.unread ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                      {match.lastMessage}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{match.matchedAt}</p>
                    {match.unread && (
                      <div className="w-2 h-2 bg-neon-pink rounded-full ml-auto mt-1" />
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {matches.length === 0 && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No matches yet</h3>
            <p className="text-muted-foreground mb-4">
              Keep swiping to find the perfect mate for your pet!
            </p>
            <Link to="/discovery">
              <Button className="bg-gradient-primary hover:opacity-90">
                Start Swiping
              </Button>
            </Link>
          </div>
        </div>
      )}

      <BottomNavigation unreadCount={unreadCount} />

      <ProfileView
        isOpen={profileViewOpen}
        onClose={() => setProfileViewOpen(false)}
        petId={selectedPetId}
        showLikeButton={false}
      />
    </div>
  );
};

export default Matches;