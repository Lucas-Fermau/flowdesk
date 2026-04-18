import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, type GlobalRole } from '../lib/jwt';
import { prisma } from '../lib/prisma';
import { HttpError } from './errorHandler';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: GlobalRole;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  try {
    const payload = verifyAccessToken(header.slice(7));
    req.userId = payload.userId;
    req.userRole = payload.role;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

export function requireRole(...roles: GlobalRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return next(new HttpError(403, 'Acesso negado'));
    }
    next();
  };
}

export async function requireWorkspaceMember(
  workspaceId: string,
  userId: string,
  allowedRoles?: Array<'owner' | 'admin' | 'manager' | 'member'>
) {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  if (!member) throw new HttpError(403, 'Você não é membro deste workspace');
  if (allowedRoles && !allowedRoles.includes(member.role)) {
    throw new HttpError(403, 'Permissão insuficiente neste workspace');
  }
  return member;
}
