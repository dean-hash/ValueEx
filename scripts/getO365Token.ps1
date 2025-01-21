# Install Microsoft.Graph module if not already installed
if (-not (Get-Module -ListAvailable -Name Microsoft.Graph)) {
    Install-Module Microsoft.Graph -Scope CurrentUser -Force
}

# Connect to Microsoft Graph
Connect-MgGraph -Scopes "Mail.Send", "Mail.Read", "User.Read"

# Get access token
$token = Get-MgContext | Select-Object -ExpandProperty AccessToken

Write-Host "`nAdd this to your .env file:"
Write-Host "OFFICE365_TOKEN=$token"
