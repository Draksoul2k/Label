@echo off
chcp 65001 > nul
echo ========================================================
echo   HE THONG QUAN LY MA VACH & THIET KE IN TEM NHAN VNLABEL
echo ========================================================
echo.
echo Dang khoi dong Backend API va Frontend tai http://localhost:5043 ...
echo.

start "" "http://localhost:5043"

cd /d "%~dp0backend\VNLabel.Api"
dotnet run
pause
