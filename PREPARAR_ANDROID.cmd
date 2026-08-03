@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul || (echo Instale Node.js LTS primeiro.& pause & exit /b 1)
call npm install || (pause & exit /b 1)
call npm run build || (pause & exit /b 1)
if not exist android call npx cap add android || (pause & exit /b 1)
call npx cap sync android || (pause & exit /b 1)
call npx cap open android
