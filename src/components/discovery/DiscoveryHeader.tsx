
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, SlidersHorizontal } from "lucide-react";
import SettingsDropdown from "@/components/SettingsDropdown";

interface DiscoveryHeaderProps {
  onFilterOpen: () => void;
}

const DiscoveryHeader = ({ onFilterOpen }: DiscoveryHeaderProps) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border">
      <Link to="/profile">
        <Button variant="ghost" size="sm">
          <User className="w-5 h-5" />
        </Button>
      </Link>
      <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
        FluffyMatch
      </h1>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={onFilterOpen}>
          <SlidersHorizontal className="w-5 h-5" />
        </Button>
        <SettingsDropdown />
      </div>
    </div>
  );
};

export default DiscoveryHeader;
