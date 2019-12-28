#!/bin/sh
python3 -m venv ~/.virtualenvs/$1
source ~/.virtualenvs/$1/bin/activate
pip install django
django-admin startproject backend