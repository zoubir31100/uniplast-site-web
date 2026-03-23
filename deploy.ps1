# ================================================================
#  UNIPLAST - deploy.ps1  (v3 - Debug Fix)
#  ضعه في: F:\Nouveau dossier\uniplast-site web\
#  انقر بزر اليمين - Run with PowerShell
# ================================================================

$ErrorActionPreference = "Continue"
Clear-Host

Write-Host ""
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host "   UNIPLAST - نشر على Netlify             " -ForegroundColor Cyan
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host ""

# ── المسارات ──────────────────────────────────────────────────
$projectDir  = "F:\Nouveau dossier\uniplast-site web"
$storageFile = "$projectDir\src\utils\storage.ts"
$targetFile  = "$projectDir\src\constants.ts"
$sourceFile  = "$env:USERPROFILE\Downloads\constants.ts"
$distDir     = "$projectDir\dist"

# ── تشخيص المسارات ────────────────────────────────────────────
Write-Host "  [DIAG] فحص المسارات..." -ForegroundColor Magenta
Write-Host "  Project : $projectDir"
Write-Host "  Storage : $storageFile"
Write-Host "  Dist    : $distDir"
Write-Host ""

if (-not (Test-Path $projectDir)) {
    Write-Host "  !! خطأ: المجلد غير موجود!" -ForegroundColor Red
    Write-Host "  المسار: $projectDir" -ForegroundColor Red
    Write-Host ""
    Write-Host "  تحقق من:" -ForegroundColor Yellow
    Write-Host "   - هل القرص F:\ موجود؟" -ForegroundColor Yellow
    Write-Host "   - هل اسم المجلد صحيح تماماً؟" -ForegroundColor Yellow
    Read-Host "`n  اضغط Enter للخروج"
    exit
}
Write-Host "  [OK] المجلد موجود" -ForegroundColor Green

if (-not (Test-Path $storageFile)) {
    Write-Host "  !! خطأ: storage.ts غير موجود!" -ForegroundColor Red
    Write-Host "  المسار المتوقع: $storageFile" -ForegroundColor Red
    Write-Host ""
    Write-Host "  محتوى src\utils:" -ForegroundColor Yellow
    if (Test-Path "$projectDir\src\utils") {
        Get-ChildItem "$projectDir\src\utils" | ForEach-Object { Write-Host "   - $($_.Name)" }
    } else {
        Write-Host "   المجلد src\utils غير موجود!" -ForegroundColor Red
    }
    Read-Host "`n  اضغط Enter للخروج"
    exit
}
Write-Host "  [OK] storage.ts موجود" -ForegroundColor Green

# ── الخطوة 1: نسخ constants.ts ────────────────────────────────
Write-Host ""
Write-Host "  [1/4] فحص البيانات الجديدة..." -ForegroundColor Yellow

if (Test-Path $sourceFile) {
    $sizeKB = [math]::Round((Get-Item $sourceFile).Length / 1KB)
    Write-Host "        وُجد constants.ts ($sizeKB KB)" -ForegroundColor Green
    Copy-Item $sourceFile $targetFile -Force
    Remove-Item $sourceFile -Force
    Write-Host "        تم النسخ" -ForegroundColor Green
} else {
    Write-Host "        لا يوجد ملف جديد في Downloads" -ForegroundColor Gray
}

# ── الخطوة 2: تحديث رقم الإصدار ──────────────────────────────
Write-Host ""
Write-Host "  [2/4] تحديث مفتاح التخزين..." -ForegroundColor Yellow

$content = [System.IO.File]::ReadAllText($storageFile, [System.Text.Encoding]::UTF8)

