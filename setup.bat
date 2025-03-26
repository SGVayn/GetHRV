@echo off

echo Creating virtual environment...
python -m venv envi

echo Activating virtual environment...
call envi\Scripts\activate

echo Installing requirements...
pip install -r requirements.txt

echo Applying migrations...
python manage.py migrate

echo Creating superuser...
python manage.py createsuperuser

echo Done!
echo To run the server:
echo set DJANGO_SETTINGS_MODULE=GetHRV.mysite.settings && python manage.py runserver 5555
