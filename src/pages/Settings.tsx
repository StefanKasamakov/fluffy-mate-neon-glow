import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Moon, Sun, LogOut } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/onboarding');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Link to="/profile">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold">Settings</h1>
        <div className="w-8" /> {/* Spacer */}
      </div>

      <div className="p-4 space-y-6">
        {/* Theme Settings */}
        <Card className="p-4 bg-gradient-card border-border">
          <h3 className="text-lg font-semibold mb-4">Appearance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {theme === 'light' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                <div>
                  <p className="font-medium">Theme</p>
                  <p className="text-sm text-muted-foreground">
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
        </Card>

        {/* Location Settings */}
        <Card className="p-4 bg-gradient-card border-border">
          <h3 className="text-lg font-semibold mb-4">Location</h3>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start border-border">
              Update Location
            </Button>
            <p className="text-xs text-muted-foreground">
              Update your location to find matches nearby
            </p>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card className="p-4 bg-gradient-card border-border">
          <h3 className="text-lg font-semibold mb-4">Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Get notified about new matches and messages
                </p>
              </div>
              <Switch
                checked={pushNotifications}
                onCheckedChange={setPushNotifications}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive updates via email
                </p>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
          </div>
        </Card>

        {/* Privacy Settings */}
        <Card className="p-4 bg-gradient-card border-border">
          <h3 className="text-lg font-semibold mb-4">Privacy</h3>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start border-border">
              Privacy Policy
            </Button>
            <Button variant="outline" className="w-full justify-start border-border">
              Terms of Service
            </Button>
            <Button variant="outline" className="w-full justify-start border-border">
              Data Export
            </Button>
          </div>
        </Card>

        {/* Account Actions */}
        <Card className="p-4 bg-gradient-card border-border">
          <h3 className="text-lg font-semibold mb-4">Account</h3>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start border-border">
              Delete Account
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Settings;