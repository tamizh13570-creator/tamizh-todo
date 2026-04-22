# Fly.io deployment script for Tamizh Todo App
# Run this script step by step

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Tamizh Todo - Fly.io Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if flyctl is installed
Write-Host "Step 1: Checking flyctl installation..." -ForegroundColor Yellow
if (-not (Get-Command flyctl -ErrorAction SilentlyContinue)) {
    Write-Host "  flyctl not found. Installing..." -ForegroundColor Red
    Write-Host "  Run: winget install Fly.io.flyctl" -ForegroundColor White
    Write-Host "  Then re-run this script." -ForegroundColor White
    exit 1
} else {
    Write-Host "  flyctl found!" -ForegroundColor Green
    flyctl version
}

Write-Host ""

# Step 2: Login check
Write-Host "Step 2: Checking Fly.io login status..." -ForegroundColor Yellow
$authStatus = flyctl auth whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Not logged in. Opening browser to login..." -ForegroundColor Red
    flyctl auth login
} else {
    Write-Host "  Logged in as: $authStatus" -ForegroundColor Green
}

Write-Host ""

# Step 3: Launch the app
Write-Host "Step 3: Deploying to Fly.io..." -ForegroundColor Yellow
Write-Host "  (This builds and deploys your Docker container)" -ForegroundColor White
flyctl deploy

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
flyctl status
Write-Host ""
Write-Host "Your app URL:" -ForegroundColor Cyan
flyctl info --json | ConvertFrom-Json | Select-Object -ExpandProperty Hostname
