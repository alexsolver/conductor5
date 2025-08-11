
-- Migration para padronizar nomenclatura: favorecidos -> beneficiaries
-- CRITICAL: Alinha banco de dados com schema Drizzle

DO $$
DECLARE
    schema_name text;
    tenant_schemas text[] := ARRAY[
        'tenant_3f99462f_3621_4b1b_bea8_782acc50d62e',
        'tenant_715c510a_3db5_4510_880a_9a1a5c320100', 
        'tenant_78a4c88e_0e85_4f7c_ad92_f472dad50d7a',
        'tenant_cb9056df_d964_43d7_8fd8_b0cc00a72056'
    ];
BEGIN
    FOREACH schema_name IN ARRAY tenant_schemas
    LOOP
        RAISE NOTICE 'Padronizando nomenclatura em schema: %', schema_name;
        
        -- Verificar se tabela favorecidos existe
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = schema_name AND table_name = 'favorecidos'
        ) THEN
            -- Renomear tabela para beneficiaries
            EXECUTE format('ALTER TABLE %I.favorecidos RENAME TO beneficiaries', schema_name);
            
            -- Atualizar referências em tickets (se existir)
            IF EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = schema_name AND table_name = 'tickets'
            ) THEN
                -- A coluna beneficiaryId já está correta, apenas verificar constraint
                EXECUTE format('
                    ALTER TABLE %I.tickets 
                    DROP CONSTRAINT IF EXISTS tickets_beneficiary_id_favorecidos_id_fk
                ', schema_name);
                
                EXECUTE format('
                    ALTER TABLE %I.tickets 
                    ADD CONSTRAINT tickets_beneficiary_id_beneficiaries_id_fk 
                    FOREIGN KEY (beneficiary_id) REFERENCES %I.beneficiaries(id)
                ', schema_name, schema_name);
            END IF;
            
            RAISE NOTICE 'Nomenclatura padronizada em schema: %', schema_name;
        ELSE
            RAISE NOTICE 'Tabela favorecidos não encontrada em schema: %', schema_name;
        END IF;
    END LOOP;
END $$;
