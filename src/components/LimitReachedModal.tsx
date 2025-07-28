import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface LimitReachedModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'superLike' | 'rewind';
  subscriptionTier?: string;
}

export const LimitReachedModal = ({ isOpen, onClose, type, subscriptionTier = 'free' }: LimitReachedModalProps) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onClose();
    navigate('/premium');
  };

  const content = {
    superLike: {
      title: "You've used your free Super Lick for today!",
      description: subscriptionTier === 'free' 
        ? "Upgrade to FluffyMatch Gold or Platinum to send more daily Super Licks and unlock awesome perks."
        : "You've used all your Super Licks for today! Upgrade to get more Super Licks.",
      icon: "👅",
      buttonText: "Upgrade Now"
    },
    rewind: {
      title: "Oops! You've used all 5 of your daily Rewinds.",
      description: "Subscribe to FluffyMatch Gold or higher to unlock unlimited Rewinds!",
      icon: "⏪",
      buttonText: "See Plans"
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto bg-gradient-card border-border">
        <DialogHeader className="text-center">
          <div className="text-6xl mb-4">{content[type].icon}</div>
          <DialogTitle className="text-xl font-bold text-foreground">
            {content[type].title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 text-center">
          <p className="text-muted-foreground text-sm">
            {content[type].description}
          </p>
          
          <div className="space-y-2">
            <Button 
              onClick={handleUpgrade}
              className="w-full bg-gradient-primary hover:opacity-90 shadow-button"
            >
              {content[type].buttonText}
            </Button>
            
            <Button 
              onClick={onClose}
              variant="ghost"
              className="w-full text-muted-foreground"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};