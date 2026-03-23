@echo off
cls

set "sourceFile=%USERPROFILE%\Downloads\constants.ts"
set "targetFile=E:\uniplast-site-web\src\constants.ts"

echo.
echo  ================================
echo   UNIPLAST - Save Data
echo  ================================
echo.

if not exist "%sourceFile%" (
    echo  ERROR: constants.ts not found in Downloads
    echo.
    echo  Steps:
    echo  1. Open Admin Panel in browser
    echo  2. Click Save
    echo  3. Download constants.ts
    echo  4. Run this file again
    echo.
    pause
    exit
)

if not exist "%targetFile%" (
    echo  ERROR: Target file not found:
    echo  %targetFile%
    echo.
    pause
    exit
)

echo  Copying...
copy /Y "%sourceFile%" "%targetFile%"
del "%sourceFile%"

echo.
echo  ================================
echo   OK - Saved successfully!
echo  ================================
echo.
echo  Next steps:
echo  1. Run npm run build
echo  2. Open GitHub Desktop
echo  3. Commit and Push
echo.
pause
