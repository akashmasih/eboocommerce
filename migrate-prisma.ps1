# PowerShell script to run Prisma migrations for all services
# Usage: npm run migrate:prisma
# 
# Options:
#   - Use 'prisma migrate dev' to create new migrations (development)
#   - Use 'prisma db push' to push schema without migrations (quick setup)
#   - Use 'prisma migrate deploy' for production

param(
    [string]$Mode = "dev"  # Options: "dev", "push", "deploy"
)

Write-Host "Running Prisma migrations for all services..." -ForegroundColor Green
Write-Host "Mode: $Mode" -ForegroundColor Cyan
Write-Host "Note: Make sure your database is running and DATABASE_URL is set correctly" -ForegroundColor Yellow
Write-Host ""

$services = @(
    "auth-service",
    "product-service",
    "pricing-service",
    "inventory-service",
    "cart-service",
    "order-service",
    "payment-service",
    "seller-service",
    "shipping-service",
    "notification-service",
    "review-service"
)

$currentDir = Get-Location

foreach ($service in $services) {
    $servicePath = "services\$service"
    if (Test-Path "$servicePath\prisma\schema.prisma") {
        Write-Host "Processing $service..." -ForegroundColor Yellow
        Set-Location $servicePath
        
        try {
            switch ($Mode) {
                "push" {
                    Write-Host "  Pushing schema to database (no migration files)..." -ForegroundColor Gray
                    npx prisma db push
                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "Schema pushed for $service" -ForegroundColor Green
                    } else {
                        Write-Host "Failed to push schema for $service" -ForegroundColor Red
                    }
                }
                "deploy" {
                    Write-Host "  Deploying migrations (production mode)..." -ForegroundColor Gray
                    npx prisma migrate deploy
                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "Migrations deployed for $service" -ForegroundColor Green
                    } else {
                        Write-Host "Failed to deploy migrations for $service" -ForegroundColor Red
                    }
                }
                default {
                    Write-Host "  Creating/updating migrations (development mode)..." -ForegroundColor Gray
                    $migrationName = "init_$(Get-Date -Format 'yyyyMMddHHmmss')"
                    npx prisma migrate dev --name $migrationName
                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "Migrations created/updated for $service" -ForegroundColor Green
                    } else {
                        Write-Host "Failed to create migrations for $service" -ForegroundColor Red
                    }
                }
            }
        } catch {
            Write-Host "Failed for $service : $_" -ForegroundColor Red
        }
        
        Set-Location $currentDir
        Write-Host ""
    } else {
        Write-Host "Skipping $service (no Prisma schema found)" -ForegroundColor Gray
    }
}

Write-Host "Migration process completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Usage examples:" -ForegroundColor Yellow
Write-Host "  npm run migrate:prisma          # Development: create migrations" -ForegroundColor Cyan
Write-Host "  npm run migrate:prisma -- -Mode push    # Quick: push schema without migrations" -ForegroundColor Cyan
Write-Host "  npm run migrate:prisma -- -Mode deploy  # Production: deploy existing migrations" -ForegroundColor Cyan
