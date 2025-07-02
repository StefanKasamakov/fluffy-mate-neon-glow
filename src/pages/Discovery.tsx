import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, X, MapPin, Settings, User } from "lucide-react";

const Discovery = () => {
  const [currentPetIndex, setCurrentPetIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  const pets = [
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
    },
    {
      id: 2,
      name: "Max",
      breed: "Persian Cat",
      age: 2,
      location: "1.8 miles away",
      description: "Calm and affectionate, perfect gentleman. Has excellent lineage and health records.",
      photo: "https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?w=400&h=600&fit=crop",
      verified: true,
      owner: "Mike R."
    },
    {
      id: 3,
      name: "Bella",
      breed: "Labrador",
      age: 4,
      location: "3.2 miles away",
      description: "Sweet and gentle, great with kids. Looking for a healthy mate for future litters.",
      photo: "https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=400&h=600&fit=crop",
      verified: false,
      owner: "Emma K."
    }
  ];

  const currentPet = pets[currentPetIndex];

  const handleSwipe = (direction: 'left' | 'right') => {
    setSwipeDirection(direction);
    
    setTimeout(() => {
      setCurrentPetIndex((prev) => (prev + 1) % pets.length);
      setSwipeDirection(null);
    }, 600);
  };

  if (!currentPet) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">No more pets nearby!</h2>
          <p className="text-muted-foreground">Check back later for new matches</p>
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
        <Link to="/settings">
          <Button variant="ghost" size="sm">
            <Settings className="w-5 h-5" />
          </Button>
        </Link>
      </div>

      {/* Card Stack */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative w-full max-w-sm">
          {/* Main Card */}
          <div 
            className={`relative bg-gradient-card border border-border rounded-2xl overflow-hidden shadow-card transition-all duration-600 ${
              swipeDirection === 'left' ? 'animate-swipe-left' : 
              swipeDirection === 'right' ? 'animate-swipe-right' : ''
            }`}
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
          </div>

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
    </div>
  );
};

export default Discovery;