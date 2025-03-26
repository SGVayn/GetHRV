@echo off

echo Creating virtual environment...
py -3.10 -m venv envi

echo Activating virtual environment...
call envi\Scripts\activate

echo Upgrading pip...
python -m pip install --upgrade pip

echo Installing Django 5.1.2...
pip install Django==5.1.2

echo Installing all requirements...
pip install -r requirements.txt

echo Applying migrations...
python manage.py migrate

echo Creating superuser...
python manage.py createsuperuser

echo Setup complete!
echo To run the server:
echo call envi\Scripts\activate && python manage.py runserver 0.0.0.0:5555