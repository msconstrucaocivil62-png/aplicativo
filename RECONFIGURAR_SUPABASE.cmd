@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
if exist ".env.local" del /q ".env.local"
echo Configuracao publica do Supabase removida.
echo Execute CONFIGURAR_E_ABRIR.cmd para cadastrar novamente.
pause
endlocal
