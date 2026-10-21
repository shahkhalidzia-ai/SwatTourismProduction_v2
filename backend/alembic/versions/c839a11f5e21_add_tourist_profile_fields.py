"""add_tourist_profile_fields

Revision ID: c839a11f5e21
Revises: b7189a01d29e
Create Date: 2026-10-06 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c839a11f5e21'
down_revision: Union[str, None] = 'b7189a01d29e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    cols = [c['name'] for c in insp.get_columns('tourist_profiles')]
    if 'budget_level' not in cols:
        op.add_column('tourist_profiles', sa.Column('budget_level', sa.String(length=20), nullable=True))
    if 'travel_style' not in cols:
        op.add_column('tourist_profiles', sa.Column('travel_style', sa.String(length=20), nullable=True))
    if 'interests' not in cols:
        op.add_column('tourist_profiles', sa.Column('interests', sa.JSON(), nullable=True))


def downgrade() -> None:
    pass
