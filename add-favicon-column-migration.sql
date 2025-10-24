-- Migration: Add favicon column to bookmarks table
-- This migration adds support for storing automatically extracted favicons
-- separate from user-uploaded custom favicons

-- Add the favicon column
ALTER TABLE public.bookmarks 
ADD COLUMN IF NOT EXISTS favicon TEXT;

-- Add documentation comment
COMMENT ON COLUMN public.bookmarks.favicon IS 'Automatically extracted favicon URL from the website, used as fallback when no custom logo is provided';

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bookmarks' 
AND column_name = 'favicon';

-- Show sample of updated table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookmarks' 
ORDER BY ordinal_position;
