$ErrorActionPreference = "Stop"

Write-Host "Running tests in parallel..."

$jobs = @(
    @{
        Name = "Teams Integration Tests"
        Command = "npm test -- src/tests/integration/teams/TeamsIntegration.test.ts"
    },
    @{
        Name = "Matching Engine Tests"
        Command = "npm test -- src/core/matching/__tests__"
    },
    @{
        Name = "Unit Tests"
        Command = "npm test -- src/tests/unit"
    }
)

$processes = @()

foreach ($job in $jobs) {
    Write-Host "Starting $($job.Name)..."
    $process = Start-Process "cmd.exe" -ArgumentList "/c", $job.Command -PassThru -NoNewWindow -RedirectStandardOutput "$($job.Name)_output.txt" -RedirectStandardError "$($job.Name)_error.txt"
    $processes += @{
        Process = $process
        Name = $job.Name
    }
}

$allPassed = $true

foreach ($proc in $processes) {
    Write-Host "Waiting for $($proc.Name)..."
    $proc.Process.WaitForExit()
    
    Write-Host "Output from $($proc.Name):"
    Get-Content "$($proc.Name)_output.txt"
    
    if (Test-Path "$($proc.Name)_error.txt") {
        Write-Host "Errors from $($proc.Name):"
        Get-Content "$($proc.Name)_error.txt"
    }
    
    if ($proc.Process.ExitCode -ne 0) {
        Write-Host "❌ $($proc.Name) failed with exit code $($proc.Process.ExitCode)" -ForegroundColor Red
        $allPassed = $false
    } else {
        Write-Host "✅ $($proc.Name) passed" -ForegroundColor Green
    }
    
    # Cleanup
    Remove-Item "$($proc.Name)_output.txt" -ErrorAction SilentlyContinue
    Remove-Item "$($proc.Name)_error.txt" -ErrorAction SilentlyContinue
}

if (-not $allPassed) {
    Write-Host "❌ Some tests failed" -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ All tests passed" -ForegroundColor Green
    exit 0
}
