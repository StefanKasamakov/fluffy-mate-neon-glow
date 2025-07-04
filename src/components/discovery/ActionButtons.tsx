
import { Button } from "@/components/ui/button";
import { Heart, X, RotateCcw } from "lucide-react";

interface ActionButtonsProps {
  onRewind: () => void;
  onDislike: () => void;
  onSuperLike: () => void;
  onLike: () => void;
  canUndo: boolean;
  canUseRewind: boolean;
  canUseSuperLike: boolean;
  rewindsRemaining: number;
  superLikesRemaining: number;
}

const ActionButtons = ({
  onRewind,
  onDislike,
  onSuperLike,
  onLike,
  canUndo,
  canUseRewind,
  canUseSuperLike,
  rewindsRemaining,
  superLikesRemaining
}: ActionButtonsProps) => {
  return (
    <div className="flex justify-center gap-4 z-10 relative">
      <Button
        onClick={onRewind}
        disabled={!canUndo || !canUseRewind}
        size="lg"
        variant="outline"
        className="rounded-full w-16 h-16 border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
        title={canUseRewind ? `Rewind (${rewindsRemaining} left)` : "No rewinds left today"}
      >
        <RotateCcw className="w-6 h-6" />
      </Button>
      
      <Button
        onClick={onDislike}
        size="lg"
        variant="outline"
        className="rounded-full w-16 h-16 border-destructive text-destructive hover:bg-destructive hover:text-white"
      >
        <X className="w-6 h-6" />
      </Button>
      
      <Button
        onClick={onSuperLike}
        disabled={!canUseSuperLike}
        size="lg"
        variant="outline"
        className="rounded-full w-16 h-16 border-neon-yellow text-neon-yellow hover:bg-neon-yellow hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
        title={canUseSuperLike ? `Super Lick (${superLikesRemaining} left)` : "No Super Licks left today"}
      >
        <div className="text-2xl">👅</div>
      </Button>
      
      <Button
        onClick={onLike}
        size="lg"
        className="rounded-full w-16 h-16 bg-gradient-primary hover:opacity-90 shadow-button"
      >
        <Heart className="w-6 h-6" />
      </Button>
    </div>
  );
};

export default ActionButtons;
