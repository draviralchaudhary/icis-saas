import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../config/jwt';
import { prisma } from '../config/db';

export interface AuthRequest extends Request {
  user?: JwtPayload & { id: string };
}

// ── JWT Auth Guard ────────────────────────────────────
export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = header.split(' ')[1];
    const payload = verifyAccessToken(token);
    req.user = { ...payload, id: payload.userId };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ── API Key Auth Guard ────────────────────────────────
import bcrypt from 'bcryptjs';

export async function authenticateApiKey(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const raw = req.headers['x-api-key'] as string;
    if (!raw?.startsWith('icis_sk_')) {
      return res.status(401).json({ error: 'Invalid API key format' });
    }

    const prefix = raw.slice(0, 16); // icis_sk_ + 8 chars
    const keys = await prisma.apiKey.findMany({
      where: { keyPrefix: prefix, isActive: true },
      include: { user: true },
    });

    let matched = null;
    for (const key of keys) {
      if (await bcrypt.compare(raw, key.keyHash)) { matched = key; break; }
    }

    if (!matched) return res.status(401).json({ error: 'Invalid API key' });
    if (matched.expiresAt && matched.expiresAt < new Date()) {
      return res.status(401).json({ error: 'API key expired' });
    }

    // Update last used
    await prisma.apiKey.update({
      where: { id: matched.id },
      data: { lastUsedAt: new Date() },
    });

    req.user = {
      userId: matched.userId,
      id: matched.userId,
      email: matched.user.email,
      role: matched.user.role,
      orgId: matched.orgId || undefined,
    };
    next();
  } catch {
    return res.status(401).json({ error: 'API key authentication failed' });
  }
}

// ── Role Guard ────────────────────────────────────────
export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
