-- Migration script for Parts and Services module
-- Creates all necessary tables for the parts and services management system

-- Parts table - Main parts/components catalog
CREATE TABLE IF NOT EXISTS parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Basic Information
  part_number VARCHAR(100) NOT NULL,
  manufacturer_part_number VARCHAR(100),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  
  -- Technical Specifications
  specifications JSONB,
  images TEXT[],
  manuals TEXT[],
  barcode VARCHAR(100),
  
  -- Commercial Information
  cost_price DECIMAL(15,2),
  margin DECIMAL(5,2),
  sale_price DECIMAL(15,2),
  currency VARCHAR(3) DEFAULT 'BRL',
  
  -- Classification
  abc_classification VARCHAR(1),
  criticality VARCHAR(20) DEFAULT 'medium',
  obsolescence_status VARCHAR(50) DEFAULT 'active',
  
  -- Interchangeable Parts
  interchangeable_parts UUID[],
  alternative_suppliers UUID[],
  
  -- Status and Audit
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by_id UUID REFERENCES users(id),
  updated_by_id UUID REFERENCES users(id)
);

-- Inventory/Stock table - Multi-location inventory control
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  part_id UUID REFERENCES parts(id) ON DELETE CASCADE NOT NULL,
  location_id UUID REFERENCES locations(id),
  
  -- Stock Levels
  current_stock INTEGER DEFAULT 0,
  minimum_stock INTEGER DEFAULT 0,
  maximum_stock INTEGER DEFAULT 0,
  reorder_point INTEGER DEFAULT 0,
  economic_order_quantity INTEGER DEFAULT 0,
  
  -- Reserved and Available
  reserved_stock INTEGER DEFAULT 0,
  available_stock INTEGER DEFAULT 0,
  consigned_stock INTEGER DEFAULT 0,
  
  -- Traceability
  lot_numbers TEXT[],
  serial_numbers TEXT[],
  expiry_dates TIMESTAMP[],
  
  -- Status and Audit
  last_count_date TIMESTAMP,
  last_movement_date TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(tenant_id, part_id, location_id)
);

-- Stock Movements table - All inventory transactions
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  part_id UUID REFERENCES parts(id) ON DELETE CASCADE NOT NULL,
  inventory_id UUID REFERENCES inventory(id) ON DELETE CASCADE NOT NULL,
  
  -- Movement Details
  movement_type VARCHAR(50) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_cost DECIMAL(15,2),
  total_cost DECIMAL(15,2),
  
  -- References
  reference_type VARCHAR(50),
  reference_id UUID,
  from_location_id UUID REFERENCES locations(id),
  to_location_id UUID REFERENCES locations(id),
  
  -- Traceability
  lot_number VARCHAR(100),
  serial_number VARCHAR(100),
  expiry_date TIMESTAMP,
  
  -- Documentation
  document_number VARCHAR(100),
  notes TEXT,
  
  -- Audit
  movement_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  created_by_id UUID REFERENCES users(id)
);

-- Suppliers table - Supplier management
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Basic Information
  name VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  description TEXT,
  supplier_type VARCHAR(50) NOT NULL,
  
  -- Legal Information
  tax_id VARCHAR(50),
  legal_name VARCHAR(255),
  
  -- Contact Information
  email VARCHAR(255),
  phone VARCHAR(20),
  website VARCHAR(255),
  
  -- Address
  address JSONB,
  
  -- Commercial Information
  payment_terms VARCHAR(100),
  currency VARCHAR(3) DEFAULT 'BRL',
  credit_limit DECIMAL(15,2),
  
  -- Performance Metrics
  rating DECIMAL(3,2),
  total_purchases DECIMAL(15,2) DEFAULT 0,
  on_time_delivery_rate DECIMAL(5,2),
  quality_rating DECIMAL(3,2),
  
  -- Status and Audit
  status VARCHAR(50) DEFAULT 'active',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by_id UUID REFERENCES users(id),
  updated_by_id UUID REFERENCES users(id)
);

