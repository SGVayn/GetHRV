#!/bin/bash

echo "Upgrading pip..."
python -m pip install --upgrade pip

echo "Installing Django 5.1.2..."
pip install Django==5.1.2

echo "Installing all requirements..."
pip install -r requirements.txt

echo "Applying migrations..."
python manage.py migrate

echo "Creating superuser..."
python manage.py createsuperuser

echo "Setup complete!"
echo "To run the server:"
echo "source envi/bin/activate && python manage.py runserver 0.0.0.0:5555"


