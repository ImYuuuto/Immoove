INSERT INTO categories (name, slug)
VALUES
    ('Housing', 'housing'),
    ('Services', 'services'),
    ('Hobbies and Activities', 'hobbies-and-activities'),
    ('Renting Cars', 'renting-cars')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

UPDATE listings
SET category_id = (SELECT category_id FROM categories WHERE slug = 'housing')
WHERE service_type = 'VACATION_RENTAL'
   OR category_id = (SELECT category_id FROM categories WHERE slug = 'homes');

UPDATE listings
SET category_id = (SELECT category_id FROM categories WHERE slug = 'renting-cars')
WHERE service_type = 'CAR_RENTAL';

UPDATE listings
SET category_id = (SELECT category_id FROM categories WHERE slug = 'hobbies-and-activities')
WHERE service_type = 'ACTIVITY'
   OR category_id = (SELECT category_id FROM categories WHERE slug = 'experiences');

UPDATE listings
SET category_id = (SELECT category_id FROM categories WHERE slug = 'services')
WHERE service_type = 'RESTAURANT_CAFE';
