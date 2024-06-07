FROM python:3.11.2-alpine


WORKDIR /appli

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt

COPY app/ ./app/
COPY config/ ./config/

RUN rm /appli/config/config_template.yml

EXPOSE 80

CMD ["fastapi", "run", "app/main.py", "--port", "80"]