-- Supplier Catalog table - Products offered by suppliers
CREATE TABLE IF NOT EXISTS supplier_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE NOT NULL,
  part_id UUID REFERENCES parts(id) ON DELETE CASCADE NOT NULL,
  
  -- Supplier Information
  supplier_part_number VARCHAR(100),
  supplier_description TEXT,
  
  -- Pricing
  unit_price DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BRL',
  minimum_order_quantity INTEGER DEFAULT 1,
  
  -- Terms
  lead_time INTEGER,
  payment_terms VARCHAR(100),
  warranty VARCHAR(100),
  
  -- Status
  is_preferred BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMP DEFAULT NOW(),
  valid_to TIMESTAMP,
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by_id UUID REFERENCES users(id),
  
  UNIQUE(tenant_id, supplier_id, part_id)
);

-- Purchase Orders table - Purchase order management
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Order Information
  order_number VARCHAR(100) NOT NULL,
  supplier_id UUID REFERENCES suppliers(id) NOT NULL,
  requested_by_id UUID REFERENCES users(id),
  approved_by_id UUID REFERENCES users(id),
  
  -- Order Details
  order_type VARCHAR(50) DEFAULT 'normal',
  priority VARCHAR(20) DEFAULT 'medium',
  
  -- Financial
  subtotal DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'BRL',
  
  -- Dates
  order_date TIMESTAMP DEFAULT NOW(),
  expected_delivery_date TIMESTAMP,
  delivery_date TIMESTAMP,
  
  -- Status
  status VARCHAR(50) DEFAULT 'draft',
  
  -- Terms and Notes
  payment_terms VARCHAR(100),
  delivery_terms VARCHAR(100),
  notes TEXT,
  
  -- Receiving Information
  delivery_location_id UUID REFERENCES locations(id),
  received_by_id UUID REFERENCES users(id),
  receiving_notes TEXT,
  
  -- Audit
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by_id UUID REFERENCES users(id),
  updated_by_id UUID REFERENCES users(id),
  
  UNIQUE(tenant_id, order_number)
);

-- Purchase Order Items table - Items in purchase orders
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE NOT NULL,
  part_id UUID REFERENCES parts(id) ON DELETE CASCADE NOT NULL,
  
  -- Item Details
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  total_price DECIMAL(15,2) NOT NULL,
  
  -- Receiving
  quantity_received INTEGER DEFAULT 0,
  quantity_pending INTEGER DEFAULT 0,
  
  -- Item Specifications
  supplier_part_number VARCHAR(100),
  description TEXT,
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Service Kits table - Predefined parts kits for services
CREATE TABLE IF NOT EXISTS service_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Kit Information
  kit_name VARCHAR(255) NOT NULL,
  description TEXT,
  kit_type VARCHAR(50) NOT NULL,
  
  -- Application
  equipment_types TEXT[],
  service_types TEXT[],
  
  -- Pricing
  total_cost DECIMAL(15,2),
  sale_price DECIMAL(15,2),
  
  -- Status and Audit
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by_id UUID REFERENCES users(id),
  updated_by_id UUID REFERENCES users(id)
);

-- Service Kit Items table - Parts included in service kits
CREATE TABLE IF NOT EXISTS service_kit_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  service_kit_id UUID REFERENCES service_kits(id) ON DELETE CASCADE NOT NULL,
  part_id UUID REFERENCES parts(id) ON DELETE CASCADE NOT NULL,
  
  -- Quantity and Specifications
  quantity INTEGER NOT NULL,
  is_optional BOOLEAN DEFAULT false,
  alternative_part_ids UUID[],
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(tenant_id, service_kit_id, part_id)
);

-- Price Lists table - Unit price lists (LPU)
CREATE TABLE IF NOT EXISTS price_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- List Information
  list_name VARCHAR(255) NOT NULL,
  description TEXT,
  version VARCHAR(20) NOT NULL,
  
  -- Application
  application_type VARCHAR(50) NOT NULL,
  customer_company_id UUID REFERENCES customer_companies(id),
  contract_id UUID REFERENCES contracts(id),
  region VARCHAR(100),
  
  -- Validity
  valid_from TIMESTAMP DEFAULT NOW(),
  valid_to TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  
  -- Automatic Application
  auto_apply_to_orders BOOLEAN DEFAULT false,
  auto_apply_to_quotes BOOLEAN DEFAULT false,
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by_id UUID REFERENCES users(id),
  updated_by_id UUID REFERENCES users(id)
);

