// Controller base without framework dependencies

export interface RequestData {
  body: any;
  params: any;
  query: any;
  user?: any;
}

export interface ResponseData {
  status: (code: number) => ResponseData;
  json: (data: any) => void;
  send: (data: any) => void;
}

export abstract class BaseController {
  protected success(res: ResponseData, data: any, message?: string) {
    return res.status(200).json({
      success: true,
      data,
      message
    });
  }

  protected created(res: ResponseData, data: any, message?: string) {
    return res.status(201).json({
      success: true,
      data,
      message
    });
  }

  protected badRequest(res: ResponseData, message: string, errors?: any) {
    return res.status(400).json({
      success: false,
      message,
      errors
    });
  }

  protected notFound(res: ResponseData, message: string) {
    return res.status(404).json({
      success: false,
      message
    });
  }

  protected internalError(res: ResponseData, message: string, error?: any) {
    return res.status(500).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}

import { standardResponse } from '../../../utils/standardResponse';

export abstract class BaseController {
  protected handleError(error: any, res: ResponseData, message: string = 'Erro interno do servidor'): void {
    console.error('Controller Error:', error);
    res.status(500).json(standardResponse(false, message));
  }

  protected validateTenant(req: RequestData, res: ResponseData): string | null {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      res.status(400).json(standardResponse(false, 'Tenant ID é obrigatório'));
      return null;
    }
    return tenantId;
  }

  protected validateId(id: string, res: ResponseData): boolean {
    if (!id || id.trim() === '') {
      res.status(400).json(standardResponse(false, 'ID é obrigatório'));
      return false;
    }
    return true;
  }

  protected successResponse(res: ResponseData, message: string, data?: any, status: number = 200): void {
    res.status(status).json(standardResponse(true, message, data));
  }
}