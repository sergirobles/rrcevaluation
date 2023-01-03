#!/bin/sh

pip install --no-cache-dir --upgrade -r /code/scripts/requirements.txt

gunicorn -k uvicorn.workers.UvicornWorker main:app1 --bind 0.0.0.0:80 --workers 1 --max-requests 2 -t 0