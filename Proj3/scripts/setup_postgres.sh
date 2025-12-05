#!/bin/bash
# PostgreSQL setup script

DB_NAME="foodpool"
DB_USER="myuser"
DB_PASS="mypassword"

echo "Creating PostgreSQL database and user..."
psql -U postgres <<EOF
CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';
CREATE DATABASE $DB_NAME OWNER $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOF

echo "PostgreSQL setup complete."
