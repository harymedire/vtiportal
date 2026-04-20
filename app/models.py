"""SQLAlchemy modeli za PostgreSQL."""
from sqlalchemy import (
    Column, String, DateTime, Integer, Text, Boolean,
    ForeignKey, Date, DECIMAL
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
import uuid

Base = declarative_base()


class Article(Base):
    """Objavljeni ili draft članci."""
    __tablename__ = "articles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(Text, nullable=False)
    slug = Column(Text, unique=True, nullable=False, index=True)
    subtitle = Column(Text)
    category = Column(Text, nullable=False, index=True)
    tags = Column(ARRAY(Text), default=list)

    # Članak sadržaj: array stranica sa tekstom i hookovima
    # Format: [{"page": 1, "text": "...", "hook": "..."}, ...]
    pages_json = Column(JSONB, nullable=False)
    moral = Column(Text)

    # Slike
    hero_image_url = Column(Text)
    thumbnail_url = Column(Text)

    # Status: draft | published | archived
    status = Column(String(20), default="draft", index=True)

    # Metadata generisanja
    template_id = Column(Integer, nullable=False)
    variables_used = Column(JSONB)
    generation_cost_usd = Column(DECIMAL(6, 4))

    # Metrike
    views = Column(Integer, default=0)
    shares = Column(Integer, default=0)

    # Embedding za deduplikaciju (OpenAI text-embedding-3-small = 1536 dim)
    embedding = Column(Vector(1536))

    # FB tracking
    fb_posted_at = Column(DateTime(timezone=True))
    fb_post_id = Column(Text)

    # Timestamps
    published_at = Column(DateTime(timezone=True), index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class GenerationJob(Base):
    """Evidencija svakog job-a za generisanje (audit trail)."""
    __tablename__ = "generation_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scheduled_for = Column(DateTime(timezone=True), nullable=False, index=True)
    template_id = Column(Integer)
    status = Column(String(20), default="pending", index=True)
    article_id = Column(UUID(as_uuid=True), ForeignKey("articles.id"))
    error_message = Column(Text)
    retry_count = Column(Integer, default=0)
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class TemplateVariable(Base):
    """Pool varijabli za template-ove. Dinamički, može se širiti."""
    __tablename__ = "template_variables"

    id = Column(Integer, primary_key=True, autoincrement=True)
    template_id = Column(Integer, nullable=False, index=True)
    variable_name = Column(Text, nullable=False)
    variable_value = Column(Text, nullable=False)
    weight = Column(Integer, default=1)
    active = Column(Boolean, default=True)


class ApiUsage(Base):
    """Tracking troškova po API-ju/servisu."""
    __tablename__ = "api_usage"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    date = Column(Date, nullable=False, index=True)
    service = Column(Text, nullable=False)  # claude | openai | replicate | r2
    operation = Column(Text)  # article_gen | image_gen | embedding | upload
    tokens_or_units = Column(Integer)
    cost_usd = Column(DECIMAL(8, 4))
    article_id = Column(UUID(as_uuid=True), ForeignKey("articles.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
