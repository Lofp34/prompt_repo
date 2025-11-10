from pydantic import BaseSettings, Field


class Settings(BaseSettings):
    app_name: str = "CROSTAR Prompt Manager"
    api_prefix: str = "/api"
    secret_key: str = Field(..., env="SECRET_KEY")
    access_token_expire_minutes: int = Field(60 * 24)
    sqlite_db_url: str = Field("sqlite:///./prompt_manager.db", env="DATABASE_URL")
    allow_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])  # default Vite dev server

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
