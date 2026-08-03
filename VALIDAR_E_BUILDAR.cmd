@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul || (echo Instale o Node.js LTS.& pause & exit /b 1)
call npm install || (pause & exit /b 1)
call npm run check || (pause & exit /b 1)
echo.
echo Build validada com sucesso na pasta dist.
pause
