-- Add image_url column to messages table for AI-generated images
ALTER TABLE public.messages ADD COLUMN image_url TEXT;
