<#
.SYNOPSIS
    Run the live data pipeline for ValueX demand detection.
.DESCRIPTION
    This script:
    1. Creates necessary directories
    2. Fetches data from Hacker News and GitHub
    3. Merges the data
    4. Runs the matching pipeline
    5. Shows a summary of results
#>

# Set error action preference
$ErrorActionPreference = "Stop"

# Configuration
$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$dataDir = Join-Path $baseDir "..\data\live"
$sourcesDir = Join-Path $baseDir "sources"

# Create directories if they don't exist
New-Item -ItemType Directory -Force -Path $dataDir | Out-Null

# Clean up any existing files
Remove-Item -Path "$dataDir\*.jsonl" -Force -ErrorAction SilentlyContinue

# Run data fetchers
Write-Host "=== Fetching data from Hacker News ==="
python "$sourcesDir\hn.py"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to fetch data from Hacker News"
    exit 1
}

Write-Host "`n=== Fetching data from GitHub ==="
$githubToken = $env:GITHUB_TOKEN
if (-not $githubToken) {
    Write-Host "GITHUB_TOKEN not set. Running with reduced rate limits..."
}
python "$sourcesDir\github.py"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to fetch data from GitHub"
    exit 1
}

# Merge JSONL files
Write-Host "`n=== Merging data sources ==="
$outputFile = "$dataDir\comments.jsonl"
Get-ChildItem -Path $dataDir -Filter "*.jsonl" | 
    Where-Object { $_.Name -ne "comments.jsonl" } | 
    Get-Content | 
    Add-Content -Path $outputFile -Encoding UTF8

$lineCount = (Get-Content $outputFile | Measure-Object -Line).Lines
Write-Host "Merged $lineCount comments into $outputFile"

if ($lineCount -eq 0) {
    Write-Error "No comments found. Exiting."
    exit 1
}

# Run the matching pipeline
Write-Host "`n=== Running matching pipeline ==="
$previewsFile = "$dataDir\previews.csv"
python "$baseDir\thin_slice_v2.py" --input-jsonl $outputFile --out $previewsFile

if ($LASTEXITCODE -ne 0) {
    Write-Error "Matching pipeline failed"
    exit 1
}

# Show top 20 matches
Write-Host "`n=== Top 20 Matches ==="
Import-Csv $previewsFile -Encoding UTF8 | 
    Sort-Object { [double]$_.resonance2 } -Descending | 
    Select-Object -First 20 | 
    Format-Table @(
        @{Label="Source"; Expression={$_.source}; Width=8},
        @{Label="Resonance"; Expression={[math]::Round([double]$_.resonance2, 1)}; Align="Right"; Width=10},
        @{Label="Constraints"; Expression={$_.constraint_types}; Width=20},
        @{Label="URL"; Expression={$_.url}; Width=50}
    ) -Wrap

Write-Host "`nPipeline completed. Results saved to $previewsFile"
