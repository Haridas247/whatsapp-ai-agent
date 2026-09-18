import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    businessId: string;
    role: string;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    req.user = {
      userId: decoded.userId,
      businessId: decoded.businessId,
      role: decoded.role,
    };

    // If user is SUPERADMIN and provided a tenant switch header, override the businessId
    if (decoded.role === 'SUPERADMIN') {
      const switchBusinessId = req.headers['x-business-id'] as string;
      if (switchBusinessId) {
        req.user.businessId = switchBusinessId;
      }
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
