
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './jwtAuth';
import { tokenManager } from '../utils/tokenManager';

export const tokenRefreshMiddleware = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return next();
    }

    // Get current access token from cookies
    const currentToken = req.cookies?.accessToken;
    
    if (!currentToken) {
      return next();
    }

    // Check if token is expiring soon (within 5 minutes)
    const isExpiringSoon = tokenManager.isTokenExpiringSoon(currentToken);
    
    if (isExpiringSoon) {
      console.log('🔄 [TOKEN-REFRESH] Token expiring soon, attempting refresh...');
      
      // Get refresh token
      const refreshToken = req.cookies?.refreshToken;
      
      if (!refreshToken) {
        console.log('⚠️ [TOKEN-REFRESH] No refresh token available');
        return next();
      }

      // Verify refresh token
      const refreshPayload = tokenManager.verifyRefreshToken(refreshToken);
      
      if (!refreshPayload) {
        console.log('❌ [TOKEN-REFRESH] Invalid refresh token');
        // Clear invalid tokens
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        return next();
      }

      // Generate new access token
      const newAccessToken = tokenManager.generateAccessToken({
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        tenantId: req.user.tenantId
      });

      // Set new access token cookie
      res.cookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      console.log('✅ [TOKEN-REFRESH] Token refreshed successfully');
    }

    next();
  } catch (error) {
    console.error('❌ [TOKEN-REFRESH] Error during token refresh:', error);
    next();
  }
};
