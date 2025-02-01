import React, { useEffect, useState } from 'react';
import { OpportunityManager } from '../../services/affiliate/opportunityManager';
import { FiverrGigWidget } from './FiverrGigWidget';
import { BusinessNeed, SocialPost, JobPosting } from '../../types/affiliate';

interface OpportunityWidgetProps {
  content: SocialPost | JobPosting;
  type: 'social' | 'job';
}

export const OpportunityWidget: React.FC<OpportunityWidgetProps> = ({ content, type }) => {
  const [businessNeed, setBusinessNeed] = useState<BusinessNeed | null>(null);
  const [loading, setLoading] = useState(true);
  const opportunityManager = new OpportunityManager();

  useEffect(() => {
    const detectNeed = async () => {
      try {
        setLoading(true);
        const opportunity =
          type === 'social'
            ? await opportunityManager.processSocialPost(content as SocialPost)
            : await opportunityManager.processJobPosting(content as JobPosting);

        if (opportunity) {
          setBusinessNeed(opportunity.need);
        }
      } catch (error) {
        console.error('Error detecting business need:', error);
      } finally {
        setLoading(false);
      }
    };

    detectNeed();
  }, [content, type]);

  if (loading) {
    return <div>Loading relevant opportunities...</div>;
  }

  if (!businessNeed) {
    return null; // Don't show widget if no relevant need detected
  }

  return (
    <div className="opportunity-widget">
      <div className="opportunity-header">
        <h3>Recommended Services</h3>
        <p>Based on your requirements, here are some relevant services that might help:</p>
      </div>
      <FiverrGigWidget businessNeed={businessNeed} />
      <div className="opportunity-footer">
        <small className="disclosure">
          Affiliate Disclosure: Some of the links above are affiliate links. If you make a purchase,
          we may earn a commission at no additional cost to you.
        </small>
      </div>
    </div>
  );
};
