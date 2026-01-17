@echo off
echo ========================================
echo      IronForge - Demarrage Rapide
echo ========================================
echo.

REM Verifier si Redis tourne
docker ps | findstr "ironforge-redis" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [1/4] Demarrage de Redis...
    docker run -d -p 6379:6379 --name ironforge-redis redis:7-alpine
    timeout /t 2 /nobreak >nul
) else (
    echo [1/4] Redis deja demarre
)

echo [2/4] Compilation du projet...
cargo build --release

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERREUR: La compilation a echoue
    pause
    exit /b 1
)

echo [3/4] Lancement du serveur IronForge...
echo.
echo ========================================
echo  Serveur demarre sur http://127.0.0.1:3000
echo.
echo  Endpoints disponibles:
echo    POST   /jobs           - Creer un job
echo    GET    /jobs/:id       - Recuperer un job
echo    DELETE /jobs/:id       - Supprimer un job
echo    POST   /jobs/:id/retry - Retry depuis DLQ
echo    GET    /queues/stats   - Statistiques
echo    GET    /health         - Health check
echo    GET    /metrics        - Prometheus metrics
echo.
echo  Ctrl+C pour arreter
echo ========================================
echo.

cargo run --release --bin server
