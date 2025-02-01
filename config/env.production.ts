export const ENV_CONFIG = {
  // Existing configured credentials
  GODADDY: {
    API_KEY: 'YvFt7v3Y1X_YHYvN-jTbpcrGYN-dwyR',
    API_SECRET: 'QwzQzWrRZzwKmLGvqwbP',
  },

  // Teams Integration
  TEAMS: {
    BOT_ID: 'cascade@divvytech.com',
    APP_ID: process.env.TEAMS_APP_ID,
    APP_PASSWORD: process.env.TEAMS_APP_PASSWORD,
  },

  // Affiliate Networks
  FIVERR: {
    MARKETPLACE_LINK: 'https://go.fiverr.com/visit/?bta=1064652&brand=fiverrmktplace',
    PRO_LINK: 'https://go.fiverr.com/visit/?bta=1064652&brand=fp',
    LOGO_MAKER_LINK: 'https://go.fiverr.com/visit/?bta=1064652&brand=logomaker',
    AFFILIATES_LINK: 'https://go.fiverr.com/visit/?bta=1064652&brand=fiveraffiliates',
  },

  // Firebase Configuration
  FIREBASE: {
    PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
    CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    DATABASE_URL: process.env.FIREBASE_DATABASE_URL,
  },

  // Gemini Configuration
  GEMINI: {
    API_KEY: process.env.GEMINI_API_KEY,
  },
};
