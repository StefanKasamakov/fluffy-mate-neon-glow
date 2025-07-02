import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, MessageCircle } from "lucide-react";

const Matches = () => {
  const [matches] = useState([
    {
      id: 1,
      petName: "Luna",
      ownerName: "Sarah M.",
      breed: "Golden Retriever",
      photo: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=200&h=200&fit=crop",
      matchedAt: "2 hours ago",
      lastMessage: "Hi! Luna looks amazing, would love to arrange a meetup!",
      unread: true,
      verified: true
    },
    {
      id: 2,
      petName: "Charlie",
      ownerName: "John D.",
      breed: "Labrador",
      photo: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=200&h=200&fit=crop",
      matchedAt: "1 day ago",
      lastMessage: "Thank you for the match! When would be a good time to meet?",
      unread: false,
      verified: true
    },
    {
      id: 3,
      petName: "Mia",
      ownerName: "Lisa K.",
      breed: "Persian Cat",
      photo: "https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?w=200&h=200&fit=crop",
      matchedAt: "3 days ago",
      lastMessage: "Mia is so beautiful! Would love to discuss breeding.",
      unread: false,
      verified: false
    }
  ]);

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