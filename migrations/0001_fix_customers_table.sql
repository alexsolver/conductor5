
-- Add missing columns to customers table
ALTER TABLE customers 
  ADD COLUMN IF NOT EXISTS mobile_phone varchar(20),
  ADD COLUMN IF NOT EXISTS customer_type varchar(10) DEFAULT 'PF',
  ADD COLUMN IF NOT EXISTS cpf varchar(14),
  ADD COLUMN IF NOT EXISTS cnpj varchar(18),
  ADD COLUMN IF NOT EXISTS company_name varchar(255),
  ADD COLUMN IF NOT EXISTS contact_person varchar(255),
  ADD COLUMN IF NOT EXISTS state varchar(2),
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS address_number varchar(20),
  ADD COLUMN IF NOT EXISTS complement varchar(100),
  ADD COLUMN IF NOT EXISTS neighborhood varchar(100),
  ADD COLUMN IF NOT EXISTS city varchar(100),
  ADD COLUMN IF NOT EXISTS zip_code varchar(10);

-- Add constraint for customer_type
ALTER TABLE customers 
  ADD CONSTRAINT IF NOT EXISTS customer_type_check 
  CHECK (customer_type IN ('PF', 'PJ'));

-- Update existing records to have proper customer_type
UPDATE customers 
SET customer_type = 'PF' 
WHERE customer_type IS NULL;
