CREATE TABLE stock_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code TEXT,
  action TEXT, -- 'IN' or 'OUT'
  quantity INTEGER,
  timestamp TIMESTAMPTZ DEFAULT now()
);
