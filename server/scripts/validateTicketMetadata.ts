
import { pool } from '../db';

async function validateTicketMetadata() {
  console.log('🔍 Validando sistema de metadados de ticket...');

  try {
    // Buscar tous os tenants
    const tenantsResult = await pool.query('SELECT id FROM public.tenants');
    const tenants = tenantsResult.rows;

    console.log(`📋 Validando ${tenants.length} tenants`);

    for (const tenant of tenants) {
      const tenantId = tenant.id;
      const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;

      console.log(`\n🔧 Validando tenant: ${tenantId}`);
      
      // Verificar se ticket_field_options existe e tem dados
      const optionsResult = await pool.query(`
        SELECT field_name, COUNT(*) as count 
        FROM "${schemaName}".ticket_field_options 
        WHERE active = true 
        GROUP BY field_name
      `);

      if (optionsResult.rows.length > 0) {
        console.log(`  ✅ Opções encontradas:`);
        optionsResult.rows.forEach(row => {
          console.log(`    - ${row.field_name}: ${row.count} opções`);
        });
      } else {
        console.log(`  ❌ Nenhuma opção encontrada em ticket_field_options`);
      }

      // Testar query específica para status e priority
      const statusOptions = await pool.query(`
        SELECT option_value, display_label, color_hex 
        FROM "${schemaName}".ticket_field_options 
        WHERE field_name = 'status' AND active = true 
        ORDER BY sort_order, display_label
      `);

      const priorityOptions = await pool.query(`
        SELECT option_value, display_label, color_hex 
        FROM "${schemaName}".ticket_field_options 
        WHERE field_name = 'priority' AND active = true 
        ORDER BY sort_order, display_label
      `);

      console.log(`  📊 Status options: ${statusOptions.rows.length}`);
      console.log(`  📊 Priority options: ${priorityOptions.rows.length}`);

      if (statusOptions.rows.length === 0 || priorityOptions.rows.length === 0) {
        console.log(`  ⚠️ PROBLEMA: Opções insuficientes para funcionamento adequado`);
      }
    }

    console.log('\n🎉 Validação de metadados concluída!');

  } catch (error) {
    console.error('❌ Erro na validação:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  validateTicketMetadata()
    .then(() => {
      console.log('✅ Validação executada com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro na validação:', error);
      process.exit(1);
    });
}

export { validateTicketMetadata };
