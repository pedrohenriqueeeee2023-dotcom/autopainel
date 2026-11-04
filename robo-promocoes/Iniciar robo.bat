@echo off
title Robo de Promocoes
cd /d "%~dp0"
if not exist node_modules (
  echo Instalando o robo pela primeira vez, aguarde...
  call npm install
)
start "" cmd /c "timeout /t 6 >nul & start http://localhost:3000"
echo Robo ligando... NAO feche esta janela enquanto quiser o robo funcionando.
npm start
pause
