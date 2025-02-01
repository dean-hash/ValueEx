# PowerShell script to check TypeScript files for errors
param(
    [string]$ProjectRoot = (Get-Location),
    [string[]]$PriorityFiles = @(
        "src\visualization\NetworkGraph.ts",
        "src\visualization\correlationDashboard.ts"
    )
)

function Write-ColorOutput {
    param(
        [string]$Text,
        [string]$Color = "White"
    )
    Write-Host $Text -ForegroundColor $Color
}

function Test-TypeScriptFile {
    param(
        [string]$FilePath
    )
    
    Write-ColorOutput "`nChecking file: $FilePath" "Cyan"
    $result = npx tsc "$FilePath" --noEmit 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "ERROR: Found issues in $FilePath" "Red"
        $result | ForEach-Object {
            Write-ColorOutput $_ "Red"
        }
        return $false
    } else {
        Write-ColorOutput "PASS: No errors in $FilePath" "Green"
        return $true
    }
}

# Ensure we're in the project root
Set-Location $ProjectRoot

# Check if TypeScript is installed
if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
    Write-ColorOutput "ERROR: npx is not found. Please install Node.js and npm first." "Red"
    exit 1
}

# First check priority files
Write-ColorOutput "`n=== Checking Priority Files ===" "Yellow"
foreach ($file in $PriorityFiles) {
    $fullPath = Join-Path $ProjectRoot $file
    if (Test-Path $fullPath) {
        if (-not (Test-TypeScriptFile $fullPath)) {
            Write-ColorOutput "`nERROR: Found errors in priority file. Stopping execution." "Red"
            exit 1
        }
    } else {
        Write-ColorOutput "WARNING: Priority file not found: $file" "Yellow"
    }
}

# Then check all remaining .ts files
Write-ColorOutput "`n=== Checking All TypeScript Files ===" "Yellow"
$allTsFiles = Get-ChildItem -Path $ProjectRoot -Recurse -Include "*.ts", "*.tsx" |
    Where-Object { $_.FullName -notlike "*\node_modules\*" -and $_.FullName -notin ($PriorityFiles | ForEach-Object { Join-Path $ProjectRoot $_ }) }

$errorCount = 0
foreach ($file in $allTsFiles) {
    if (-not (Test-TypeScriptFile $file.FullName)) {
        $errorCount++
        Write-ColorOutput "`nERROR: Found errors. Stopping execution." "Red"
        exit 1
    }
}

if ($errorCount -eq 0) {
    Write-ColorOutput "`nSUCCESS: All TypeScript files checked successfully!" "Green"
}
