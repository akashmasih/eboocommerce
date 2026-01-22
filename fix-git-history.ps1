# Fix git history by removing secrets
# This script will rewrite commit 650bfe0 to remove SendGrid API key

Write-Host "=== Removing Secrets from Git History ===" -ForegroundColor Yellow
Write-Host ""

$secret = "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"
$replacement = "SG.your-sendgrid-api-key-here"

# Checkout the commit with secrets
Write-Host "Checking out commit 650bfe0..." -ForegroundColor Cyan
git checkout 650bfe0 --quiet

# Check if files exist in that commit
if (Test-Path "CONFIG_NEEDED.md") {
    Write-Host "Fixing CONFIG_NEEDED.md..." -ForegroundColor Green
    $content = Get-Content "CONFIG_NEEDED.md" -Raw
    $content = $content -replace [regex]::Escape($secret), $replacement
    Set-Content "CONFIG_NEEDED.md" $content -NoNewline
}

if (Test-Path "update-auth-env.ps1") {
    Write-Host "Fixing update-auth-env.ps1..." -ForegroundColor Green
    $content = Get-Content "update-auth-env.ps1" -Raw
    $content = $content -replace [regex]::Escape($secret), $replacement
    Set-Content "update-auth-env.ps1" $content -NoNewline
}

# Go back to main branch
git checkout main --quiet

Write-Host ""
Write-Host "Files fixed. Now you need to:" -ForegroundColor Yellow
Write-Host "  1. Use interactive rebase to edit commit 650bfe0" -ForegroundColor White
Write-Host "  2. Or use: git filter-branch to rewrite history" -ForegroundColor White
Write-Host "  3. Or use BFG Repo-Cleaner (recommended)" -ForegroundColor White
Write-Host ""
Write-Host "BFG Repo-Cleaner: https://rtyley.github.io/bfg-repo-cleaner/" -ForegroundColor Cyan
