import React, { useState, useEffect } from 'react';
import { QuickStartAffiliate } from '../../services/affiliate/quickStartAffiliate';
import { RevenueStreamManager } from '../../services/revenue/revenueStreamManager';
import { TeamsNotificationService } from '../../services/teams/teamsNotification';
import { useValueContext } from '../../contexts/ValueContext';

interface QuickAffiliateWidgetProps {
  keywords: string[];
  source?: string;
  context?: 'teams' | 'web' | 'social';
  style?: 'inline' | 'card' | 'banner';
}

export const QuickAffiliateWidget: React.FC<QuickAffiliateWidgetProps> = ({
  keywords,
  source = 'web',
  context = 'web',
  style = 'card',
}) => {
  const [clicked, setClicked] = useState(false);
  const [match, setMatch] = useState<any>(null);
  const { valueManager } = useValueContext();
  const affiliate = new QuickStartAffiliate();
  const teams = new TeamsNotificationService();

  useEffect(() => {
    const loadMatch = async () => {
      const result = await affiliate.matchNeedToService(keywords);
      setMatch(result);

      // If this is from Teams, notify about the opportunity
      if (context === 'teams' && result.expectedCommission > 10) {
        await teams.sendOpportunityAlert({
          type: 'affiliate_opportunity',
          category: result.category,
          expectedValue: result.expectedCommission,
          source: 'fiverr',
          context: source,
        });
      }
    };

    loadMatch();
  }, [keywords.join(',')]);

  if (!match) return null;

  const handleClick = async () => {
    setClicked(true);
    await affiliate.trackConversion(match);

    // Track value creation
    await valueManager.trackValueCreation({
      type: 'affiliate_conversion',
      amount: match.expectedCommission,
      source: 'fiverr',
      category: match.category,
    });
  };

  // Different display styles based on context
  const renderContent = () => {
    switch (style) {
      case 'inline':
        return (
          <a
            href={match.affiliateLink}
            target="_blank"
            rel="noopener noreferrer sponsored"
            onClick={handleClick}
            className="inline-affiliate-link"
          >
            Find {match.category} Services on Fiverr
          </a>
        );

      case 'banner':
        return (
          <div
            className="banner-container"
            dangerouslySetInnerHTML={{ __html: match.bannerHtml }}
            onClick={handleClick}
          />
        );

      default: // card
        return (
          <div className="affiliate-card">
            <div className="card-content">
              <h3>Need {match.category}?</h3>
              <p>Find top-rated professionals on Fiverr</p>
              <a
                href={match.affiliateLink}
                target="_blank"
                rel="noopener noreferrer sponsored"
                onClick={handleClick}
                className="cta-button"
              >
                View Services
              </a>
              <small className="disclosure">{affiliate.generateDisclosure(match.category)}</small>
            </div>
            {match.bannerHtml && (
              <div className="card-banner" dangerouslySetInnerHTML={{ __html: match.bannerHtml }} />
            )}
          </div>
        );
    }
  };

  return <div className={`quick-affiliate-widget ${style}`}>{renderContent()}</div>;
};
