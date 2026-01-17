@echo off
echo ========================================
echo      IronForge - Test Demo
echo ========================================
echo.

echo Soumission de jobs de test...
echo.

cargo run --release --example advanced_submit

echo.
echo ========================================
echo Jobs soumis avec succes!
echo.
echo Verifiez les logs du worker pour voir
echo le traitement des jobs.
echo ========================================
echo.
pause
