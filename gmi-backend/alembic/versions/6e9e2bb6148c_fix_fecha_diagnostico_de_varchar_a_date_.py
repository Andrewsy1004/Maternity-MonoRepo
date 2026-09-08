from alembic import op
import sqlalchemy as sa

revision = '6e9e2bb6148c'
down_revision = '6308f60ca981'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        'antecedente_patologico',
        'fecha_diagnostico',
        existing_type=sa.VARCHAR(),
        type_=sa.Date(),
        existing_nullable=True,
        schema='gmi',
        postgresql_using='fecha_diagnostico::date'
    )


def downgrade() -> None:
    op.alter_column(
        'antecedente_patologico',
        'fecha_diagnostico',
        existing_type=sa.Date(),
        type_=sa.VARCHAR(),
        existing_nullable=True,
        schema='gmi',
    )