"""add token columns and active flag

Revision ID: a1b2c3d4e5f6
Revises: 7e24685e8a73
Create Date: 2026-11-09 10:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "7e24685e8a73"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("pastell_users", sa.Column("token_name", sa.String(), nullable=True))
    op.add_column("pastell_users", sa.Column("token", sa.String(), nullable=True))
    op.add_column("pastell_users", sa.Column("token_expires_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("pastell_users", sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("true")))


def downgrade() -> None:
    op.drop_column("pastell_users", "active")
    op.drop_column("pastell_users", "token_expires_at")
    op.drop_column("pastell_users", "token")
    op.drop_column("pastell_users", "token_name")
