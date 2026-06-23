@echo off
REM Self-elevating script to fix Windows Firewall for the dev servers.
REM Double-click this file, then click "Yes" on the UAC prompt.

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Requesting administrator rights...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo Removing BLOCK rules for python (these were silently created earlier)...
netsh advfirewall firewall delete rule name="Python" >nul 2>&1
netsh advfirewall firewall delete rule name="python" >nul 2>&1

echo Allowing python and the dev ports through the firewall...
netsh advfirewall firewall delete rule name="Expo Metro 8081" >nul 2>&1
netsh advfirewall firewall delete rule name="Django Dev 8000" >nul 2>&1
netsh advfirewall firewall delete rule name="Python Allow" >nul 2>&1
netsh advfirewall firewall add rule name="Python Allow" dir=in action=allow program="C:\Python312\python.exe" enable=yes profile=any
netsh advfirewall firewall add rule name="Expo Metro 8081" dir=in action=allow protocol=TCP localport=8081
netsh advfirewall firewall add rule name="Django Dev 8000" dir=in action=allow protocol=TCP localport=8000

echo.
echo Done. You can close this window.
pause
