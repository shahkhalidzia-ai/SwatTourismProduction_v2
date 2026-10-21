"""add_trip_stop_columns

Revision ID: b7189a01d29e
Revises: 21e18e4cdc05
Create Date: 2026-10-05 09:50:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7189a01d29e'
down_revision: Union[str, None] = '21e18e4cdc05'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    cols = [c['name'] for c in insp.get_columns('trip_stops')]
    if 'end_day_number' not in cols:
        op.add_column('trip_stops', sa.Column('end_day_number', sa.Integer(), nullable=True))
    if 'time_slot' not in cols:
        op.add_column('trip_stops', sa.Column('time_slot', sa.String(length=30), nullable=True))


def downgrade() -> None:
    pass
