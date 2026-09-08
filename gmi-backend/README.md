# Guía de Instalación y Configuración

1. Renombra el archivo de ejemplo `.env.example` a `.env`:

2. Correr docker compose:
```bash
docker compose up -d
```

3. Crear entorno virtual:
```bash
python3 -m venv venv
```

4. Activar entorno virtual:
```bash
source venv/bin/activate
```

5. Instalar dependencias:
```bash
pip install -r requirements.txt
```

6. Correr Alembic para crear tablas:
```bash
alembic upgrade head
```

7. Correr uvicorn:
```bash
uvicorn app.main:app --reload
```