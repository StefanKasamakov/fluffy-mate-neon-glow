
import { animated } from "react-spring";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

interface PetCardProps {
  pet: any;
  style: any;
  bind: any;
  cardRef: React.RefObject<HTMLDivElement>;
  onClick: () => void;
  zIndex: number;
}

const PetCard = ({ pet, style, bind, cardRef, onClick, zIndex }: PetCardProps) => {
  const handleClick = (e: React.MouseEvent) => {
    // Only trigger click if it's not a drag operation and not during animation
    e.stopPropagation();
    e.preventDefault();
    onClick();
  };

  return (
    <animated.div 
      ref={cardRef}
      {...bind()}
      style={{ 
        ...style,
        zIndex
      }}
      className="relative bg-gradient-card border border-border rounded-2xl overflow-hidden shadow-card touch-none select-none cursor-grab active:cursor-grabbing"
    >
      {/* Image */}
      <div 
        className="relative h-96 pointer-events-none" 
      >
        <img
          src={pet.photo}
          alt={pet.name}
          className="w-full h-full object-cover pointer-events-none"
        />
        
        {/* Clickable overlay for profile */}
        <div 
          className="absolute inset-0 cursor-pointer"
          onClick={handleClick}
        />
        
        {/* Verification Badge */}
        {pet.verified && (
          <Badge className="absolute top-4 right-4 bg-neon-green/20 text-neon-green border-neon-green">
            ✓ Verified
          </Badge>
        )}

        {/* Gradient Overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 to-transparent" />
      </div>

      {/* Pet Info */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white pointer-events-none">
        <div className="flex items-baseline gap-2 mb-2">
          <h2 className="text-2xl font-bold">{pet.name}</h2>
          <span className="text-lg">{pet.age} years</span>
        </div>
        
        <div className="flex items-center gap-1 mb-2">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">{pet.location}</span>
        </div>
        
        <p className="text-sm mb-2">{pet.breed}</p>
        <p className="text-sm opacity-90">{pet.description}</p>
        
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-gray-300">Owner: {pet.owner}</span>
        </div>
      </div>
    </animated.div>
  );
};

export default PetCard;
