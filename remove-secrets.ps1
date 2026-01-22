# Script to remove secrets from git history
$secret = "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"
$replacement = "SG.your-sendgrid-api-key-here"

$files = @("CONFIG_NEEDED.md", "update-auth-env.ps1")

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $content = $content -replace [regex]::Escape($secret), $replacement
        Set-Content $file $content -NoNewline
    }
}
