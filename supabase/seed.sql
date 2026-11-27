-- ============================================================
-- Bhoomi Art — Sample Catalog Seed Data (Idempotent)
-- ============================================================

INSERT INTO categories (name, slug, description, image_url, display_order, is_visible)
VALUES
  (
    'Planters',
    'planters',
    'Handcrafted terracotta planters for indoor and outdoor spaces.',
    '/logo-icon.png',
    1,
    TRUE
  ),
  (
    'Vases',
    'vases',
    'Wheel-thrown earthenware vases shaped by traditional artisans.',
    '/logo-icon.png',
    2,
    TRUE
  )
ON CONFLICT (slug) DO NOTHING;

INSERT INTO subcategories (category_id, name, slug, description, image_url, display_order, is_visible)
SELECT
  c.id,
  'Tabletop Planters',
  'tabletop-planters',
  'Compact terracotta planters ideal for desks, shelves, and windowsills.',
  '/logo-icon.png',
  1,
  TRUE
FROM categories c
WHERE c.slug = 'planters'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (
  name,
  slug,
  short_description,
  long_description,
  materials,
  care_instructions,
  price,
  sku,
  availability_type,
  is_featured,
  is_signature,
  is_bestseller,
  is_new_arrival,
  status
)
VALUES
  (
    'Terracotta Urn Planter',
    'terracotta-urn-planter',
    'Classic wheel-thrown terracotta planter with natural breathable finish.',
    'Handcrafted on a traditional potter''s wheel using mineral-rich natural clay. Ideal for indoor botanicals and courtyard corners.',
    'Natural terracotta clay',
    'Wipe gently with a damp cloth. Avoid harsh chemical cleaners.',
    1490.00,
    'BA-PLT-001',
    'ready_to_ship',
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    'active'
  ),
  (
    'Earthy Ribbed Vase',
    'earthy-ribbed-vase',
    'Sculptural ribbed earthenware vase in warm sun-baked clay.',
    'Carefully hand-ribbed for tactile warmth and organic character. Works beautifully with dried florals or as a standalone accent.',
    'Natural terracotta clay',
    'Keep dry inside unless fitted with a glass liner for fresh stems.',
    1850.00,
    'BA-VAS-001',
    'ready_to_ship',
    TRUE,
    FALSE,
    TRUE,
    TRUE,
    'active'
  ),
  (
    'Heritage Courtyard Pot',
    'heritage-courtyard-pot',
    'Deep handcrafted garden planter made to order by master potters.',
    'Slow-dried and kiln-fired for durability in covered patios and living rooms. Crafted individually upon order.',
    'Fired natural terracotta',
    'Allow natural patina to develop over time; clean with soft brush.',
    2650.00,
    'BA-PLT-002',
    'made_to_order',
    FALSE,
    TRUE,
    FALSE,
    TRUE,
    'active'
  ),
  (
    'Minimalist Tabletop Planter',
    'minimalist-tabletop-planter',
    'Compact terracotta planter for succulents and small indoor herbs.',
    'A serene everyday vessel sized for desks, bookshelves, and sunny kitchen sills.',
    'Natural terracotta clay',
    'Water moderately; terracotta naturally breathes excess moisture.',
    890.00,
    'BA-PLT-003',
    'ready_to_ship',
    TRUE,
    FALSE,
    FALSE,
    TRUE,
    'active'
  )
ON CONFLICT (slug) DO NOTHING;

INSERT INTO product_media (product_id, url, media_type, alt_text, display_order)
SELECT p.id, '/logo-icon.png', 'image', p.name, 0
FROM products p
WHERE p.slug IN (
  'terracotta-urn-planter',
  'earthy-ribbed-vase',
  'heritage-courtyard-pot',
  'minimalist-tabletop-planter'
)
AND NOT EXISTS (
  SELECT 1 FROM product_media pm WHERE pm.product_id = p.id AND pm.display_order = 0
);

INSERT INTO product_media (product_id, url, media_type, alt_text, display_order)
SELECT p.id, '/Bhoomi_Art_Tagline_HD.png', 'image', p.name || ' alternate view', 1
FROM products p
WHERE p.slug = 'terracotta-urn-planter'
AND NOT EXISTS (
  SELECT 1 FROM product_media pm WHERE pm.product_id = p.id AND pm.display_order = 1
);

INSERT INTO product_category_map (product_id, category_id)
SELECT p.id, c.id
FROM products p
JOIN categories c ON (
  (p.slug LIKE '%planter%' OR p.slug LIKE '%pot%') AND c.slug = 'planters'
  OR p.slug LIKE '%vase%' AND c.slug = 'vases'
)
ON CONFLICT DO NOTHING;

INSERT INTO product_subcategory_map (product_id, subcategory_id)
SELECT p.id, s.id
FROM products p
JOIN subcategories s ON s.slug = 'tabletop-planters'
WHERE p.slug = 'minimalist-tabletop-planter'
ON CONFLICT DO NOTHING;

INSERT INTO inventory (product_id, variant_id, total_stock, reserved_stock, low_stock_threshold, tracking_enabled)
SELECT p.id, NULL, CASE WHEN p.availability_type = 'ready_to_ship' THEN 12 ELSE 0 END, 0, 3, TRUE
FROM products p
WHERE p.slug IN (
  'terracotta-urn-planter',
  'earthy-ribbed-vase',
  'heritage-courtyard-pot',
  'minimalist-tabletop-planter'
)
AND NOT EXISTS (
  SELECT 1 FROM inventory i WHERE i.product_id = p.id AND i.variant_id IS NULL
);
