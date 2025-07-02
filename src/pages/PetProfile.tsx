import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Camera, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PetProfile = () => {
  const [photos, setPhotos] = useState<string[]>([]);
  const [certificates, setCertificates] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    petName: "",
    ownerName: "",
    breed: "",
    age: "",
    gender: "",
    description: "",
    preferredBreeds: "",
    distance: "",
    minAge: "",
    maxAge: ""
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  const addPhoto = () => {
    if (photos.length >= 6) {
      toast({
        title: "Maximum photos reached",
        description: "You can only add up to 6 photos.",
        variant: "destructive"
      });
      return;
    }
    
    // Simulate file input - in real app this would open file picker
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // In real app, upload to storage and get URL
        const newPhoto = `https://images.unsplash.com/photo-${Math.random() > 0.5 ? '1582562124811-c09040d0a901' : '1535268647677-300dbf3d78d1'}?w=400&h=400&fit=crop`;
        setPhotos([...photos, newPhoto]);
        toast({
          title: "Photo added",
          description: "Your pet photo has been uploaded successfully."
        });
      }
    };
    fileInput.click();
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
    toast({
      title: "Photo removed",
      description: "The photo has been removed from your profile."
    });
  };

  const addCertificate = () => {
    // Simulate file input for certificates
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.jpg,.jpeg,.png';
    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setCertificates([...certificates, `cert-${Date.now()}`]);
        toast({
          title: "Certificate uploaded",
          description: "Health certificate has been uploaded successfully."
        });
      }
    };
    fileInput.click();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Validate required fields
    if (!formData.petName || !formData.ownerName) {
      toast({
        title: "Missing information",
        description: "Please fill in at least the pet name and owner name.",
        variant: "destructive"
      });
      return;
    }

    // In real app, save to database
    toast({
      title: "Profile saved",
      description: "Your pet profile has been saved successfully."
    });
    
    // Navigate back to discovery
    navigate('/discovery');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Link to="/discovery">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold">Pet Profile</h1>
        <Button variant="ghost" size="sm" className="text-accent" onClick={handleSave}>
          Save
        </Button>
      </div>

      <div className="p-4 space-y-6">
        {/* Photos Section */}
        <Card className="p-4 bg-gradient-card border-border">
          <h3 className="text-lg font-semibold mb-4">Photos</h3>
          <div className="grid grid-cols-3 gap-3">
            {photos.map((photo, index) => (
              <div key={index} className="relative aspect-square">
                <img
                  src={photo}
                  alt={`Pet photo ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  onClick={() => removePhoto(index)}
                  className="absolute -top-2 -right-2 bg-destructive rounded-full p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {photos.length < 6 && (
              <button
                onClick={addPhoto}
                className="aspect-square border-2 border-dashed border-border rounded-lg flex items-center justify-center hover:border-accent transition-colors"
              >
                <Plus className="w-6 h-6 text-muted-foreground" />
              </button>
            )}
          </div>
        </Card>

        {/* Basic Info */}
        <Card className="p-4 bg-gradient-card border-border">
          <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
          <div className="space-y-4">
            <Input 
              placeholder="Pet's name" 
              className="bg-secondary border-border"
              value={formData.petName}
              onChange={(e) => handleInputChange('petName', e.target.value)}
            />
            
            <Input 
              placeholder="Owner's name" 
              className="bg-secondary border-border"
              value={formData.ownerName}
              onChange={(e) => handleInputChange('ownerName', e.target.value)}
            />
            
            <Select value={formData.breed} onValueChange={(value) => handleInputChange('breed', value)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Breed" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50">
                <SelectItem value="golden-retriever">Golden Retriever</SelectItem>
                <SelectItem value="labrador">Labrador</SelectItem>
                <SelectItem value="persian-cat">Persian Cat</SelectItem>
                <SelectItem value="siamese-cat">Siamese Cat</SelectItem>
                <SelectItem value="bulldog">Bulldog</SelectItem>
              </SelectContent>
            </Select>

            <div className="grid grid-cols-2 gap-4">
              <Input 
                placeholder="Age (years)" 
                type="number" 
                className="bg-secondary border-border"
                value={formData.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
              />
              <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Textarea
              placeholder="Tell us about your pet's personality, traits, and what makes them special..."
              className="bg-secondary border-border min-h-[100px]"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
            />
          </div>
        </Card>

        {/* Health & Verification */}
        <Card className="p-4 bg-gradient-card border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Health & Verification</h3>
            <Badge variant="secondary" className="bg-neon-green/20 text-neon-green border-neon-green">
              Verified
            </Badge>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Vaccination Records</label>
              <div className="grid grid-cols-2 gap-3">
                {certificates.map((cert, index) => (
                  <div key={index} className="relative">
                    <div className="aspect-[4/3] bg-secondary rounded-lg flex items-center justify-center border border-border">
                      <div className="text-center p-2">
                        <div className="w-8 h-8 mx-auto mb-1 bg-neon-green/20 rounded flex items-center justify-center">
                          <span className="text-neon-green text-xs">✓</span>
                        </div>
                        <span className="text-xs text-muted-foreground">Health Certificate</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setCertificates(certificates.filter((_, i) => i !== index))}
                      className="absolute -top-2 -right-2 bg-destructive rounded-full p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addCertificate}
                  className="aspect-[4/3] border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center hover:border-accent transition-colors"
                >
                  <Camera className="w-5 h-5 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Upload Document</span>
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Upload vaccination records, health certificates, and breeding documentation for verification.
              </p>
            </div>
          </div>
        </Card>

        {/* Preferences */}
        <Card className="p-4 bg-gradient-card border-border">
          <h3 className="text-lg font-semibold mb-4">Mate Preferences</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Preferred Breeds</label>
              <Select value={formData.preferredBreeds} onValueChange={(value) => handleInputChange('preferredBreeds', value)}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select preferred breeds" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  <SelectItem value="any">Any Breed</SelectItem>
                  <SelectItem value="same">Same Breed Only</SelectItem>
                  <SelectItem value="similar">Similar Breeds</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Distance Range</label>
              <Select value={formData.distance} onValueChange={(value) => handleInputChange('distance', value)}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select distance range" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  <SelectItem value="5">Within 5 miles</SelectItem>
                  <SelectItem value="10">Within 10 miles</SelectItem>
                  <SelectItem value="25">Within 25 miles</SelectItem>
                  <SelectItem value="50">Within 50 miles</SelectItem>
                  <SelectItem value="100">Within 100 miles</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Age Range</label>
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  placeholder="Min age" 
                  type="number" 
                  className="bg-secondary border-border"
                  value={formData.minAge}
                  onChange={(e) => handleInputChange('minAge', e.target.value)}
                />
                <Input 
                  placeholder="Max age" 
                  type="number" 
                  className="bg-secondary border-border"
                  value={formData.maxAge}
                  onChange={(e) => handleInputChange('maxAge', e.target.value)}
                />
              </div>
            </div>
          </div>
        </Card>

        <Button 
          className="w-full bg-gradient-primary hover:opacity-90 shadow-button"
          onClick={handleSave}
        >
          Save Profile
        </Button>
      </div>
    </div>
  );
};

export default PetProfile;