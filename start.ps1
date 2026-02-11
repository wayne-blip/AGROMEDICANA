# AgroMedicana Startup Script
# Stop existing processes
Stop-Process -Name python -Force -ErrorAction SilentlyContinue
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Start backend
Start-Process -FilePath "c:\AgroMedicana-MVP\backend\.venv\Scripts\python.exe" `
    -ArgumentList "c:\AgroMedicana-MVP\backend\app.py" `
    -WorkingDirectory "c:\AgroMedicana-MVP\backend"
Start-Sleep -Seconds 3

# Start frontend
Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c cd /d c:\AgroMedicana-MVP\frontend && npx vite --port 5173" `
    -WorkingDirectory "c:\AgroMedicana-MVP\frontend"
Start-Sleep -Seconds 5

# Verify
$backendOk = $false
$frontendOk = $false
try { $null = Invoke-WebRequest http://localhost:5000/api/v1/experts -UseBasicParsing -TimeoutSec 5; $backendOk = $true } catch {}
try { $null = Invoke-WebRequest http://localhost:5173 -UseBasicParsing -TimeoutSec 5; $frontendOk = $true } catch {}

Write-Host ""
Write-Host "=================================="
Write-Host "  AgroMedicana MVP"
Write-Host "=================================="
Write-Host "  Backend  (Flask):  $(if($backendOk){'RUNNING - http://localhost:5000'}else{'FAILED'})"
Write-Host "  Frontend (Vite):   $(if($frontendOk){'RUNNING - http://localhost:5173'}else{'FAILED'})"
Write-Host "=================================="
