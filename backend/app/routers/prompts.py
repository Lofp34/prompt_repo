from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import selectinload
from sqlmodel import select

from ..deps import SessionDep, get_current_user
from ..models import Prompt, PromptTagLink, Tag, User
from ..schemas import (
    PromptCreate,
    PromptRead,
    PromptSummary,
    PromptUpdate,
    PromptVersionRead,
)
from ..services.prompt_versions import create_prompt_version

router = APIRouter(prefix="/prompts", tags=["prompts"])


def _normalize_tag(name: str) -> str:
    return name.strip()


def _sync_prompt_tags(
    session: SessionDep, prompt: Prompt, tag_names: Optional[List[str]]
) -> None:
    if tag_names is None:
        return

    normalized = {_normalize_tag(name) for name in tag_names if _normalize_tag(name)}
    existing_links = {link.tag.name: link for link in prompt.tag_links}

    for tag_name, link in list(existing_links.items()):
        if tag_name not in normalized:
            session.delete(link)

    for name in normalized:
        if name in existing_links:
            continue
        tag = session.exec(select(Tag).where(Tag.name == name)).first()
        if not tag:
            tag = Tag(name=name)
            session.add(tag)
            session.flush()
        session.add(PromptTagLink(prompt_id=prompt.id, tag_id=tag.id))


def _with_common_loads(query):
    return query.options(
        selectinload(Prompt.category),
        selectinload(Prompt.subcategory),
        selectinload(Prompt.tag_links).selectinload(PromptTagLink.tag),
    )


@router.get("", response_model=List[PromptSummary])
def list_prompts(
    *,
    session: SessionDep,
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    subcategory_id: Optional[int] = None,
    tag: Optional[str] = Query(default=None, description="Filter by a single tag"),
    modele_cible: Optional[str] = None,
    langue: Optional[str] = None,
    sort: str = Query(
        "-updated_at", description="Sort field, prefix with - for descending order"
    ),
    current_user: User = Depends(get_current_user),
) -> List[PromptSummary]:
    query = _with_common_loads(
        select(Prompt).where(Prompt.owner_id == current_user.id)
    )

    if search:
        search_term = f"%{search.lower()}%"
        query = query.where(
            (Prompt.title.ilike(search_term))
            | (Prompt.description.ilike(search_term))
            | (Prompt.contexte.ilike(search_term))
            | (Prompt.objectif.ilike(search_term))
            | (Prompt.resultat.ilike(search_term))
        )

    if category_id:
        query = query.where(Prompt.category_id == category_id)
    if subcategory_id:
        query = query.where(Prompt.subcategory_id == subcategory_id)
    if modele_cible:
        query = query.where(Prompt.modele_cible == modele_cible)
    if langue:
        query = query.where(Prompt.langue == langue)
    if tag:
        query = query.join(Prompt.tag_links).join(PromptTagLink.tag).where(Tag.name == tag)

    sort_field = Prompt.updated_at
    descending = sort.startswith("-")
    key = sort.lstrip("-")
    if key == "title":
        sort_field = Prompt.title
    elif key == "created_at":
        sort_field = Prompt.created_at
    elif key == "rubrique":
        sort_field = Prompt.category_id

    query = query.order_by(sort_field.desc() if descending else sort_field.asc())

    return session.exec(query).unique().all()


@router.post("", response_model=PromptRead, status_code=status.HTTP_201_CREATED)
def create_prompt(
    *,
    session: SessionDep,
    payload: PromptCreate,
    current_user: User = Depends(get_current_user),
) -> PromptRead:
    prompt = Prompt(
        title=payload.title,
        description=payload.description,
        contexte=payload.contexte,
        role=payload.role,
        objectif=payload.objectif,
        style=payload.style,
        ton=payload.ton,
        audience=payload.audience,
        resultat=payload.resultat,
        category_id=payload.category_id,
        subcategory_id=payload.subcategory_id,
        modele_cible=payload.modele_cible,
        langue=payload.langue,
        owner_id=current_user.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    session.add(prompt)
    session.commit()
    session.refresh(prompt)
    _sync_prompt_tags(session, prompt, payload.tags)
    session.commit()
    session.refresh(prompt)
    create_prompt_version(session, prompt)
    session.commit()
    session.refresh(prompt)

    return session.exec(
        _with_common_loads(select(Prompt).where(Prompt.id == prompt.id))
    ).first()


@router.get("/{prompt_id}", response_model=PromptRead)
def get_prompt(
    *,
    prompt_id: int,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> PromptRead:
    prompt = session.exec(
        _with_common_loads(
            select(Prompt).where(
                Prompt.id == prompt_id, Prompt.owner_id == current_user.id
            )
        )
    ).first()
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Prompt not found"
        )
    return prompt


@router.put("/{prompt_id}", response_model=PromptRead)
def update_prompt(
    *,
    prompt_id: int,
    payload: PromptUpdate,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> PromptRead:
    prompt = session.get(Prompt, prompt_id)
    if not prompt or prompt.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Prompt not found"
        )

    for field, value in payload.dict(exclude_unset=True, exclude={"tags"}).items():
        setattr(prompt, field, value)
    prompt.updated_at = datetime.utcnow()
    session.add(prompt)
    session.commit()
    session.refresh(prompt)

    if payload.tags is not None:
        _sync_prompt_tags(session, prompt, payload.tags)
        session.commit()
        session.refresh(prompt)

    create_prompt_version(session, prompt)
    session.commit()

    return session.exec(
        _with_common_loads(select(Prompt).where(Prompt.id == prompt.id))
    ).first()


@router.delete("/{prompt_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_prompt(
    *,
    prompt_id: int,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> None:
    prompt = session.get(Prompt, prompt_id)
    if not prompt or prompt.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Prompt not found"
        )

    session.delete(prompt)
    session.commit()


@router.post(
    "/{prompt_id}/duplicate",
    response_model=PromptRead,
    status_code=status.HTTP_201_CREATED,
)
def duplicate_prompt(
    *,
    prompt_id: int,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> PromptRead:
    prompt = session.exec(
        _with_common_loads(
            select(Prompt).where(
                Prompt.id == prompt_id, Prompt.owner_id == current_user.id
            )
        )
    ).first()
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Prompt not found"
        )

    new_prompt = Prompt(
        title=f"{prompt.title} (copie)",
        description=prompt.description,
        contexte=prompt.contexte,
        role=prompt.role,
        objectif=prompt.objectif,
        style=prompt.style,
        ton=prompt.ton,
        audience=prompt.audience,
        resultat=prompt.resultat,
        category_id=prompt.category_id,
        subcategory_id=prompt.subcategory_id,
        modele_cible=prompt.modele_cible,
        langue=prompt.langue,
        owner_id=current_user.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    session.add(new_prompt)
    session.commit()
    session.refresh(new_prompt)

    tag_names = [link.tag.name for link in prompt.tag_links]
    _sync_prompt_tags(session, new_prompt, tag_names)
    session.commit()
    session.refresh(new_prompt)
    create_prompt_version(session, new_prompt)
    session.commit()

    return session.exec(
        _with_common_loads(select(Prompt).where(Prompt.id == new_prompt.id))
    ).first()


@router.get("/{prompt_id}/versions", response_model=List[PromptVersionRead])
def list_versions(
    *,
    prompt_id: int,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> List[PromptVersionRead]:
    prompt = session.exec(
        select(Prompt)
        .options(selectinload(Prompt.versions))
        .where(Prompt.id == prompt_id, Prompt.owner_id == current_user.id)
    ).first()
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Prompt not found"
        )
    return prompt.versions
