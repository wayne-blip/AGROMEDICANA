@echo off
echo Stopping existing processes...
taskkill /F /IM python.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo Starting Backend (Flask on port 5000)...
start "AgroMedicana-Backend" /D "c:\AgroMedicana-MVP\backend" "c:\AgroMedicana-MVP\backend\.venv\Scripts\python.exe" "c:\AgroMedicana-MVP\backend\app.py"
timeout /t 3 /nobreak >nul

echo Starting Frontend (Vite on port 5173)...
start "AgroMedicana-Frontend" /D "c:\AgroMedicana-MVP\frontend" cmd /c "npx vite --port 5173"
timeout /t 5 /nobreak >nul

echo.
echo ==================================
echo   AgroMedicana MVP
echo ==================================
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:5173
echo ==================================
