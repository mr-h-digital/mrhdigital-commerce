-- Seed stock levels — only inserts if the row doesn't already exist
INSERT INTO stock (product_id, quantity) VALUES
  ('P001', 5),
  ('P002', 8),
  ('P003', 12),
  ('P004', 20),
  ('P005', 15),
  ('P006', 18),
  ('P007', 10),
  ('P008', 14),
  ('P009', 30),
  ('P010', 25),
  ('P011', 7),
  ('P012', 40)
ON CONFLICT (product_id) DO NOTHING;
