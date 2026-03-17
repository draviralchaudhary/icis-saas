// ─────────────────────────────────────────────────────────
// ICIS Backend — Billing Routes (Stripe)
// GET  /api/billing/plans
// POST /api/billing/checkout
// POST /api/billing/portal
// GET  /api/billing/subscription
// GET  /api/billing/invoices
// ─────────────────────────────────────────────────────────
import { Router, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2023-10-16' as any,
});

const router = Router();

// ── PLANS ─────────────────────────────────────────────
router.get('/plans', (_req, res) => {
  return res.json([
    {
      id: 'free',
      name: 'Free',
      price: 0,
      currency: 'inr',
      interval: 'month',
      features: [
        '2 AI Agents',
        '1,000 API calls/month',
        'Community support',
        'Standard compute',
      ],
      limits: { agents: 2, apiCalls: 1000 },
    },
    {
      id: 'starter',
      name: 'Starter',
      priceId: process.env.STRIPE_PRICE_STARTER,
      price: 299900,   // ₹2,999/mo in paise
      currency: 'inr',
      interval: 'month',
      features: [
        '10 AI Agents',
        '50,000 API calls/month',
        'Email support',
        'Priority compute',
        'Custom agent config',
      ],
      limits: { agents: 10, apiCalls: 50000 },
    },
    {
      id: 'pro',
      name: 'Pro',
      priceId: process.env.STRIPE_PRICE_PRO,
      price: 999900,
      currency: 'inr',
      interval: 'month',
      popular: true,
      features: [
        'Unlimited agents',
        '500,000 API calls/month',
        'Priority support + SLA',
        'Supercompute access',
        'Multi-agent orchestration',
        'Usage analytics',
        'API key management',
      ],
      limits: { agents: -1, apiCalls: 500000 },
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      priceId: process.env.STRIPE_PRICE_ENTERPRISE,
      price: null,
      currency: 'inr',
      interval: 'month',
      features: [
        'Everything in Pro',
        'Custom compute clusters',
        'Dedicated account manager',
        'SSO / SAML',
        'On-prem deployment',
        'Custom SLA',
        'Volume discounts',
      ],
      limits: { agents: -1, apiCalls: -1 },
    },
  ]);
});

// ── CREATE CHECKOUT SESSION ───────────────────────────
router.post('/checkout', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { priceId, plan } = req.body;
    if (!priceId) return res.status(400).json({ error: 'priceId is required' });

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Get or create Stripe customer
    let customerId: string;
    if (user.orgId) {
      const org = await prisma.organization.findUnique({ where: { id: user.orgId } });
      if (org?.stripeId) {
        customerId = org.stripeId;
      } else {
        const customer = await stripe.customers.create({
          email: user.email, name: user.name,
          metadata: { userId: user.id, orgId: user.orgId || '' },
        });
        customerId = customer.id;
      }
    } else {
      const customer = await stripe.customers.create({
        email: user.email, name: user.name,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/dashboard/billing?success=1`,
      cancel_url:  `${process.env.FRONTEND_URL}/dashboard/billing?canceled=1`,
      metadata: { userId: user.id, plan },
      subscription_data: {
        metadata: { userId: user.id },
      },
    });

    return res.json({ url: session.url });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ── CUSTOMER PORTAL ───────────────────────────────────
router.post('/portal', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { organization: true },
    });

    const stripeId = user?.organization?.stripeId;
    if (!stripeId) return res.status(400).json({ error: 'No billing customer found' });

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeId,
      return_url: `${process.env.FRONTEND_URL}/dashboard/billing`,
    });

    return res.json({ url: session.url });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ── GET SUBSCRIPTION ──────────────────────────────────
router.get('/subscription', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: { organization: { include: { subscription: true } } },
  });
  return res.json(user?.organization?.subscription || null);
});

// ── INVOICES ──────────────────────────────────────────
router.get('/invoices', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: { organization: true },
  });

  if (!user?.organization?.stripeId) return res.json([]);

  const invoices = await stripe.invoices.list({
    customer: user.organization.stripeId,
    limit: 20,
  });

  return res.json(invoices.data.map(inv => ({
    id: inv.id,
    amount: inv.amount_paid,
    currency: inv.currency,
    status: inv.status,
    pdfUrl: inv.invoice_pdf,
    createdAt: new Date(inv.created * 1000),
  })));
});

export default router;
