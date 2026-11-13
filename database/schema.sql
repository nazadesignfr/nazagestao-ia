-- NazaGestão IA — banco de dados inicial para uma única empresa.
-- Execute em um banco PostgreSQL novo. Valores monetários usam NUMERIC, nunca FLOAT.

CREATE TABLE IF NOT EXISTS company (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name VARCHAR(160) NOT NULL,
  document VARCHAR(20),
  phone VARCHAR(30),
  email VARCHAR(160),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'operator')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  document VARCHAR(20),
  phone VARCHAR(30),
  email VARCHAR(160),
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sku VARCHAR(60) UNIQUE,
  name VARCHAR(160) NOT NULL,
  description TEXT,
  unit VARCHAR(20) NOT NULL DEFAULT 'un',
  sale_price NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (sale_price >= 0),
  cost_price NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
  stock_quantity NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  min_stock NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (min_stock >= 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sale_number BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
  customer_id BIGINT REFERENCES customers(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'completed'
    CHECK (status IN ('draft', 'completed', 'cancelled')),
  subtotal NUMERIC(14,2) NOT NULL CHECK (subtotal >= 0),
  discount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  total NUMERIC(14,2) NOT NULL CHECK (total >= 0),
  notes TEXT,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sale_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sale_id BIGINT NOT NULL REFERENCES sales(id) ON DELETE RESTRICT,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name VARCHAR(160) NOT NULL,
  quantity NUMERIC(14,3) NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(14,2) NOT NULL CHECK (unit_price >= 0),
  unit_cost NUMERIC(14,2) NOT NULL CHECK (unit_cost >= 0),
  line_total NUMERIC(14,2) NOT NULL CHECK (line_total >= 0)
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  sale_id BIGINT REFERENCES sales(id) ON DELETE RESTRICT,
  movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('entry', 'sale', 'adjustment', 'sale_reversal')),
  quantity NUMERIC(14,3) NOT NULL CHECK (quantity > 0),
  notes TEXT,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS financial_entries (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sale_id BIGINT REFERENCES sales(id) ON DELETE RESTRICT,
  entry_type VARCHAR(20) NOT NULL CHECK (entry_type IN ('receivable', 'payable')),
  description VARCHAR(240) NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  due_date DATE,
  paid_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'paid', 'cancelled')),
  payment_method VARCHAR(30),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_low_stock ON products(stock_quantity, min_stock);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_financial_entries_status_due ON financial_entries(status, due_date);
CREATE INDEX IF NOT EXISTS idx_financial_entries_sale ON financial_entries(sale_id);

INSERT INTO company (id, name) VALUES (1, 'Minha Empresa') ON CONFLICT (id) DO NOTHING;
