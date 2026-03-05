import os


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-me")

    # Base de données
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", "sqlite:///poke_quiz.db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Chemin du CSV Pokémon
    BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
    POKE_CSV_PATH = os.environ.get(
        "POKE_CSV_PATH", os.path.join(BASE_DIR, "data", "poke.csv")
    )

