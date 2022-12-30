FROM python:3.9

RUN apt-get update -y && apt-get install -y libgl1

ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

WORKDIR /code

COPY ./requirements.txt /code/requirements.txt

RUN pip install --upgrade pip

RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

COPY ./app /code/

CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "main:app1", "--bind", "0.0.0.0:80", "--workers","4", "--max-requests", "100", "-t", "0"]