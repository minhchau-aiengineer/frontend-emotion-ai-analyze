from pathlib import Path
from typing import Iterable
from urllib.parse import quote_plus

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # App settings
    APP_NAME: str = "Emotion Recognition API"
    DEBUG: bool = True
    
    # Path settings
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    MODEL_DIR: Path = BASE_DIR / "models"
    UPLOAD_DIR: Path = BASE_DIR / "app" / "static" / "uploads"
    RESULTS_DIR: Path = BASE_DIR / "app" / "static" / "results"
    
    # Model paths
    FACE_MODEL_PATH: Path = MODEL_DIR / "faces/face_emotion_model.keras"
    AUDIO_MODEL_PATH: Path = MODEL_DIR / "audio/best_model1_weights.h5"
    # FUSION_MODEL_PATH: Path = MODEL_DIR / "fusion_model.pth"
    
    # API settings
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_IMAGE_TYPES: list = ["image/jpeg", "image/png"]
    ALLOWED_AUDIO_TYPES: list = [
        "audio/wav",
        "audio/wave",
        "audio/x-wav",
        "audio/weba",
        "audio/webm",
        "audio/ogg",
        "audio/mpeg",
        "audio/mp3",
    ]
    ALLOWED_VIDEO_TYPES: list = [
        "video/mp4",
        "video/mpeg",
        "video/webm",
        "video/quicktime",
        "video/x-matroska",
    ]
    MAX_VIDEO_SIZE: int = 200 * 1024 * 1024  # 200MB to match frontend hint

    # Database (SQL Server)
    SQLSERVER_HOST: str = "localhost"
    SQLSERVER_PORT: int = 1433
    SQLSERVER_USER: str = "sa"
    SQLSERVER_PASSWORD: str = "123456"
    SQLSERVER_DB: str = "EmotionAI"
    SQLSERVER_ODBC_DRIVER: str = "ODBC Driver 18 for SQL Server"
    SQLSERVER_TRUST_CERT: bool = True
    SQLSERVER_ENCRYPT: bool = False

    class Config:
        env_file = ".env"

    def _resolve_driver(self) -> str:
        """Pick the first installed SQL Server ODBC driver from our preference list."""
        preferred: Iterable[str] = (
            self.SQLSERVER_ODBC_DRIVER,
            "ODBC Driver 18 for SQL Server",
            "ODBC Driver 17 for SQL Server",
            "ODBC Driver 13 for SQL Server",
            "ODBC Driver 11 for SQL Server",
            "SQL Server",
        )

        try:
            import pyodbc

            available = {driver.lower() for driver in pyodbc.drivers()}
        except Exception:
            available = set()

        for candidate in preferred:
            if candidate and (not available or candidate.lower() in available):
                return candidate

        raise RuntimeError(
            "No suitable SQL Server ODBC driver found. Install an ODBC driver for SQL "
            "Server or set SQLSERVER_ODBC_DRIVER in the environment."
        )

    def sqlserver_uri(self) -> str:
        driver = quote_plus(self._resolve_driver())
        trust = "yes" if self.SQLSERVER_TRUST_CERT else "no"
        encrypt = "yes" if self.SQLSERVER_ENCRYPT else "no"
        password = quote_plus(self.SQLSERVER_PASSWORD or "")
        params = f"driver={driver}&TrustServerCertificate={trust}&Encrypt={encrypt}"

        return (
            f"mssql+pyodbc://{self.SQLSERVER_USER}:{password}"
            f"@{self.SQLSERVER_HOST}:{self.SQLSERVER_PORT}/{self.SQLSERVER_DB}?{params}"
        )

settings = Settings()