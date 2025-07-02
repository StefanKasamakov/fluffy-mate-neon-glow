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
  const [hearts, setHearts] = useState<Array<{ id: number; delay: number; x: number; y: number; type: string }>>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (isVisible) {
      // Generate floating hearts and paw prints
      const heartElements = Array.from({ length: 25 }, (_, i) => ({
        id: i,
        delay: Math.random() * 3,
        x: Math.random() * 100,
        y: Math.random() * 80 + 10,
        type: Math.random() > 0.5 ? 'heart' : 'paw'
      }));
      setHearts(heartElements);
      
      // Show content after brief delay for animation
      const timer = setTimeout(() => setShowContent(true), 500);
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
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center overflow-hidden">
      {/* Floating Hearts and Paw Prints */}
      {hearts.map((item) => (
        <div
          key={item.id}
          className="absolute animate-pulse"
          style={{
            left: `${item.x}%`,
            top: `${item.y}%`,
            animationDelay: `${item.delay}s`,
            animationDuration: `${2 + Math.random()}s`,
            transform: `scale(${0.5 + Math.random() * 0.8})`,
          }}
        >
          {item.type === 'heart' ? (
            <Heart 
              className="w-8 h-8 text-neon-pink fill-neon-pink opacity-70 animate-bounce"
              style={{
                animationDelay: `${item.delay}s`,
                animationDuration: '2s'
              }}
            />
          ) : (
            <div 
              className="w-6 h-6 text-neon-cyan opacity-60 animate-spin"
              style={{
                animationDelay: `${item.delay}s`,
                animationDuration: '3s'
              }}
            >
              🐾
            </div>
          )}
        </div>
      ))}

      {/* Main Content */}
      <div 
        className={`text-center transition-all duration-700 transform ${
          showContent ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-8'
        }`}
      >
        {/* Match Text with Better Outline */}
        <div className="mb-10">
          <div className="relative">
            <h1 className="text-6xl font-bold text-white mb-4 relative z-10" style={{
              textShadow: '0 0 10px rgba(255, 255, 255, 0.5), 0 0 20px rgba(255, 255, 255, 0.3), 0 0 30px rgba(255, 255, 255, 0.2)',
              WebkitTextStroke: '2px rgba(255, 255, 255, 0.8)'
            }}>
              It's a Match!
            </h1>
            <div className="absolute inset-0 text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent blur-sm opacity-80">
              It's a Match!
            </div>
          </div>
          <p className="text-white/90 text-xl">
            You and {matchedPet.name} liked each other! 💕
          </p>
        </div>

        {/* Pet Photos */}
        <div className="flex items-center justify-center gap-12 mb-10">
          <div className="relative transform hover:scale-105 transition-transform duration-300">
            <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-neon-pink shadow-neon relative">
              <img
                src={userPet.photo}
                alt={userPet.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-primary opacity-10 rounded-full"></div>
            </div>
            <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-gradient-card px-4 py-2 rounded-full border border-neon-pink/30">
              <span className="text-sm font-semibold text-foreground">{userPet.name}</span>
            </div>
          </div>

          <div className="flex items-center relative">
            <Heart className="w-12 h-12 text-neon-pink fill-neon-pink animate-pulse" />
            <div className="absolute inset-0 animate-ping">
              <Heart className="w-12 h-12 text-neon-pink fill-neon-pink opacity-30" />
            </div>
          </div>

          <div className="relative transform hover:scale-105 transition-transform duration-300">
            <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-neon-cyan shadow-neon relative">
              <img
                src={matchedPet.photo}
                alt={matchedPet.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-accent opacity-10 rounded-full"></div>
            </div>
            <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-gradient-card px-4 py-2 rounded-full border border-neon-cyan/30">
              <span className="text-sm font-semibold text-foreground">{matchedPet.name}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-6 justify-center">
          <Button
            onClick={onKeepSwiping}
            variant="outline"
            size="lg"
            className="px-8 py-3 border-2 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:border-white/50 transition-all duration-300 backdrop-blur-sm"
          >
            Keep Swiping
          </Button>
          <Button
            onClick={handleStartChat}
            size="lg"
            className="px-8 py-3 bg-gradient-primary hover:opacity-90 shadow-button transform hover:scale-105 transition-all duration-300"
          >
            💬 Start Chat
          </Button>
        </div>
      </div>
    </div>
  );
};