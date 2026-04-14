param(
    [switch]$CheckOnly,
    [switch]$SkipChecks
)

$ErrorActionPreference = "Stop"

if ($CheckOnly -and $SkipChecks) {
    throw "Choose either -CheckOnly or -SkipChecks, not both."
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $repoRoot "backend"
$backendPython = Join-Path $backendDir ".venv\Scripts\python.exe"
$modelPath = Join-Path $backendDir "yolov8n.pt"
$nodeModulesDir = Join-Path $repoRoot "node_modules"

function Assert-PathExists {
    param(
        [string]$Path,
        [string]$Label
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        throw "$Label missing: $Path"
    }
}

function Resolve-CommandPath {
    param(
        [string[]]$Names,
        [string[]]$FallbackPaths,
        [string]$Label
    )

    foreach ($name in $Names) {
        $command = Get-Command $name -ErrorAction SilentlyContinue
        if ($command) {
            return $command.Source
        }
    }

    foreach ($fallbackPath in $FallbackPaths) {
        if (Test-Path -LiteralPath $fallbackPath) {
            return $fallbackPath
        }
    }

    throw "Required command not found: $Label"
}

function Invoke-CheckStep {
    param(
        [string]$Label,
        [scriptblock]$Action
    )

    Write-Host "Checking $Label..." -ForegroundColor Cyan
    & $Action
    Write-Host "OK: $Label" -ForegroundColor Green
}

$nodeCommand = Resolve-CommandPath -Names @("node", "node.exe") -FallbackPaths @("C:\Program Files\nodejs\node.exe") -Label "Node.js"
$npmCommand = Resolve-CommandPath -Names @("npm.cmd", "npm", "npm.exe") -FallbackPaths @("C:\Program Files\nodejs\npm.cmd") -Label "npm"

if (-not $SkipChecks) {
    Invoke-CheckStep "Node.js" {
        & $nodeCommand --version | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "Node.js version check failed."
        }
    }
    Invoke-CheckStep "npm" {
        & $npmCommand --version | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "npm version check failed."
        }
    }
    Invoke-CheckStep "backend virtualenv python" { Assert-PathExists $backendPython "Backend Python" }
    Invoke-CheckStep "backend model file" { Assert-PathExists $modelPath "YOLO model" }
    Invoke-CheckStep "frontend node_modules" { Assert-PathExists $nodeModulesDir "node_modules" }

    Invoke-CheckStep "backend Python imports" {
        & $backendPython -c "import cv2, fastapi, numpy, torch, ultralytics, uvicorn" | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "Backend dependency import check failed."
        }
    }

    Invoke-CheckStep "Expo package manifest" {
        & $npmCommand --prefix $repoRoot run --silent start -- --help | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "Expo start command check failed."
        }
    }

    if ($CheckOnly) {
        Write-Host ""
        Write-Host "Environment checks passed. No services were started." -ForegroundColor Green
        exit 0
    }
}

$backendCommand = "Set-Location '$repoRoot'; & '$backendPython' -m uvicorn backend.app:app --host 0.0.0.0 --port 8000"
$expoCommand = "Set-Location '$repoRoot'; & '$npmCommand' start"

Write-Host ""
Write-Host "Starting backend in a new PowerShell window..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCommand | Out-Null

Write-Host "Starting Expo in a new PowerShell window..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", $expoCommand | Out-Null

Write-Host ""
Write-Host "Backend and Expo are starting in separate windows." -ForegroundColor Green
Write-Host "For a dry run, use: .\scripts\start-all.ps1 -CheckOnly" -ForegroundColor Yellow
