import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const Matches = () => {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

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
        
        // Get the most recent message for this match
        const { data: messages } = await supabase
          .from('messages')
          .select('message_text, created_at')
          .eq('match_id', match.id)
          .order('created_at', { ascending: false })
          .limit(1);

        const lastMessage = messages?.[0];
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
          petName: otherPet.pet_name,
          ownerName: otherPet.owner_name,
          breed: otherPet.breed || 'Mixed Breed',
          photo: otherPet.pet_photos?.[0]?.photo_url || 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=200&h=200&fit=crop',
          matchedAt: timeAgo,
          lastMessage: lastMessage?.message_text || 'Say hello!',
          unread: !lastMessage, // If no messages, consider it unread
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
        <div className="w-8" /> {/* Spacer */}
      </div>

      {/* New Matches Section */}
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5 text-neon-pink" />
          New Matches
        </h2>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          {matches.slice(0, 3).map((match) => (
            <Link key={match.id} to={`/chat/${match.id}`}>
              <div className="relative">
                <img
                  src={match.photo}
                  alt={match.petName}
                  className="w-full aspect-square object-cover rounded-lg border-2 border-neon-pink/30"
                />
                {match.verified && (
                  <Badge className="absolute -top-1 -right-1 w-6 h-6 p-0 bg-neon-green text-black text-xs flex items-center justify-center">
                    ✓
                  </Badge>
                )}
                <div className="mt-2 text-center">
                  <p className="text-sm font-medium">{match.petName}</p>
                  <p className="text-xs text-muted-foreground">{match.matchedAt}</p>
                </div>
              </div>
            </Link>
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
                      <p className="font-medium">{match.petName}</p>
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
            <Button variant="ghost" className="w-full h-16 flex flex-col gap-1 text-accent">
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
              <div className="w-5 h-5 flex items-center justify-center">👤</div>
              <span className="text-xs">Profile</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Matches;