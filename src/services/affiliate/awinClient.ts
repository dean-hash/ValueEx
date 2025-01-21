import axios from 'axios';

export class AwinClient {
  private readonly baseUrl = 'https://api.awin.com';
  private readonly apiKey: string;
  private readonly publisherId: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.publisherId = process.env.AWIN_PUBLISHER_ID || '';
  }

  async getHighValuePrograms() {
    const response = await axios.get(`${this.baseUrl}/publishers/${this.publisherId}/programmes`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      params: {
        relationship: 'joined',
        orderBy: 'commissionRate',
        orderDirection: 'desc',
      },
    });

    // Filter for AI/Tech products with high commission
    return response.data.filter((program: any) => {
      const isAITech =
        program.category.toLowerCase().includes('tech') ||
        program.description.toLowerCase().includes('ai') ||
        program.description.toLowerCase().includes('intelligence');

      const hasGoodCommission = program.commissionRate > 20; // 20% or higher

      return isAITech && hasGoodCommission;
    });
  }

  async getCommissionDetails(programId: number) {
    return axios.get(`${this.baseUrl}/publishers/${this.publisherId}/commissiongroups`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      params: {
        programmeId: programId,
      },
    });
  }

  async trackOpportunity(programId: number, metadata: any) {
    // Store opportunity tracking info for ValueEx
    // We'll expand this as we build out the matching system
  }
}
