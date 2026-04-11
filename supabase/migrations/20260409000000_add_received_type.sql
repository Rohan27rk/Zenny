-- Add 'received' as a valid transaction type
-- This represents money received (returns, refunds, transfers) that is NOT salary/income

ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check 
  CHECK (type IN ('income', 'expense', 'received'));

-- Add default categories for 'received' type
INSERT INTO categories (name, type, icon, color, is_default) VALUES
  ('Money Returned', 'received', 'refresh-cw', '#06b6d4', true),
  ('Refund', 'received', 'rotate-ccw', '#06b6d4', true),
  ('Transfer Received', 'received', 'arrow-down-circle', '#06b6d4', true),
  ('Cashback', 'received', 'gift', '#06b6d4', true),
  ('Other Received', 'received', 'plus-circle', '#06b6d4', true)
ON CONFLICT DO NOTHING;
