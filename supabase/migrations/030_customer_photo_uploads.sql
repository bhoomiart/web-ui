-- Customer reference photos: customization requests on orders, and return requests.
-- Files live in a private bucket. The database stores storage paths, and the admin
-- screens sign them when displayed. All access goes through server routes (service role).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'customer-uploads',
  'customer-uploads',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customization_photos TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE return_requests
  ADD COLUMN IF NOT EXISTS photos TEXT[] NOT NULL DEFAULT '{}';
