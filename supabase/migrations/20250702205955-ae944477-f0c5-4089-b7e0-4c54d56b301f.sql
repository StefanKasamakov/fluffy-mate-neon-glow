-- Critical Security Fixes

-- 1. Fix Likes Privacy Policy - Users should only see likes involving their own pets
DROP POLICY IF EXISTS "Users can view all likes" ON public.likes;

CREATE POLICY "Users can view likes involving their pets" 
ON public.likes 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM pets 
    WHERE pets.id = likes.liker_pet_id AND pets.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM pets 
    WHERE pets.id = likes.liked_pet_id AND pets.user_id = auth.uid()
  )
);

-- 2. Strengthen Match Creation Security - Remove overly permissive policy
DROP POLICY IF EXISTS "System can create matches" ON public.matches;

CREATE POLICY "Matches can only be created through mutual likes" 
ON public.matches 
FOR INSERT 
WITH CHECK (
  -- Ensure both pets exist and there are mutual likes
  EXISTS (
    SELECT 1 FROM likes l1
    JOIN likes l2 ON l1.liker_pet_id = l2.liked_pet_id 
                 AND l1.liked_pet_id = l2.liker_pet_id
    WHERE (l1.liker_pet_id = matches.pet1_id AND l1.liked_pet_id = matches.pet2_id)
       OR (l1.liker_pet_id = matches.pet2_id AND l1.liked_pet_id = matches.pet1_id)
  )
);

-- 3. Create message_reads table for proper unread tracking
CREATE TABLE public.message_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Enable RLS on message_reads
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own read status
CREATE POLICY "Users can manage their own message read status" 
ON public.message_reads 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Improve storage policies for pet certificates - path-based access
DROP POLICY IF EXISTS "Users can view their own pet certificates" ON storage.objects;

CREATE POLICY "Users can view their own pet certificates" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'pet-certificates' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload certificates with proper path structure" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'pet-certificates' AND 
  auth.uid()::text = (storage.foldername(name))[1] AND
  (storage.extension(name)) IN ('pdf', 'jpg', 'jpeg', 'png')
);

-- 5. Add is_read field to messages for simpler unread tracking
ALTER TABLE public.messages 
ADD COLUMN is_read BOOLEAN DEFAULT false;

-- 6. Create function to mark messages as read
CREATE OR REPLACE FUNCTION public.mark_message_as_read(message_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.messages 
  SET is_read = true 
  WHERE id = message_id 
    AND EXISTS (
      SELECT 1 FROM matches 
      JOIN pets p1 ON p1.id = matches.pet1_id 
      JOIN pets p2 ON p2.id = matches.pet2_id
      WHERE matches.id = messages.match_id 
        AND (p1.user_id = auth.uid() OR p2.user_id = auth.uid())
        AND messages.sender_user_id != auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Add input validation constraints
ALTER TABLE public.pets 
ADD CONSTRAINT pets_pet_name_length CHECK (char_length(pet_name) >= 1 AND char_length(pet_name) <= 50),
ADD CONSTRAINT pets_owner_name_length CHECK (char_length(owner_name) >= 1 AND char_length(owner_name) <= 50),
ADD CONSTRAINT pets_description_length CHECK (char_length(description) <= 500),
ADD CONSTRAINT pets_age_range CHECK (age >= 0 AND age <= 30);

ALTER TABLE public.messages 
ADD CONSTRAINT messages_text_length CHECK (char_length(message_text) >= 1 AND char_length(message_text) <= 1000);