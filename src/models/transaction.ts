import { Timestamp } from 'firebase-admin/firestore';

export interface Transaction {
  transactionId: string;
  timestamp: Timestamp;
  merchantId: string;
  transactionValue: number;
  currency: string;
  transactionType: 'purchase' | 'refund' | 'commission';
  status: 'pending' | 'completed' | 'failed';
  affiliateNetwork: 'awin' | 'fiverr' | 'jasper' | 'anthropic' | 'midjourney';
  rawWebhookData: Record<string, any>;
  analysisResults?: {
    insights: string[];
    recommendations: string[];
    lastAnalyzed: Timestamp;
  };
}

export interface Merchant {
  merchantId: string;
  name: string;
  category: string;
  affiliateNetwork: string;
  commissionRates: {
    default: number;
    special?: Record<string, number>;
  };
  performanceMetrics?: {
    totalTransactions: number;
    totalValue: number;
    lastUpdated: Timestamp;
  };
}

// For future multi-user support
export interface UserProfile {
  userId: string;
  email: string;
  preferences: {
    notificationSettings: {
      email: boolean;
      teams: boolean;
    };
    analyticsFrequency: 'daily' | 'weekly' | 'monthly';
  };
  merchants: {
    merchantId: string;
    dateAdded: Timestamp;
  }[];
}
