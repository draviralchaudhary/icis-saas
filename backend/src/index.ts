// ─────────────────────────────────────────────────────────
// ICIS Backend — src/index.ts
// ─────────────────────────────────────────────────────────
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';

import { logger } from './config/logger';
import { prisma } from './config/db';

// Routes
import authRoutes      from './routes/auth';
import userRoutes      from './routes/users';
import agentRoutes     from './routes/agents';
import apiKeyRoutes    from './routes/apiKeys';
import billingRoutes   from './routes/billing';
import contactRoutes   from './routes/contact';
import usageRoutes     from './routes/usage';
import webhookRoutes   from './routes/webhooks';

const app = express();
const PORT = process.env.PORT || 4000;

// ── GLOBAL MIDDLEWARE ─────────────────────────────────

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Stripe webhooks need raw body BEFORE json parser
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }), webhookRoutes);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Stricter limit for auth
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts.' },
});

// ── ROUTES ────────────────────────────────────────────

app.use('/api/auth',    authLimiter, authRoutes);
app.use('/api/users',   userRoutes);
app.use('/api/agents',  agentRoutes);
app.use('/api/keys',    apiKeyRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/usage',   usageRoutes);

// Health check
app.get('/health', (_req, res) => res.json({
  status: 'ok',
  version: '1.0.0',
  timestamp: new Date().toISOString(),
}));

// ── ERROR HANDLER ─────────────────────────────────────

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error(err.stack || err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ── START ─────────────────────────────────────────────

async function start() {
  try {
    await prisma.$connect();
    logger.info('✓ Database connected');

    app.listen(PORT, () => {
      logger.info(`✓ ICIS API running on http://localhost:${PORT}`);
      logger.info(`  ENV: ${process.env.NODE_ENV}`);
    });
  } catch (err) {
    logger.error('Failed to start:', err);
    process.exit(1);
  }
}

start();

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default app;
