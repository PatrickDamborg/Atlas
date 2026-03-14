from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ---------- Application ----------
    APP_ENV: str = "development"
    LOG_LEVEL: str = "INFO"

    # ---------- CORS ----------
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # ---------- Azure SQL Database ----------
    DATABASE_URL: str = ""

    # ---------- Azure Blob Storage ----------
    AZURE_STORAGE_CONNECTION_STRING: str = ""
    AZURE_STORAGE_CONTAINER_NAME: str = "uploads"

    # ---------- Azure Entra ID (MSAL) ----------
    AZURE_CLIENT_ID: str = ""
    AZURE_TENANT_ID: str = ""
    AZURE_API_SCOPE: str = ""

    # ---------- OpenAI / Azure OpenAI ----------
    OPENAI_API_KEY: str = ""
    AZURE_OPENAI_ENDPOINT: str = ""
    AZURE_OPENAI_KEY: str = ""

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"


settings = Settings()
