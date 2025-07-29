
const { Client } = require('pg');

async function executeStatusTypeMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Get all tenant schemas
    const schemasResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%'
    `);

    console.log(`📋 Found ${schemasResult.rows.length} tenant schemas`);

    for (const row of schemasResult.rows) {
      const schemaName = row.schema_name;
      
      try {
        // Check if column already exists
        const columnCheck = await client.query(`
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = $1 
          AND table_name = 'ticket_field_options' 
          AND column_name = 'status_type'
        `, [schemaName]);

        if (columnCheck.rows.length === 0) {
          // Add the status_type column
          await client.query(`
            ALTER TABLE "${schemaName}".ticket_field_options 
            ADD COLUMN status_type VARCHAR(20)
          `);

          // Add comment
          await client.query(`
            COMMENT ON COLUMN "${schemaName}".ticket_field_options.status_type 
            IS 'Tipo do status: open, paused, resolved, closed'
          `);

          console.log(`✅ Added status_type column to schema ${schemaName}`);
        } else {
          console.log(`ℹ️  Column status_type already exists in schema ${schemaName}`);
        }
      } catch (error) {
        console.error(`❌ Error processing schema ${schemaName}:`, error.message);
      }
    }

    console.log('🎉 Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.end();
  }
}

executeStatusTypeMigration();
