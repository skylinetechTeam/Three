# Script para instalar dependências e iniciar API
Clear-Host
Write-Host "🚀 Setup e Inicialização da API" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

# Verificar se pasta api existe
if (-not (Test-Path "api")) {
    Write-Host "❌ Pasta 'api' não encontrada!" -ForegroundColor Red
    Write-Host "   Certifique-se de estar na pasta correta do projeto." -ForegroundColor Yellow
    pause
    exit 1
}

# Verificar se server.js existe
if (-not (Test-Path "api\server.js")) {
    Write-Host "❌ Arquivo 'server.js' não encontrado na pasta api!" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "✅ Estrutura do projeto verificada" -ForegroundColor Green

# Verificar se package.json existe
if (-not (Test-Path "api\package.json")) {
    Write-Host "⚠️  package.json não encontrado" -ForegroundColor Yellow
    Write-Host "   Criando package.json básico..." -ForegroundColor Yellow
    
    Set-Location "api"
    npm init -y | Out-Null
    Set-Location ".."
    
    Write-Host "✅ package.json criado" -ForegroundColor Green
}

Write-Host ""
Write-Host "📦 Instalando dependências..." -ForegroundColor Cyan
Set-Location "api"

# Instalar dependências necessárias
Write-Host "   • express" -ForegroundColor Gray
npm install express --save | Out-Null

Write-Host "   • socket.io" -ForegroundColor Gray
npm install socket.io --save | Out-Null

Write-Host "   • cors" -ForegroundColor Gray
npm install cors --save | Out-Null

Write-Host "   • helmet" -ForegroundColor Gray
npm install helmet --save | Out-Null

Write-Host "   • morgan" -ForegroundColor Gray
npm install morgan --save | Out-Null

Write-Host "   • compression" -ForegroundColor Gray
npm install compression --save | Out-Null

Write-Host "   • moment" -ForegroundColor Gray
npm install moment --save | Out-Null

Write-Host "   • joi" -ForegroundColor Gray
npm install joi --save | Out-Null

Write-Host "   • uuid" -ForegroundColor Gray
npm install uuid --save | Out-Null

Write-Host "   • rate-limiter-flexible" -ForegroundColor Gray
npm install rate-limiter-flexible --save | Out-Null

Write-Host ""
Write-Host "✅ Dependências instaladas!" -ForegroundColor Green
Write-Host ""
Write-Host "─────────────────────────────────────────" -ForegroundColor Gray
Write-Host "🚀 Iniciando servidor..." -ForegroundColor Green
Write-Host "─────────────────────────────────────────" -ForegroundColor Gray
Write-Host ""

# Iniciar servidor
try {
    node server.js
} catch {
    Write-Host "❌ Erro ao iniciar servidor: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    Set-Location ".."
    Write-Host ""
    Write-Host "✅ Script finalizado" -ForegroundColor Green
    pause
}