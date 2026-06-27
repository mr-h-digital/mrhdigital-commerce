-- Products — upsert so existing data (e.g. updated prices) is preserved on restart
INSERT INTO products (id, name, category, brand, description, price, image_emoji, specs, rating, review_count, featured, badge, tags_json) VALUES
('P001','MacBook Pro 16"','Laptop','Apple','M3 Pro chip, 18GB RAM, 512GB SSD, Liquid Retina XDR display. The most powerful MacBook ever made, perfect for developers and creatives.',45999.00,'💻','M3 Pro · 18GB · 512GB SSD',4.9,2847,true,'Best Seller','apple,pro,developer'),
('P002','Dell XPS 15','Laptop','Dell','Intel Core i7-13700H, 32GB RAM, 1TB SSD, OLED 3.5K display. Stunning visuals meet serious performance.',32999.00,'💻','i7-13700H · 32GB · 1TB SSD',4.7,1203,false,'Top Rated','windows,oled,creator'),
('P003','Lenovo ThinkPad X1 Carbon','Laptop','Lenovo','Intel Core i7-1365U, 16GB RAM, 512GB SSD, ultralight business laptop. Military-grade durability at just 1.12kg.',27999.00,'💼','i7-1365U · 16GB · 512GB SSD',4.6,892,false,null,'business,lightweight,durable'),
('P004','iPhone 15 Pro Max','Mobile','Apple','A17 Pro chip, 256GB, 48MP camera system, titanium design. The most advanced iPhone ever — shoot cinema-quality 4K ProRes video.',24999.00,'📱','A17 Pro · 256GB · 48MP',4.8,5621,true,'🔥 Hot','apple,camera,titanium'),
('P005','Samsung Galaxy S24 Ultra','Mobile','Samsung','Snapdragon 8 Gen 3, 256GB, 200MP camera, S-Pen included. The ultimate Android powerhouse with AI-powered photography.',22999.00,'📱','SD 8 Gen 3 · 256GB · 200MP',4.7,3214,true,'New','android,ai,s-pen'),
('P006','Google Pixel 8 Pro','Mobile','Google','Google Tensor G3, 128GB, 50MP camera, 7 years of OS updates. The purest Android experience with the best computational photography.',17999.00,'📱','Tensor G3 · 128GB · 50MP',4.5,1876,false,null,'android,pure,ai'),
('P007','iPad Pro 12.9"','Tablet','Apple','M2 chip, 256GB, Liquid Retina XDR, Apple Pencil 2 compatible. The tablet that replaced laptops — now with ProMotion and Thunderbolt.',19999.00,'📲','M2 · 256GB · 12.9" XDR',4.8,2103,false,'Top Rated','apple,creative,pencil'),
('P008','Samsung Galaxy Tab S9+','Tablet','Samsung','Snapdragon 8 Gen 2, 256GB, 12.4" AMOLED, S-Pen in box. The best Android tablet for productivity and entertainment.',16999.00,'📲','SD 8 Gen 2 · 256GB · 12.4"',4.6,987,false,null,'android,amoled,s-pen'),
('P009','Sony WH-1000XM5','Audio','Sony','Industry-leading noise cancellation, 30hr battery, multipoint connect. Block out the world and lose yourself in music.',6999.00,'🎧','ANC · 30hr · Multipoint',4.9,8432,true,'Best Seller','noise-cancelling,wireless,premium'),
('P010','Apple AirPods Pro 2','Audio','Apple','Adaptive Transparency, Personalised Spatial Audio, MagSafe charging. The best-sounding AirPods ever made.',5999.00,'🎧','H2 chip · ANC · Spatial',4.7,6789,false,null,'apple,wireless,spatial'),
('P011','LG UltraGear 27" 4K','Monitor','LG','27" 4K IPS Nano, 144Hz, 1ms GTG, HDMI 2.1, USB-C 90W. The only monitor you will ever need — whether you are gaming, coding, or designing.',12999.00,'🖥️','4K · 144Hz · USB-C 90W',4.6,1542,false,'Editor''s Pick','gaming,4k,usb-c'),
('P012','Logitech MX Master 3S','Peripherals','Logitech','8000 DPI, MagSpeed scroll, quiet clicks, USB-C, compatible with Mac & PC. The mouse designed for people who work seriously.',1999.00,'🖱️','8000 DPI · MagSpeed · USB-C',4.8,12043,true,'Best Seller','productivity,wireless,silent')
ON CONFLICT (id) DO UPDATE SET
  name         = EXCLUDED.name,
  category     = EXCLUDED.category,
  brand        = EXCLUDED.brand,
  description  = EXCLUDED.description,
  price        = EXCLUDED.price,
  image_emoji  = EXCLUDED.image_emoji,
  specs        = EXCLUDED.specs,
  rating       = EXCLUDED.rating,
  review_count = EXCLUDED.review_count,
  featured     = EXCLUDED.featured,
  badge        = EXCLUDED.badge,
  tags_json    = EXCLUDED.tags_json;

-- Seed reviews — only insert if not already present
INSERT INTO reviews (id, product_id, author, rating, comment, created_at) VALUES
('r001p01','P001','Thabo M.',5,'Absolutely incredible machine. The M3 Pro chip handles everything I throw at it.',CURRENT_TIMESTAMP),
('r002p01','P001','Sarah K.',5,'Best laptop I have ever owned. Battery life is phenomenal — easily 12+ hours.',CURRENT_TIMESTAMP),
('r003p01','P001','James L.',4,'Stunning display and performance. Slightly pricey but worth every cent.',CURRENT_TIMESTAMP),
('r001p04','P004','Nomsa D.',5,'The titanium build feels premium. Camera system is unmatched.',CURRENT_TIMESTAMP),
('r002p04','P004','Ruan P.',5,'Best iPhone yet. ProRes video recording is a game-changer for content creators.',CURRENT_TIMESTAMP),
('r003p04','P004','Lerato S.',4,'Amazing phone but the price is steep. The camera makes up for it.',CURRENT_TIMESTAMP),
('r001p09','P009','Michael T.',5,'Best noise cancelling headphones on the market, period.',CURRENT_TIMESTAMP),
('r002p09','P009','Ayanda N.',5,'Wear them on my daily commute — pure bliss. The ANC is sorcery.',CURRENT_TIMESTAMP),
('r003p09','P009','Pieter V.',5,'Tried every competitor. Nothing comes close. Sony did it again.',CURRENT_TIMESTAMP),
('r001p12','P012','Dev A.',5,'The MagSpeed scroll wheel is addictive. Changed how I work.',CURRENT_TIMESTAMP),
('r002p12','P012','Claire R.',4,'Excellent mouse for professionals. USB-C charging is a nice touch.',CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;
