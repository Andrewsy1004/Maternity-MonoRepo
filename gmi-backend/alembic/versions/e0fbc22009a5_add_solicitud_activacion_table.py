"""add solicitud_activacion table

Revision ID: e0fbc22009a5
Revises: a1c911b4a854
Create Date: 2026-07-13 09:09:12.219167

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'e0fbc22009a5'
down_revision: Union[str, None] = 'a1c911b4a854'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'solicitud_activacion',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('codigo_gmi', sa.String(length=20), nullable=False),
        sa.Column('pregunta', sa.String(length=200), nullable=False),
        sa.Column('hash_respuesta', sa.String(length=256), nullable=False),
        sa.Column('estado', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('codigo_gmi'),
        schema='gmi'
    )


def downgrade() -> None:
    op.drop_table('solicitud_activacion', schema='gmi')