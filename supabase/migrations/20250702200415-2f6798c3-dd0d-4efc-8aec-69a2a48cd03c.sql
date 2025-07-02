-- Create pets table to store pet profiles
CREATE TABLE public.pets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pet_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  breed TEXT,
  age INTEGER,
  gender TEXT,
  description TEXT,
  location TEXT DEFAULT 'Location not specified',
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pet_photos table for multiple photos per pet
CREATE TABLE public.pet_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pet_certificates table for health certificates
CREATE TABLE public.pet_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  certificate_url TEXT NOT NULL,
  certificate_type TEXT DEFAULT 'health',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pet_preferences table
CREATE TABLE public.pet_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  preferred_breeds TEXT DEFAULT 'any',
  distance_range INTEGER DEFAULT 25,
  min_age INTEGER DEFAULT 1,
  max_age INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for pets table
CREATE POLICY "Pets are viewable by everyone" 
ON public.pets 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own pets" 
ON public.pets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pets" 
ON public.pets 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pets" 
ON public.pets 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for pet_photos table
CREATE POLICY "Pet photos are viewable by everyone" 
ON public.pet_photos 
FOR SELECT 
USING (true);

CREATE POLICY "Users can manage photos of their own pets" 
ON public.pet_photos 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.pets 
  WHERE pets.id = pet_photos.pet_id 
  AND pets.user_id = auth.uid()
));

-- Create policies for pet_certificates table
CREATE POLICY "Pet certificates are viewable by everyone" 
ON public.pet_certificates 
FOR SELECT 
USING (true);

CREATE POLICY "Users can manage certificates of their own pets" 
ON public.pet_certificates 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.pets 
  WHERE pets.id = pet_certificates.pet_id 
  AND pets.user_id = auth.uid()
));

-- Create policies for pet_preferences table
CREATE POLICY "Pet preferences are viewable by everyone" 
ON public.pet_preferences 
FOR SELECT 
USING (true);

CREATE POLICY "Users can manage preferences of their own pets" 
ON public.pet_preferences 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.pets 
  WHERE pets.id = pet_preferences.pet_id 
  AND pets.user_id = auth.uid()
));

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_pets_updated_at
BEFORE UPDATE ON public.pets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pet_preferences_updated_at
BEFORE UPDATE ON public.pet_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for pet photos and certificates
INSERT INTO storage.buckets (id, name, public) VALUES ('pet-photos', 'pet-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('pet-certificates', 'pet-certificates', false);

-- Create storage policies for pet photos
CREATE POLICY "Pet photos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'pet-photos');

CREATE POLICY "Users can upload pet photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'pet-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own pet photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'pet-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own pet photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'pet-photos' AND auth.uid() IS NOT NULL);

-- Create storage policies for pet certificates
CREATE POLICY "Users can view their own pet certificates" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'pet-certificates' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can upload pet certificates" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'pet-certificates' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own pet certificates" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'pet-certificates' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own pet certificates" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'pet-certificates' AND auth.uid() IS NOT NULL);