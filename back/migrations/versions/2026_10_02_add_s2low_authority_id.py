"""store the S2low authority associated with a technical account"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "2026_10_02_s2low_authority"
down_revision: str | None = "18f093f5cf97"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("connecteur_auth_tdt", sa.Column("s2low_authority_id", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("connecteur_auth_tdt", "s2low_authority_id")
