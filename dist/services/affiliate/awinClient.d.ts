export declare class AwinClient {
  private readonly baseUrl;
  private readonly apiKey;
  private readonly publisherId;
  constructor(apiKey: string);
  getHighValuePrograms(): Promise<any>;
  getCommissionDetails(programId: number): Promise<import('axios').AxiosResponse<any, any>>;
  trackOpportunity(programId: number, metadata: any): Promise<void>;
}
