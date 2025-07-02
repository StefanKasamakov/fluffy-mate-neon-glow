import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Settings, Moon, Sun, MapPin, Locate } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useToast } from "@/hooks/use-toast";

const SettingsDropdown = () => {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [location, setLocation] = useState("New York, NY");

  const handleUpdateLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // In a real app, you'd reverse geocode these coordinates
          setLocation(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
          toast({
            title: "Location Updated",
            description: "Your location has been updated successfully",
          });
        },
        (error) => {
          toast({
            title: "Location Error",
            description: "Could not get your location. Please try again.",
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Location Not Supported",
        description: "Geolocation is not supported by this browser.",
        variant: "destructive",
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <Settings className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 bg-card border-border">
        {/* Theme Toggle */}
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'light' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <div>
                <p className="font-medium text-sm">Theme</p>
                <p className="text-xs text-muted-foreground">
                  {theme === 'light' ? 'Light mode' : 'Dark mode'}
                </p>
              </div>
            </div>
            <Switch
              checked={theme === 'light'}
              onCheckedChange={(checked) => setTheme(checked ? 'light' : 'dark')}
            />
          </div>
        </div>

        {/* Location */}
        <div className="p-3">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-4 h-4" />
            <div className="flex-1">
              <p className="font-medium text-sm">Location</p>
              <p className="text-xs text-muted-foreground">{location}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleUpdateLocation}
            className="w-full justify-start text-xs border-border"
          >
            <Locate className="w-3 h-3 mr-2" />
            Update Location
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SettingsDropdown;