-- Price List Items table - Items in price lists
CREATE TABLE IF NOT EXISTS price_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  price_list_id UUID REFERENCES price_lists(id) ON DELETE CASCADE NOT NULL,
  
  -- Item Reference
  item_type VARCHAR(50) NOT NULL,
  part_id UUID REFERENCES parts(id),
  service_kit_id UUID REFERENCES service_kits(id),
  item_code VARCHAR(100),
  item_description VARCHAR(255),
  
  -- Pricing
  unit_price DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BRL',
  
  -- Volume Discounts
  minimum_quantity INTEGER DEFAULT 1,
  maximum_quantity INTEGER,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Special Pricing
  margin_percentage DECIMAL(5,2),
  special_price DECIMAL(15,2),
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS parts_tenant_part_number_idx ON parts (tenant_id, part_number);
CREATE INDEX IF NOT EXISTS parts_tenant_category_idx ON parts (tenant_id, category);
CREATE INDEX IF NOT EXISTS parts_tenant_barcode_idx ON parts (tenant_id, barcode);
CREATE INDEX IF NOT EXISTS parts_tenant_active_idx ON parts (tenant_id, is_active);

CREATE INDEX IF NOT EXISTS inventory_tenant_part_idx ON inventory (tenant_id, part_id);
CREATE INDEX IF NOT EXISTS inventory_tenant_location_idx ON inventory (tenant_id, location_id);
CREATE INDEX IF NOT EXISTS inventory_tenant_reorder_idx ON inventory (tenant_id, reorder_point);

CREATE INDEX IF NOT EXISTS stock_movements_tenant_part_idx ON stock_movements (tenant_id, part_id);
CREATE INDEX IF NOT EXISTS stock_movements_tenant_date_idx ON stock_movements (tenant_id, movement_date);
CREATE INDEX IF NOT EXISTS stock_movements_tenant_type_idx ON stock_movements (tenant_id, movement_type);

CREATE INDEX IF NOT EXISTS suppliers_tenant_name_idx ON suppliers (tenant_id, name);
CREATE INDEX IF NOT EXISTS suppliers_tenant_status_idx ON suppliers (tenant_id, status);
CREATE INDEX IF NOT EXISTS suppliers_tenant_active_idx ON suppliers (tenant_id, is_active);

CREATE INDEX IF NOT EXISTS supplier_catalog_tenant_supplier_idx ON supplier_catalog (tenant_id, supplier_id);
CREATE INDEX IF NOT EXISTS supplier_catalog_tenant_part_idx ON supplier_catalog (tenant_id, part_id);
CREATE INDEX IF NOT EXISTS supplier_catalog_tenant_preferred_idx ON supplier_catalog (tenant_id, is_preferred);

CREATE INDEX IF NOT EXISTS purchase_orders_tenant_number_idx ON purchase_orders (tenant_id, order_number);
CREATE INDEX IF NOT EXISTS purchase_orders_tenant_supplier_idx ON purchase_orders (tenant_id, supplier_id);
CREATE INDEX IF NOT EXISTS purchase_orders_tenant_status_idx ON purchase_orders (tenant_id, status);
CREATE INDEX IF NOT EXISTS purchase_orders_tenant_date_idx ON purchase_orders (tenant_id, order_date);

CREATE INDEX IF NOT EXISTS purchase_order_items_tenant_order_idx ON purchase_order_items (tenant_id, purchase_order_id);
CREATE INDEX IF NOT EXISTS purchase_order_items_tenant_part_idx ON purchase_order_items (tenant_id, part_id);

CREATE INDEX IF NOT EXISTS service_kits_tenant_name_idx ON service_kits (tenant_id, kit_name);
CREATE INDEX IF NOT EXISTS service_kits_tenant_type_idx ON service_kits (tenant_id, kit_type);
CREATE INDEX IF NOT EXISTS service_kits_tenant_active_idx ON service_kits (tenant_id, is_active);

CREATE INDEX IF NOT EXISTS service_kit_items_tenant_kit_idx ON service_kit_items (tenant_id, service_kit_id);
CREATE INDEX IF NOT EXISTS service_kit_items_tenant_part_idx ON service_kit_items (tenant_id, part_id);

