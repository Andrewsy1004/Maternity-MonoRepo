"""add chat_ia alerta_fk and catalogo ia

Revision ID: a1c911b4a854
Revises: 6e9e2bb6148c
Create Date: 2026-06-30

"""
from typing import Union, Sequence
from alembic import op
import sqlalchemy as sa

revision: str = 'a1c911b4a854'
down_revision: Union[str, None] = '6e9e2bb6148c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'chat_ia',
        sa.Column('alerta_id', sa.String(), nullable=True),
        schema='gmi'
    )
    op.create_foreign_key(
        'fk_chat_ia_alerta_id',
        'chat_ia', 'alerta',
        ['alerta_id'], ['id'],
        source_schema='gmi',
        referent_schema='gmi'
    )
    op.execute("""
        INSERT INTO gmi_catalogo.cat_tipo_alerta (codigo, nombre, descripcion, activo)
        VALUES ('ia', 'Alerta IA', 'Alerta generada por el asistente de IA', true)
        ON CONFLICT (codigo) DO NOTHING
    """)
    op.execute("""
        INSERT INTO gmi_catalogo.cat_prioridad_alerta (codigo, nombre, color_hex, requiere_accion_inmediata, activo)
        VALUES
            ('rojo',     'Alta',  '#FF0000', true,  true),
            ('amarillo', 'Media', '#FFA500', false, true)
        ON CONFLICT (codigo) DO NOTHING
    """)


def downgrade() -> None:
    op.drop_constraint('fk_chat_ia_alerta_id', 'chat_ia', schema='gmi', type_='foreignkey')
    op.drop_column('chat_ia', 'alerta_id', schema='gmi')