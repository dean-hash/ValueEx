import React, { useEffect, useRef } from 'react';
import { BusinessNeed } from '../../types/affiliate';

interface FiverrGigWidgetProps {
  businessNeed?: BusinessNeed;
  affiliateId?: string;
  width?: string | number;
  height?: string | number;
}

export const FiverrGigWidget: React.FC<FiverrGigWidgetProps> = ({
  businessNeed,
  affiliateId = '1064652',
  width = '100%',
  height = 350,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Load the Fiverr SDK
    const script = document.createElement('script');
    script.src = 'https://www.fiverr.com/gig_widgets/sdk';
    script.async = true;
    script.onload = () => {
      if (iframeRef.current && (window as any).FW_SDK) {
        (window as any).FW_SDK.register(iframeRef.current);
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Construct search parameters based on business need
  const getSearchParams = () => {
    if (!businessNeed) return '';

    const keywords = businessNeed.keywords.join(' ');
    return encodeURIComponent(keywords);
  };

  // Base URL for the widget
  const widgetUrl = new URL('https://www.fiverr.com/gig_widgets');

  // Add search parameters if we have a business need
  if (businessNeed) {
    widgetUrl.searchParams.append('search_term', getSearchParams());
  }

  // Add affiliate ID and other parameters
  widgetUrl.searchParams.append('affiliate_id', affiliateId);
  widgetUrl.searchParams.append('strip_google_tagmanager', 'true');
  widgetUrl.searchParams.append('data-mode', 'random_gigs');

  return (
    <div className="fiverr-gig-widget-container">
      <iframe
        ref={iframeRef}
        src={widgetUrl.toString()}
        loading="lazy"
        data-with-title="true"
        className="fiverr_nga_frame"
        frameBorder="0"
        height={height}
        width={width}
        referrerPolicy="no-referrer-when-downgrade"
        title="Fiverr Gig Widget"
      />
    </div>
  );
};