CREATE INDEX IF NOT EXISTS price_lists_tenant_name_idx ON price_lists (tenant_id, list_name);
CREATE INDEX IF NOT EXISTS price_lists_tenant_validity_idx ON price_lists (tenant_id, valid_from, valid_to);
CREATE INDEX IF NOT EXISTS price_lists_tenant_active_idx ON price_lists (tenant_id, is_active);
CREATE INDEX IF NOT EXISTS price_lists_tenant_customer_idx ON price_lists (tenant_id, customer_company_id);

CREATE INDEX IF NOT EXISTS price_list_items_tenant_list_idx ON price_list_items (tenant_id, price_list_id);
CREATE INDEX IF NOT EXISTS price_list_items_tenant_part_idx ON price_list_items (tenant_id, part_id);
CREATE INDEX IF NOT EXISTS price_list_items_tenant_type_idx ON price_list_items (tenant_id, item_type);

-- Insert initial data for parts and services module
INSERT INTO suppliers (tenant_id, name, supplier_type, email, phone, status, is_active, created_at) VALUES
('3f99462f-3621-4b1b-bea8-782acc50d62e', 'Bosch Industrial', 'manufacturer', 'contato@bosch.com.br', '(11) 3456-7890', 'active', true, NOW()),
('3f99462f-3621-4b1b-bea8-782acc50d62e', 'Siemens Brasil', 'manufacturer', 'vendas@siemens.com.br', '(11) 2345-6789', 'active', true, NOW()),
('3f99462f-3621-4b1b-bea8-782acc50d62e', 'WEG Equipamentos', 'manufacturer', 'comercial@weg.net', '(47) 3276-4000', 'active', true, NOW()),
('3f99462f-3621-4b1b-bea8-782acc50d62e', 'Distribuidora TecParts', 'distributor', 'vendas@tecparts.com.br', '(11) 4567-8901', 'active', true, NOW());

INSERT INTO parts (tenant_id, part_number, manufacturer_part_number, title, description, category, subcategory, cost_price, margin, sale_price, currency, abc_classification, criticality, is_active, created_at) VALUES
('3f99462f-3621-4b1b-bea8-782acc50d62e', 'MOT001', 'WEG-W22-5CV', 'Motor Elétrico WEG 5CV', 'Motor elétrico trifásico WEG W22 5CV 3500RPM', 'Motores', 'Motores Elétricos', 2500.00, 40.00, 3500.00, 'BRL', 'A', 'high', true, NOW()),
('3f99462f-3621-4b1b-bea8-782acc50d62e', 'SEN001', 'BOSCH-BME280', 'Sensor de Pressão Bosch BME280', 'Sensor de pressão e temperatura digital Bosch', 'Sensores', 'Pressão', 85.00, 50.00, 127.50, 'BRL', 'B', 'medium', true, NOW()),
('3f99462f-3621-4b1b-bea8-782acc50d62e', 'VAL001', 'SIEMENS-VV47', 'Válvula Solenóide Siemens', 'Válvula solenóide 2 vias DN25 24V Siemens', 'Válvulas', 'Solenóides', 450.00, 35.00, 607.50, 'BRL', 'B', 'medium', true, NOW()),
('3f99462f-3621-4b1b-bea8-782acc50d62e', 'FIL001', 'MANN-W962', 'Filtro de Óleo MANN W962', 'Filtro de óleo hidráulico MANN W962', 'Filtros', 'Óleo', 35.00, 60.00, 56.00, 'BRL', 'C', 'low', true, NOW()),
('3f99462f-3621-4b1b-bea8-782acc50d62e', 'ROL001', 'SKF-6308', 'Rolamento SKF 6308', 'Rolamento rígido de esferas SKF 6308', 'Rolamentos', 'Esferas', 120.00, 45.00, 174.00, 'BRL', 'B', 'medium', true, NOW());

