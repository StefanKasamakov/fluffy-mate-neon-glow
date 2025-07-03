
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const EmptyState = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">No more pets nearby!</h2>
        <p className="text-muted-foreground mb-4">Check back later for new matches</p>
        <Button onClick={() => navigate('/profile')} className="bg-gradient-primary">
          Create Your Pet Profile
        </Button>
      </div>
    </div>
  );
};

export default EmptyState;
