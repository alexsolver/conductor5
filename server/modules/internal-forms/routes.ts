/**
 * Internal Forms Routes
 * Handles internal form management and processing
 */

import { Router, Request, Response } from 'express';
import { jwtAuth } from '../../middleware/jwtAuth';
import { requireTenantAccess, AuthenticatedRequest } from '../../middleware/rbacMiddleware';
import { logInfo, logError } from '../../utils/logger';
import { storage } from '../../storage-simple';

const router = Router();

/**
 * Get all internal forms for tenant
 */
router.get('/', jwtAuth, requireTenantAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId!;
    const { page = 1, limit = 20, search } = req.query;
    
    logInfo('Getting internal forms', { tenantId, page, limit, search });
    
    // Mock internal forms - replace with actual implementation
    const forms = ['
      {
        id: 'employee_onboarding',
        title: 'Employee Onboarding Form',
        description: 'Comprehensive form for new employee onboarding process',
        status: 'active',
        category: 'hr',
        fields: ['
          { name: 'employee_name', type: 'text', required: true, label: 'Employee Name' },
          { name: 'employee_id', type: 'text', required: true, label: 'Employee ID' },
          { name: 'department', type: 'select', required: true, label: 'Department', options: ['IT', 'HR', 'Finance', 'Operations] },
          { name: 'start_date', type: 'date', required: true, label: 'Start Date' },
          { name: 'manager_email', type: 'email', required: true, label: 'Manager Email' },
          { name: 'equipment_needed', type: 'checkbox', label: 'Equipment Needed', options: ['Laptop', 'Monitor', 'Phone', 'Access Card] }
        ],
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-20T00:00:00Z'
      },
      {
        id: 'expense_report',
        title: 'Expense Report Form',
        description: 'Form for submitting business expense reports',
        status: 'active',
        category: 'finance',
        fields: ['
          { name: 'employee_name', type: 'text', required: true, label: 'Employee Name' },
          { name: 'report_period', type: 'text', required: true, label: 'Report Period' },
          { name: 'total_amount', type: 'number', required: true, label: 'Total Amount' },
          { name: 'expense_category', type: 'select', required: true, label: 'Category', options: ['Travel', 'Meals', 'Office Supplies', 'Training] },
          { name: 'receipts', type: 'file', required: true, label: 'Receipt Attachments' },
          { name: 'justification', type: 'textarea', required: true, label: 'Business Justification' }
        ],
        createdAt: '2024-01-10T00:00:00Z',
        updatedAt: '2024-01-18T00:00:00Z'
      }
    ];

    // Apply search filter if provided
    let filteredForms = forms;
    if (search) {
      const searchTerm = search.toString().toLowerCase();
      filteredForms = forms.filter(form =>
        form.title.toLowerCase().includes(searchTerm) ||
        form.description.toLowerCase().includes(searchTerm) ||
        form.category.toLowerCase().includes(searchTerm)
      );
    }

    // Apply pagination
    const startIndex = (Number(page) - 1) * Number(limit);
    const paginatedForms = filteredForms.slice(startIndex, startIndex + Number(limit));

    res.json({
      forms: paginatedForms,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: filteredForms.length,
        totalPages: Math.ceil(filteredForms.length / Number(limit))
      }
    });
  } catch (error) {
    logError('Error getting internal forms', error);
    res.status(500).json({ message: 'Failed to get internal forms' });
  }
});

/**
 * Get specific internal form by ID
 */
router.get('/:formId', jwtAuth, requireTenantAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId!;
    const { formId } = req.params;
    
    logInfo('Getting internal form by ID', { tenantId, formId });
    
    // Mock form retrieval - replace with actual implementation
    if (formId === 'employee_onboarding') {
      const form = {
        id: 'employee_onboarding',
        title: 'Employee Onboarding Form',
        description: 'Comprehensive form for new employee onboarding process',
        status: 'active',
        category: 'hr',
        fields: ['
          { name: 'employee_name', type: 'text', required: true, label: 'Employee Name' },
          { name: 'employee_id', type: 'text', required: true, label: 'Employee ID' },
          { name: 'department', type: 'select', required: true, label: 'Department', options: ['IT', 'HR', 'Finance', 'Operations] },
          { name: 'start_date', type: 'date', required: true, label: 'Start Date' },
          { name: 'manager_email', type: 'email', required: true, label: 'Manager Email' },
          { name: 'equipment_needed', type: 'checkbox', label: 'Equipment Needed', options: ['Laptop', 'Monitor', 'Phone', 'Access Card] }
        ],
        submissions: 15,
        lastSubmission: '2024-01-19T14:30:00Z',
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-20T00:00:00Z'
      };
      
      res.json(form);
    } else {
      res.status(404).json({ message: 'Form not found' });
    }
  } catch (error) {
    logError('Error getting internal form by ID', error);
    res.status(500).json({ message: 'Failed to get internal form' });
  }
});

/**
 * Create new internal form
 */
router.post('/', jwtAuth, requireTenantAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId!;
    const formData = req.body;
    
    logInfo('Creating internal form', { tenantId, formData });
    
    // Validate form data
    if (!formData.title || !formData.fields || !Array.isArray(formData.fields)) {
      return res.status(400).json({ message: 'Form title and fields are required' });
    }
    
    // Validate fields
    for (const field of formData.fields) {
      if (!field.name || !field.type || !field.label) {
        return res.status(400).json({ message: 'Each field must have name, type, and label' });
      }
    }
    
    const newForm = {
      id: `form_${Date.now()}`,
      tenantId,
      ...formData,
      status: formData.status || 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.status(201).json(newForm);
  } catch (error) {
    logError('Error creating internal form', error);
    res.status(500).json({ message: 'Failed to create internal form' });
  }
});

/**
 * Update internal form
 */
router.put('/:formId', jwtAuth, requireTenantAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId!;
    const { formId } = req.params;
    const updateData = req.body;
    
    logInfo('Updating internal form', { tenantId, formId, updateData });
    
    // Validate update data
    if (updateData.fields && !Array.isArray(updateData.fields)) {
      return res.status(400).json({ message: 'Fields must be an array' });
    }
    
    const updatedForm = {
      id: formId,
      tenantId,
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    res.json(updatedForm);
  } catch (error) {
    logError('Error updating internal form', error);
    res.status(500).json({ message: 'Failed to update internal form' });
  }
});

/**
 * Delete internal form
 */
router.delete('/:formId', jwtAuth, requireTenantAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId!;
    const { formId } = req.params;
    
    logInfo('Deleting internal form', { tenantId, formId });
    
    // Mock deletion - replace with actual implementation
    res.json({ message: 'Form deleted successfully' });
  } catch (error) {
    logError('Error deleting internal form', error);
    res.status(500).json({ message: 'Failed to delete internal form' });
  }
});

/**
 * Submit internal form
 */
router.post('/:formId/submit', jwtAuth, requireTenantAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId!;
    const { formId } = req.params;
    const submissionData = req.body;
    
    logInfo('Submitting internal form', { tenantId, formId, submissionData });
    
    // Validate submission data
    if (!submissionData || typeof submissionData !== 'object') {
      return res.status(400).json({ message: 'Submission data is required' });
    }
    
    const submission = {
      id: `submission_${Date.now()}`,
      formId,
      tenantId,
      submittedBy: req.user!.id,
      data: submissionData,
      status: 'pending',
      submittedAt: new Date().toISOString()
    };

    res.status(201).json(submission);
  } catch (error) {
    logError('Error submitting internal form', error);
    res.status(500).json({ message: 'Failed to submit form' });
  }
});

