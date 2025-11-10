from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import init_db
from .routers import auth, categories, import_export, prompts, tags


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allow_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth.router, prefix=settings.api_prefix)
    app.include_router(prompts.router, prefix=settings.api_prefix)
    app.include_router(categories.router, prefix=settings.api_prefix)
    app.include_router(tags.router, prefix=settings.api_prefix)
    app.include_router(import_export.router, prefix=settings.api_prefix)

    @app.on_event("startup")
    def _startup() -> None:  # pragma: no cover - FastAPI event
        init_db()

    @app.get("/")
    async def root() -> dict[str, str]:
        return {"message": "CROSTAR Prompt Manager API"}

    return app


app = create_app()
