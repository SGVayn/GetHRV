#!/bin/bash

echo "Creating virtual environment..."
python3 -m venv envi

echo "Activating virtual environment..."
source envi/bin/activate

echo "Installing requirements..."
pip install -r requirements.txt

echo "Applying migrations..."
python manage.py migrate

echo "Creating superuser..."
python manage.py createsuperuser

echo "Done!"
echo "To run the project:"
echo "source envi/bin/activate"
echo "DJANGO_SETTINGS_MODULE=GetHRV.mysite.settings python manage.py runserver 5555"
