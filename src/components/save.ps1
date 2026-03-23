# ============================================================
#  UNIPLAST - save.ps1
#  ضعه في: F:\uniplast-site web\
#  بعد تنزيل constants.ts من لوحة الإدارة:
#  انقر بزر اليمين ← Run with PowerShell
# ============================================================

$ErrorActionPreference = "Stop"
Clear-Host

Write-Host ""
Write-Host "  ╔════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║   UNIPLAST - حفظ البيانات          ║" -ForegroundColor Cyan  
Write-Host "  ╚════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# مسار المشروع
$projectDir = "F:\uniplast-site web"
$targetFile  = "$projectDir\src\constants.ts"

# مسار التنزيل — يبحث في Downloads تلقائياً
$downloadsDir = "$env:USERPROFILE\Downloads"
$sourceFile   = "$downloadsDir\constants.ts"

# ── تحقق من وجود المشروع ──────────────────────────────────
if (-not (Test-Path $targetFile)) {
    Write-Host "  ❌ لم يُعثر على: $targetFile" -ForegroundColor Red
    Write-Host "  تأكد أن المسار صحيح" -ForegroundColor Yellow
    Read-Host "`n  اضغط Enter للخروج"
    exit
}

# ── تحقق من وجود الملف المُنزَّل ─────────────────────────
if (-not (Test-Path $sourceFile)) {
    Write-Host "  ❌ لم يُعثر على constants.ts في Downloads" -ForegroundColor Red
    Write-Host "  تأكد أنك ضغطت 'تنزيل constants.ts' في لوحة الإدارة" -ForegroundColor Yellow
    Read-Host "`n  اضغط Enter للخروج"
    exit
}

# ── حجم الملف ─────────────────────────────────────────────
$sizeKB = [math]::Round((Get-Item $sourceFile).Length / 1KB)
Write-Host "  📄 الملف: constants.ts ($sizeKB KB)" -ForegroundColor White

# ── نسخة احتياطية ─────────────────────────────────────────
$backupFile = "$projectDir\src\constants.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').ts"
Copy-Item $targetFile $backupFile
Write-Host "  💾 نسخة احتياطية: $(Split-Path $backupFile -Leaf)" -ForegroundColor Gray

# ── النسخ ─────────────────────────────────────────────────
Write-Host ""
Write-Host "  📋 نسخ الملف..." -ForegroundColor Yellow
Copy-Item $sourceFile $targetFile -Force
Write-Host "  ✅ تم النسخ بنجاح!" -ForegroundColor Green

# ── حذف الملف من Downloads ────────────────────────────────
Remove-Item $sourceFile -Force
Write-Host "  🗑️  تم حذف الملف من Downloads" -ForegroundColor Gray

Write-Host ""
Write-Host "  ╔════════════════════════════════════╗" -ForegroundColor Green
Write-Host "  ║   ✅ البيانات محفوظة بنجاح!        ║" -ForegroundColor Green
Write-Host "  ╚════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  الخطوة التالية — للنشر على الإنترنت:" -ForegroundColor Cyan
Write-Host "  1. في terminal المشروع: Ctrl+C" -ForegroundColor White
Write-Host "  2. ثم اكتب: npm run build" -ForegroundColor Yellow
Write-Host "  3. ارفع مجلد dist/ على السيرفر" -ForegroundColor White
Write-Host ""

Read-Host "  اضغط Enter للإغلاق"
