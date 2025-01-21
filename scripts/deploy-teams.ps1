#!/usr/bin/env pwsh

# Teams Bot Deployment Script
$ErrorActionPreference = "Stop"

# Configuration
$config = @{
    ResourceGroup = "valueex-rg"
    Location = "eastus"
    BotName = "valueex-bot"
    AppServicePlan = "valueex-asp"
}

# Create Resource Group
Write-Host "Creating Resource Group..."
az group create --name $config.ResourceGroup --location $config.Location

# Create App Service Plan
Write-Host "Creating App Service Plan..."
az appservice plan create `
    --name $config.AppServicePlan `
    --resource-group $config.ResourceGroup `
    --sku S1 `
    --is-linux

# Create Bot Channels Registration
Write-Host "Creating Bot Channels Registration..."
az bot create `
    --resource-group $config.ResourceGroup `
    --name $config.BotName `
    --kind registration `
    --sku S1 `
    --microsoft-app-id $env:TEAMS_CLIENT_ID

# Configure Teams Channel
Write-Host "Configuring Teams Channel..."
az bot teams-channel create `
    --resource-group $config.ResourceGroup `
    --name $config.BotName

# Deploy Application
Write-Host "Deploying Application..."
npm run build
az webapp deployment source config-zip `
    --resource-group $config.ResourceGroup `
    --name $config.BotName `
    --src dist/teams-bot.zip

Write-Host "Deployment Complete!"
