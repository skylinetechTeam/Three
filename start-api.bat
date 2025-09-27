@echo off
title API do Aplicativo de Corridas
color 0A

echo.
echo ========================================
echo 🚀 INICIANDO API DO APLICATIVO DE CORRIDAS
echo ========================================
echo.

REM Verificar se Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Erro: Node.js não foi encontrado!
    echo    Por favor, instale o Node.js primeiro.
    echo    Download: https://nodejs.org
    pause
    exit /b 1
)

REM Mostrar versão do Node.js
echo 📋 Versão do Node.js:
node --version
echo.

REM Verificar se a pasta api existe
if not exist "api" (
    echo ❌ Erro: Pasta 'api' não encontrada!
    echo    Certifique-se de estar na pasta correta do projeto.
    pause
    exit /b 1
)

REM Verificar se server.js existe
if not exist "api\server.js" (
    echo ❌ Erro: Arquivo 'server.js' não encontrado na pasta api!
    echo    Verifique a estrutura do projeto.
    pause
    exit /b 1
)

echo 📡 Iniciando servidor da API...
echo 🔗 Pasta: %CD%\api
echo 📄 Arquivo: server.js
echo.
echo ─────────────────────────────────────────
echo 💡 Pressione Ctrl+C para encerrar
echo ─────────────────────────────────────────
echo.

REM Mudar para a pasta api e iniciar o servidor
cd api
node server.js

REM Retornar para a pasta original
cd ..

echo.
echo ─────────────────────────────────────────
echo ✅ Servidor encerrado.
echo ─────────────────────────────────────────
pause