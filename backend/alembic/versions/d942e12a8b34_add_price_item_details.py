"""add_price_item_details

Revision ID: d942e12a8b34
Revises: c839a11f5e21
Create Date: 2026-10-06 14:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd942e12a8b34'
down_revision: Union[str, None] = 'c839a11f5e21'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    cols = [c['name'] for c in insp.get_columns('price_items')]
    if 'details' not in cols:
        op.add_column('price_items', sa.Column('details', sa.JSON(), nullable=True))

    # Update media check constraint for price_item support
    if bind.dialect.name == 'sqlite':
        res = bind.exec_driver_sql("SELECT sql FROM sqlite_master WHERE type='table' AND name='media'").fetchone()
        if res and 'price_item' not in res[0]:
            bind.exec_driver_sql("PRAGMA foreign_keys=OFF")
            bind.exec_driver_sql("""
                CREATE TABLE media_new (
                    owner_type VARCHAR(20) NOT NULL, 
                    owner_id CHAR(32) NOT NULL, 
                    url TEXT NOT NULL, 
                    media_type VARCHAR(10) NOT NULL, 
                    caption VARCHAR(200), 
                    sort_order INTEGER NOT NULL, 
                    uploaded_by CHAR(32), 
                    created_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
                    id CHAR(32) NOT NULL, 
                    PRIMARY KEY (id), 
                    CONSTRAINT check_media_type CHECK (media_type IN ('image', 'video')), 
                    CONSTRAINT check_media_owner_type CHECK (owner_type IN ('listing', 'destination', 'post', 'report', 'price_item')), 
                    FOREIGN KEY(uploaded_by) REFERENCES users (id) ON DELETE SET NULL
                )
            """)
            bind.exec_driver_sql("INSERT INTO media_new SELECT owner_type, owner_id, url, media_type, caption, sort_order, uploaded_by, created_at, id FROM media")
            bind.exec_driver_sql("DROP TABLE media")
            bind.exec_driver_sql("ALTER TABLE media_new RENAME TO media")
            bind.exec_driver_sql("PRAGMA foreign_keys=ON")


def downgrade() -> None:
    pass
