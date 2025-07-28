import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { X, SlidersHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  const [breeds, setBreeds] = useState<string[]>(["Any Breed"]);
  const [loading, setLoading] = useState(false);

  // Load breeds from database
  useEffect(() => {
    loadBreeds();
  }, []);

  // Update filters when currentFilters changes
  useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters]);

  const loadBreeds = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pets')
        .select('breed')
        .not('breed', 'is', null)
        .order('breed');

      if (error) throw error;

      const uniqueBreeds = [...new Set(data?.map(pet => pet.breed) || [])];
      setBreeds(["Any Breed", ...uniqueBreeds.sort()]);
    } catch (error) {
      console.error('Error loading breeds:', error);
      // Fallback to default breeds
      setBreeds([
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
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: FilterSettings = {
      breed: "Any Breed",
      distance: 100,
      ageRange: [1, 15],
      gender: "any",
      verifiedOnly: false
    };
    setFilters(resetFilters);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <Card className="w-full bg-card border-t border-border rounded-t-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold">Filters</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

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
            <Badge variant="secondary">Within {filters.distance} miles</Badge>
          </div>
          <Slider
            value={[filters.distance]}
            onValueChange={(value) => setFilters({...filters, distance: value[0]})}
            max={100}
            min={1}
            step={1}
            className="w-full [&>.relative]:bg-gradient-to-r [&>.relative]:from-primary [&>.relative]:to-primary-glow"
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
            className="w-full transition-all duration-200 ease-in-out [&>.relative]:bg-gradient-to-r [&>.relative]:from-primary [&>.relative]:to-primary-glow"
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
              <SelectItem value="unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Verified Only Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium">Verified Pets Only</label>
            <p className="text-xs text-muted-foreground">Show only pets with health verification</p>
          </div>
          <Switch
            checked={filters.verifiedOnly}
            onCheckedChange={(checked) => setFilters({...filters, verifiedOnly: checked})}
          />
        </div>
        </div>

        {/* Sticky Action Buttons */}
        <div className="border-t border-border p-6 bg-card">
          <div className="flex gap-3">
            <Button variant="ghost" onClick={handleReset} className="flex-1">
              Reset
            </Button>
            <Button onClick={handleApply} className="flex-1 bg-gradient-primary hover:opacity-90 shadow-button">
              Apply Filters
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FilterModal;