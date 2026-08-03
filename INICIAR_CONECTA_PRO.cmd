@echo off
setlocal EnableExtensions
chcp 65001 >nul
title O Profissional Certo - Inicializador V2.2

cd /d "%~dp0"

echo ============================================================
echo               O PROFISSIONAL CERTO V2.2 - TESTE LOCAL
echo ============================================================
echo.

if not exist "package.json" (
  echo ERRO: O projeto nao esta em uma pasta extraida.
  echo.
  echo Clique com o botao direito no arquivo ZIP e escolha:
  echo     EXTRAIR TUDO
  echo.
  echo Depois abra a pasta extraida e execute este arquivo novamente.
  echo.
  pause
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo ERRO: Node.js nao foi encontrado.
  echo Instale a versao LTS em https://nodejs.org/
  echo Reinicie o computador e tente novamente.
  pause
  exit /b 1
)

for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":3000 .*LISTENING"') do taskkill /PID %%P /F >nul 2>nul
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":24678 .*LISTENING"') do taskkill /PID %%P /F >nul 2>nul

if not exist "node_modules" (
  echo Instalando dependencias pela primeira vez...
  call npm install
  if errorlevel 1 (
    echo.
    echo A instalacao falhou. Verifique sua internet e envie uma foto desta janela.
    pause
    exit /b 1
  )
)

echo.
echo Iniciando o aplicativo...
start "O Profissional Certo - Servidor" cmd /k "cd /d ""%~dp0"" && npm run dev"

echo Aguardando o servidor...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$u='http://127.0.0.1:3000'; for($i=0;$i -lt 90;$i++){try{$r=Invoke-WebRequest -UseBasicParsing -Uri $u -TimeoutSec 2;if($r.StatusCode -ge 200){Start-Process $u;exit 0}}catch{};Start-Sleep -Seconds 2};exit 1"

if errorlevel 1 (
  echo.
  echo O aplicativo nao respondeu. Veja a janela O Profissional Certo - Servidor.
  pause
  exit /b 1
)

exit /b 0
