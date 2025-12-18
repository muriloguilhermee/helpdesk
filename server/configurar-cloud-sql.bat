@echo off
REM Script para configurar Cloud SQL no Cloud Run (Windows)
REM Uso: configurar-cloud-sql.bat [CONNECTION_NAME] [SENHA] [BANCO]

setlocal

set CONNECTION_NAME=%1
set SENHA=%2
set BANCO=%3
set REGION=us-central1
set SERVICE_NAME=helpdesk-server

if "%CONNECTION_NAME%"=="" (
  echo ❌ Uso: configurar-cloud-sql.bat [CONNECTION_NAME] [SENHA] [BANCO]
  echo.
  echo Exemplo:
  echo   configurar-cloud-sql.bat helpdesk-6dff8:us-central1:helpdesk-db minhaSenha123 postgres
  echo.
  echo Onde:
  echo   CONNECTION_NAME: Connection name do Cloud SQL
  echo   SENHA: Senha do usuário postgres no Cloud SQL
  echo   BANCO: Nome do banco (padrão: postgres)
  exit /b 1
)

if "%SENHA%"=="" (
  echo ❌ Erro: Senha não fornecida
  exit /b 1
)

if "%BANCO%"=="" set BANCO=postgres

echo 🔧 Configurando Cloud SQL no Cloud Run...
echo.
echo Connection Name: %CONNECTION_NAME%
echo Banco: %BANCO%
echo Região: %REGION%
echo Serviço: %SERVICE_NAME%
echo.

set DATABASE_URL=postgresql://postgres:%SENHA%@/%BANCO%?host=/cloudsql/%CONNECTION_NAME%

echo 📝 Passo 1: Adicionando Cloud SQL connection ao Cloud Run...
gcloud run services update %SERVICE_NAME% --add-cloudsql-instances=%CONNECTION_NAME% --region=%REGION%

echo.
echo 📝 Passo 2: Atualizando DATABASE_URL no Cloud Run...
gcloud run services update %SERVICE_NAME% --update-env-vars DATABASE_URL="%DATABASE_URL%" --region=%REGION%

echo.
echo ✅ Configuração concluída!
echo.
echo 🔍 Para verificar, acesse:
echo    https://console.cloud.google.com/run/detail/%REGION%/%SERVICE_NAME%
echo.
echo 📋 Próximos passos:
echo    1. Verifique os logs do Cloud Run
echo    2. Você deve ver: '✅ Database connected successfully!'
echo    3. O sistema criará as tabelas automaticamente

endlocal

