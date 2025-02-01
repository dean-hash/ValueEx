import React from 'react';
import { BusinessNeed } from '../../types/affiliate';

interface BannerConfig {
  rgid: number;
  keywords: string[];
  title: string;
}

const BANNER_CONFIGS: BannerConfig[] = [
  {
    rgid: 2,
    keywords: ['affiliate', 'partnership', 'marketing'],
    title: 'Global Fiverr Sub Affiliates',
  },
  {
    rgid: 4,
    keywords: ['website', 'web development', 'web design', 'wordpress'],
    title: 'Website Building',
  },
  {
    rgid: 5,
    keywords: ['video', 'editing', 'animation', 'motion graphics'],
    title: 'Video Editing',
  },
  {
    rgid: 6,
    keywords: ['logo', 'branding', 'brand identity', 'design'],
    title: 'Branding',
  },
];

interface FiverrBannerProps {
  businessNeed?: BusinessNeed;
  affiliateId?: string;
  width?: number;
  height?: number;
  fallbackRgid?: number; // Default banner if no match
}

export const FiverrBanner: React.FC<FiverrBannerProps> = ({
  businessNeed,
  affiliateId = '1064652',
  width = 300,
  height = 250,
  fallbackRgid = 6, // General Fiverr banner as fallback
}) => {
  // Find the most relevant banner based on business need
  const findRelevantBanner = (need: BusinessNeed): BannerConfig => {
    let bestMatch: { config: BannerConfig; score: number } | null = null;

    BANNER_CONFIGS.forEach((config) => {
      let score = 0;
      const needKeywords = new Set(need.keywords.map((k) => k.toLowerCase()));

      // Score based on keyword matches
      config.keywords.forEach((keyword) => {
        if (needKeywords.has(keyword.toLowerCase())) {
          score += 1;
        }
        if (need.description.toLowerCase().includes(keyword.toLowerCase())) {
          score += 0.5;
        }
      });

      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { config, score };
      }
    });

    return bestMatch && bestMatch.score > 0
      ? bestMatch.config
      : BANNER_CONFIGS.find((c) => c.rgid === fallbackRgid) || BANNER_CONFIGS[0];
  };

  const selectedBanner = businessNeed
    ? findRelevantBanner(businessNeed)
    : BANNER_CONFIGS.find((c) => c.rgid === fallbackRgid) || BANNER_CONFIGS[0];

  return (
    <div className="fiverr-banner-container" title={selectedBanner.title}>
      <iframe
        src={`https://fiverr.ck-cdn.com/tn/serve/geoGroup/?rgid=${selectedBanner.rgid}&bta=${affiliateId}`}
        width={width}
        height={height}
        frameBorder="0"
        scrolling="no"
        title={`Fiverr ${selectedBanner.title} Banner`}
      />
    </div>
  );
};
