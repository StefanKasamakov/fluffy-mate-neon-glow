import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { X, SlidersHorizontal } from "lucide-react";

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterSettings) => void;
  currentFilters: FilterSettings;
}

export interface FilterSettings {
  breed: string;
  distance: number;
  ageRange: [number, number];
  gender: string;
  verifiedOnly: boolean;
}

const FilterModal = ({ isOpen, onClose, onApply, currentFilters }: FilterModalProps) => {
  const [filters, setFilters] = useState<FilterSettings>(currentFilters);

  const breeds = [
    "Any Breed",
    "Golden Retriever",
    "Labrador",
    "Persian Cat",
    "Siamese Cat",
    "Bulldog",
    "German Shepherd",
    "Poodle",
    "Beagle",
    "Rottweiler"
  ];

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: FilterSettings = {
      breed: "Any Breed",
      distance: 25,
      ageRange: [1, 10],
      gender: "any",
      verifiedOnly: false
    };
    setFilters(resetFilters);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <Card className="w-full bg-card border-t border-border rounded-t-2xl p-6 space-y-6 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold">Filters</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Breed Filter */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Preferred Breed</label>
          <Select value={filters.breed} onValueChange={(value) => setFilters({...filters, breed: value})}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50">
              {breeds.map((breed) => (
                <SelectItem key={breed} value={breed}>{breed}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Distance Filter */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Distance</label>
            <Badge variant="secondary">{filters.distance} miles</Badge>
          </div>
          <Slider
            value={[filters.distance]}
            onValueChange={(value) => setFilters({...filters, distance: value[0]})}
            max={100}
            min={1}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1 mile</span>
            <span>100 miles</span>
          </div>
        </div>

        {/* Age Range Filter */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Age Range</label>
            <Badge variant="secondary">{filters.ageRange[0]} - {filters.ageRange[1]} years</Badge>
          </div>
          <Slider
            value={filters.ageRange}
            onValueChange={(value) => setFilters({...filters, ageRange: [value[0], value[1]]})}
            max={15}
            min={1}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1 year</span>
            <span>15 years</span>
          </div>
        </div>

        {/* Gender Filter */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Gender</label>
          <Select value={filters.gender} onValueChange={(value) => setFilters({...filters, gender: value})}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50">
              <SelectItem value="any">Any Gender</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Verified Only Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium">Verified Pets Only</label>
            <p className="text-xs text-muted-foreground">Show only pets with health verification</p>
          </div>
          <Button
            variant={filters.verifiedOnly ? "default" : "secondary"}
            size="sm"
            onClick={() => setFilters({...filters, verifiedOnly: !filters.verifiedOnly})}
          >
            {filters.verifiedOnly ? "On" : "Off"}
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button variant="ghost" onClick={handleReset} className="flex-1">
            Reset
          </Button>
          <Button onClick={handleApply} className="flex-1 bg-gradient-primary hover:opacity-90 shadow-button">
            Apply Filters
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default FilterModal;