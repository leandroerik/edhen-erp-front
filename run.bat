@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Instalando dependencias...
  call npm install
)
echo Iniciando Edhen ERP Front...
call npm run dev
pause
