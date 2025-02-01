interface DataSharingContract {
  purposeOfUse: string[];
  dataPoints: string[];
  retentionPeriod: number;
  sharingRestrictions: string[];
  deletionProtocol: string;
}
export declare class AnonymizedProfileManager {
  private profiles;
  private activeContracts;
  private profileUpdates;
  createAnonymizedProfile(rawData: any, contract: DataSharingContract): Promise<string>;
  updateProfile(profileId: string, newData: any): Promise<boolean>;
  getShareableData(profileId: string, requestedPurpose: string): Promise<any>;
  private generateSecureIdentifier;
  private updateDataPoint;
  private scheduleDataDeletion;
  private deleteProfile;
  getProfileUpdates(): import('rxjs').Observable<string[]>;
}
export {};