if ($content -match "uniplast_products_v(\d+)") {
    $currentVersion = [int]$Matches[1]
    $newVersion     = $currentVersion + 1

    $content = $content -replace "uniplast_products_v$currentVersion",  "uniplast_products_v$newVersion"
    $content = $content -replace "uniplast_categories_v$currentVersion","uniplast_categories_v$newVersion"
    $content = $content -replace "uniplast_config_v$currentVersion",    "uniplast_config_v$newVersion"
    $content = $content -replace "uniplast_pin_v$currentVersion",       "uniplast_pin_v$newVersion"
    $content = $content -replace "uniplast_orders_v$currentVersion",    "uniplast_orders_v$newVersion"

    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($storageFile, $content, $utf8NoBom)

    Write-Host "        v$currentVersion  =>  v$newVersion  [OK]" -ForegroundColor Green
} else {
    Write-Host "  !! لم يُعثر على رقم الإصدار في storage.ts" -ForegroundColor Red
    Write-Host "     تابع بدون تحديث المفتاح..." -ForegroundColor Yellow
}

# ── الخطوة 3: npm run build ───────────────────────────────────
Write-Host ""
Write-Host "  [3/4] بناء المشروع (قد يأخذ دقيقة)..." -ForegroundColor Yellow

Set-Location $projectDir

if (-not (Test-Path "$projectDir\node_modules")) {
    Write-Host ""
    Write-Host "  !! node_modules غير موجود!" -ForegroundColor Red
    Write-Host "     شغّل أولاً: npm install" -ForegroundColor Yellow
    Read-Host "`n  اضغط Enter للخروج"
    exit
}

& cmd.exe /c "cd /d `"$projectDir`" && npm run build"
$buildExit = $LASTEXITCODE

Write-Host ""
if ($buildExit -ne 0) {
    Write-Host "  !! فشل البناء (exit code: $buildExit)" -ForegroundColor Red
    Write-Host "     انظر الأخطاء أعلاه" -ForegroundColor Yellow

    if ($currentVersion) {
        $content = [System.IO.File]::ReadAllText($storageFile, [System.Text.Encoding]::UTF8)
        $content = $content -replace "uniplast_products_v$newVersion",  "uniplast_products_v$currentVersion"
        $content = $content -replace "uniplast_categories_v$newVersion","uniplast_categories_v$currentVersion"
        $content = $content -replace "uniplast_config_v$newVersion",    "uniplast_config_v$currentVersion"
        $content = $content -replace "uniplast_pin_v$newVersion",       "uniplast_pin_v$currentVersion"
        $content = $content -replace "uniplast_orders_v$newVersion",    "uniplast_orders_v$currentVersion"
        $utf8NoBom = New-Object System.Text.UTF8Encoding $false
        [System.IO.File]::WriteAllText($storageFile, $content, $utf8NoBom)
        Write-Host "        تم استعادة v$currentVersion" -ForegroundColor Gray
    }
    Read-Host "`n  اضغط Enter للخروج"
    exit
}

if (-not (Test-Path "$distDir\index.html")) {
    Write-Host "  !! مجلد dist/ فارغ!" -ForegroundColor Red
    Read-Host "`n  اضغط Enter للخروج"
    exit
}

$distSize = [math]::Round((Get-ChildItem $distDir -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB, 1)
Write-Host "  [OK] dist/ جاهز ($distSize MB)" -ForegroundColor Green

# ── الخطوة 4: فتح Netlify ─────────────────────────────────────
Write-Host ""
Write-Host "  [4/4] فتح Netlify..." -ForegroundColor Yellow

Start-Process "https://app.netlify.com/sites/uniplast-siteweb-dz/deploys"
Start-Sleep -Milliseconds 800
Start-Process "explorer.exe" $distDir

Write-Host ""
Write-Host "  ─────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  1. فُتحت صفحة Netlify في المتصفح" -ForegroundColor Cyan
Write-Host "  2. فُتح مجلد dist في Explorer" -ForegroundColor Cyan
Write-Host "  3. اسحب مجلد dist كاملاً على Netlify" -ForegroundColor White
Write-Host "  ─────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  ========================================" -ForegroundColor Green
Write-Host "   اكتمل!                                 " -ForegroundColor Green
Write-Host "  ========================================" -ForegroundColor Green
Write-Host ""
Read-Host "  اضغط Enter للإغلاق"
