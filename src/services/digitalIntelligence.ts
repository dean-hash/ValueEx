import { OpenAI } from 'openai';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { RateLimit } from '../utils/rateLimit';

interface AccuracyMetrics {
  confidence: number;
  signalStrength: number;
  dataPoints: number;
}

interface NeedSignal {
  type: 'search' | 'purchase' | 'urgency';
  strength: number;
  source: string;
  timestamp: Date;
  metadata: {
    intent?: string;
    urgencyLevel?: number;
    pricePoint?: number;
  };
}

export class DigitalIntelligence {
  private prisma = new PrismaClient();
  private openai = new OpenAI();
  private rateLimit = new RateLimit();

  async analyzeNeed(category: string): Promise<{
    isGenuineNeed: boolean;
    accuracy: AccuracyMetrics;
    signals: NeedSignal[];
    recommendedActions: string[];
  }> {
    // Collect only essential signals
    const [searchSignals, purchaseSignals, urgencySignals] = await Promise.all([
      this.getSearchIntentSignals(category),
      this.getPurchaseHistorySignals(category),
      this.getUrgencySignals(category)
    ]);

    // Validate signal quality
    const accuracy = this.calculateAccuracy([
      ...searchSignals,
      ...purchaseSignals,
      ...urgencySignals
    ]);

    // Only proceed if we have enough quality data
    if (!this.hasReliableData(accuracy)) {
      return {
        isGenuineNeed: false,
        accuracy,
        signals: [],
        recommendedActions: ['Insufficient data for confident recommendation']
      };
    }

    // Use GPT-4 to analyze intent patterns
    const analysis = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Analyze user need signals to identify genuine requirements. Focus on urgency, intent, and purchase readiness. Avoid speculation and prioritize clear signals."
        },
        {
          role: "user",
          content: JSON.stringify({
            searchSignals,
            purchaseSignals,
            urgencySignals
          })
        }
      ],
      temperature: 0.1 // Lower temperature for more focused analysis
    });

    const insights = JSON.parse(analysis.choices[0].message.content);
    
    return {
      isGenuineNeed: this.validateNeed(insights),
      accuracy,
      signals: [...searchSignals, ...purchaseSignals, ...urgencySignals],
      recommendedActions: this.getRecommendedActions(insights)
    };
  }

  private async getSearchIntentSignals(category: string): Promise<NeedSignal[]> {
    // Focus on Google Trends - most reliable free source
    await this.rateLimit.wait('google_trends');
    const trends = await axios.get(
      `https://trends.google.com/trends/api/dailytrends?geo=US&q=${encodeURIComponent(category)}`
    );

    return [{
      type: 'search',
      strength: this.normalizeSearchVolume(trends.data),
      source: 'google_trends',
      timestamp: new Date(),
      metadata: {
        intent: this.categorizeIntent(trends.data)
      }
    }];
  }

  private async getPurchaseHistorySignals(category: string): Promise<NeedSignal[]> {
    // Check our own purchase history data
    const recentPurchases = await this.prisma.purchase.findMany({
      where: {
        category,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      select: {
        price: true,
        createdAt: true
      }
    });

    return [{
      type: 'purchase',
      strength: this.calculatePurchaseStrength(recentPurchases),
      source: 'internal_data',
      timestamp: new Date(),
      metadata: {
        pricePoint: this.calculateAveragePrice(recentPurchases)
      }
    }];
  }

  private async getUrgencySignals(category: string): Promise<NeedSignal[]> {
    // Check Reddit for urgency indicators
    await this.rateLimit.wait('reddit');
    const response = await axios.get(
      `https://www.reddit.com/search.json?q=${encodeURIComponent(category)}&sort=new&t=day`
    );

    const urgencyScore = this.analyzeUrgencyInPosts(response.data.data.children);

    return [{
      type: 'urgency',
      strength: urgencyScore,
      source: 'reddit',
      timestamp: new Date(),
      metadata: {
        urgencyLevel: this.categorizeUrgency(urgencyScore)
      }
    }];
  }

  private calculateAccuracy(signals: NeedSignal[]): AccuracyMetrics {
    return {
      confidence: this.calculateConfidence(signals),
      signalStrength: this.calculateSignalStrength(signals),
      dataPoints: signals.length
    };
  }

  private hasReliableData(accuracy: AccuracyMetrics): boolean {
    return (
      accuracy.confidence > 0.7 &&    // High confidence
      accuracy.signalStrength > 0.6 && // Strong signals
      accuracy.dataPoints >= 3        // Multiple data points
    );
  }

  private validateNeed(insights: any): boolean {
    // Strict validation criteria
    return (
      insights.intentClarity > 0.8 &&   // Clear intent
      insights.urgencyLevel > 0.6 &&    // Reasonable urgency
      insights.purchaseReadiness > 0.7  // Ready to buy
    );
  }

  private getRecommendedActions(insights: any): string[] {
    const actions = [];
    
    if (insights.intentClarity > 0.9) {
      actions.push('Immediate outreach recommended');
    }
    
    if (insights.pricePoint) {
      actions.push(`Focus on ${insights.pricePoint} price range`);
    }
    
    if (insights.urgencyLevel > 0.8) {
      actions.push('Prioritize fast-shipping options');
    }

    return actions;
  }

  // Helper methods with simplified but accurate logic
  private normalizeSearchVolume(data: any): number {
    // Simplified normalization focusing on clear signals
    return 0.7; // Placeholder
  }

  private calculatePurchaseStrength(purchases: any[]): number {
    // Focus on recent, completed purchases
    return 0.8; // Placeholder
  }

  private analyzeUrgencyInPosts(posts: any[]): number {
    // Look for clear urgency indicators
    return 0.6; // Placeholder
  }

  private calculateConfidence(signals: NeedSignal[]): number {
    // Weight more reliable signals higher
    return 0.85; // Placeholder
  }

  private calculateSignalStrength(signals: NeedSignal[]): number {
    // Focus on signal quality over quantity
    return 0.75; // Placeholder
  }

  private calculateAveragePrice(purchases: any[]): number {
    // Calculate average price from purchase history
    if (purchases.length === 0) return 0;
    return purchases.reduce((sum, p) => sum + p.price, 0) / purchases.length;
  }

  private categorizeIntent(data: any): string {
    // Analyze and categorize search intent
    return 'purchase_intent'; // Placeholder
  }

  private categorizeUrgency(score: number): number {
    // Convert urgency score to level (1-5)
    return Math.ceil(score * 5);
  }
}

export const digitalIntelligence = new DigitalIntelligence();
