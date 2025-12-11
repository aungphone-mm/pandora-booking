-- Create gallery_photos table for home page photo gallery
-- Admin can upload up to 5 photos to display on the home page

CREATE TABLE IF NOT EXISTS gallery_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Image information
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL, -- Path in Supabase storage for deletion
  alt_text TEXT, -- Accessibility alt text
  caption TEXT, -- Optional caption

  -- Display settings
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Admin who uploaded
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_gallery_photos_display_order ON gallery_photos(display_order);
CREATE INDEX IF NOT EXISTS idx_gallery_photos_is_active ON gallery_photos(is_active);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_gallery_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS gallery_photos_updated_at_trigger ON gallery_photos;
CREATE TRIGGER gallery_photos_updated_at_trigger
  BEFORE UPDATE ON gallery_photos
  FOR EACH ROW
  EXECUTE FUNCTION update_gallery_photos_updated_at();

-- Enable Row Level Security
ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;

-- Allow public to view active gallery photos
CREATE POLICY "Public can view active gallery photos"
  ON gallery_photos
  FOR SELECT
  USING (is_active = true);

-- Allow admins to view all gallery photos (including inactive)
CREATE POLICY "Admins can view all gallery photos"
  ON gallery_photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Allow admins to insert gallery photos
CREATE POLICY "Admins can insert gallery photos"
  ON gallery_photos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Allow admins to update gallery photos
CREATE POLICY "Admins can update gallery photos"
  ON gallery_photos
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Allow admins to delete gallery photos
CREATE POLICY "Admins can delete gallery photos"
  ON gallery_photos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Comments for documentation
COMMENT ON TABLE gallery_photos IS 'Stores gallery photos displayed on the home page (max 5)';
COMMENT ON COLUMN gallery_photos.storage_path IS 'Path in Supabase storage bucket for deletion';
COMMENT ON COLUMN gallery_photos.display_order IS 'Order in which photos appear in gallery (lower = first)';
COMMENT ON COLUMN gallery_photos.alt_text IS 'Accessibility alt text for the image';

/*
IMPORTANT: Storage Bucket Setup (Manual in Supabase Dashboard)

1. Create a new storage bucket named: gallery
2. Set bucket to PUBLIC
3. File size limit: 5MB
4. Allowed MIME types: image/jpeg, image/png, image/webp

Storage RLS Policies to create in Supabase Dashboard:

-- Allow public read access
CREATE POLICY "Public can view gallery images"
ON storage.objects FOR SELECT
USING (bucket_id = 'gallery');

-- Allow admins to upload
CREATE POLICY "Admins can upload gallery images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'gallery' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Allow admins to delete
CREATE POLICY "Admins can delete gallery images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'gallery' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);
*/
