#!/bin/sh
set -eu

# Alembic necesita un driver síncrono y debe conectarse al host de la red Docker.
python -c "import os; from pathlib import Path; p = Path('alembic.ini'); lines = p.read_text(encoding='utf-8').splitlines(); p.write_text('\n'.join(('sqlalchemy.url = ' + os.environ['MIGRATION_DATABASE_URL']) if line.startswith('sqlalchemy.url =') else line for line in lines) + '\n', encoding='utf-8')"

exec "$@"
