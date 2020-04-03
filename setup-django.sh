#!/bin/sh
python3 -m venv ~/.virtualenvs/$1
source ~/.virtualenvs/$1/bin/activate
pip install django graphene-django
django-admin startproject backend
cd backend
pip freeze > requirements.txt
