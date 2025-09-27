# Script simples para iniciar a API do aplicativo de corridas
param([switch]$Help)

if ($Help) {
    Write-Host "🚀 Script de Inicialização da API" -ForegroundColor Green
    Write-Host "=================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Este script inicia o servidor da API automaticamente."
    Write-Host ""
    Write-Host "Uso:"
    Write-Host "  .\start-server.ps1        # Iniciar servidor"
    Write-Host "  .\start-server.ps1 -Help  # Mostrar ajuda"
    Write-Host ""
    exit 0
}

# Configurar título da janela
$Host.UI.RawUI.WindowTitle = "API do Aplicativo de Corridas"
Clear-Host

Write-Host ""
Write-Host "🚀 INICIANDO API DO APLICATIVO DE CORRIDAS" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

# Verificar Node.js
try {
    $nodeVersion = & node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js não encontrado!" -ForegroundColor Red
    Write-Host "   Instale em: https://nodejs.org" -ForegroundColor Yellow
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Verificar pasta api
if (-not (Test-Path "api")) {
    Write-Host "❌ Pasta 'api' não encontrada!" -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Verificar server.js
if (-not (Test-Path "api\server.js")) {
    Write-Host "❌ Arquivo 'server.js' não encontrado!" -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-Host "📁 Pasta da API: $PWD\api" -ForegroundColor Cyan
Write-Host "📄 Servidor: server.js" -ForegroundColor Cyan
Write-Host ""
Write-Host "─────────────────────────────────────────" -ForegroundColor Gray
Write-Host "💡 Pressione Ctrl+C para encerrar" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────" -ForegroundColor Gray
Write-Host ""

# Iniciar servidor
try {
    Set-Location "api"
    & node server.js
} catch {
    Write-Host "❌ Erro ao iniciar servidor: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    Set-Location ".."
    Write-Host ""
    Write-Host "✅ Script finalizado" -ForegroundColor Green
    Read-Host "Pressione Enter para sair"
}