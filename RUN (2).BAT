@echo off
REM Force the script to run from the current directory (Essential for USB drives)
cd /d "%~dp0"

chcp 65001 >nul
color 0b
title UNIPLAST System Manager
cls

REM --- Pre-flight Check for Node.js ---
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0c
    cls
    echo ========================================================
    echo           CRITICAL ERROR: NODE.JS MISSING
    echo ========================================================
    echo.
    echo This computer does not have Node.js installed.
    echo To run this program, you must install Node.js first.
    echo.
    echo Opening download page...
    timeout /t 5 >nul
    start "" "https://nodejs.org/en/download/"
    pause
    exit
)

:MENU
cls
color 0b
echo ========================================================
echo               UNIPLAST SYSTEM MANAGER
echo ========================================================
echo.
echo    [1] Open Program (Local Mode)
echo.
echo    [2] Update System (Build and Deploy to Netlify)
echo.
echo    [3] NEW DEVICE / USB SETUP (First Time Run)
echo.
echo    [4] BUILD ONLY - Prepare dist (no upload)
echo.
echo ========================================================
echo    NOTE: If products are missing, go to Admin - Settings
echo    and click "Factory Reset".
echo ========================================================
set /p choice="Please select an option (1, 2, 3 or 4): "

if "%choice%"=="1" goto RUN_DEV
if "%choice%"=="2" goto DEPLOY
if "%choice%"=="3" goto SETUP
if "%choice%"=="4" goto BUILD_ONLY
goto MENU

:RUN_DEV
cls
echo Starting UNIPLAST Local Server...
echo The browser will open automatically.
echo Press CTRL+C to stop.
echo.
call npm run dev
pause
goto MENU

:DEPLOY
cls
echo ========================================================
echo           BUILDING PROJECT... Please wait.
echo ========================================================
echo.
call npm run build

if %errorlevel% neq 0 (
    color 0c
    echo.
    echo ========================================================
    echo           BUILD FAILED
    echo ========================================================
    echo.
    echo Please read the error message above.
    echo.
    pause
    goto MENU
)

color 0a
cls
echo ========================================================
echo.
echo   Build reussi avec succes !
echo   Le projet est pret a etre mis en ligne.
echo.
echo ========================================================
echo.
echo   Appuyez sur une touche pour ouvrir Netlify
echo   et mettre a jour le site...
echo.
echo ========================================================
pause >nul

echo Opening Project Folder...
start "" "%~dp0dist"
echo Opening Site Deploys Page...
start "" "https://app.netlify.com/projects/uniplast-siteweb-dz/deploys"

cls
color 0b
echo ========================================================
echo               READY FOR UPLOAD
echo ========================================================
echo.
echo [IMPORTANT]
echo 1. Netlify Account: geumar.med@gmail.com
echo.
echo 2. The page for 'uniplast-siteweb-dz' will open.
echo.
echo 3. Scroll to the bottom to find "Drag and drop".
echo    Drag the dist folder onto the Netlify page.
echo.
echo    !! DO NOT CREATE A NEW SITE !!
echo.
echo ========================================================
echo.
pause
goto MENU

:BUILD_ONLY
cls
echo ========================================================
echo           BUILD ONLY... Please wait.
echo ========================================================
echo.
call npm run build

if %errorlevel% neq 0 (
    color 0c
    echo.
    echo ========================================================
    echo           BUILD FAILED
    echo ========================================================
    echo.
    echo Please read the error message above.
    echo.
    pause
    goto MENU
)

color 0a
cls
echo ========================================================
echo.
echo   Build reussi avec succes !
echo   Le dossier dist est pret.
echo.
echo ========================================================
echo.
echo   Appuyez sur une touche pour ouvrir Netlify
echo   et mettre a jour le site...
echo.
echo ========================================================
pause >nul

start "" "https://app.netlify.com/projects/uniplast-siteweb-dz/deploys"
start "" "%~dp0dist"

echo.
pause
goto MENU

:SETUP
cls
echo ========================================================
echo           SETTING UP NEW DEVICE...
echo ========================================================
echo.
echo Installing dependencies (npm install)...
echo This may take a few minutes...
echo.
call npm install
echo.
echo ========================================================
echo           SETUP COMPLETE!
echo ========================================================
echo.
echo You can now use Option [1] to run the program.
pause
goto MENU
