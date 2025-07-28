import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, Star, Heart, Eye } from "lucide-react";
import SettingsDropdown from "@/components/SettingsDropdown";
import BottomNavigation from "@/components/discovery/BottomNavigation";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

const Premium = () => {
  const { unreadCount } = useUnreadMessages();
  const features = [
    {
      icon: <Heart className="w-5 h-5" />,
      title: "Unlimited Swipes",
      description: "Swipe as much as you want with no daily limits"
    },
    {
      icon: <Eye className="w-5 h-5" />,
      title: "See Who Liked You",
      description: "View all pets that have already liked your pet"
    },
    {
      icon: <div className="w-5 h-5 flex items-center justify-center text-xs">👅</div>,
      title: "Super Lick",
      description: "Stand out with 5 Super Licks per day"
    },
    {
      icon: <div className="w-5 h-5 flex items-center justify-center text-xs">🔄</div>,
      title: "Rewind",
      description: "Undo your last swipe if you changed your mind"
    },
    {
      icon: <div className="w-5 h-5 flex items-center justify-center text-xs">⚡</div>,
      title: "Boost",
      description: "Be the top profile in your area for 30 minutes"
    }
  ];

  const plans = [
    {
      name: "FluffyMatch Plus",
      price: "$9.99",
      period: "per month",
      popular: false,
      features: ["Unlimited Swipes", "See Who Liked You", "1 Super Lick per day"]
    },
    {
      name: "FluffyMatch Gold",
      price: "$19.99",
      period: "per month",
      popular: true,
      features: ["Everything in Plus", "5 Super Licks per day", "1 Boost per month", "5 Rewinds per day"]
    },
    {
      name: "FluffyMatch Platinum",
      price: "$29.99",
      period: "per month",
      popular: false,
      features: ["Everything in Gold", "Priority Likes", "Message Before Matching", "Read Receipts"]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Link to="/discovery">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold">FluffyMatch Premium</h1>
        <SettingsDropdown />
      </div>

      <div className="p-4 space-y-6">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-gradient-primary rounded-full flex items-center justify-center shadow-button">
            <Star className="w-10 h-10 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Upgrade Your Experience
          </h2>
          <p className="text-muted-foreground">
            Get more matches and find the perfect mate for your furry friend faster
          </p>
        </div>

        {/* Features Grid */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Premium Features</h3>
          <div className="grid grid-cols-1 gap-3">
            {features.map((feature, index) => (
              <Card key={index} className="p-4 bg-gradient-card border-border">
                 <div className="flex items-start gap-3">
                   <div className="text-neon-cyan mt-0.5">{feature.icon}</div>
                   <div>
                     <h4 className="font-medium text-foreground">{feature.title}</h4>
                     <p className="text-sm text-muted-foreground">{feature.description}</p>
                   </div>
                 </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Choose Your Plan</h3>
          <div className="space-y-3">
            {plans.map((plan, index) => (
              <Card key={index} className={`p-4 border-2 relative ${
                plan.popular 
                  ? "border-accent bg-gradient-accent/10" 
                  : "border-border bg-gradient-card"
              }`}>
                {plan.popular && (
                  <Badge className="absolute -top-2 left-4 bg-accent text-accent-foreground">
                    Most Popular
                  </Badge>
                )}
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground">{plan.name}</h4>
                       <div className="flex items-baseline gap-1">
                         <span className="text-2xl font-bold text-neon-pink">{plan.price}</span>
                         <span className="text-sm text-foreground">{plan.period}</span>
                       </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-neon-green" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                   <Button 
                     className={`w-full ${
                       plan.popular 
                         ? "bg-gradient-primary hover:opacity-90 shadow-button text-black" 
                         : "bg-gradient-accent hover:opacity-90 text-black"
                     }`}
                   >
                     Choose {plan.name}
                   </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Terms */}
        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            Subscriptions automatically renew unless canceled at least 24 hours before the end of the current period.
          </p>
          <div className="flex justify-center gap-4 text-xs">
            <button className="text-accent hover:text-accent/80">Terms of Service</button>
            <button className="text-accent hover:text-accent/80">Privacy Policy</button>
            <button className="text-accent hover:text-accent/80">Restore Purchases</button>
          </div>
        </div>
      </div>

      <BottomNavigation unreadCount={unreadCount} />
    </div>
  );
};

export default Premium;