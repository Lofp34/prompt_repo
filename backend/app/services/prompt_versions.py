from __future__ import annotations

import json
from datetime import datetime

from sqlmodel import Session

from ..models import Prompt, PromptVersion


SNAPSHOT_FIELDS = [
    "title",
    "description",
    "contexte",
    "role",
    "objectif",
    "style",
    "ton",
    "audience",
    "resultat",
    "modele_cible",
    "langue",
]


def create_prompt_version(session: Session, prompt: Prompt) -> None:
    snapshot_data = {
        field: getattr(prompt, field) for field in SNAPSHOT_FIELDS
    }
    snapshot_data.update(
        {
            "category_id": prompt.category_id,
            "subcategory_id": prompt.subcategory_id,
            "tags": [link.tag.name for link in prompt.tag_links],
            "created_at": prompt.created_at.isoformat() if prompt.created_at else None,
            "updated_at": prompt.updated_at.isoformat() if prompt.updated_at else None,
        }
    )
    version = PromptVersion(
        prompt_id=prompt.id,
        snapshot=json.dumps(snapshot_data, ensure_ascii=False),
        created_at=datetime.utcnow(),
    )
    session.add(version)
