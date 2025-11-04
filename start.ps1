# Script para iniciar API
Clear-Host
Write-Host "🚀 Iniciando API..." -ForegroundColor Green

if (-not (Test-Path "api")) {
    Write-Host "❌ Pasta api não encontrada!" -ForegroundColor Red
    pause
    exit
}

if (-not (Test-Path "api\server.js")) {
    Write-Host "❌ server.js não encontrado!" -ForegroundColor Red
    pause
    exit
}

try {
    Set-Location "api"
    node server.js
} finally {
    Set-Location ".."
    Write-Host "Servidor encerrado." -ForegroundColor Yellow
    pause
}