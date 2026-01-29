# PowerShell script to generate Prisma clients for all services
# Usage: npm run generate:prisma

Write-Host "Generating Prisma clients for all services..." -ForegroundColor Green

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

foreach ($service in $services) {
    $servicePath = "services\$service"
    if (Test-Path "$servicePath\prisma\schema.prisma") {
        Write-Host "Generating Prisma client for $service..." -ForegroundColor Yellow
        Set-Location $servicePath
        npx prisma generate
        Set-Location ..\..
        Write-Host "Generated Prisma client for $service" -ForegroundColor Green
    } else {
        Write-Host "Skipping $service (no Prisma schema found)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "All Prisma clients generated successfully!" -ForegroundColor Green
