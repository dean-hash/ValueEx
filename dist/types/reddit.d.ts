export interface RedditMedia {
  type: string;
  oembed?: {
    provider_url: string;
    version: string;
    title: string;
    author_name: string;
    height: number;
    width: number;
    html: string;
    thumbnail_width: number;
    thumbnail_height: number;
    thumbnail_url: string;
  };
  reddit_video?: {
    fallback_url: string;
    height: number;
    width: number;
    scrubber_media_url: string;
    dash_url: string;
    duration: number;
    hls_url: string;
    is_gif: boolean;
    transcoding_status: string;
  };
}
export interface RedditMediaMetadata {
  status: string;
  e: string;
  m: string;
  p: Array<{
    y: number;
    x: number;
    u: string;
  }>;
  s: {
    y: number;
    x: number;
    u: string;
  };
  id: string;
}
export interface RedditPreview {
  images: Array<{
    source: {
      url: string;
      width: number;
      height: number;
    };
    resolutions: Array<{
      url: string;
      width: number;
      height: number;
    }>;
    variants: {
      gif?: {
        source: {
          url: string;
          width: number;
          height: number;
        };
      };
      mp4?: {
        source: {
          url: string;
          width: number;
          height: number;
        };
      };
    };
    id: string;
  }>;
  enabled: boolean;
}
export interface RedditGalleryData {
  items: Array<{
    media_id: string;
    id: number;
  }>;
}
export interface RedditAward {
  giver_coin_reward: number | null;
  subreddit_id: string | null;
  is_new: boolean;
  days_of_drip_extension: number | null;
  coin_price: number;
  id: string;
  penny_donate: number | null;
  award_sub_type: string;
  coin_reward: number;
  icon_url: string;
  days_of_premium: number | null;
  tiers_by_required_awardings: Record<
    string,
    {
      reshard_amount: number;
      icon_url: string;
      award_type: string;
      required_awardings: number;
    }
  > | null;
  reshard_amount: number | null;
  icon_height: number;
  icon_width: number;
  static_icon_height: number;
  static_icon_width: number;
  static_icon_url: string;
  awardings_required_to_grant_benefits: number | null;
  description: string;
  end_date: string | null;
  sticky_duration_seconds: number | null;
  subreddit_coin_reward: number;
  count: number;
  name: string;
}
export interface ModReport {
  mod: string;
  reason: string;
  time: number;
}
export interface UserReport {
  user: string | null;
  reason: string;
  time: number;
}
export interface RedditPost {
  id: string;
  title: string;
  content: string;
  url: string;
  author: string;
  author_karma: number;
  author_created_utc: number;
  author_verified: boolean;
  subreddit: string;
  score: number;
  created_utc: number;
  num_comments: number;
  upvote_ratio: number;
  awards: number;
  flair?: string;
  is_self: boolean;
  is_video: boolean;
  is_original_content: boolean;
  domain: string;
  over_18: boolean;
  spoiler: boolean;
  locked: boolean;
  removed: boolean;
  stickied: boolean;
  distinguished: string | null;
  gilded: number;
  edited: boolean | number;
  permalink: string;
  thumbnail: string;
  selftext: string;
  selftext_html: string | null;
  media?: RedditMedia;
  media_metadata?: Record<string, RedditMediaMetadata>;
  preview?: RedditPreview;
  gallery_data?: RedditGalleryData;
  crosspost_parent_list?: RedditPost[];
  all_awardings?: RedditAward[];
  total_awards_received: number;
  link_flair_text?: string;
  link_flair_type?: string;
  link_flair_background_color?: string;
  author_flair_text?: string;
  author_flair_type?: string;
  author_flair_background_color?: string;
  subreddit_subscribers: number;
  subreddit_type: string;
  suggested_sort?: string;
  whitelist_status: string;
  contest_mode: boolean;
  mod_reports: ModReport[];
  user_reports: UserReport[];
  can_mod_post: boolean;
  send_replies: boolean;
  archived: boolean;
  no_follow: boolean;
  is_crosspostable: boolean;
  pinned: boolean;
  media_only: boolean;
  can_gild: boolean;
  is_meta: boolean;
  category?: string;
  secure_media?: RedditMedia;
  secure_media_embed?: Record<string, unknown>;
  link_flair_template_id?: string;
  can_award: boolean;
  author_premium: boolean;
  treatment_tags: string[];
  visited: boolean;
  removed_by_category?: string;
  mod_note?: string;
  mod_reason_title?: string;
  mod_reason_by?: string;
  mod_reason?: string;
  approved_by?: string;
  author_flair_css_class?: string;
  author_flair_richtext?: Array<{
    e: string;
    t?: string;
    a?: string;
    u?: string;
  }>;
  gildings: Record<string, number>;
  content_categories?: string[];
  is_robot_indexable: boolean;
  report_reasons?: string[];
  discussion_type?: string;
  num_duplicates: number;
  num_crossposts: number;
  author_cakeday?: boolean;
}
