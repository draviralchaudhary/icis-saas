// ─────────────────────────────────────────────────────────
// ICIS Backend — Agent Routes
// GET    /api/agents           - list user's agents
// POST   /api/agents           - create agent
// GET    /api/agents/:id       - get agent detail
// PATCH  /api/agents/:id       - update agent
// DELETE /api/agents/:id       - delete agent
// POST   /api/agents/:id/run   - trigger agent run
// GET    /api/agents/:id/runs  - get run history
// ─────────────────────────────────────────────────────────
import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { authenticate, authenticateApiKey, AuthRequest } from '../middleware/auth';

const router = Router();

// Both JWT and API key can access agents
const auth = [authenticate];

const AgentSchema = z.object({
  name:        z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type:        z.enum(['TASK_AGENT','RESEARCH_AGENT','CODE_AGENT','DATA_AGENT','CHAT_AGENT','CUSTOM']).default('TASK_AGENT'),
  config: z.object({
    model:         z.string().default('claude-sonnet-4-20250514'),
    systemPrompt:  z.string().optional(),
    tools:         z.array(z.string()).default([]),
    maxTokens:     z.number().default(4096),
    temperature:   z.number().min(0).max(1).default(0.7),
    memoryEnabled: z.boolean().default(true),
  }).default({}),
});

// LIST
router.get('/', ...auth, async (req: AuthRequest, res: Response) => {
  const agents = await prisma.agent.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { runs: true } },
    },
  });
  return res.json(agents);
});

// CREATE
router.post('/', ...auth, async (req: AuthRequest, res: Response) => {
  try {
    const data = AgentSchema.parse(req.body);
    const agent = await prisma.agent.create({
      data: {
        ...data,
        userId: req.user!.userId,
        orgId: req.user!.orgId,
      },
    });
    return res.status(201).json(agent);
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    return res.status(500).json({ error: 'Failed to create agent' });
  }
});

// GET ONE
router.get('/:id', ...auth, async (req: AuthRequest, res: Response) => {
  const agent = await prisma.agent.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
    include: {
      runs: { take: 10, orderBy: { createdAt: 'desc' } },
      _count: { select: { runs: true } },
    },
  });
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  return res.json(agent);
});

// UPDATE
router.patch('/:id', ...auth, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.agent.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    if (!existing) return res.status(404).json({ error: 'Agent not found' });

    const data = AgentSchema.partial().parse(req.body);
    const agent = await prisma.agent.update({
      where: { id: req.params.id },
      data,
    });
    return res.json(agent);
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    return res.status(500).json({ error: 'Update failed' });
  }
});

// DELETE
router.delete('/:id', ...auth, async (req: AuthRequest, res: Response) => {
  const existing = await prisma.agent.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
  });
  if (!existing) return res.status(404).json({ error: 'Agent not found' });
  await prisma.agent.update({ where: { id: req.params.id }, data: { status: 'ARCHIVED' } });
  return res.json({ message: 'Agent archived' });
});

// TRIGGER RUN
router.post('/:id/run', ...auth, async (req: AuthRequest, res: Response) => {
  try {
    const agent = await prisma.agent.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    if (agent.status !== 'ACTIVE') return res.status(400).json({ error: 'Agent is not active' });

    const { input } = req.body;
    if (!input) return res.status(400).json({ error: 'Input is required' });

    // Create run record
    const run = await prisma.agentRun.create({
      data: { agentId: agent.id, input, status: 'running' },
    });

    // TODO: Dispatch to actual agent execution engine / queue
    // For now, simulate completion
    setTimeout(async () => {
      await prisma.agentRun.update({
        where: { id: run.id },
        data: {
          status: 'completed',
          output: { message: 'Agent run completed', result: 'Simulated output' },
          tokensUsed: Math.floor(Math.random() * 1000 + 200),
          durationMs: Math.floor(Math.random() * 3000 + 500),
          completedAt: new Date(),
        },
      });
      await prisma.agent.update({
        where: { id: agent.id },
        data: { totalRuns: { increment: 1 }, successRuns: { increment: 1 } },
      });
    }, 1000);

    return res.status(202).json({ run, message: 'Agent run initiated' });
  } catch {
    return res.status(500).json({ error: 'Failed to run agent' });
  }
});

// RUN HISTORY
router.get('/:id/runs', ...auth, async (req: AuthRequest, res: Response) => {
  const agent = await prisma.agent.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
  });
  if (!agent) return res.status(404).json({ error: 'Agent not found' });

  const page  = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);

  const [runs, total] = await Promise.all([
    prisma.agentRun.findMany({
      where: { agentId: agent.id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.agentRun.count({ where: { agentId: agent.id } }),
  ]);

  return res.json({ runs, total, page, limit, pages: Math.ceil(total / limit) });
});

export default router;
