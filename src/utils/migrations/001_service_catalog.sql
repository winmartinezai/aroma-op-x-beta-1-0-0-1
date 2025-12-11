-- Migration 001: Service Catalog Table
-- Purpose: Create dynamic service catalog for pricing system
-- Date: 2025-12-10

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CREATE SERVICE CATALOG TABLE
CREATE TABLE IF NOT EXISTS service_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL CHECK (category IN ('PAINT', 'CLEAN', 'TOUCH_UP_PAINT', 'TOUCH_UP_CLEAN', 'EXTRAS')),
    name TEXT NOT NULL,
    client_price NUMERIC(10, 2) DEFAULT 0 CHECK (client_price >= 0),
    employee_pay NUMERIC(10, 2) DEFAULT 0 CHECK (employee_pay >= 0),
    template_name TEXT, -- 'YEAR_2025', 'YEAR_2026', NULL for custom items
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique combinations within a template
    UNIQUE(category, name, template_name)
);

-- 2. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX idx_service_catalog_category ON service_catalog(category);
CREATE INDEX idx_service_catalog_template ON service_catalog(template_name);
CREATE INDEX idx_service_catalog_active ON service_catalog(is_active);
CREATE INDEX idx_service_catalog_lookup ON service_catalog(category, name, template_name) WHERE is_active = TRUE;

-- 3. CREATE UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_service_catalog_updated_at
    BEFORE UPDATE ON service_catalog
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. ADD LINE_ITEMS COLUMN TO JOBS TABLE
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS line_items JSONB;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS price_locked_at TIMESTAMPTZ;

-- 5. CREATE INDEX ON LINE_ITEMS FOR QUERIES
CREATE INDEX IF NOT EXISTS idx_jobs_line_items ON jobs USING GIN (line_items);

-- 6. SEED DATA FROM YEAR_2025 TEMPLATE
-- PAINT Services
INSERT INTO service_catalog (category, name, client_price, employee_pay, template_name) VALUES
    ('PAINT', '1x1', 265, 115, 'YEAR_2025'),
    ('PAINT', '2x2', 290, 135, 'YEAR_2025'),
    ('PAINT', '3x2', 315, 160, 'YEAR_2025'),
    ('PAINT', 'Studio', 265, 115, 'YEAR_2025')
ON CONFLICT (category, name, template_name) DO NOTHING;

-- CLEAN Services
INSERT INTO service_catalog (category, name, client_price, employee_pay, template_name) VALUES
    ('CLEAN', '1x1', 135, 60, 'YEAR_2025'),
    ('CLEAN', '2x2', 145, 70, 'YEAR_2025'),
    ('CLEAN', '3x2', 155, 80, 'YEAR_2025'),
    ('CLEAN', 'Studio', 135, 60, 'YEAR_2025')
ON CONFLICT (category, name, template_name) DO NOTHING;

-- TOUCH_UP_PAINT Services
INSERT INTO service_catalog (category, name, client_price, employee_pay, template_name) VALUES
    ('TOUCH_UP_PAINT', '1x1', 165, 85, 'YEAR_2025'),
    ('TOUCH_UP_PAINT', '2x2', 190, 95, 'YEAR_2025'),
    ('TOUCH_UP_PAINT', '3x2', 215, 110, 'YEAR_2025')
ON CONFLICT (category, name, template_name) DO NOTHING;

-- TOUCH_UP_CLEAN Services
INSERT INTO service_catalog (category, name, client_price, employee_pay, template_name) VALUES
    ('TOUCH_UP_CLEAN', 'Colina_Flat', 65, 50, 'YEAR_2025'),
    ('TOUCH_UP_CLEAN', '1x1', 65, 50, 'YEAR_2025'),
    ('TOUCH_UP_CLEAN', '2x2', 75, 50, 'YEAR_2025'),
    ('TOUCH_UP_CLEAN', '3x2', 85, 50, 'YEAR_2025')
ON CONFLICT (category, name, template_name) DO NOTHING;

-- EXTRAS
INSERT INTO service_catalog (category, name, client_price, employee_pay, template_name) VALUES
    ('EXTRAS', 'Garage Paint', 100, 60, 'YEAR_2025'),
    ('EXTRAS', 'Door & Trim', 120, 40, 'YEAR_2025'),
    ('EXTRAS', 'Front Door Only', 80, 40, 'YEAR_2025'),
    ('EXTRAS', 'Kilz', 50, 25, 'YEAR_2025'),
    ('EXTRAS', 'Large Unit', 20, 10, 'YEAR_2025'),
    ('EXTRAS', 'Stairs', 25, 15, 'YEAR_2025'),
    ('EXTRAS', 'Townhouse', 25, 15, 'YEAR_2025'),
    ('EXTRAS', 'Mop & Glo', 10, 5, 'YEAR_2025'),
    ('EXTRAS', 'Drywall Repair', 0, 0, 'YEAR_2025')
