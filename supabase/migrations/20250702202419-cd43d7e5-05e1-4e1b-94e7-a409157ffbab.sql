-- Create matches table to track when two pets like each other
CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pet1_id UUID NOT NULL,
  pet2_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(pet1_id, pet2_id)
);

-- Create likes table to track individual likes
CREATE TABLE public.likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  liker_pet_id UUID NOT NULL,
  liked_pet_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(liker_pet_id, liked_pet_id)
);

-- Create messages table for chat functionality
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL,
  sender_user_id UUID NOT NULL,
  message_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for matches
CREATE POLICY "Users can view matches involving their pets" 
ON public.matches 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM pets 
    WHERE pets.id = matches.pet1_id AND pets.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM pets 
    WHERE pets.id = matches.pet2_id AND pets.user_id = auth.uid()
  )
);

CREATE POLICY "System can create matches" 
ON public.matches 
FOR INSERT 
WITH CHECK (true);

-- RLS policies for likes
CREATE POLICY "Users can view all likes"
ON public.likes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create likes for their own pets" 
ON public.likes 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM pets 
    WHERE pets.id = likes.liker_pet_id AND pets.user_id = auth.uid()
  )
);

-- RLS policies for messages
CREATE POLICY "Users can view messages in their matches" 
ON public.messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM matches 
    JOIN pets p1 ON p1.id = matches.pet1_id 
    JOIN pets p2 ON p2.id = matches.pet2_id
    WHERE matches.id = messages.match_id 
    AND (p1.user_id = auth.uid() OR p2.user_id = auth.uid())
  )
);

CREATE POLICY "Users can send messages in their matches" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = sender_user_id AND
  EXISTS (
    SELECT 1 FROM matches 
    JOIN pets p1 ON p1.id = matches.pet1_id 
    JOIN pets p2 ON p2.id = matches.pet2_id
    WHERE matches.id = messages.match_id 
    AND (p1.user_id = auth.uid() OR p2.user_id = auth.uid())
  )
);

-- Add foreign key constraints
ALTER TABLE public.matches 
ADD CONSTRAINT matches_pet1_id_fkey FOREIGN KEY (pet1_id) REFERENCES pets(id) ON DELETE CASCADE,
ADD CONSTRAINT matches_pet2_id_fkey FOREIGN KEY (pet2_id) REFERENCES pets(id) ON DELETE CASCADE;

ALTER TABLE public.likes 
ADD CONSTRAINT likes_liker_pet_id_fkey FOREIGN KEY (liker_pet_id) REFERENCES pets(id) ON DELETE CASCADE,
ADD CONSTRAINT likes_liked_pet_id_fkey FOREIGN KEY (liked_pet_id) REFERENCES pets(id) ON DELETE CASCADE;

ALTER TABLE public.messages 
ADD CONSTRAINT messages_match_id_fkey FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE;

-- Function to create a match when there's mutual liking
CREATE OR REPLACE FUNCTION create_match_on_mutual_like()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the liked pet also likes the liker pet
  IF EXISTS (
    SELECT 1 FROM likes 
    WHERE liker_pet_id = NEW.liked_pet_id 
    AND liked_pet_id = NEW.liker_pet_id
  ) THEN
    -- Create a match (ensuring consistent ordering)
    INSERT INTO matches (pet1_id, pet2_id)
    VALUES (
      LEAST(NEW.liker_pet_id, NEW.liked_pet_id),
      GREATEST(NEW.liker_pet_id, NEW.liked_pet_id)
    )
    ON CONFLICT (pet1_id, pet2_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically create matches
CREATE TRIGGER trigger_create_match_on_mutual_like
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION create_match_on_mutual_like();