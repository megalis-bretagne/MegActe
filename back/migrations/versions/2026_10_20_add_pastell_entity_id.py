"""store the Pastell entity associated with each user"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "2026_10_20_pastell_entity_id"
down_revision: str | None = "2026_10_02_s2low_authority"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("pastell_users", sa.Column("id_entite_pastell", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("pastell_users", "id_entite_pastell")
