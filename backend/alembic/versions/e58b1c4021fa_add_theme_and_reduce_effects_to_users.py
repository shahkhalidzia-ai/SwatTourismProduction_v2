"""add_theme_and_reduce_effects_to_users

Revision ID: e58b1c4021fa
Revises: d942e12a8b34
Create Date: 2026-10-15 12:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e58b1c4021fa'
down_revision: Union[str, None] = 'd942e12a8b34'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    cols = [c['name'] for c in insp.get_columns('users')]
    if 'theme' not in cols:
        op.add_column('users', sa.Column('theme', sa.String(length=20), server_default='lake', nullable=False))
    if 'reduce_effects' not in cols:
        op.add_column('users', sa.Column('reduce_effects', sa.Boolean(), server_default=sa.text('0'), nullable=False))


def downgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    cols = [c['name'] for c in insp.get_columns('users')]
    if 'reduce_effects' in cols:
        op.drop_column('users', 'reduce_effects')
    if 'theme' in cols:
        op.drop_column('users', 'theme')
