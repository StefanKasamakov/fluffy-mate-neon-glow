import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MatchAnimationProps {
  isVisible: boolean;
  userPet: {
    name: string;
    photo: string;
  };
  matchedPet: {
    name: string;
    photo: string;
  };
  matchId: string;
  onKeepSwiping: () => void;
}

export const MatchAnimation = ({ 
  isVisible, 
  userPet, 
  matchedPet, 
  matchId, 
  onKeepSwiping 
}: MatchAnimationProps) => {
  const [showContent, setShowContent] = useState(false);
  const [hearts, setHearts] = useState<Array<{ id: number; delay: number; x: number }>>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (isVisible) {
      // Generate floating hearts
      const heartElements = Array.from({ length: 15 }, (_, i) => ({
        id: i,
        delay: Math.random() * 2,
        x: Math.random() * 100
      }));
      setHearts(heartElements);
      
      // Show content after brief delay
      const timer = setTimeout(() => setShowContent(true), 300);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
      setHearts([]);
    }
  }, [isVisible]);

  const handleStartChat = () => {
    navigate(`/chat/${matchId}`);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      {/* Floating Hearts */}
      {hearts.map((heart) => (
        <div
          key={heart.id}
          className="absolute animate-bounce"
          style={{
            left: `${heart.x}%`,
            animationDelay: `${heart.delay}s`,
            animationDuration: '3s',
            top: '10%'
          }}
        >
          <Heart 
            className="w-6 h-6 text-neon-pink fill-neon-pink opacity-80"
            style={{
              animationDelay: `${heart.delay}s`,
            }}
          />
        </div>
      ))}

      {/* Main Content */}
      <div 
        className={`text-center transition-all duration-500 ${
          showContent ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
        }`}
      >
        {/* Match Text */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            It's a Match!
          </h1>
          <p className="text-white/80 text-lg">
            You and {matchedPet.name} liked each other
          </p>
        </div>

        {/* Pet Photos */}
        <div className="flex items-center justify-center gap-8 mb-8">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-card">
              <img
                src={userPet.photo}
                alt={userPet.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-card px-3 py-1 rounded-full">
              <span className="text-sm font-medium">{userPet.name}</span>
            </div>
          </div>

          <div className="flex items-center">
            <Heart className="w-8 h-8 text-neon-pink fill-neon-pink animate-pulse" />
          </div>

          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-card">
              <img
                src={matchedPet.photo}
                alt={matchedPet.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-card px-3 py-1 rounded-full">
              <span className="text-sm font-medium">{matchedPet.name}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button
            onClick={onKeepSwiping}
            variant="outline"
            size="lg"
            className="px-8 border-white text-white hover:bg-white hover:text-black"
          >
            Keep Swiping
          </Button>
          <Button
            onClick={handleStartChat}
            size="lg"
            className="px-8 bg-gradient-primary hover:opacity-90 shadow-button"
          >
            Start Chat
          </Button>
        </div>
      </div>
    </div>
  );
};