INSERT INTO service_kits (tenant_id, kit_name, description, kit_type, equipment_types, service_types, total_cost, sale_price, is_active, created_at) VALUES
('3f99462f-3621-4b1b-bea8-782acc50d62e', 'Kit Manutenção Preventiva Motor', 'Kit completo para manutenção preventiva de motores elétricos', 'preventive', ARRAY['Motor Elétrico', 'Bomba'], ARRAY['Manutenção Preventiva'], 650.00, 975.00, true, NOW()),
('3f99462f-3621-4b1b-bea8-782acc50d62e', 'Kit Emergência Hidráulica', 'Kit de emergência para sistemas hidráulicos', 'emergency', ARRAY['Sistema Hidráulico'], ARRAY['Manutenção Corretiva', 'Emergência'], 850.00, 1275.00, true, NOW()),
('3f99462f-3621-4b1b-bea8-782acc50d62e', 'Kit Instalação Sensores', 'Kit para instalação de sensores de monitoramento', 'installation', ARRAY['Equipamento Industrial'], ARRAY['Instalação'], 350.00, 525.00, true, NOW());

INSERT INTO price_lists (tenant_id, list_name, description, version, application_type, valid_from, is_active, auto_apply_to_orders, created_at) VALUES
('3f99462f-3621-4b1b-bea8-782acc50d62e', 'Tabela Geral 2025', 'Tabela de preços geral para clientes padrão', '1.0', 'general', NOW(), true, true, NOW()),
('3f99462f-3621-4b1b-bea8-782acc50d62e', 'Tabela Contratos Premium', 'Tabela especial para contratos premium', '1.0', 'contract', NOW(), true, false, NOW());

-- Insert inventory records for the main location
INSERT INTO inventory (tenant_id, part_id, location_id, current_stock, minimum_stock, maximum_stock, reorder_point, economic_order_quantity, available_stock, is_active, created_at)
SELECT 
  '3f99462f-3621-4b1b-bea8-782acc50d62e',
  p.id,
  l.id,
  CASE 
    WHEN p.part_number = 'MOT001' THEN 5
    WHEN p.part_number = 'SEN001' THEN 20
    WHEN p.part_number = 'VAL001' THEN 12
    WHEN p.part_number = 'FIL001' THEN 50
    WHEN p.part_number = 'ROL001' THEN 15
    ELSE 0
  END,
  CASE 
    WHEN p.part_number = 'MOT001' THEN 2
    WHEN p.part_number = 'SEN001' THEN 5
    WHEN p.part_number = 'VAL001' THEN 3
    WHEN p.part_number = 'FIL001' THEN 10
    WHEN p.part_number = 'ROL001' THEN 5
    ELSE 0
  END,
  CASE 
    WHEN p.part_number = 'MOT001' THEN 10
    WHEN p.part_number = 'SEN001' THEN 50
    WHEN p.part_number = 'VAL001' THEN 25
    WHEN p.part_number = 'FIL001' THEN 100
    WHEN p.part_number = 'ROL001' THEN 30
    ELSE 0
  END,
  CASE 
    WHEN p.part_number = 'MOT001' THEN 3
    WHEN p.part_number = 'SEN001' THEN 8
    WHEN p.part_number = 'VAL001' THEN 5
    WHEN p.part_number = 'FIL001' THEN 15
    WHEN p.part_number = 'ROL001' THEN 8
    ELSE 0
  END,
  CASE 
    WHEN p.part_number = 'MOT001' THEN 5
    WHEN p.part_number = 'SEN001' THEN 20
    WHEN p.part_number = 'VAL001' THEN 10
    WHEN p.part_number = 'FIL001' THEN 50
    WHEN p.part_number = 'ROL001' THEN 15
    ELSE 0
  END,
  CASE 
    WHEN p.part_number = 'MOT001' THEN 5
    WHEN p.part_number = 'SEN001' THEN 20
    WHEN p.part_number = 'VAL001' THEN 12
    WHEN p.part_number = 'FIL001' THEN 50
    WHEN p.part_number = 'ROL001' THEN 15
    ELSE 0
  END,
  true,
  NOW()
FROM parts p
CROSS JOIN (SELECT id FROM locations WHERE tenant_id = '3f99462f-3621-4b1b-bea8-782acc50d62e' LIMIT 1) l
WHERE p.tenant_id = '3f99462f-3621-4b1b-bea8-782acc50d62e';