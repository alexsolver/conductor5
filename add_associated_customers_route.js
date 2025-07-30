import fs from 'fs';

// Read the routes file
const routesPath = 'server/modules/customers/routes.ts';
let content = fs.readFileSync(routesPath, 'utf8');

// Find the first occurrence of the pattern and add the new route before it
const searchPattern = '// GET /api/customers/companies/:companyId/members - Get members of a company';
const firstOccurrence = content.indexOf(searchPattern);

if (firstOccurrence !== -1) {
  const newRoute = `// GET /api/customers/companies/:companyId/associated - Get customers already associated with company
customersRouter.get('/companies/:companyId/associated', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { companyId } = req.params;
    const tenantId = req.user?.tenantId;

    console.log('[ASSOCIATED-CUSTOMERS] Getting associated customers for company', companyId);

    if (!tenantId) {
      return res.status(401).json({ 
        success: false,
        message: 'Tenant required' 
      });
    }

    const { schemaManager } = await import('../../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(tenantId);

    // Get customers that ARE already associated with this company
    const query = \`
      SELECT DISTINCT c.id, c.first_name as "firstName", c.last_name as "lastName", 
             c.email, c.customer_type as "customerType", c.company_name as "companyName", 
             c.status, ccm.role, ccm.is_primary as "isPrimary", ccm.is_active as "isActive",
             ccm.created_at as "memberSince"
      FROM "\${schemaName}"."customers" c
      INNER JOIN "\${schemaName}"."customer_company_memberships" ccm 
        ON c.id = ccm.customer_id 
      WHERE ccm.company_id = $1 AND ccm.tenant_id = $2
      ORDER BY ccm.is_primary DESC, c.first_name, c.last_name
    \`;

    const result = await pool.query(query, [companyId, tenantId]);

    console.log(\`[ASSOCIATED-CUSTOMERS] Found \${result.rows.length} associated customers\`);

    res.json({
      success: true,
      message: 'Associated customers retrieved successfully',
      data: result.rows
    });

  } catch (error: any) {
    console.error('Error fetching associated customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch associated customers',
      error: error.message
    });
  }
});

`;

  // Insert the new route before the first occurrence
  const newContent = content.slice(0, firstOccurrence) + newRoute + content.slice(firstOccurrence);
  
  // Write back to file
  fs.writeFileSync(routesPath, newContent);
  console.log('✅ Successfully added associated customers route!');
} else {
  console.log('❌ Could not find the pattern to insert the new route');
}