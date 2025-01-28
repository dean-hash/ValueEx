export interface AffiliateRequirements {
  network: string;
  requirements: {
    websiteAge: {
      min: number;
      recommended: number;
    };
    traffic: {
      monthly: {
        min: number;
        recommended: number;
      };
      unique: {
        min: number;
        recommended: number;
      };
    };
    content: {
      minArticles: number;
      minWordsPerArticle: number;
      requiredPolicies: string[];
      qualityScore: number;
    };
    technical: {
      requiredTags: string[];
      trackingSetup: string[];
      ssl: boolean;
    };
    business: {
      registrationRequired: boolean;
      taxInfoRequired: boolean;
      paymentThreshold: number;
    };
  };
  applicationProcess: {
    steps: string[];
    averageApprovalTime: number;
    commonRejectionReasons: string[];
    appealProcess?: string;
  };
}

// Network-specific requirements based on our experience and rejections
export const NETWORK_REQUIREMENTS: Record<string, AffiliateRequirements> = {
  'ShareASale': {
    network: 'ShareASale',
    requirements: {
      websiteAge: {
        min: 3,
        recommended: 6
      },
      traffic: {
        monthly: {
          min: 500,
          recommended: 2000
        },
        unique: {
          min: 300,
          recommended: 1500
        }
      },
      content: {
        minArticles: 10,
        minWordsPerArticle: 1000,
        requiredPolicies: ['privacy', 'terms', 'affiliate-disclosure'],
        qualityScore: 0.7
      },
      technical: {
        requiredTags: ['shareASale-tracking', 'conversion-pixel'],
        trackingSetup: ['global-tracking', 'product-tracking'],
        ssl: true
      },
      business: {
        registrationRequired: true,
        taxInfoRequired: true,
        paymentThreshold: 50
      }
    },
    applicationProcess: {
      steps: [
        'Website Review',
        'Content Quality Check',
        'Technical Integration Verification',
        'Business Documentation',
        'Final Approval'
      ],
      averageApprovalTime: 7, // days
      commonRejectionReasons: [
        'Insufficient traffic',
        'Low content quality',
        'Missing required policies',
        'Incomplete business information'
      ],
      appealProcess: 'Submit appeal with improvements after 30 days'
    }
  },
  'ImpactRadius': {
    network: 'ImpactRadius',
    requirements: {
      websiteAge: {
        min: 6,
        recommended: 12
      },
      traffic: {
        monthly: {
          min: 1000,
          recommended: 5000
        },
        unique: {
          min: 800,
          recommended: 4000
        }
      },
      content: {
        minArticles: 15,
        minWordsPerArticle: 1200,
        requiredPolicies: ['privacy', 'terms', 'affiliate-disclosure', 'cookie-policy'],
        qualityScore: 0.8
      },
      technical: {
        requiredTags: ['impact-pixel', 'conversion-tracking'],
        trackingSetup: ['global-tracking', 'product-tracking', 'event-tracking'],
        ssl: true
      },
      business: {
        registrationRequired: true,
        taxInfoRequired: true,
        paymentThreshold: 100
      }
    },
    applicationProcess: {
      steps: [
        'Initial Application',
        'Website Audit',
        'Technical Review',
        'Business Verification',
        'Final Review'
      ],
      averageApprovalTime: 14, // days
      commonRejectionReasons: [
        'Website not established enough',
        'Insufficient organic traffic',
        'Poor content quality',
        'Missing technical requirements'
      ]
    }
  }
};
