"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-04-20 00:00:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Omogući pgvector extension
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"")

    # ===== articles =====
    op.create_table(
        "articles",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("slug", sa.Text(), unique=True, nullable=False),
        sa.Column("subtitle", sa.Text()),
        sa.Column("category", sa.Text(), nullable=False),
        sa.Column("tags", postgresql.ARRAY(sa.Text()), server_default="{}"),
        sa.Column("pages_json", postgresql.JSONB(), nullable=False),
        sa.Column("moral", sa.Text()),
        sa.Column("hero_image_url", sa.Text()),
        sa.Column("thumbnail_url", sa.Text()),
        sa.Column("status", sa.String(20), server_default="draft"),
        sa.Column("template_id", sa.Integer(), nullable=False),
        sa.Column("variables_used", postgresql.JSONB()),
        sa.Column("generation_cost_usd", sa.DECIMAL(6, 4)),
        sa.Column("views", sa.Integer(), server_default="0"),
        sa.Column("shares", sa.Integer(), server_default="0"),
        sa.Column("fb_posted_at", sa.DateTime(timezone=True)),
        sa.Column("fb_post_id", sa.Text()),
        sa.Column("published_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
    )

    # pgvector kolona (alembic ne zna za Vector tip iz libova)
    op.execute("ALTER TABLE articles ADD COLUMN embedding vector(1536)")

    op.create_index("ix_articles_slug", "articles", ["slug"])
    op.create_index("ix_articles_status", "articles", ["status"])
    op.create_index("ix_articles_category", "articles", ["category"])
    op.create_index("ix_articles_published_at", "articles", ["published_at"])

    # ===== generation_jobs =====
    op.create_table(
        "generation_jobs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("scheduled_for", sa.DateTime(timezone=True), nullable=False),
        sa.Column("template_id", sa.Integer()),
        sa.Column("status", sa.String(20), server_default="pending"),
        sa.Column("article_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("articles.id")),
        sa.Column("error_message", sa.Text()),
        sa.Column("retry_count", sa.Integer(), server_default="0"),
        sa.Column("started_at", sa.DateTime(timezone=True)),
        sa.Column("completed_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_jobs_scheduled_for", "generation_jobs", ["scheduled_for"])
    op.create_index("ix_jobs_status", "generation_jobs", ["status"])

    # ===== template_variables =====
    op.create_table(
        "template_variables",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("template_id", sa.Integer(), nullable=False),
        sa.Column("variable_name", sa.Text(), nullable=False),
        sa.Column("variable_value", sa.Text(), nullable=False),
        sa.Column("weight", sa.Integer(), server_default="1"),
        sa.Column("active", sa.Boolean(), server_default="true"),
    )
    op.create_index("ix_vars_template_id", "template_variables", ["template_id"])

    # ===== api_usage =====
    op.create_table(
        "api_usage",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("service", sa.Text(), nullable=False),
        sa.Column("operation", sa.Text()),
        sa.Column("tokens_or_units", sa.Integer()),
        sa.Column("cost_usd", sa.DECIMAL(8, 4)),
        sa.Column("article_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("articles.id")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_usage_date", "api_usage", ["date"])

    # pgvector index (kreira se nakon što je kolona postavljena)
    op.execute(
        "CREATE INDEX ix_articles_embedding ON articles "
        "USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)"
    )


def downgrade():
    op.drop_table("api_usage")
    op.drop_table("template_variables")
    op.drop_table("generation_jobs")
    op.drop_table("articles")
