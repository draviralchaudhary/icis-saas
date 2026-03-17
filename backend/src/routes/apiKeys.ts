// ─────────────────────────────────────────────────────────
// ICIS Backend — API Key Routes
// GET    /api/keys       - list keys
// POST   /api/keys       - create key
// DELETE /api/keys/:id   - revoke key
// ─────────────────────────────────────────────────────────
import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { prisma } from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// LIST
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const keys = await prisma.apiKey.findMany({
    where: { userId: req.user!.userId, isActive: true },
    select: {
      id: true, name: true, keyPrefix: true, scopes: true,
      lastUsedAt: true, expiresAt: true, createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  return res.json(keys);
});

// CREATE
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, scopes, expiresAt } = req.body;
    if (!name) return res.status(400).json({ error: 'Key name is required' });

    // Generate key: icis_sk_<random32>
    const rawKey   = `icis_sk_${nanoid(32)}`;
    const keyPrefix = rawKey.slice(0, 16); // icis_sk_ + first 8 chars
    const keyHash  = await bcrypt.hash(rawKey, 10);

    const key = await prisma.apiKey.create({
      data: {
        name,
        keyHash,
        keyPrefix,
        userId: req.user!.userId,
        orgId: req.user!.orgId,
        scopes: scopes || ['read', 'write'],
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    // Return raw key ONCE — never stored in plain text
    return res.status(201).json({
      id: key.id,
      name: key.name,
      key: rawKey,         // ← show to user once only
      keyPrefix: key.keyPrefix,
      scopes: key.scopes,
      createdAt: key.createdAt,
      warning: 'Copy this key now. It will not be shown again.',
    });
  } catch {
    return res.status(500).json({ error: 'Failed to create API key' });
  }
});

// REVOKE
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const key = await prisma.apiKey.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
  });
  if (!key) return res.status(404).json({ error: 'Key not found' });

  await prisma.apiKey.update({
    where: { id: key.id },
    data: { isActive: false },
  });
  return res.json({ message: 'API key revoked' });
});

export default router;
