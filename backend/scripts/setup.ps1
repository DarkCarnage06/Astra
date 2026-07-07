#Requires -Version 5.1
$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

Write-Host "ASTRA Backend setup" -ForegroundColor Cyan

if (-not (Test-Path ".venv")) {
    python -m venv .venv
}

& .\.venv\Scripts\pip install -r requirements-core.txt

Write-Host "`nInstalling ephemeris dependencies..." -ForegroundColor Yellow
$ephemeris = & .\.venv\Scripts\pip install pyswisseph==2.08.00-1 "flatlib>=0.2.3" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "`nEphemeris install failed (common on Windows without C++ Build Tools)." -ForegroundColor Red
    Write-Host "Install: https://visualstudio.microsoft.com/visual-cpp-build-tools/" -ForegroundColor Yellow
    Write-Host "Then run: .\.venv\Scripts\pip install -r requirements-ephemeris.txt" -ForegroundColor Yellow
    Write-Host "`nCore API will still start, but /api/chart needs pyswisseph." -ForegroundColor Yellow
} else {
    Write-Host "Ephemeris dependencies installed." -ForegroundColor Green
}

Write-Host "`nRun tests:" -ForegroundColor Cyan
Write-Host "  .\.venv\Scripts\pytest" -ForegroundColor White
Write-Host "`nStart server:" -ForegroundColor Cyan
Write-Host "  .\.venv\Scripts\uvicorn app.main:app --reload" -ForegroundColor White
