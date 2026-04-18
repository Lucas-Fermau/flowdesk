import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../lib/jwt';
import { HttpError } from '../middleware/errorHandler';
import { loginSchema, refreshSchema, registerSchema } from '../schemas';

const BCRYPT_ROUNDS = 10;

function publicUser(u: {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: 'admin' | 'manager' | 'member';
  createdAt: Date;
}) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    avatar: u.avatar,
    role: u.role,
    createdAt: u.createdAt,
  };
}

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse(req.body);
      const existing = await prisma.user.findUnique({ where: { email: data.email } });
      if (existing) throw new HttpError(409, 'Email já cadastrado');

      const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
      const user = await prisma.user.create({
        data: { name: data.name, email: data.email, password: passwordHash },
      });

      const accessToken = signAccessToken({ userId: user.id, role: user.role });
      const refreshToken = signRefreshToken({
        userId: user.id,
        tokenVersion: user.tokenVersion,
      });

      res.status(201).json({ user: publicUser(user), accessToken, refreshToken });
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = loginSchema.parse(req.body);
      const user = await prisma.user.findUnique({ where: { email: data.email } });
      if (!user) throw new HttpError(401, 'Credenciais inválidas');

      const valid = await bcrypt.compare(data.password, user.password);
      if (!valid) throw new HttpError(401, 'Credenciais inválidas');

      const accessToken = signAccessToken({ userId: user.id, role: user.role });
      const refreshToken = signRefreshToken({
        userId: user.id,
        tokenVersion: user.tokenVersion,
      });

      res.json({ user: publicUser(user), accessToken, refreshToken });
    } catch (err) {
      next(err);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const data = refreshSchema.parse(req.body);
      let payload: ReturnType<typeof verifyRefreshToken>;
      try {
        payload = verifyRefreshToken(data.refreshToken);
      } catch {
        throw new HttpError(401, 'Refresh token inválido ou expirado');
      }

      const user = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user) throw new HttpError(401, 'Usuário não encontrado');
      if (user.tokenVersion !== payload.tokenVersion) {
        throw new HttpError(401, 'Refresh token revogado');
      }

      const accessToken = signAccessToken({ userId: user.id, role: user.role });
      // Rotate refresh token by issuing a new one with same version
      const refreshToken = signRefreshToken({
        userId: user.id,
        tokenVersion: user.tokenVersion,
      });

      res.json({ accessToken, refreshToken });
    } catch (err) {
      next(err);
    }
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.userId } });
      if (!user) throw new HttpError(404, 'Usuário não encontrado');
      res.json({ user: publicUser(user) });
    } catch (err) {
      next(err);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      // Invalidate all refresh tokens by bumping tokenVersion
      await prisma.user.update({
        where: { id: req.userId },
        data: { tokenVersion: { increment: 1 } },
      });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
