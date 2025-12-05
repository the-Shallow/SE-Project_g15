@echo off
SET DB_NAME=foodpool
SET DB_USER=myuser
SET DB_PASS=mypassword

echo Setting up PostgreSQL...
psql -U postgres -c "CREATE USER %DB_USER% WITH PASSWORD '%DB_PASS%';"
psql -U postgres -c "CREATE DATABASE %DB_NAME% OWNER %DB_USER%;"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE %DB_NAME% TO %DB_USER%;"

echo PostgreSQL setup complete.
pause
