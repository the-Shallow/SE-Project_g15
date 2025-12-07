@echo off
call scripts\setup_postgres.bat
call scripts\install_backend.bat
call scripts\install_frontend.bat
echo All setup complete.
pause
