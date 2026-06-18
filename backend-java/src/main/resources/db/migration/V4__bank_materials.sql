-- Add columns to banks table
ALTER TABLE banks ADD COLUMN IF NOT EXISTS contact_person VARCHAR(50);
ALTER TABLE banks ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);
ALTER TABLE banks ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE banks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

-- Add string-format columns to bank_products
ALTER TABLE bank_products ADD COLUMN IF NOT EXISTS loan_amount VARCHAR(100);
ALTER TABLE bank_products ADD COLUMN IF NOT EXISTS loan_term VARCHAR(100);

-- bank_material_items (资料条目 - what materials to collect)
CREATE TABLE IF NOT EXISTS bank_material_items (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES bank_products(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    required BOOLEAN NOT NULL DEFAULT false,
    source VARCHAR(200),
    format VARCHAR(200),
    note TEXT,
    category VARCHAR(100) NOT NULL DEFAULT '基本资料',
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- bank_field_mappings (字段口径)
CREATE TABLE IF NOT EXISTS bank_field_mappings (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES bank_products(id) ON DELETE CASCADE,
    sys_field VARCHAR(100) NOT NULL,
    bank_field VARCHAR(100) NOT NULL,
    source VARCHAR(200),
    note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- bank_templates (制式表格)
CREATE TABLE IF NOT EXISTS bank_templates (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES bank_products(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    key_fields VARCHAR(500),
    note TEXT,
    file_url VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
