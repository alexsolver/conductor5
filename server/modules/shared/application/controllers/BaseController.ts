
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
