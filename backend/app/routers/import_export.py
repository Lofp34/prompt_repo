from __future__ import annotations

from datetime import datetime
from typing import Dict

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import selectinload
from sqlmodel import select

from ..deps import SessionDep, get_current_user
from ..models import Category, Prompt, PromptTagLink, Subcategory, Tag, User
from ..schemas import ImportPayload
from ..services.prompt_versions import create_prompt_version
from .prompts import _sync_prompt_tags

router = APIRouter(prefix="/library", tags=["library"])


def _serialize_prompt(prompt: Prompt) -> Dict:
    return {
        "title": prompt.title,
        "description": prompt.description,
        "contexte": prompt.contexte,
        "role": prompt.role,
        "objectif": prompt.objectif,
        "style": prompt.style,
        "ton": prompt.ton,
        "audience": prompt.audience,
        "resultat": prompt.resultat,
        "category": prompt.category.name if prompt.category else None,
        "subcategory": prompt.subcategory.name if prompt.subcategory else None,
        "tags": [link.tag.name for link in prompt.tag_links],
        "modele_cible": prompt.modele_cible,
        "langue": prompt.langue,
        "created_at": prompt.created_at.isoformat() if prompt.created_at else None,
        "updated_at": prompt.updated_at.isoformat() if prompt.updated_at else None,
    }


@router.get("/export")
def export_library(
    *, session: SessionDep, current_user: User = Depends(get_current_user)
) -> JSONResponse:
    prompts = session.exec(
        select(Prompt)
        .options(
            selectinload(Prompt.tag_links).selectinload(PromptTagLink.tag),
            selectinload(Prompt.category),
            selectinload(Prompt.subcategory),
        )
        .where(Prompt.owner_id == current_user.id)
    ).all()

    categories = session.exec(select(Category)).all()
    subcategories = session.exec(select(Subcategory)).all()
    tags = session.exec(select(Tag)).all()

    payload = {
        "exported_at": datetime.utcnow().isoformat(),
        "categories": [{"name": category.name} for category in categories],
        "subcategories": [
            {
                "name": subcat.name,
                "category": subcat.category.name if subcat.category else None,
            }
            for subcat in subcategories
        ],
        "tags": [tag.name for tag in tags],
        "prompts": [_serialize_prompt(prompt) for prompt in prompts],
    }
    return JSONResponse(content=payload)


def _get_or_create_category(
    session: SessionDep, *, category_name: str | None, subcategory_name: str | None
) -> tuple[int | None, int | None]:
    category_id = None
    subcategory_id = None
    if category_name:
        category = session.exec(select(Category).where(Category.name == category_name)).first()
        if not category:
            category = Category(name=category_name)
            session.add(category)
            session.commit()
            session.refresh(category)
        category_id = category.id
        if subcategory_name:
            subcategory = session.exec(
                select(Subcategory).where(
                    Subcategory.category_id == category.id,
                    Subcategory.name == subcategory_name,
                )
            ).first()
            if not subcategory:
                subcategory = Subcategory(name=subcategory_name, category_id=category.id)
                session.add(subcategory)
                session.commit()
                session.refresh(subcategory)
            subcategory_id = subcategory.id
    return category_id, subcategory_id


@router.post("/import")
def import_library(
    *,
    session: SessionDep,
    payload: ImportPayload,
    current_user: User = Depends(get_current_user),
) -> Dict[str, int]:
    created = 0
    skipped = 0

    for item in payload.prompts:
        existing = session.exec(
            select(Prompt).where(
                Prompt.title == item.title,
                Prompt.owner_id == current_user.id,
            )
        ).first()
        if existing:
            skipped += 1
            continue

        category_id, subcategory_id = _get_or_create_category(
            session,
            category_name=item.category,
            subcategory_name=item.subcategory,
        )
        prompt = Prompt(
            title=item.title,
            description=item.description,
            contexte=item.contexte,
            role=item.role,
            objectif=item.objectif,
            style=item.style,
            ton=item.ton,
            audience=item.audience,
            resultat=item.resultat,
            category_id=category_id,
            subcategory_id=subcategory_id,
            modele_cible=item.modele_cible,
            langue=item.langue,
            owner_id=current_user.id,
            created_at=item.created_at or datetime.utcnow(),
            updated_at=item.updated_at or datetime.utcnow(),
        )
        session.add(prompt)
        session.commit()
        session.refresh(prompt)
        _sync_prompt_tags(session, prompt, item.tags)
        session.commit()
        session.refresh(prompt)
        create_prompt_version(session, prompt)
        session.commit()
        created += 1

    return {"created": created, "skipped": skipped}
