# Setup environment variables for ValueEx
Write-Host "Setting up ValueEx environment variables..."

# Create .env file
$envContent = @"
# API Keys - DO NOT COMMIT
OPENAI_API_KEY=sk-jNmBKcOlYp_qZKYrmH4gYXc_whHqBPWwxWv\cGrSPFjpzHxUfV7FmSTNsThwDfTGHvRvKGTSR1hkFJHTh7QwCYWbFpKYhTQQ_tvhwwQpZWbH\_c_T1XWVoVf4Xbup1TMwmtBJWu_pGqTX4+v-7TpCA
AZURE_API_KEY=sk-Tszect-GotLhCbmVNZqQyw-AwFCWbuzNZqCxUK_JXjgiLKJbXovn1iZcQvlz7RqBUQ1_1mtz3WGFl3DibbvJOzD5SOv-XlTRqevLzEtKUzqQ-PXGv7vXZd1SRFlLbJHWsQezszWV-PLIO-LLbNeZzNFQvuAA

# Revenue Generation
AWIN_API_KEY=29f5f656-d632-4cdd-b0c1-e4ad3f1fd0e2
AWIN_PUBLISHER_ID=671175

# GoDaddy Configuration
GODADDY_API_KEY=YvFt7v3Y1X_YHYvN-jTbpcrGYN-dwyR
GODADDY_API_SECRET=QwzQzWrRZzwKmLGvqwbP

# Fiverr Affiliate Links
FIVERR_AFFILIATE_ID=1064652
FIVERR_MARKETPLACE_LINK=https://go.fiverr.com/visit/?bta=1064652&brand=fiverrmktplace
FIVERR_PRO_LINK=https://go.fiverr.com/visit/?bta=1064652&brand=fp
FIVERR_LOGO_MAKER_LINK=https://go.fiverr.com/visit/?bta=1064652&brand=logomaker
FIVERR_SUB_AFFILIATES_LINK=https://go.fiverr.com/visit/?bta=1064652&brand=fiveraffiliates

# Service Configuration
MAX_BATCH_SIZE=100
PROCESSING_TIMEOUT=60000
RETRY_ATTEMPTS=3
BATCH_SIZE=50

# API Configuration
ALLOWED_API_URL=http://localhost:3614
API_VERSION=v1

# Email Configuration
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_USER=dean@divvytech.com
EMAIL_TLS=true

# Teams Integration
BOT_ID=cascade@divvytech.com
"@

# Write content to .env file
$envContent | Out-File -FilePath ".env" -Encoding UTF8 -Force

Write-Host "Environment variables have been set up successfully!"
Write-Host "Note: Some sensitive credentials like EMAIL_PASSWORD and TEAMS credentials need to be added manually."
