import { Router } from 'express';
import { jwtAuth } from '../../middleware/auth';
import { AuthenticatedRequest } from '../../types';

const customersRouter = Router();

// PATCH /api/customers/:id - Update existing customer
customersRouter.patch('/:id', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(401).json({ message: 'Tenant required' });
    }

    const customerId = req.params.id;

    // Build comprehensive update data from request
    const updateData = {
      first_name: req.body.firstName,
      last_name: req.body.lastName,
      phone: req.body.phone,
      mobile_phone: req.body.mobilePhone,
      customer_type: req.body.customerType,
      cpf: req.body.cpf,
      cnpj: req.body.cnpj,
      company_name: req.body.companyName,
      contact_person: req.body.contactPerson,
      state: req.body.state,
      address: req.body.address,
      address_number: req.body.addressNumber,
      complement: req.body.complement,
      neighborhood: req.body.neighborhood,
      city: req.body.city,
      zip_code: req.body.zipCode,
      is_active: req.body.isActive !== false
    };

    console.log(`[UPDATE-CUSTOMER] Updating customer ${customerId}:`, updateData);

    const { schemaManager } = await import('../../db');
    const pool = schemaManager.getPool();
    const schemaName = schemaManager.getSchemaName(req.user.tenantId);

    const result = await pool.query(`
      UPDATE "${schemaName}".customers 
      SET first_name = $3, last_name = $4, phone = $5, mobile_phone = $6, 
        customer_type = $7, cpf = $8, cnpj = $9, company_name = $10, contact_person = $11,
        state = $12, address = $13, address_number = $14,
        complement = $15, neighborhood = $16, city = $17, zip_code = $18,
        is_active = $19, updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `, [
      customerId, req.user.tenantId, updateData.first_name, updateData.last_name,
      updateData.phone, updateData.mobile_phone, updateData.customer_type,
      updateData.cpf, updateData.cnpj, updateData.company_name, updateData.contact_person,
      updateData.state, updateData.address, updateData.address_number,
      updateData.complement, updateData.neighborhood, updateData.city, updateData.zip_code,
      updateData.is_active
    ]);

    res.json({
      success: true,
      customer: result.rows[0],
      message: 'Cliente atualizado com sucesso'
    });

  } catch (error: any) {
    console.error('[UPDATE-CUSTOMER] Error:', error);

    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar cliente',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export { customersRouter };