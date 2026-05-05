param(
    [switch]$CheckOnly,
    [switch]$SkipFrontendInstall,
    [switch]$SkipBackendInstall
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $repoRoot "backend"
$venvDir = Join-Path $backendDir ".venv"
$backendPython = Join-Path $venvDir "Scripts\python.exe"
$backendPip = Join-Path $venvDir "Scripts\pip.exe"
$requirementsPath = Join-Path $backendDir "requirements.txt"
$modelPath = Join-Path $backendDir "yolov8n.pt"
$nodeModulesDir = Join-Path $repoRoot "node_modules"
$expoPackageDir = Join-Path $nodeModulesDir "expo"
$expoCliPath = Join-Path $nodeModulesDir ".bin\expo.cmd"
$backendHealthUrl = "http://127.0.0.1:8000/health"

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

function Invoke-Step {
    param(
        [string]$Label,
        [scriptblock]$Action
    )

    Write-Host $Label -ForegroundColor Cyan
    & $Action
}

function Assert-LastExitCode {
    param([string]$Label)

    if ($LASTEXITCODE -ne 0) {
        throw "$Label failed with exit code $LASTEXITCODE."
    }
}

function Assert-PathExists {
    param(
        [string]$Path,
        [string]$Label
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        throw "$Label missing: $Path"
    }
}

function Test-FrontendDependenciesReady {
    return (Test-Path -LiteralPath $nodeModulesDir) `
        -and (Test-Path -LiteralPath $expoPackageDir) `
        -and (Test-Path -LiteralPath $expoCliPath)
}

function Wait-BackendReady {
    param(
        [string]$HealthUrl,
        [int]$TimeoutSeconds,
        [System.Diagnostics.Process]$Process
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)

    while ((Get-Date) -lt $deadline) {
        if ($Process.HasExited) {
            throw "Backend process exited before becoming healthy."
        }

        try {
            $response = Invoke-WebRequest -Uri $HealthUrl -UseBasicParsing -TimeoutSec 2
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) {
                return
            }
        } catch {
            Start-Sleep -Milliseconds 750
            continue
        }
    }

    throw "Backend health check timed out after $TimeoutSeconds seconds: $HealthUrl"
}

$pythonCommand = Resolve-CommandPath -Names @("python", "python.exe", "py.exe", "py") -FallbackPaths @() -Label "Python"
$nodeCommand = Resolve-CommandPath -Names @("node", "node.exe") -FallbackPaths @("C:\Program Files\nodejs\node.exe") -Label "Node.js"
$npmCommand = Resolve-CommandPath -Names @("npm.cmd", "npm", "npm.exe") -FallbackPaths @("C:\Program Files\nodejs\npm.cmd") -Label "npm"

Invoke-Step "Checking Node.js..." {
    & $nodeCommand --version | Out-Null
    Assert-LastExitCode "Node.js check"
}

Invoke-Step "Checking npm..." {
    & $npmCommand --version | Out-Null
    Assert-LastExitCode "npm check"
}

Invoke-Step "Checking Python..." {
    if ($pythonCommand -like "*py.exe" -or (Split-Path -Leaf $pythonCommand) -eq "py") {
        & $pythonCommand -3 --version | Out-Null
    } else {
        & $pythonCommand --version | Out-Null
    }
    Assert-LastExitCode "Python check"
}

if (-not (Test-Path -LiteralPath $venvDir)) {
    Invoke-Step "Creating backend virtual environment..." {
        if ($pythonCommand -like "*py.exe" -or (Split-Path -Leaf $pythonCommand) -eq "py") {
            & $pythonCommand -3 -m venv $venvDir
        } else {
            & $pythonCommand -m venv $venvDir
        }
        Assert-LastExitCode "Backend virtual environment creation"
    }
}

Assert-PathExists $backendPython "Backend Python"
Assert-PathExists $requirementsPath "Backend requirements"
Assert-PathExists $modelPath "YOLO model"

if (-not $SkipBackendInstall) {
    Invoke-Step "Installing backend dependencies..." {
        & $backendPip install -r $requirementsPath
        Assert-LastExitCode "Backend dependency installation"
    }
}

if ((-not (Test-FrontendDependenciesReady)) -and (-not $SkipFrontendInstall)) {
    Invoke-Step "Installing frontend dependencies..." {
        & $npmCommand install
        Assert-LastExitCode "Frontend dependency installation"
    }
}

Assert-PathExists $nodeModulesDir "node_modules"
Assert-PathExists $expoPackageDir "Expo package"
Assert-PathExists $expoCliPath "Expo CLI"

Invoke-Step "Verifying backend imports..." {
    & $backendPython -c "import cv2, fastapi, numpy, torch, ultralytics, uvicorn" | Out-Null
    Assert-LastExitCode "Backend import verification"
}

Invoke-Step "Verifying Expo startup wiring..." {
    & $expoCliPath --help | Out-Null
    Assert-LastExitCode "Expo startup verification"
}

if ($CheckOnly) {
    Write-Host ""
    Write-Host "Environment is ready. No services were started." -ForegroundColor Green
    exit 0
}

$backendCommand = "Set-Location '$repoRoot'; & '$backendPython' -m uvicorn backend.app:app --host 0.0.0.0 --port 8000"
$expoCommand = "Set-Location '$repoRoot'; & '$npmCommand' start"

Write-Host ""
Write-Host "Starting backend in a new PowerShell window..." -ForegroundColor Cyan
$backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCommand -PassThru

Write-Host "Waiting for backend health at $backendHealthUrl ..." -ForegroundColor Cyan
Wait-BackendReady -HealthUrl $backendHealthUrl -TimeoutSeconds 45 -Process $backendProcess
Write-Host "Backend is healthy." -ForegroundColor Green

Write-Host "Starting Expo in a new PowerShell window..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", $expoCommand | Out-Null

Write-Host ""
Write-Host "Backend and Expo are running in separate windows." -ForegroundColor Green
Write-Host "Use .\scripts\launch-dev.ps1 -CheckOnly for a dry run." -ForegroundColor Yellow
