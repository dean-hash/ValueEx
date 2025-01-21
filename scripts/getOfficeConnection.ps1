$connection = az resource show `
  --resource-group "DefaultResourceGroup-EUS" `
  --name "office365" `
  --resource-type "Microsoft.Web/connections" | ConvertFrom-Json

Write-Host "Connection Info:"
$connection.properties | ConvertTo-Json
