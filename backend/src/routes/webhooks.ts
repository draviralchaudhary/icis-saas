// ─────────────────────────────────────────────────────────
// ICIS Backend — Stripe Webhook Handler
// POST /api/webhooks/stripe
// ─────────────────────────────────────────────────────────
import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '../config/db';
import { logger } from '../config/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' as any });
const router = Router();

router.post('/stripe', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    logger.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (!userId) break;

        // Find or create org
        let org = await prisma.organization.findFirst({ where: { stripeId: sub.customer as string } });
        if (!org) {
          const user = await prisma.user.findUnique({ where: { id: userId } });
          org = await prisma.organization.create({
            data: {
              name: user?.company || user?.name || 'My Org',
              slug: userId.slice(0, 8),
              stripeId: sub.customer as string,
              plan: getPlan(sub),
            },
          });
          await prisma.user.update({ where: { id: userId }, data: { orgId: org.id } });
        } else {
          await prisma.organization.update({
            where: { id: org.id },
            data: { plan: getPlan(sub) },
          });
        }

        // Upsert subscription
        await prisma.subscription.upsert({
          where: { orgId: org.id },
          create: {
            orgId: org.id,
            stripeSubscriptionId: sub.id,
            stripePriceId: sub.items.data[0].price.id,
            status: sub.status,
            currentPeriodStart: new Date((sub as any).current_period_start * 1000),
            currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
          update: {
            status: sub.status,
            stripePriceId: sub.items.data[0].price.id,
            currentPeriodStart: new Date((sub as any).current_period_start * 1000),
            currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: { status: 'canceled' },
        });
        break;
      }

      case 'invoice.payment_succeeded': {
        const inv = event.data.object as Stripe.Invoice;
        logger.info(`Invoice paid: ${inv.id}`);
        break;
      }

      case 'invoice.payment_failed': {
        const inv = event.data.object as Stripe.Invoice;
        logger.warn(`Invoice payment failed: ${inv.id}`);
        // TODO: send email to customer
        break;
      }

      default:
        logger.info(`Unhandled webhook: ${event.type}`);
    }
  } catch (err: any) {
    logger.error(`Webhook handler error: ${err.message}`);
    return res.status(500).send('Webhook processing failed');
  }

  return res.json({ received: true });
});

function getPlan(sub: Stripe.Subscription): 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE' {
  const priceId = sub.items.data[0]?.price.id;
  if (priceId === process.env.STRIPE_PRICE_STARTER)    return 'STARTER';
  if (priceId === process.env.STRIPE_PRICE_PRO)        return 'PRO';
  if (priceId === process.env.STRIPE_PRICE_ENTERPRISE) return 'ENTERPRISE';
  return 'FREE';
}

export default router;
