// ─────────────────────────────────────────────────────────
// ICIS Backend — Auth Routes
// POST /api/auth/register
// POST /api/auth/login
// POST /api/auth/refresh
// POST /api/auth/logout
// POST /api/auth/forgot-password
// POST /api/auth/reset-password
// GET  /api/auth/verify-email/:token
// ─────────────────────────────────────────────────────────
import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { prisma } from '../config/db';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../config/jwt';
import { authenticate, AuthRequest } from '../middleware/auth';
import { sendEmail } from '../services/email';

const router = Router();

// ── REGISTER ──────────────────────────────────────────
const RegisterSchema = z.object({
  name:     z.string().min(2).max(80),
  email:    z.string().email(),
  password: z.string().min(8).max(100),
  company:  z.string().optional(),
});

router.post('/register', async (req: Request, res: Response) => {
  try {
    const body = RegisterSchema.parse(req.body);

    const exists = await prisma.user.findUnique({ where: { email: body.email } });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash   = await bcrypt.hash(body.password, 12);
    const emailVerifyToken = nanoid(32);

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: passwordHash,
        company: body.company,
        emailVerifyToken,
      },
    });

    await sendEmail({
      to: user.email,
      subject: 'Verify your ICIS account',
      html: `
        <h2>Welcome to ICIS, ${user.name}!</h2>
        <p>Please verify your email:</p>
        <a href="${process.env.FRONTEND_URL}/verify-email/${emailVerifyToken}">
          Verify Email
        </a>
      `,
    });

    const accessToken  = signAccessToken({ userId: user.id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.id, email: user.email, role: user.role });

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      accessToken,
      refreshToken,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    return res.status(500).json({ error: 'Registration failed' });
  }
});

// ── LOGIN ─────────────────────────────────────────────
const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string(),
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = LoginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const accessToken  = signAccessToken({ userId: user.id, email: user.email, role: user.role, orgId: user.orgId || undefined });
    const refreshToken = signRefreshToken({ userId: user.id, email: user.email, role: user.role, orgId: user.orgId || undefined });

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, company: user.company },
      accessToken,
      refreshToken,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    return res.status(500).json({ error: 'Login failed' });
  }
});

// ── REFRESH TOKEN ─────────────────────────────────────
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

    const payload = verifyRefreshToken(refreshToken);
    const session = await prisma.session.findUnique({ where: { refreshToken } });
    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Session expired' });
    }

    const newAccessToken  = signAccessToken({ userId: payload.userId, email: payload.email, role: payload.role, orgId: payload.orgId });
    const newRefreshToken = signRefreshToken({ userId: payload.userId, email: payload.email, role: payload.role, orgId: payload.orgId });

    await prisma.session.update({
      where: { id: session.id },
      data: {
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// ── LOGOUT ────────────────────────────────────────────
router.post('/logout', authenticate, async (req: AuthRequest, res: Response) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await prisma.session.deleteMany({ where: { refreshToken } });
  }
  return res.json({ message: 'Logged out' });
});

// ── VERIFY EMAIL ──────────────────────────────────────
router.get('/verify-email/:token', async (req: Request, res: Response) => {
  const user = await prisma.user.findFirst({
    where: { emailVerifyToken: req.params.token },
  });
  if (!user) return res.status(400).json({ error: 'Invalid verification token' });

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, emailVerifyToken: null },
  });
  return res.json({ message: 'Email verified successfully' });
});

// ── FORGOT PASSWORD ───────────────────────────────────
router.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const token = nanoid(32);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });
    await sendEmail({
      to: user.email,
      subject: 'Reset your ICIS password',
      html: `
        <h2>Password Reset</h2>
        <p>Click to reset your password (expires in 1 hour):</p>
        <a href="${process.env.FRONTEND_URL}/reset-password/${token}">Reset Password</a>
      `,
    });
  }

  // Always return success to prevent email enumeration
  return res.json({ message: 'If that email exists, a reset link has been sent.' });
});

// ── RESET PASSWORD ────────────────────────────────────
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });
    if (!user) return res.status(400).json({ error: 'Invalid or expired reset token' });

    const hash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hash, resetToken: null, resetTokenExpiry: null },
    });
    // Invalidate all sessions
    await prisma.session.deleteMany({ where: { userId: user.id } });

    return res.json({ message: 'Password reset successfully' });
  } catch {
    return res.status(500).json({ error: 'Reset failed' });
  }
});

// ── ME ────────────────────────────────────────────────
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, name: true, email: true, company: true, role: true, emailVerified: true, createdAt: true },
  });
  return res.json(user);
});

export default router;
