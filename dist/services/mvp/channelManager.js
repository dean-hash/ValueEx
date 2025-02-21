"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelManager = void 0;
const digitalIntelligence_1 = require("../digitalIntelligence");
const logger_1 = require("../../utils/logger");
class ChannelManager {
    constructor() {
        this.channels = new Map();
        this.deliveryHistory = new Map(); // Track deliveries per user
        this.initializeDefaultChannels();
    }
    static getInstance() {
        if (!ChannelManager.instance) {
            ChannelManager.instance = new ChannelManager();
        }
        return ChannelManager.instance;
    }
    initializeDefaultChannels() {
        // Email - Primary channel for detailed value propositions
        this.channels.set('email', {
            id: 'email',
            name: 'Email Delivery',
            type: 'email',
            active: true,
            settings: {
                template: 'value_focused',
                maxFrequency: 24,
                contentType: 'educational',
            },
        });
        // Web - Immediate delivery through web interface
        this.channels.set('web', {
            id: 'web',
            name: 'Web Interface',
            type: 'web',
            active: true,
            settings: {
                template: 'interactive',
                contentType: 'direct',
            },
        });
        // SMS - Quick, urgent notifications
        this.channels.set('sms', {
            id: 'sms',
            name: 'SMS Notifications',
            type: 'sms',
            active: true,
            settings: {
                template: 'brief',
                maxFrequency: 48,
                contentType: 'promotional',
            },
        });
    }
    /**
     * Deliver value proposition and affiliate link through appropriate channels
     */
    async deliverMatch(product, demand, userId) {
        try {
            // 1. Generate the delivery payload
            const payload = await this.createDeliveryPayload(product, demand);
            // 2. Select appropriate channels based on urgency and user preferences
            const selectedChannels = this.selectChannels(demand, userId);
            // 3. Deliver through each selected channel
            const deliveryPromises = selectedChannels.map((channel) => this.deliverThroughChannel(channel, payload, userId));
            await Promise.all(deliveryPromises);
            return true;
        }
        catch (error) {
            logger_1.logger.error('Error delivering match:', error);
            return false;
        }
    }
    async createDeliveryPayload(product, demand) {
        // Generate personalized value proposition using Digital Intelligence
        const analysis = await digitalIntelligence_1.digitalIntelligence.analyzeNeed(`${product.name} for ${demand.query}`);
        // Extract key selling points from analysis
        const sellingPoints = analysis.signals
            .filter((s) => s.type === 'market' || s.type === 'demand')
            .flatMap((s) => s.metadata.drivers || []);
        // Generate affiliate link (MVP: simple tracking link)
        const affiliateLink = this.generateAffiliateLink(product.id, demand.id);
        return {
            product,
            demand,
            affiliateLink,
            valueProposition: this.createValueProposition(product, sellingPoints),
            urgencyFactors: analysis.signals.find((s) => s.type === 'urgency')?.metadata.drivers || [],
            callToAction: this.createCallToAction(demand.insights.urgency),
        };
    }
    createValueProposition(product, sellingPoints) {
        // Create a compelling, focused value proposition
        const mainBenefit = sellingPoints[0] || product.description;
        const supportingPoints = sellingPoints.slice(1, 3).map((point) => `\n• ${point}`);
        return `
            ${mainBenefit}
            
            Key Benefits:${supportingPoints.join('')}
            
            Price: $${product.price.toFixed(2)}
        `.trim();
    }
    createCallToAction(urgency) {
        if (urgency > 0.8) {
            return 'Limited Time Offer - Act Now!';
        }
        else if (urgency > 0.5) {
            return 'Special Opportunity - Check It Out';
        }
        return 'Learn More';
    }
    generateAffiliateLink(productId, demandId) {
        // MVP: Simple tracking link
        // In production, this would integrate with Awin
        return `https://valuex.app/track/${productId}?demand=${demandId}`;
    }
    selectChannels(demand, userId) {
        const selectedChannels = [];
        const now = new Date();
        // Always include web interface
        selectedChannels.push(this.channels.get('web'));
        // Check email frequency
        const emailDeliveries = this.deliveryHistory.get(`${userId}_email`) || [];
        const lastEmailDelivery = emailDeliveries[emailDeliveries.length - 1];
        if (!lastEmailDelivery || now.getTime() - lastEmailDelivery.getTime() > 24 * 60 * 60 * 1000) {
            selectedChannels.push(this.channels.get('email'));
        }
        // Add SMS for high urgency
        if (demand.insights.urgency > 0.7) {
            const smsDeliveries = this.deliveryHistory.get(`${userId}_sms`) || [];
            const lastSmsDelivery = smsDeliveries[smsDeliveries.length - 1];
            if (!lastSmsDelivery || now.getTime() - lastSmsDelivery.getTime() > 48 * 60 * 60 * 1000) {
                selectedChannels.push(this.channels.get('sms'));
            }
        }
        return selectedChannels;
    }
    async deliverThroughChannel(channel, payload, userId) {
        // Record delivery
        const deliveries = this.deliveryHistory.get(`${userId}_${channel.id}`) || [];
        deliveries.push(new Date());
        this.deliveryHistory.set(`${userId}_${channel.id}`, deliveries);
        // MVP: Log the delivery (in production, this would send actual messages)
        logger_1.logger.info(`Delivering through ${channel.name}:`, {
            channel: channel.id,
            userId,
            productId: payload.product.id,
            demandId: payload.demand.id,
            valueProposition: payload.valueProposition,
            affiliateLink: payload.affiliateLink,
        });
        // In production, this would integrate with actual delivery services
        switch (channel.type) {
            case 'email':
                // await emailService.send(...)
                break;
            case 'sms':
                // await smsService.send(...)
                break;
            case 'web':
                // await webNotificationService.send(...)
                break;
        }
    }
}
exports.ChannelManager = ChannelManager;
//# sourceMappingURL=channelManager.js.map