"""drop pwd_pastell column

Revision ID: 18f093f5cf97
Revises: a1b2c3d4e5f6
Create Date: 2026-09-22 15:54:55.051986

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '18f093f5cf97'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Supprime la colonne pwd_pastell : l'authentification Pastell repose
    désormais exclusivement sur le token, aucun mot de passe n'est stocké."""
    op.drop_column("pastell_users", "pwd_pastell")


def downgrade() -> None:
    op.add_column("pastell_users", sa.Column("pwd_pastell", sa.String(), nullable=True))
