"""ad_slots — admin-managed ad rotation per slot

Revision ID: 002
Revises: 001
Create Date: 2026-04-28 00:00:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "ad_slots",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("slot_name", sa.Text, nullable=False),
        sa.Column("image_url", sa.Text, nullable=False),
        sa.Column("link_url", sa.Text, nullable=False),
        sa.Column("active", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("label", sa.Text),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index(
        "ix_ad_slots_active_slot",
        "ad_slots",
        ["slot_name", "active"],
    )


def downgrade():
    op.drop_index("ix_ad_slots_active_slot", table_name="ad_slots")
    op.drop_table("ad_slots")
