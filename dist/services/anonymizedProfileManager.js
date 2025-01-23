"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnonymizedProfileManager = void 0;
const crypto_1 = require("crypto");
const rxjs_1 = require("rxjs");
const logger_1 = require("../utils/logger");
class AnonymizedProfileManager {
    constructor() {
        this.profiles = new Map();
        this.activeContracts = new Map();
        this.profileUpdates = new rxjs_1.BehaviorSubject([]);
    }
    async createAnonymizedProfile(rawData, contract) {
        // Generate unique identifier
        const profileId = this.generateSecureIdentifier(rawData);
        // Create profile with only contracted data points
        const profile = {
            profileId,
            subProfiles: new Map(),
            aggregateMetrics: {
                categoryInterests: new Map(),
                valuePreferences: new Map(),
                interactionPatterns: {
                    frequency: 0,
                    depth: 0,
                    consistency: 0,
                },
            },
            dataRetentionPolicy: {
                expiryDate: new Date(Date.now() + contract.retentionPeriod * 24 * 60 * 60 * 1000),
                purposeOfUse: [...contract.purposeOfUse],
                sharingRestrictions: [...contract.sharingRestrictions],
            },
        };
        // Store profile and contract
        this.profiles.set(profileId, profile);
        this.activeContracts.set(profileId, contract);
        // Schedule automatic deletion
        this.scheduleDataDeletion(profileId, contract.retentionPeriod);
        return profileId;
    }
    async updateProfile(profileId, newData) {
        const profile = this.profiles.get(profileId);
        const contract = this.activeContracts.get(profileId);
        if (!profile || !contract) {
            logger_1.logger.warn(`Attempted to update non-existent profile: ${profileId}`);
            return false;
        }
        // Only update contracted data points
        contract.dataPoints.forEach((point) => {
            if (newData[point]) {
                this.updateDataPoint(profile, point, newData[point]);
            }
        });
        this.profileUpdates.next([...this.profileUpdates.value, profileId]);
        return true;
    }
    async getShareableData(profileId, requestedPurpose) {
        const profile = this.profiles.get(profileId);
        const contract = this.activeContracts.get(profileId);
        if (!profile || !contract) {
            logger_1.logger.warn(`Attempted to access non-existent profile: ${profileId}`);
            return null;
        }
        // Check if purpose is allowed
        if (!contract.purposeOfUse.includes(requestedPurpose)) {
            logger_1.logger.warn(`Unauthorized purpose for data access: ${requestedPurpose}`);
            return null;
        }
        // Return only shareable data points
        return {
            resonancePatterns: Array.from(profile.aggregateMetrics.valuePreferences.entries())
                .filter(([key]) => !contract.sharingRestrictions.includes(key))
                .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {}),
        };
    }
    generateSecureIdentifier(data) {
        const hash = (0, crypto_1.createHash)('sha256');
        hash.update(JSON.stringify(data) + Date.now().toString());
        return hash.digest('hex');
    }
    updateDataPoint(profile, point, value) {
        switch (point) {
            case 'categoryInterest':
                profile.aggregateMetrics.categoryInterests.set(value.category, (profile.aggregateMetrics.categoryInterests.get(value.category) || 0) + value.weight);
                break;
            case 'valuePreference':
                profile.aggregateMetrics.valuePreferences.set(value.preference, (profile.aggregateMetrics.valuePreferences.get(value.preference) || 0) + value.weight);
                break;
            case 'interaction':
                profile.aggregateMetrics.interactionPatterns = {
                    frequency: (profile.aggregateMetrics.interactionPatterns.frequency + value.frequency) / 2,
                    depth: Math.max(profile.aggregateMetrics.interactionPatterns.depth, value.depth),
                    consistency: (profile.aggregateMetrics.interactionPatterns.consistency + value.consistency) / 2,
                };
                break;
        }
    }
    scheduleDataDeletion(profileId, retentionPeriod) {
        setTimeout(() => {
            this.deleteProfile(profileId);
        }, retentionPeriod * 24 * 60 * 60 * 1000);
    }
    async deleteProfile(profileId) {
        // Secure deletion of all profile data
        const profile = this.profiles.get(profileId);
        if (profile) {
            // Clear all maps and objects
            profile.subProfiles.clear();
            profile.aggregateMetrics.categoryInterests.clear();
            profile.aggregateMetrics.valuePreferences.clear();
            profile.aggregateMetrics.interactionPatterns = {
                frequency: 0,
                depth: 0,
                consistency: 0,
            };
            // Remove from storage
            this.profiles.delete(profileId);
            this.activeContracts.delete(profileId);
            logger_1.logger.info(`Profile ${profileId} deleted according to retention policy`);
        }
    }
    getProfileUpdates() {
        return this.profileUpdates.asObservable();
    }
}
exports.AnonymizedProfileManager = AnonymizedProfileManager;
//# sourceMappingURL=anonymizedProfileManager.js.map