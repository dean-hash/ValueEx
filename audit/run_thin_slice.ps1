$ErrorActionPreference = "Stop"

function Invoke-Python {
    param([string]$ScriptRelPath)
    try { python $ScriptRelPath } catch { python3 $ScriptRelPath }
}

# Repo root = parent of this script's folder (script lives in audit/)
$Root = Split-Path -Parent $PSScriptRoot
$RunId = "run_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

Push-Location $Root

try {
    # 1. Update config with run_id
    $ConfigPath = "audit\config.json"
    $Config = Get-Content $ConfigPath -Raw | ConvertFrom-Json
    $Config.run.run_id = $RunId
    $Config | ConvertTo-Json -Depth 10 | Set-Content $ConfigPath -Encoding UTF8
    
    Write-Host "=== ValueX Thin-Slice Pipeline ===" -ForegroundColor Cyan
    Write-Host "Run ID: $RunId"
    Write-Host "Config: $ConfigPath"
    
    # 2. Build synonyms
    Write-Host "`n[1/3] Building synonyms..." -ForegroundColor Yellow
    Invoke-Python "audit\build_synonyms_ext.py"
    $SynonymCount = (Get-Content "audit\synonyms_ext.json" | ConvertFrom-Json | Measure-Object).Count
    Write-Host "  Loaded $SynonymCount terms from sources_terms.csv"
    
    # 3. Run thin-slice
    Write-Host "`n[2/3] Running thin-slice..." -ForegroundColor Yellow
    $StartTime = Get-Date
    Invoke-Python "audit\thin_slice_v2.py"
    $Duration = [math]::Round(((Get-Date) - $StartTime).TotalSeconds, 2)
    
    # 4. Show results
    Write-Host "`n=== Results ===" -ForegroundColor Green
    Write-Host "Processing complete in ${Duration}s"
    
    # 5. Show output files
    Write-Host "`nOutput files in audit/:" -ForegroundColor Cyan
    Get-ChildItem -Path "audit" -File | 
        Where-Object { $_.Name -match '\.(json|md|csv)$' } |
        Select-Object Name, Length, LastWriteTime |
        Format-Table -AutoSize
    
    # 6. Show explain directory if it exists
    if (Test-Path "audit\explain") {
        $ExplainCount = (Get-ChildItem "audit\explain" -Filter "*.json").Count
        Write-Host "`nExplain files: $ExplainCount JSON files in audit/explain/"
    }
    
    # 7. Show how to view results
    Write-Host "`nTo view results:"
    Write-Host "  Get-Content audit\thin_slice_preview.md -Raw | more"
    Write-Host "  code audit\thin_slice_cards.json"
    Write-Host "  code audit\thin_slice_slack.json"
    
}
catch {
    Write-Host "`nError: $_" -ForegroundColor Red
    exit 1
}
finally {
    Pop-Location
}
