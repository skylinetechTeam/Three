# Script PowerShell para iniciar a API do aplicativo de corridas
param(
    [switch]$Help,
    [switch]$Verbose
)

# Mostrar ajuda se solicitado
if ($Help) {
    Write-Host "📖 AJUDA - Script de Inicialização da API" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Uso:" -ForegroundColor Yellow
    Write-Host "  .\start-api.ps1              # Iniciar normalmente"
    Write-Host "  .\start-api.ps1 -Verbose     # Modo verboso"
    Write-Host "  .\start-api.ps1 -Help        # Mostrar esta ajuda"
    Write-Host ""
    Write-Host "Descrição:" -ForegroundColor Yellow
    Write-Host "  Este script inicia automaticamente o servidor da API"
    Write-Host "  do aplicativo de corridas localizado na pasta 'api'."
    Write-Host ""
    Write-Host "Pré-requisitos:" -ForegroundColor Yellow
    Write-Host "  • Node.js instalado"
    Write-Host "  • Pasta 'api' com arquivo 'server.js'"
    Write-Host "  • Dependências instaladas (npm install)"
    exit 0
}

# Configurar console
$Host.UI.RawUI.WindowTitle = "🚗 API do Aplicativo de Corridas"
Clear-Host

# Banner
Write-Host ""
Write-Host "🚀 INICIANDO API DO APLICATIVO DE CORRIDAS" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""

# Função para log com timestamp
function Write-Log {
    param([string]$Message, [string]$Color = "White")
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
}

# Verificar se Node.js está instalado
try {
    $nodeVersion = node --version
    Write-Log "✅ Node.js encontrado: $nodeVersion" "Green"
} catch {
    Write-Log "❌ Node.js não foi encontrado!" "Red"
    Write-Log "   Por favor, instale o Node.js primeiro." "Yellow"
    Write-Log "   Download: https://nodejs.org" "Yellow"
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Verificar estrutura do projeto
$apiPath = Join-Path $PSScriptRoot "api"
$serverFile = Join-Path $apiPath "server.js"
$packageFile = Join-Path $apiPath "package.json"

if (-not (Test-Path $apiPath)) {
    Write-Log "❌ Pasta 'api' não encontrada!" "Red"
    Write-Log "   Caminho esperado: $apiPath" "Yellow"
    Read-Host "Pressione Enter para sair"
    exit 1
}

if (-not (Test-Path $serverFile)) {
    Write-Log "❌ Arquivo 'server.js' não encontrado!" "Red"
    Write-Log "   Caminho esperado: $serverFile" "Yellow"
    Read-Host "Pressione Enter para sair"
    exit 1
}

if (-not (Test-Path $packageFile)) {
    Write-Log "⚠️  Arquivo 'package.json' não encontrado" "Yellow"
    Write-Log "   Pode ser necessário executar 'npm init' na pasta api" "Yellow"
}

# Mostrar informações do projeto
Write-Log "📁 Pasta do projeto: $PSScriptRoot" "Cyan"
Write-Log "📡 Pasta da API: $apiPath" "Cyan"
Write-Log "📄 Servidor: $serverFile" "Cyan"

if ($Verbose) {
    Write-Log "🔍 Modo verboso ativado" "Magenta"
    Write-Log "   - Mostrará logs detalhados do servidor" "Gray"
}

Write-Host ""
Write-Host "─────────────────────────────────────────" -ForegroundColor Gray
Write-Host "💡 Pressione Ctrl+C para encerrar o servidor" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────" -ForegroundColor Gray
Write-Host ""

# Iniciar servidor
try {
    Write-Log "🚀 Iniciando servidor da API..." "Green"
    
    # Configurar processo
    $processInfo = New-Object System.Diagnostics.ProcessStartInfo
    $processInfo.FileName = "node"
    $processInfo.Arguments = "server.js"
    $processInfo.WorkingDirectory = $apiPath
    $processInfo.UseShellExecute = $false
    $processInfo.RedirectStandardOutput = $true
    $processInfo.RedirectStandardError = $true
    $processInfo.CreateNoWindow = $false
    
    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $processInfo
    
    # Eventos para capturar output
    $process.add_OutputDataReceived({
        if ($EventArgs.Data) {
            Write-Host $EventArgs.Data -ForegroundColor White
        }
    })
    
    $process.add_ErrorDataReceived({
        if ($EventArgs.Data) {
            Write-Host $EventArgs.Data -ForegroundColor Red
        }
    })
    
    # Iniciar processo
    $process.Start() | Out-Null
    $process.BeginOutputReadLine()
    $process.BeginErrorReadLine()
    
    Write-Log "✅ Processo iniciado com PID: $($process.Id)" "Green"
    
    # Aguardar o processo
    $process.WaitForExit()
    
    # Verificar código de saída
    $exitCode = $process.ExitCode
    if ($exitCode -eq 0) {
        Write-Log "✅ Servidor encerrado normalmente" "Green"
    } else {
        Write-Log "❌ Servidor encerrado com erro (código: $exitCode)" "Red"
    }
    
} catch {
    Write-Log "❌ Erro ao iniciar o servidor: $($_.Exception.Message)" "Red"
    exit 1
} finally {
    if ($process -and -not $process.HasExited) {
        Write-Log "🛑 Encerrando processo..." "Yellow"
        $process.Kill()
    }
}

Write-Host ""
Write-Host "─────────────────────────────────────────" -ForegroundColor Gray
Write-Host "👋 Script finalizado" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────────" -ForegroundColor Gray

if (-not $Verbose) {
    Read-Host "Pressione Enter para sair"
}