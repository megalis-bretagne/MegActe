"""creation

Revision ID: 1cf3d83d62af
Revises: 
Create Date: 2024-09-26 07:56:44.897905

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "1cf3d83d62af"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table(
        "pastell_users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("login", sa.String(), nullable=False),
        sa.Column("id_pastell", sa.Integer(), nullable=False),
        sa.Column("pwd_pastell", sa.String(), nullable=True),
        sa.Column("pwd_key", sa.String(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("id_pastell"),
    )
    op.create_index(
        op.f("ix_pastell_users_login"), "pastell_users", ["login"], unique=True
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f("ix_pastell_users_login"), table_name="pastell_users")
    op.drop_table("pastell_users")
    # ### end Alembic commands ###
