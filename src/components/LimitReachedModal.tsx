import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface LimitReachedModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'superLike' | 'rewind';
}

export const LimitReachedModal = ({ isOpen, onClose, type }: LimitReachedModalProps) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onClose();
    navigate('/premium');
  };

  const content = {
    superLike: {
      title: "Super Licks Used Up! 🚀",
      description: "You've used all your Super Licks for today! Upgrade to Premium for unlimited Super Licks.",
      icon: "🚀"
    },
    rewind: {
      title: "Rewinds Used Up! ⏪",
      description: "You've used all your Rewinds for today! Upgrade to Premium for unlimited Rewinds.",
      icon: "⏪"
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
              Upgrade to Premium
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