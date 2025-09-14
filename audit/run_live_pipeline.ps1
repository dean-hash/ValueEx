<#
.SYNOPSIS
    Run the complete ValueX live data pipeline.
.DESCRIPTION
    This script runs the complete pipeline:
    1. Fetches data from Hacker News and GitHub
    2. Merges the data with deduplication
    3. Processes the data to find matching offers
    4. Generates metrics and previews
#>

# Set error action preference
$ErrorActionPreference = "Stop"
$env:PYTHONIOENCODING = "utf-8"

# Safe git short SHA (empty if not a git repo)
$commit = ""
try { $commit = (git rev-parse --short HEAD 2>$null) -replace '\s','' } catch {}
if (-not $commit) { $commit = "nogit" }

# Load environment variables if env.ps1 exists
if (Test-Path "$PSScriptRoot\env.ps1") { 
    . "$PSScriptRoot\env.ps1" 
}

# Configuration
$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$dataDir = Join-Path $baseDir "data\live"
$sourcesDir = Join-Path $baseDir "sources"

# Create directories if they don't exist
if (-not (Test-Path $dataDir)) {
    New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
}

# Clean up any existing files
Remove-Item -Path "$dataDir\*.json", "$dataDir\*.csv" -Force -ErrorAction SilentlyContinue

# Step 1: Fetch data from Hacker News
Write-Host "=== Fetching data from Hacker News ==="
python "$sourcesDir\hn.py"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to fetch data from Hacker News"
    exit 1
}

# Step 2: Fetch data from GitHub with improved fetcher
Write-Host "`n=== Fetching data from GitHub ==="
if (-not $env:GITHUB_TOKEN) {
    Write-Host "GITHUB_TOKEN not set. Running with reduced rate limits..."
}
# Use the new GitHub fetcher
python "$sourcesDir\github_new.py"

# Step 3: Merge JSONL files
Write-Host "`n=== Merging data sources ==="
$hnFile = "$dataDir\hn.jsonl"
$ghFile = "$dataDir\github.jsonl"
$mergedFile = "$dataDir\comments.jsonl"

# Combine files, skipping any that don't exist
Get-ChildItem -Path $hnFile, $ghFile -ErrorAction SilentlyContinue | 
    Where-Object { $_.Length -gt 0 } | 
    Get-Content | 
    Where-Object { $_.Trim() -ne '' } |
    Set-Content -Path $mergedFile -Encoding UTF8

# Count rows for metrics
$hnCount = (Get-Content $hnFile -ErrorAction SilentlyContinue | Measure-Object -Line).Lines
$ghCount = (Get-Content $ghFile -ErrorAction SilentlyContinue | Measure-Object -Line).Lines

# Step 4: Process the data
Write-Host "`n=== Processing data and finding matches ==="
python "$baseDir\thin_slice_v2.py" --input-jsonl $mergedFile --out "$dataDir\previews.csv" --hours 24
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to process data"
    exit 1
}

# Step 5: Generate metrics
Write-Host "`n=== Generating metrics ==="
$previews = Import-Csv "$dataDir\previews.csv" -ErrorAction SilentlyContinue
$queuedCount = ($previews | Where-Object { [double]$_.resonance2 -ge 60 } | Measure-Object).Count
$commit = (git rev-parse --short HEAD 2>$null) -replace '\s',''

$metrics = @{
    window_hours = 24
    hn_fetched = $hnCount
    gh_fetched = $ghCount
    merged = (Get-Content $mergedFile -ErrorAction SilentlyContinue | Measure-Object -Line).Lines
    queued_resonance60 = $queuedCount
    generated_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    commit = $commit
}

# Save metrics
$metrics | ConvertTo-Json | Set-Content "$dataDir\metrics.json" -Encoding UTF8

# Update context lock
$logEntry = "- $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') : window=24h merged=$($metrics.merged) queued60=$($metrics.queued_resonance60) commit=$($metrics.commit)"
Add-Content -Path "$baseDir\CONTEXT_LOCK.md" -Value $logEntry

# Show summary
Write-Host "`n=== Pipeline completed successfully ==="
Write-Host "`nSummary:"
Write-Host "- Hacker News comments: $($metrics.hn_fetched)"
Write-Host "- GitHub comments: $($metrics.gh_fetched)"
Write-Host "- Total processed: $($metrics.merged)"
Write-Host "- High-resonance matches (≥60): $($metrics.queued_resonance60)"

# Show top 20 matches
if ($previews) {
    Write-Host "`nTop 20 matches:"
    $previews | 
        Sort-Object { [double]$_.resonance2 } -Descending | 
        Select-Object -First 20 | 
        Format-Table @(
            @{Label="Source"; Expression={$_.source}; Width=8},
            @{Label="Resonance"; Expression={[math]::Round([double]$_.resonance2, 1)}; Align="Right"; Width=10},
            @{Label="Constraints"; Expression={$_.constraint_types}; Width=20},
            @{n="Author OP"; e={$_.author_is_op}};
            @{Label="URL"; Expression={$_.url}; Width=50},
            @{Label="Offer"; Expression={$_.routed_offer}; Width=30}
        ) -Wrap
}

Write-Host "`nResults saved to:"
Write-Host "- Raw data: $mergedFile"
Write-Host "- Previews: $dataDir\previews.csv"
Write-Host "- Metrics: $dataDir\metrics.json"
Write-Host "- Context: $baseDir\CONTEXT_LOCK.md"
