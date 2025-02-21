# Environment Variables Setup

This document outlines the environment variables required for ValueEx MVP.

## Core API Keys

### GoDaddy API
```env
GODADDY_API_KEY=YvFt7v3Y1X_YHYvN-jTbpcrGYN-dwyR
GODADDY_API_SECRET=QwzQzWrRZzwKmLGvqwbP
```

### Affiliate Networks

#### Awin
```env
AWIN_API_KEY=your_api_key_here
AWIN_PUBLISHER_ID=your_publisher_id_here
```

#### Fiverr Affiliate Links
```env
FIVERR_MARKETPLACE_LINK=https://go.fiverr.com/visit/?bta=1064652&brand=fiverrmktplace
FIVERR_PRO_LINK=https://go.fiverr.com/visit/?bta=1064652&brand=fp
FIVERR_LOGO_MAKER_LINK=https://go.fiverr.com/visit/?bta=1064652&brand=logomaker
FIVERR_SUB_AFFILIATES_LINK=https://go.fiverr.com/visit/?bta=1064652&brand=fiveraffiliates
```

### Teams Integration
```env
BOT_ID=cascade@divvytech.com
TEAMS_APP_ID=your_app_id_here
TEAMS_APP_PASSWORD=your_app_password_here
```

## Setting Up Environment Variables

1. Create a `.env` file in the root directory
2. Copy the variables above and replace placeholder values
3. Run `scripts/setup-env.ps1` to validate configuration

## Branch Structure

The repository uses the following branch structure:

* `main`: Main development branch
* `production`: Production-ready code
* `feature/mvp-health-monitoring`: Health monitoring features
* `cleanup-and-simplify`: Code cleanup and simplification
* `gh-pages`: Documentation site

For MVP development, most work should be committed to `cleanup-and-simplify` and merged into `main` when stable.

## Security Notes

* Never commit `.env` file
* Use `scripts/setupSecureCredentials.ts` for secure credential storage
* API keys are rotated automatically every 90 days
* Credentials are stored securely using Azure Key Vault
