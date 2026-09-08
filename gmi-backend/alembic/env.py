from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context
from sqlmodel import SQLModel

from app.database.base import *

# template para que alembic incluya el import de sqlmodel en migraciones autogeneradas
from alembic.script import write_hooks

@write_hooks.register("add_sqlmodel_import")
def add_sqlmodel_import(filename, options):
    with open(filename, "r") as f:
        content = f.read()
    if "sqlmodel" in content and "import sqlmodel" not in content:
        content = content.replace("import sqlalchemy as sa", "import sqlalchemy as sa\nimport sqlmodel")
        with open(filename, "w") as f:
            f.write(content)

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# le dice a alembic que
target_metadata = SQLModel.metadata


def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()