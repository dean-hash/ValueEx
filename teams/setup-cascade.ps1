# Connect to Azure AD
Connect-AzureAD

# Create the application
$appName = "Cascade"
$app = New-AzureADApplication -DisplayName $appName `
    -IdentifierUris "api://divvytech.com/cascade" `
    -ReplyUrls "https://token.botframework.com/.auth/web/redirect"

# Add required permissions
$requiredResourceAccess = New-Object System.Collections.Generic.List[Microsoft.Open.AzureAD.Model.RequiredResourceAccess]

# Microsoft Graph permissions
$graphServicePrincipal = Get-AzureADServicePrincipal -Filter "AppId eq '00000003-0000-0000-c000-000000000000'"
$permissions = @(
    "Presence.Read.All",
    "User.Read.All",
    "Chat.ReadWrite",
    "TeamsApp.ReadWrite.All"
)

foreach ($permission in $permissions) {
    $role = $graphServicePrincipal.AppRoles | Where-Object { $_.Value -eq $permission }
    $resourceAccess = New-Object Microsoft.Open.AzureAD.Model.ResourceAccess
    $resourceAccess.Id = $role.Id
    $resourceAccess.Type = "Role"
    $requiredResourceAccess.Add($resourceAccess)
}

Set-AzureADApplication -ObjectId $app.ObjectId -RequiredResourceAccess $requiredResourceAccess

# Create service principal
$sp = New-AzureADServicePrincipal -AppId $app.AppId

Write-Host "Application ID: $($app.AppId)"
Write-Host "Object ID: $($app.ObjectId)"
