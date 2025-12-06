#!/bin/bash
# Backend setup script

echo "Creating virtual environment..."
python -m venv venv
source venv/bin/activate

echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "Copying .env.example to .env"
cp .env.example .env

echo "Backend setup complete."
echo "Activate venv using 'source venv/bin/activate' (Linux/macOS) or 'venv\\Scripts\\activate' (Windows)"
