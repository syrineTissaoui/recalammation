import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthedRequest extends Request {
  user?: { id: string; role: 'AGENT' | 'CADRE'; email: string };
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const hdr = req.header('Authorization');
    if (!hdr || !hdr.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing Authorization header' });
    }
    const token = hdr.slice('Bearer '.length);
    const payload = jwt.verify(token, config.jwtSecret) as AuthedRequest['user'];
    if (!payload?.id) return res.status(401).json({ message: 'Invalid token' });
    req.user = payload;
    next();
  } catch (e: any) {
    return res.status(401).json({ message: 'Unauthorized', detail: e.message });
  }
}
