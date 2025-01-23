import { AffiliateManager } from '../services/affiliateManager';
import { RedditManager } from '../services/redditManager';
describe('Ethical Compliance Tests', () => {
    let affiliateManager;
    let redditManager;
    beforeEach(() => {
        affiliateManager = new AffiliateManager();
        redditManager = new RedditManager({
            userAgent: 'test',
            clientId: 'test',
            clientSecret: 'test',
            refreshToken: 'test',
        });
    });
    describe('Value First Principle', () => {
        it('always provides value before commercial content', async () => {
            const questions = [
                {
                    question: "I'm looking for a good beginner camera, budget $500",
                    context: 'Photography newbie here, want to learn properly',
                },
                {
                    question: 'Need help choosing between X and Y laptops',
                    context: 'CS student, will be coding and running VMs',
                },
            ];
            for (const q of questions) {
                const response = await affiliateManager.generateResponse(q.question, {
                    name: 'Test Product',
                    link: 'http://affiliate.link',
                    details: 'Product details',
                });
                if (response) {
                    // Value should come before any links
                    const valueIndex = response.content.indexOf("Here's what you need to know");
                    const linkIndex = response.content.indexOf('http://');
                    expect(valueIndex).toBeLessThan(linkIndex);
                    // Should address the specific context
                    expect(response.content.toLowerCase()).toContain(q.context.toLowerCase());
                }
            }
        });
        it('rejects opportunities where we cannot add value', async () => {
            const response = await affiliateManager.generateResponse('Can anyone recommend a good doctor?', {
                name: 'Medical Product',
                link: 'http://affiliate.link',
                details: 'Medical solution',
            });
            // Should reject medical advice requests
            expect(response).toBeNull();
        });
    });
    describe('Transparency Requirements', () => {
        it('always includes clear affiliate disclosure', async () => {
            const response = await affiliateManager.generateResponse('Looking for product recommendations', {
                name: 'Test Product',
                link: 'http://affiliate.link',
                details: 'Details',
            });
            expect(response?.disclosure).toContain('affiliate');
            expect(response?.content).toContain(response?.disclosure);
        });
        it('maintains disclosure visibility', async () => {
            const response = await affiliateManager.generateResponse('Product question here', {
                name: 'Test Product',
                link: 'http://affiliate.link',
                details: 'Details',
            });
            if (response) {
                // Disclosure shouldn't be buried at the bottom
                const contentLines = response.content.split('\n');
                const disclosureIndex = contentLines.findIndex((line) => line.includes('affiliate'));
                // Should be in first 3 or last 3 lines
                expect(disclosureIndex < 3 || disclosureIndex > contentLines.length - 4).toBe(true);
            }
        });
    });
    describe('Community Health', () => {
        it('maintains healthy engagement ratio', async () => {
            const metrics = await redditManager.getUserMetrics('testuser');
            expect(metrics.karmaBalance).toBeGreaterThan(0.9);
        });
        it('respects community guidelines', async () => {
            // Test each subreddit's specific rules
            const subreddits = ['photography', 'laptops', 'buildapc'];
            for (const subreddit of subreddits) {
                const canPost = await redditManager.canPostInSubreddit(subreddit, {
                    minDetailLevel: 2,
                    minKarmaRatio: 0.9,
                    maxDailyPosts: 5,
                    requiredDisclosure: 'Affiliate link disclosure',
                    bannedSubreddits: [],
                    minAccountAge: 30,
                    minKarma: 100,
                });
                // Should respect per-subreddit limits
                if (canPost) {
                    await redditManager.updatePostCount(subreddit);
                    const secondPost = await redditManager.canPostInSubreddit(subreddit, {
                        minDetailLevel: 2,
                        minKarmaRatio: 0.9,
                        maxDailyPosts: 5,
                        requiredDisclosure: 'Affiliate link disclosure',
                        bannedSubreddits: [],
                        minAccountAge: 30,
                        minKarma: 100,
                    });
                    // Should enforce cool-down between posts
                    expect(secondPost).toBe(false);
                }
            }
        });
    });
    describe('Value Alignment', () => {
        it('prioritizes user needs over commission value', async () => {
            const response = await affiliateManager.generateResponse('Need a budget laptop under $500', {
                name: 'Expensive Laptop',
                link: 'http://affiliate.link',
                details: 'High-end laptop $2000',
            });
            // Should reject misaligned recommendations
            expect(response).toBeNull();
        });
        it('provides balanced information', async () => {
            const response = await affiliateManager.generateResponse('Looking for camera recommendations', {
                name: 'Camera X',
                link: 'http://affiliate.link',
                details: 'Great camera',
            });
            if (response) {
                // Should mention both pros and cons
                expect(response.content).toMatch(/pros?|advantages|benefits/i);
                expect(response.content).toMatch(/cons?|limitations|considerations/i);
            }
        });
    });
});
//# sourceMappingURL=affiliate.ethics.test.js.map