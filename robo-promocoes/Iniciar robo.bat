@echo off
title Robo de Promocoes
cd /d "%~dp0"

where git >nul 2>nul
if %errorlevel%==0 (
  if exist "..\.git" (
    echo Procurando atualizacoes do robo...
    git pull --ff-only
  )
)

echo Conferindo as pecas do robo...
call npm install --no-audit --no-fund --loglevel=error

start "" cmd /c "timeout /t 8 >nul & start http://localhost:3000"
echo.
echo Robo ligando... NAO feche esta janela enquanto quiser o robo funcionando.
npm start
pause
