# Despliegue

Desde la raíz se levantan Nginx, frontend, API FastAPI, PostgreSQL y Redis. Solamente Nginx publica un puerto (`8082` por defecto); los demás servicios permanecen en redes internas.

```bash
cp .env.example .env
nano .env
docker compose up -d --build
docker compose ps
```

Defina valores seguros para `POSTGRES_PASSWORD`, `JWT_SECRET_KEY` y `OPENAI_API_KEY`. Para un dominio público configure `PUBLIC_API_URL` sin barra final antes de ejecutar el build.

Alembic aplica automáticamente las migraciones al iniciar la API. Los datos persisten en los volúmenes `postgres_data` y `redis_data`; no ejecute `docker compose down -v` a menos que quiera eliminarlos.
