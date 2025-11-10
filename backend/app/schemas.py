from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    sub: Optional[str] = None


class UserBase(BaseModel):
    email: str


class UserCreate(UserBase):
    password: str = Field(min_length=8)


class UserRead(UserBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True


class CategoryBase(BaseModel):
    name: str


class CategoryCreate(CategoryBase):
    pass


class CategoryRead(CategoryBase):
    id: int
    subcategories: List["SubcategoryRead"] = Field(default_factory=list)

    class Config:
        orm_mode = True


class SubcategoryBase(BaseModel):
    name: str
    category_id: int


class SubcategoryCreate(SubcategoryBase):
    pass


class SubcategoryRead(BaseModel):
    id: int
    name: str
    category_id: int

    class Config:
        orm_mode = True


class TagBase(BaseModel):
    name: str


class TagCreate(TagBase):
    pass


class TagRead(TagBase):
    id: int

    class Config:
        orm_mode = True


class PromptMetadata(BaseModel):
    rubrique: Optional[str] = None
    sous_rubrique: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    modele_cible: Optional[str] = None
    langue: Optional[str] = None


class PromptBase(BaseModel):
    title: str
    description: Optional[str] = None
    contexte: Optional[str] = None
    role: Optional[str] = None
    objectif: Optional[str] = None
    style: Optional[str] = None
    ton: Optional[str] = None
    audience: Optional[str] = None
    resultat: Optional[str] = None
    category_id: Optional[int] = None
    subcategory_id: Optional[int] = None
    tags: List[str] = Field(default_factory=list)
    modele_cible: Optional[str] = None
    langue: Optional[str] = None


class PromptCreate(PromptBase):
    pass


class PromptUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    contexte: Optional[str] = None
    role: Optional[str] = None
    objectif: Optional[str] = None
    style: Optional[str] = None
    ton: Optional[str] = None
    audience: Optional[str] = None
    resultat: Optional[str] = None
    category_id: Optional[int] = None
    subcategory_id: Optional[int] = None
    tags: Optional[List[str]] = None
    modele_cible: Optional[str] = None
    langue: Optional[str] = None


class PromptSummary(BaseModel):
    id: int
    title: str
    description: Optional[str]
    modele_cible: Optional[str]
    langue: Optional[str]
    category: Optional[CategoryRead]
    subcategory: Optional[SubcategoryRead]
    tags: List[TagRead]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class PromptRead(PromptSummary):
    contexte: Optional[str]
    role: Optional[str]
    objectif: Optional[str]
    style: Optional[str]
    ton: Optional[str]
    audience: Optional[str]
    resultat: Optional[str]


class PromptVersionRead(BaseModel):
    id: int
    prompt_id: int
    snapshot: str
    created_at: datetime

    class Config:
        orm_mode = True


class ImportPrompt(BaseModel):
    title: str
    description: Optional[str] = None
    contexte: Optional[str] = None
    role: Optional[str] = None
    objectif: Optional[str] = None
    style: Optional[str] = None
    ton: Optional[str] = None
    audience: Optional[str] = None
    resultat: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    modele_cible: Optional[str] = None
    langue: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ImportPayload(BaseModel):
    prompts: List[ImportPrompt]
