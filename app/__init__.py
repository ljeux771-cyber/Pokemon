import os

from dotenv import load_dotenv
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager

from .config import Config

db = SQLAlchemy()
login_manager = LoginManager()


def create_app() -> Flask:
    """Application factory."""
    load_dotenv()

    app = Flask(__name__, template_folder="templates", static_folder="static")
    app.config.from_object(Config)

    # Init extensions
    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = "auth.login"

    from .models import User  # noqa: F401
    from .pokemon_data import load_pokemon_data
    from .auth_routes import auth_bp
    from .game_routes import game_bp

    # Enregistrer les blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(game_bp)

    # Charger les données Pokémon en mémoire au démarrage
    with app.app_context():
        db.create_all()
        app.pokemon_list = load_pokemon_data(app.config["POKE_CSV_PATH"])

    return app


@login_manager.user_loader
def load_user(user_id: str):
    from .models import User

    return User.query.get(int(user_id))

