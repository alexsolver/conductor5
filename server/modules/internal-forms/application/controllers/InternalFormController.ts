
import { Request, Response } from 'express';
import { CreateInternalFormUseCase } from '../use-cases/CreateInternalFormUseCase';
import { SubmitFormUseCase } from '../use-cases/SubmitFormUseCase';
import { IInternalFormRepository } from '../../domain/repositories/IInternalFormRepository';
import { IFormSubmissionRepository } from '../../domain/repositories/IFormSubmissionRepository';

export class InternalFormController {
  constructor(
    private createFormUseCase: CreateInternalFormUseCase,
    private submitFormUseCase: SubmitFormUseCase,
    private formRepository: IInternalFormRepository,
    private submissionRepository: IFormSubmissionRepository
  ) {}

  async createForm(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = req.user as any;
      const formData = {
        ...req.body,
        tenantId,
        createdBy: userId
      };

      const form = await this.createFormUseCase.execute(formData);
      res.status(201).json(form);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getForms(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.user as any;
      const { category } = req.query;

      const forms = category 
        ? await this.formRepository.findByCategory(tenantId, category as string)
        : await this.formRepository.findByTenant(tenantId);

      res.json(forms);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getForm(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.user as any;
      const { id } = req.params;

      const form = await this.formRepository.findById(id, tenantId);
      if (!form) {
        res.status(404).json({ error: 'Form not found' });
        return;
      }

      res.json(form);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async submitForm(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = req.user as any;
      const { id } = req.params;

      const submission = await this.submitFormUseCase.execute({
        formId: id,
        data: req.body.data,
        submittedBy: userId,
        tenantId
      });

      res.status(201).json(submission);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getSubmissions(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.user as any;
      const { formId, status } = req.query;

      let submissions;
      if (formId) {
        submissions = await this.submissionRepository.findByForm(formId as string, tenantId);
      } else if (status) {
        submissions = await this.submissionRepository.findByStatus(status as string, tenantId);
      } else {
        submissions = await this.submissionRepository.findByUser(', tenantId); // All submissions
      }

      res.json(submissions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
