
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, User } from "lucide-react";

interface BottomNavigationProps {
  unreadCount: number;
}

const BottomNavigation = ({ unreadCount }: BottomNavigationProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
      <div className="flex justify-around py-2">
        <Link to="/discovery" className="flex-1">
          <Button variant="ghost" className="w-full h-16 flex flex-col gap-1 text-neon-pink font-semibold">
            <Heart className="w-5 h-5" />
            <span className="text-xs">Discover</span>
          </Button>
        </Link>
        
        <Link to="/matches" className="flex-1">
          <Button variant="ghost" className="w-full h-16 flex flex-col gap-1 relative text-muted-foreground">
            <div className="w-5 h-5 flex items-center justify-center">💬</div>
            <span className="text-xs">Matches</span>
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 bg-destructive text-destructive-foreground text-xs flex items-center justify-center rounded-full">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
        </Link>
        
        <Link to="/who-liked-you" className="flex-1">
          <Button variant="ghost" className="w-full h-16 flex flex-col gap-1 text-muted-foreground">
            <div className="w-5 h-5 flex items-center justify-center">👀</div>
            <span className="text-xs">Likes</span>
          </Button>
        </Link>
        
        <Link to="/premium" className="flex-1">
          <Button variant="ghost" className="w-full h-16 flex flex-col gap-1 text-muted-foreground">
            <div className="w-5 h-5 flex items-center justify-center">⭐</div>
            <span className="text-xs">Premium</span>
          </Button>
        </Link>
        
        <Link to="/profile" className="flex-1">
          <Button variant="ghost" className="w-full h-16 flex flex-col gap-1 text-muted-foreground">
            <User className="w-5 h-5" />
            <span className="text-xs">Profile</span>
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default BottomNavigation;
