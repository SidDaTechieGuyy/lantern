FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM python:3.11-slim
RUN pip install --no-cache-dir flask flask-cors gunicorn gevent psutil docker python-dateutil

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY app.py .

EXPOSE 80

CMD ["gunicorn", "--worker-class", "gevent", "--workers", "1", "--bind", "0.0.0.0:80", "--timeout", "120", "app:app"]
