import { GoogleGenerativeAI } from '@google/generative-ai';
import { ENV_CONFIG } from '../../config/env.production';
import { db } from '../config/firebase';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(ENV_CONFIG.GEMINI.API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

export async function analyzeTransactionWithGemini(transactionData: any) {
    try {
        const prompt = `
        Analyze this affiliate marketing transaction and provide insights:
        Transaction ID: ${transactionData.transactionId}
        Commission Amount: ${transactionData.commissionAmount}
        Sale Amount: ${transactionData.saleAmount}
        Status: ${transactionData.status}
        
        Please provide:
        1. Transaction quality assessment
        2. Fraud risk indicators if any
        3. Recommendations for similar conversions
        4. Potential upsell opportunities
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const analysis = response.text();

        // Store the analysis in Firebase
        await db.ref(`transaction-analysis/${transactionData.transactionId}`).set({
            analysis,
            timestamp: admin.database.ServerValue.TIMESTAMP
        });

        return analysis;
    } catch (error) {
        console.error('Error analyzing transaction with Gemini:', error);
        throw error;
    }
}
