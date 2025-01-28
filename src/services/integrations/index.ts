import { createTransport } from 'nodemailer';
import { configService } from '../../config/configService';
import Stripe from 'stripe';
import Redis from 'ioredis';

// Email Service
export const emailTransport = createTransport({
  host: configService.getConfigServiceConfig('AOA_EMAIL_HOST'),
  port: Number(configService.getConfigServiceConfig('AOA_EMAIL_PORT')),
  secure: configService.getConfigServiceConfig('AOA_EMAIL_TLS') === 'true',
  auth: {
    user: configService.getConfigServiceConfig('AOA_EMAIL_USER'),
    pass: configService.getConfigServiceConfig('AOA_EMAIL_PASSWORD'),
  },
});

// Stripe Integration
const stripeSecretKey = configService.getConfigServiceConfig('STRIPE_SECRET_KEY');
if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
});

// Redis Client
export const redis = new Redis(configService.getConfigServiceConfig('REDIS_URL'));

// Health Check
export async function checkIntegrations(): Promise<{
  status: 'healthy' | 'unhealthy';
  error?: any;
}> {
  try {
    // Verify email
    await emailTransport.verify();

    // Verify Stripe
    await stripe.paymentIntents.list({ limit: 1 });

    // Verify Redis
    await redis.ping();

    return { status: 'healthy' };
  } catch (error) {
    return { status: 'unhealthy', error };
  }
}
