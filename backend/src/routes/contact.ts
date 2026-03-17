// ─────────────────────────────────────────────────────────
// Contact, Usage, Users routes
// ─────────────────────────────────────────────────────────
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { sendEmail } from '../services/email';

// ── CONTACT ───────────────────────────────────────────
export const contactRouter = Router();

const ContactSchema = z.object({
  name:     z.string().min(2).max(100),
  email:    z.string().email(),
  company:  z.string().max(100).optional(),
  phone:    z.string().max(20).optional(),
  interest: z.string().min(1),
  message:  z.string().min(10).max(2000),
});

contactRouter.post('/', async (req: Request, res: Response) => {
  try {
    const data = ContactSchema.parse(req.body);

    const query = await prisma.contactQuery.create({ data });

    // Notify team
    await sendEmail({
      to: process.env.EMAIL_SUPPORT || 'hello@icis.ai',
      subject: `New query from ${data.name} — ${data.interest}`,
      html: `
        <h2>New Contact Query</h2>
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Company:</strong> ${data.company || 'N/A'}</p>
        <p><strong>Interest:</strong> ${data.interest}</p>
        <p><strong>Message:</strong></p>
        <p>${data.message}</p>
      `,
    });

    // Auto-reply to user
    await sendEmail({
      to: data.email,
      subject: 'We received your query — ICIS',
      html: `
        <h2>Thank you, ${data.name}!</h2>
        <p>We've received your query about <strong>${data.interest}</strong>.</p>
        <p>Our team will reach out within 24 business hours.</p>
        <p>— Team ICIS</p>
      `,
    });

    return res.status(201).json({ message: 'Query submitted successfully', id: query.id });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    return res.status(500).json({ error: 'Failed to submit query' });
  }
});

// ── USAGE ─────────────────────────────────────────────
export const usageRouter = Router();

usageRouter.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalTokens, totalCost, dailyUsage] = await Promise.all([
    prisma.usageLog.aggregate({
      where: { userId, createdAt: { gte: startOfMonth } },
      _sum: { tokens: true, cost: true },
    }),
    prisma.usageLog.aggregate({
      where: { userId, createdAt: { gte: startOfMonth } },
      _sum: { cost: true },
    }),
    prisma.usageLog.groupBy({
      by: ['createdAt'],
      where: { userId, createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      _sum: { tokens: true },
    }),
  ]);

  return res.json({
    currentMonth: {
      tokens: totalTokens._sum.tokens || 0,
      cost: totalCost._sum.cost || 0,
    },
    dailyUsage,
  });
});

// ── USERS ─────────────────────────────────────────────
export const usersRouter = Router();

usersRouter.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      id: true, name: true, email: true, company: true,
      role: true, emailVerified: true, createdAt: true,
      organization: { select: { id: true, name: true, plan: true } },
      _count: { select: { agents: true, apiKeys: true } },
    },
  });
  return res.json(user);
});

usersRouter.patch('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const { name, company } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data: { name, company },
    select: { id: true, name: true, email: true, company: true, role: true },
  });
  return res.json(user);
});