/**
 * Get form submissions
 */
router.get('/:formId/submissions', jwtAuth, requireTenantAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId!;
    const { formId } = req.params;
    const { page = 1, limit = 20, status } = req.query;
    
    logInfo('Getting form submissions', { tenantId, formId, page, limit, status });
    
    // Mock submissions - replace with actual implementation
    const submissions = ['
      {
        id: 'submission_1',
        formId,
        tenantId,
        submittedBy: 'user_123',
        data: {
          employee_name: 'John Doe',
          employee_id: 'EMP001',
          department: 'IT',
          start_date: '2024-01-22',
          manager_email: 'manager@company.com',
          equipment_needed: ['Laptop', 'Monitor]
        },
        status: 'approved',
        submittedAt: '2024-01-20T10:30:00Z',
        reviewedAt: '2024-01-21T09:15:00Z',
        reviewedBy: 'manager_456'
      },
      {
        id: 'submission_2',
        formId,
        tenantId,
        submittedBy: 'user_789',
        data: {
          employee_name: 'Jane Smith',
          employee_id: 'EMP002',
          department: 'HR',
          start_date: '2024-01-25',
          manager_email: 'hr@company.com',
          equipment_needed: ['Laptop', 'Phone]
        },
        status: 'pending',
        submittedAt: '2024-01-21T14:20:00Z'
      }
    ];

    // Apply status filter if provided
    let filteredSubmissions = submissions;
    if (status) {
      filteredSubmissions = submissions.filter(submission => submission.status === status);
    }

    // Apply pagination
    const startIndex = (Number(page) - 1) * Number(limit);
    const paginatedSubmissions = filteredSubmissions.slice(startIndex, startIndex + Number(limit));

    res.json({
      submissions: paginatedSubmissions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: filteredSubmissions.length,
        totalPages: Math.ceil(filteredSubmissions.length / Number(limit))
      }
    });
  } catch (error) {
    logError('Error getting form submissions', error);
    res.status(500).json({ message: 'Failed to get form submissions' });
  }
});

export default router;