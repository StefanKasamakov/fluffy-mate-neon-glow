import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          FluffyMatch
        </h1>
        <p className="text-xl text-muted-foreground">Find the perfect mate for your furry friend</p>
        <Link to="/onboarding">
          <Button className="bg-gradient-primary hover:opacity-90 shadow-button text-lg px-8 py-3">
            Get Started
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Index;
