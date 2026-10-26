@echo off
setlocal
cd /d "%~dp0"

echo === Actualizando Vercel ===

git add -A
git commit -m "Actualizacion %DATE% %TIME%" --allow-empty
if errorlevel 1 (
  echo.
  echo ERROR al crear el commit.
  pause
  exit /b 1
)

git push origin HEAD
if errorlevel 1 (
  echo.
  echo ERROR al hacer push. Revisa credenciales, conflictos o la conexion.
  pause
  exit /b 1
)

echo.
echo Listo. Vercel despliega automaticamente en 1-2 minutos.
pause
