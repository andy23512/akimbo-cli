#!/bin/sh
python3 -m venv ~/.virtualenvs/$1
source ~/.virtualenvs/$1/bin/activate
pip install django graphene-django
pip freeze > requirements.txt
django-admin startproject backend
