# Poké-Quiz (Flask)

Application web de quiz Pokémon (authentification + deux modes de jeu) en Python/Flask avec Tailwind CSS.

## Installation

1. Crée un environnement virtuel et installe les dépendances :

```bash
cd /Users/louloubl/Documents/Pokemon
python -m venv .venv
source .venv/bin/activate  # sur macOS / Linux
pip install -r requirements.txt
```

2. Ajoute le fichier CSV des Pokémon :

- Exporte ton Excel en CSV avec deux colonnes : `Numero,Nom` (sans ligne d’en-tête supplémentaire).
- Place le fichier en `data/poke.csv`.

Exemple de lignes :

```text
1,Bulbizarre
2,Herbizarre
3,Florizarre
...
```

3. Variables d’environnement (optionnel) :

Crée un fichier `.env` à la racine si tu veux surcharger la clé secrète ou le chemin du CSV :

```text
SECRET_KEY=change-me
DATABASE_URL=sqlite:///poke_quiz.db
POKE_CSV_PATH=data/poke.csv
```

## Lancer l’application

### Méthode simple (recommandée)

```bash
cd /Users/louloubl/Documents/Pokemon
source .venv/bin/activate  # si pas déjà fait
python run.py
```

Puis ouvre `http://127.0.0.1:5000` dans ton navigateur.

### Méthode avec la commande flask

```bash
flask --app app run --debug
```

## Structure du projet

- `app/`
  - `__init__.py` : création de l’application, config, DB, login, chargement des Pokémon.
  - `config.py` : configuration (Flask, DB, chemins).
  - `models.py` : modèles SQLAlchemy (`User`, `Score`).
  - `pokemon_data.py` : lecture / cache de la liste des Pokémon depuis le CSV.
  - `auth_routes.py` : routes d’inscription, connexion, déconnexion.
  - `game_routes.py` : routes des modes de jeu (saisie libre, QCM).
  - `templates/` : templates Jinja (HTML + Tailwind via CDN).
  - `static/` : JS/CSS custom léger si besoin.
- `data/`
  - `poke.csv` : données Pokémon.
- `requirements.txt`
- `README.md`

