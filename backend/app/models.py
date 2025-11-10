from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from sqlalchemy import Column, DateTime, String, Text
from sqlmodel import Field, Relationship, SQLModel


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    hashed_password: str
    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), default=datetime.utcnow)
    )

    prompts: List["Prompt"] = Relationship(back_populates="owner")


class Category(SQLModel, table=True):
    __tablename__ = "categories"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)

    subcategories: List["Subcategory"] = Relationship(back_populates="category")
    prompts: List["Prompt"] = Relationship(back_populates="category")


class Subcategory(SQLModel, table=True):
    __tablename__ = "subcategories"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    category_id: int = Field(foreign_key="categories.id")

    category: Category = Relationship(back_populates="subcategories")
    prompts: List["Prompt"] = Relationship(back_populates="subcategory")


class Tag(SQLModel, table=True):
    __tablename__ = "tags"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)

    prompts: List["PromptTagLink"] = Relationship(back_populates="tag")


class PromptTagLink(SQLModel, table=True):
    __tablename__ = "prompt_tags"

    prompt_id: Optional[int] = Field(default=None, foreign_key="prompts.id", primary_key=True)
    tag_id: Optional[int] = Field(default=None, foreign_key="tags.id", primary_key=True)

    prompt: "Prompt" = Relationship(back_populates="tag_links")
    tag: Tag = Relationship(back_populates="prompts")


class Prompt(SQLModel, table=True):
    __tablename__ = "prompts"

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(index=True)
    description: Optional[str] = Field(default=None, sa_column=Column(String, nullable=True))
    contexte: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    role: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    objectif: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    style: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    ton: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    audience: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    resultat: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    modele_cible: Optional[str] = Field(default=None, index=True)
    langue: Optional[str] = Field(default=None, index=True)

    category_id: Optional[int] = Field(default=None, foreign_key="categories.id")
    subcategory_id: Optional[int] = Field(default=None, foreign_key="subcategories.id")
    owner_id: Optional[int] = Field(default=None, foreign_key="users.id")

    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), default=datetime.utcnow)
    )
    updated_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    )

    category: Optional[Category] = Relationship(back_populates="prompts")
    subcategory: Optional[Subcategory] = Relationship(back_populates="prompts")
    owner: Optional[User] = Relationship(back_populates="prompts")
    tag_links: List[PromptTagLink] = Relationship(back_populates="prompt")
    versions: List["PromptVersion"] = Relationship(back_populates="prompt")


class PromptVersion(SQLModel, table=True):
    __tablename__ = "prompt_versions"

    id: Optional[int] = Field(default=None, primary_key=True)
    prompt_id: int = Field(foreign_key="prompts.id")
    snapshot: str = Field(sa_column=Column(Text))
    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), default=datetime.utcnow)
    )

    prompt: Prompt = Relationship(back_populates="versions")
