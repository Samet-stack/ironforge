@echo off
echo ========================================
echo      IronForge - Worker
echo ========================================
echo.

echo Demarrage du worker avec 4 threads...
echo.
echo Le worker va traiter les jobs de la queue.
echo Ctrl+C pour arreter
echo.
echo ========================================
echo.

set RUST_LOG=info
cargo run --release --example advanced_worker
