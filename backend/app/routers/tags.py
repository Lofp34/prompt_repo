from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select

from ..deps import SessionDep, get_current_user
from ..models import PromptTagLink, Tag, User
from ..schemas import TagCreate, TagRead

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("", response_model=List[TagRead])
def list_tags(
    *, session: SessionDep, current_user: User = Depends(get_current_user)
) -> List[TagRead]:
    return session.exec(select(Tag).order_by(Tag.name.asc())).all()


@router.post("", response_model=TagRead, status_code=status.HTTP_201_CREATED)
def create_tag(
    *, session: SessionDep, payload: TagCreate, current_user: User = Depends(get_current_user)
) -> TagRead:
    existing = session.exec(select(Tag).where(Tag.name == payload.name)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A tag with this name already exists.",
        )
    tag = Tag(name=payload.name)
    session.add(tag)
    session.commit()
    session.refresh(tag)
    return tag


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tag(
    *, tag_id: int, session: SessionDep, current_user: User = Depends(get_current_user)
) -> None:
    tag = session.get(Tag, tag_id)
    if not tag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")

    linked_prompt = session.exec(
        select(PromptTagLink).where(PromptTagLink.tag_id == tag_id).limit(1)
    ).first()
    if linked_prompt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a tag that is used by prompts.",
        )

    session.delete(tag)
    session.commit()
