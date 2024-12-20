import { createHash } from 'crypto';
import { BehaviorSubject } from 'rxjs';
import { logger } from '../utils/logger';

interface AnonymizedProfile {
    profileId: string;  // Hashed identifier
    subProfiles: Map<string, {
        context: string;
        resonancePatterns: Map<string, number>;
        lastUpdated: Date;
    }>;
    aggregateMetrics: {
        categoryInterests: Map<string, number>;
        valuePreferences: Map<string, number>;
        interactionPatterns: {
            frequency: number;
            depth: number;
            consistency: number;
        };
    };
    dataRetentionPolicy: {
        expiryDate: Date;
        purposeOfUse: string[];
        sharingRestrictions: string[];
    };
}

interface DataSharingContract {
    purposeOfUse: string[];
    dataPoints: string[];
    retentionPeriod: number;  // days
    sharingRestrictions: string[];
    deletionProtocol: string;
}

export class AnonymizedProfileManager {
    private profiles = new Map<string, AnonymizedProfile>();
    private activeContracts = new Map<string, DataSharingContract>();
    private profileUpdates = new BehaviorSubject<string[]>([]);

    async createAnonymizedProfile(rawData: any, contract: DataSharingContract): Promise<string> {
        // Generate unique identifier
        const profileId = this.generateSecureIdentifier(rawData);
        
        // Create profile with only contracted data points
        const profile: AnonymizedProfile = {
            profileId,
            subProfiles: new Map(),
            aggregateMetrics: {
                categoryInterests: new Map(),
                valuePreferences: new Map(),
                interactionPatterns: {
                    frequency: 0,
                    depth: 0,
                    consistency: 0
                }
            },
            dataRetentionPolicy: {
                expiryDate: new Date(Date.now() + (contract.retentionPeriod * 24 * 60 * 60 * 1000)),
                purposeOfUse: [...contract.purposeOfUse],
                sharingRestrictions: [...contract.sharingRestrictions]
            }
        };

        // Store profile and contract
        this.profiles.set(profileId, profile);
        this.activeContracts.set(profileId, contract);

        // Schedule automatic deletion
        this.scheduleDataDeletion(profileId, contract.retentionPeriod);

        return profileId;
    }

    async updateProfile(profileId: string, newData: any): Promise<boolean> {
        const profile = this.profiles.get(profileId);
        const contract = this.activeContracts.get(profileId);

        if (!profile || !contract) {
            logger.warn(`Attempted to update non-existent profile: ${profileId}`);
            return false;
        }

        // Only update contracted data points
        contract.dataPoints.forEach(point => {
            if (newData[point]) {
                this.updateDataPoint(profile, point, newData[point]);
            }
        });

        this.profileUpdates.next([...this.profileUpdates.value, profileId]);
        return true;
    }

    async getShareableData(profileId: string, requestedPurpose: string): Promise<any> {
        const profile = this.profiles.get(profileId);
        const contract = this.activeContracts.get(profileId);

        if (!profile || !contract) {
            logger.warn(`Attempted to access non-existent profile: ${profileId}`);
            return null;
        }

        // Check if purpose is allowed
        if (!contract.purposeOfUse.includes(requestedPurpose)) {
            logger.warn(`Unauthorized purpose for data access: ${requestedPurpose}`);
            return null;
        }

        // Return only shareable data points
        return {
            resonancePatterns: Array.from(profile.aggregateMetrics.valuePreferences.entries())
                .filter(([key]) => !contract.sharingRestrictions.includes(key))
                .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {})
        };
    }

    private generateSecureIdentifier(data: any): string {
        const hash = createHash('sha256');
        hash.update(JSON.stringify(data) + Date.now().toString());
        return hash.digest('hex');
    }

    private updateDataPoint(profile: AnonymizedProfile, point: string, value: any) {
        switch (point) {
            case 'categoryInterest':
                profile.aggregateMetrics.categoryInterests.set(
                    value.category,
                    (profile.aggregateMetrics.categoryInterests.get(value.category) || 0) + value.weight
                );
                break;
            case 'valuePreference':
                profile.aggregateMetrics.valuePreferences.set(
                    value.preference,
                    (profile.aggregateMetrics.valuePreferences.get(value.preference) || 0) + value.weight
                );
                break;
            case 'interaction':
                profile.aggregateMetrics.interactionPatterns = {
                    frequency: (profile.aggregateMetrics.interactionPatterns.frequency + value.frequency) / 2,
                    depth: Math.max(profile.aggregateMetrics.interactionPatterns.depth, value.depth),
                    consistency: (profile.aggregateMetrics.interactionPatterns.consistency + value.consistency) / 2
                };
                break;
        }
    }

    private scheduleDataDeletion(profileId: string, retentionPeriod: number) {
        setTimeout(() => {
            this.deleteProfile(profileId);
        }, retentionPeriod * 24 * 60 * 60 * 1000);
    }

    private async deleteProfile(profileId: string) {
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
                consistency: 0
            };
            
            // Remove from storage
            this.profiles.delete(profileId);
            this.activeContracts.delete(profileId);
            
            logger.info(`Profile ${profileId} deleted according to retention policy`);
        }
    }

    getProfileUpdates() {
        return this.profileUpdates.asObservable();
    }
}
