@echo off
setlocal
cd /d "%~dp0"
call npm install || (pause & exit /b 1)
call npm run check || (pause & exit /b 1)
echo Build concluida na pasta dist.
pause
