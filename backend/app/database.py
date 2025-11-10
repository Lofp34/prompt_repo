from contextlib import contextmanager
from typing import Iterator

from sqlmodel import Session, SQLModel, create_engine

from .config import settings


engine = create_engine(
    settings.sqlite_db_url, echo=False, connect_args={"check_same_thread": False}
)


def init_db() -> None:
    import backend.app.models  # noqa: F401  # ensure models are imported

    SQLModel.metadata.create_all(engine)


@contextmanager
def get_session() -> Iterator[Session]:
    with Session(engine) as session:
        yield session
