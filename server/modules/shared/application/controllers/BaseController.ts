// Removida dependência Express

export interface BaseRequest {
  params: Record<string, any>;
  query: Record<string, any>;
  body: any;
  user?: {
    id: string;
    tenantId: string;
    email: string;
    role: string;
  };
  headers: Record<string, string>;
}

export interface BaseResponse {
  status(code: number): BaseResponse;
  json(data: any): BaseResponse;
  send(data: any): BaseResponse;
}

export abstract class BaseController {
  protected success(res: BaseResponse, data: any, message?: string) {
    return res.status(200).json({
      success: true,
      data,
      message
    });
  }

  protected created(res: BaseResponse, data: any, message?: string) {
    return res.status(201).json({
      success: true,
      data,
      message
    });
  }

  protected badRequest(res: BaseResponse, message: string, errors?: any) {
    return res.status(400).json({
      success: false,
      message,
      errors
    });
  }

  protected notFound(res: BaseResponse, message: string) {
    return res.status(404).json({
      success: false,
      message
    });
  }

  protected internalError(res: BaseResponse, message: string, error?: any) {
    return res.status(500).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}
import { standardResponse } from '../../../utils/standardResponse';

export abstract class BaseController {
  protected handleError(error: any, res: Response, message: string = 'Erro interno do servidor'): void {
    console.error('Controller Error:', error);
    res.status(500).json(standardResponse(false, message));
  }

  protected validateTenant(req: Request, res: Response): string | null {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      res.status(400).json(standardResponse(false, 'Tenant ID é obrigatório'));
      return null;
    }
    return tenantId;
  }

  protected validateId(id: string, res: Response): boolean {
    if (!id || id.trim() === '') {
      res.status(400).json(standardResponse(false, 'ID é obrigatório'));
      return false;
    }
    return true;
  }

  protected successResponse(res: Response, message: string, data?: any, status: number = 200): void {
    res.status(status).json(standardResponse(true, message, data));
  }
}