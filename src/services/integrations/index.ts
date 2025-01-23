import { createTransport } from 'nodemailer';
import Stripe from 'stripe';
import Redis from 'ioredis';
import { configService } from '../../config/configService';

// Email Service
export const emailTransport = createTransport({
  host: configService.get('EMAIL_HOST'),
  port: configService.get('EMAIL_PORT'),
  secure: configService.get('EMAIL_TLS'),
  auth: {
    user: configService.get('EMAIL_USER'),
    pass: configService.get('EMAIL_PASSWORD'),
  },
});

// Stripe Integration
export const stripe = new Stripe(configService.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2023-10-16',
  typescript: true,
});

// Redis Client
export const redis = new Redis(configService.get('REDIS_URL'));

// Health Check
export async function checkIntegrations(): Promise<{ status: 'healthy' | 'unhealthy', error?: any }> {
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
