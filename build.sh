#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt

if command -v npm &> /dev/null
then
    echo "Building React frontend..."
    cd frontend
    npm install
    npm run build
    cd ..
fi

python manage.py collectstatic --no-input

python manage.py migrate
