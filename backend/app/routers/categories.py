from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import selectinload
from sqlmodel import select

from ..deps import SessionDep, get_current_user
from ..models import Category, Prompt, Subcategory, User
from ..schemas import CategoryCreate, CategoryRead, SubcategoryCreate, SubcategoryRead

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=List[CategoryRead])
def list_categories(
    *, session: SessionDep, current_user: User = Depends(get_current_user)
) -> List[CategoryRead]:
    categories = session.exec(
        select(Category)
        .options(selectinload(Category.subcategories))
        .order_by(Category.name.asc())
    ).all()
    return categories


@router.post("", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
def create_category(
    *, session: SessionDep, payload: CategoryCreate, current_user: User = Depends(get_current_user)
) -> CategoryRead:
    existing = session.exec(select(Category).where(Category.name == payload.name)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A category with this name already exists.",
        )
    category = Category(name=payload.name)
    session.add(category)
    session.commit()
    session.refresh(category)
    return category


@router.put("/{category_id}", response_model=CategoryRead)
def update_category(
    *,
    category_id: int,
    payload: CategoryCreate,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> CategoryRead:
    category = session.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    duplicate = session.exec(
        select(Category).where(Category.name == payload.name, Category.id != category_id)
    ).first()
    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A category with this name already exists.",
        )

    category.name = payload.name
    session.add(category)
    session.commit()
    session.refresh(category)
    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    *, category_id: int, session: SessionDep, current_user: User = Depends(get_current_user)
) -> None:
    category = session.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    linked_prompt = session.exec(
        select(Prompt).where(Prompt.category_id == category_id).limit(1)
    ).first()
    if linked_prompt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a category that is used by prompts.",
        )

    session.delete(category)
    session.commit()


@router.get("/{category_id}/subcategories", response_model=List[SubcategoryRead])
def list_subcategories(
    *, category_id: int, session: SessionDep, current_user: User = Depends(get_current_user)
) -> List[SubcategoryRead]:
    return session.exec(
        select(Subcategory)
        .where(Subcategory.category_id == category_id)
        .order_by(Subcategory.name.asc())
    ).all()


@router.post(
    "/{category_id}/subcategories",
    response_model=SubcategoryRead,
    status_code=status.HTTP_201_CREATED,
)
def create_subcategory(
    *,
    category_id: int,
    payload: SubcategoryCreate,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> SubcategoryRead:
    if category_id != payload.category_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payload category does not match path parameter.",
        )

    existing = session.exec(
        select(Subcategory).where(
            Subcategory.category_id == category_id, Subcategory.name == payload.name
        )
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A subcategory with this name already exists.",
        )

    subcategory = Subcategory(name=payload.name, category_id=category_id)
    session.add(subcategory)
    session.commit()
    session.refresh(subcategory)
    return subcategory


@router.put("/subcategories/{subcategory_id}", response_model=SubcategoryRead)
def update_subcategory(
    *,
    subcategory_id: int,
    payload: SubcategoryCreate,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> SubcategoryRead:
    subcategory = session.get(Subcategory, subcategory_id)
    if not subcategory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subcategory not found",
        )

    duplicate = session.exec(
        select(Subcategory).where(
            Subcategory.category_id == payload.category_id,
            Subcategory.name == payload.name,
            Subcategory.id != subcategory_id,
        )
    ).first()
    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A subcategory with this name already exists.",
        )

    subcategory.name = payload.name
    subcategory.category_id = payload.category_id
    session.add(subcategory)
    session.commit()
    session.refresh(subcategory)
    return subcategory


@router.delete("/subcategories/{subcategory_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subcategory(
    *,
    subcategory_id: int,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> None:
    subcategory = session.get(Subcategory, subcategory_id)
    if not subcategory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subcategory not found",
        )

    linked_prompt = session.exec(
        select(Prompt).where(Prompt.subcategory_id == subcategory_id).limit(1)
    ).first()
    if linked_prompt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a subcategory that is used by prompts.",
        )

    session.delete(subcategory)
    session.commit()