ON CONFLICT (category, name, template_name) DO NOTHING;

-- 7. SEED DATA FROM YEAR_2026 TEMPLATE
-- PAINT Services
INSERT INTO service_catalog (category, name, client_price, employee_pay, template_name) VALUES
    ('PAINT', '1x1', 275, 125, 'YEAR_2026'),
    ('PAINT', '2x2', 300, 145, 'YEAR_2026'),
    ('PAINT', '3x2', 325, 170, 'YEAR_2026'),
    ('PAINT', 'Studio', 275, 125, 'YEAR_2026')
ON CONFLICT (category, name, template_name) DO NOTHING;

-- CLEAN Services
INSERT INTO service_catalog (category, name, client_price, employee_pay, template_name) VALUES
    ('CLEAN', '1x1', 155, 70, 'YEAR_2026'),
    ('CLEAN', '2x2', 165, 80, 'YEAR_2026'),
    ('CLEAN', '3x2', 175, 90, 'YEAR_2026'),
    ('CLEAN', 'Studio', 155, 70, 'YEAR_2026')
ON CONFLICT (category, name, template_name) DO NOTHING;

-- TOUCH_UP_PAINT Services
INSERT INTO service_catalog (category, name, client_price, employee_pay, template_name) VALUES
    ('TOUCH_UP_PAINT', '1x1', 130, 65, 'YEAR_2026'),
    ('TOUCH_UP_PAINT', '2x2', 150, 75, 'YEAR_2026'),
    ('TOUCH_UP_PAINT', '3x2', 170, 85, 'YEAR_2026')
ON CONFLICT (category, name, template_name) DO NOTHING;

-- TOUCH_UP_CLEAN Services
INSERT INTO service_catalog (category, name, client_price, employee_pay, template_name) VALUES
    ('TOUCH_UP_CLEAN', 'Colina_Flat', 75, 50, 'YEAR_2026'),
    ('TOUCH_UP_CLEAN', '1x1', 75, 40, 'YEAR_2026'),
    ('TOUCH_UP_CLEAN', '2x2', 85, 45, 'YEAR_2026'),
    ('TOUCH_UP_CLEAN', '3x2', 95, 50, 'YEAR_2026')
ON CONFLICT (category, name, template_name) DO NOTHING;

-- EXTRAS
INSERT INTO service_catalog (category, name, client_price, employee_pay, template_name) VALUES
    ('EXTRAS', 'Garage Paint', 135, 70, 'YEAR_2026'),
    ('EXTRAS', 'Front Door', 95, 45, 'YEAR_2026'),
    ('EXTRAS', 'Front Door Trim', 60, 30, 'YEAR_2026'),
    ('EXTRAS', 'Ceilings', 130, 65, 'YEAR_2026'),
    ('EXTRAS', 'Vaulted Ceiling', 95, 45, 'YEAR_2026'),
    ('EXTRAS', 'Large Unit', 45, 20, 'YEAR_2026'),
    ('EXTRAS', 'Townhouse', 45, 20, 'YEAR_2026'),
    ('EXTRAS', 'Kilz', 55, 30, 'YEAR_2026'),
    ('EXTRAS', 'Accent Wall', 125, 60, 'YEAR_2026'),
    ('EXTRAS', 'Tub Resurface', 450, 0, 'YEAR_2026'),
    ('EXTRAS', 'Mop & Glo', 20, 10, 'YEAR_2026'),
    ('EXTRAS', 'Drywall Repair', 0, 0, 'YEAR_2026')
ON CONFLICT (category, name, template_name) DO NOTHING;

-- 8. GRANT PERMISSIONS (Adjust based on your Supabase RLS policies)
-- This assumes authenticated users can read/write
-- You may want to restrict this further in production

COMMENT ON TABLE service_catalog IS 'Dynamic service catalog for pricing. Replaces hardcoded price templates.';
COMMENT ON COLUMN service_catalog.template_name IS 'Links to pricing template (YEAR_2025, YEAR_2026) or NULL for custom items';
COMMENT ON COLUMN service_catalog.is_active IS 'Soft delete flag. Inactive items are hidden from UI but preserved for historical jobs';
COMMENT ON COLUMN jobs.line_items IS 'JSONB array of line items with snapshot prices. Format: [{id, type, description, clientPrice, employeePrice, snapshotFrom, snapshotAt}]';
COMMENT ON COLUMN jobs.price_locked_at IS 'Timestamp when prices were locked (job created). NULL means prices can still auto-update';
