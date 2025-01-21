# Download Ollama installer
$installerUrl = "https://ollama.ai/download/ollama-windows.exe"
$installerPath = "$env:TEMP\ollama-installer.exe"

Write-Host "Downloading Ollama installer..."
Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath

# Run installer
Write-Host "Installing Ollama..."
Start-Process -FilePath $installerPath -ArgumentList "/S" -Wait

# Clean up
Remove-Item $installerPath

Write-Host "Ollama installation complete!"

# Download Mistral model
Write-Host "Downloading Mistral model..."
ollama pull mistral

Write-Host "Setup complete!"
