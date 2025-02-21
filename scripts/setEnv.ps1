param(
    [Parameter(Mandatory=$true)]
    [string]$ClientSecret
)

$env:AZURE_CLIENT_SECRET = $ClientSecret
Write-Host "Environment variable AZURE_CLIENT_SECRET has been set"
