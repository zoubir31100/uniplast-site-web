# ============================================================
#  UNIPLAST - save.ps1
#  ضعه في: F:\Nouveau dossier\uniplast-site web\
#  بعد تحميل constants.ts من لوحة الإدارة:
#  انقر بزر اليمين - Run with PowerShell
# ============================================================

$ErrorActionPreference = "Stop"
Clear-Host

Write-Host ""
Write-Host "  =================================" -ForegroundColor Cyan
Write-Host "   UNIPLAST - حفظ البيانات        " -ForegroundColor Cyan
Write-Host "  =================================" -ForegroundColor Cyan
Write-Host ""

$targetFile   = "F:\Nouveau dossier\uniplast-site web\src\constants.ts"
$sourceFile   = "$env:USERPROFILE\Downloads\constants.ts"

if (-not (Test-Path $sourceFile)) {
    Write-Host "  !! لم يُعثر على constants.ts في Downloads" -ForegroundColor Red
    Write-Host ""
    Write-Host "  الحل:" -ForegroundColor Yellow
    Write-Host "  1. افتح لوحة الإدارة في المتصفح" -ForegroundColor White
    Write-Host "  2. اضغط 'حفظ للنشر'" -ForegroundColor White
    Write-Host "  3. اضغط 'تنزيل constants.ts'" -ForegroundColor White
    Write-Host "  4. شغّل هذا السكريبت مجدداً" -ForegroundColor White
    Write-Host ""
    Read-Host "  اضغط Enter للخروج"
    exit
}

if (-not (Test-Path $targetFile)) {
    Write-Host "  !! لم يُعثر على: $targetFile" -ForegroundColor Red
    Read-Host "  اضغط Enter للخروج"
    exit
}

$sizeKB = [math]::Round((Get-Item $sourceFile).Length / 1KB)
Write-Host "  Fichier: constants.ts ($sizeKB KB)" -ForegroundColor White
Write-Host "  Copie en cours..." -ForegroundColor Yellow

Copy-Item $sourceFile $targetFile -Force
Remove-Item $sourceFile -Force

Write-Host ""
Write-Host "  =================================" -ForegroundColor Green
Write-Host "   OK - Sauvegarde reussie!        " -ForegroundColor Green
Write-Host "  =================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Etapes suivantes:" -ForegroundColor Cyan
Write-Host "  1. Ctrl+C dans le terminal Vite" -ForegroundColor White
Write-Host "  2. npm run build" -ForegroundColor Yellow
Write-Host "  3. Mettre dist/ sur le serveur" -ForegroundColor White
Write-Host ""

Read-Host "  Appuyez sur Enter pour quitter"
