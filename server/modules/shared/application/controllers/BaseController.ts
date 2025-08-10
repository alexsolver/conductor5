// Clean architecture base controller without framework dependencies

interface CleanRequest {
  body?: any;
  query?: any;
  params?: any;
  user?: any;
  headers?: any;
}

interface CleanResponse {
  status: (code: number) => {
    json: (data: any) => void;
    send: (data?: any) => void;
  };
  json: (data: any) => void;
  send: (data?: any) => void;
}

export abstract class BaseController {
  protected success(res: CleanResponse, data: any, message?: string) {
    return res.status(200).json({
      success: true,
      data,
      message
    });
  }

  protected created(res: CleanResponse, data: any, message?: string) {
    return res.status(201).json({
      success: true,
      data,
      message
    });
  }

  protected badRequest(res: CleanResponse, message: string, errors?: any) {
    return res.status(400).json({
      success: false,
      message,
      errors
    });
  }

  protected notFound(res: CleanResponse, message: string) {
    return res.status(404).json({
      success: false,
      message
    });
  }

  protected internalError(res: CleanResponse, message: string, error?: any) {
    return res.status(500).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}

import { standardResponse } from '../../../utils/standardResponse';

export abstract class BaseController {
  protected handleError(error: any, res: CleanResponse, message: string = 'Erro interno do servidor'): void {
    console.error('Controller Error:', error);
    res.status(500).json(standardResponse(false, message));
  }

  protected validateTenant(req: CleanRequest, res: CleanResponse): string | null {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      res.status(400).json(standardResponse(false, 'Tenant ID é obrigatório'));
      return null;
    }
    return tenantId;
  }

  protected validateId(id: string, res: CleanResponse): boolean {
    if (!id || id.trim() === '') {
      res.status(400).json(standardResponse(false, 'ID é obrigatório'));
      return false;
    }
    return true;
  }

  protected successResponse(res: CleanResponse, message: string, data?: any, status: number = 200): void {
    res.status(status).json(standardResponse(true, message, data));
  }
}