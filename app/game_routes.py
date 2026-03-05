import random
from typing import Optional, Tuple

from flask import (
    Blueprint,
    current_app,
    flash,
    redirect,
    render_template,
    request,
    session,
    url_for,
)
from flask_login import current_user, login_required

from . import db
from .models import Score
from .pokemon_data import Pokemon

game_bp = Blueprint("game", __name__)


def _get_or_create_score(mode: str) -> Score:
    score = Score.query.filter_by(user_id=current_user.id, mode=mode).first()
    if not score:
        score = Score(user_id=current_user.id, mode=mode, best_score=0)
        db.session.add(score)
        db.session.commit()
    return score


def _get_random_pokemon() -> Optional[Pokemon]:
    pokemon_list = getattr(current_app, "pokemon_list", [])
    if not pokemon_list:
        return None
    return random.choice(pokemon_list)


def _prepare_qcm_choices(correct: Pokemon) -> Tuple[Pokemon, list[Pokemon]]:
    pokemon_list = getattr(current_app, "pokemon_list", [])
    others = [p for p in pokemon_list if p.number != correct.number]
    wrong_choices = random.sample(others, k=3) if len(others) >= 3 else others
    choices = wrong_choices + [correct]
    random.shuffle(choices)
    return correct, choices


@game_bp.route("/")
@login_required
def home():
    free_score = _get_or_create_score("free")
    qcm_score = _get_or_create_score("qcm")
    return render_template(
        "home.html",
        free_best=free_score.best_score,
        qcm_best=qcm_score.best_score,
    )


@game_bp.route("/free", methods=["GET", "POST"])
@login_required
def mode_free():
    if not getattr(current_app, "pokemon_list", []):
        flash("Aucune donnée Pokémon disponible. Vérifiez le fichier CSV.", "error")
        return render_template("mode_free.html", question=None)

    current_number = session.get("free_current_number")
    feedback = None
    is_correct = None

    if request.method == "POST":
        user_answer = request.form.get("answer", "").strip()
        current_number = session.get("free_current_number")
        pokemon = next(
            (p for p in current_app.pokemon_list if p.number == current_number),
            None,
        )
        if pokemon is None:
            feedback = "Question invalide, nouvelle question générée."
            is_correct = False
        else:
            if user_answer.lower() == pokemon.name.lower():
                # Bonne réponse
                session["free_current_score"] = session.get("free_current_score", 0) + 1
                feedback = "Bonne réponse !"
                is_correct = True

                # Mettre à jour le meilleur score
                score = _get_or_create_score("free")
                if session["free_current_score"] > score.best_score:
                    score.best_score = session["free_current_score"]
                    db.session.commit()
            else:
                # Mauvaise réponse : reset de la série
                session["free_current_score"] = 0
                feedback = f"Mauvaise réponse, c’était {pokemon.name}."
                is_correct = False

    # Nouvelle question si pas de numéro ou après traitement
    pokemon = _get_random_pokemon()
    if pokemon:
        session["free_current_number"] = pokemon.number

    current_score = session.get("free_current_score", 0)
    best_score = _get_or_create_score("free").best_score

    return render_template(
        "mode_free.html",
        question=pokemon,
        feedback=feedback,
        is_correct=is_correct,
        current_score=current_score,
        best_score=best_score,
    )


@game_bp.route("/qcm", methods=["GET", "POST"])
@login_required
def mode_qcm():
    if not getattr(current_app, "pokemon_list", []):
        flash("Aucune donnée Pokémon disponible. Vérifiez le fichier CSV.", "error")
        return render_template("mode_qcm.html", question=None, choices=[])

    feedback = None
    is_correct = None

    if request.method == "POST":
        selected_name = request.form.get("choice", "").strip()
        current_number = session.get("qcm_current_number")
        pokemon = next(
            (p for p in current_app.pokemon_list if p.number == current_number),
            None,
        )
        if pokemon is None:
            feedback = "Question invalide, nouvelle question générée."
            is_correct = False
        else:
            if selected_name.lower() == pokemon.name.lower():
                session["qcm_current_score"] = session.get("qcm_current_score", 0) + 1
                feedback = "Bonne réponse !"
                is_correct = True
                score = _get_or_create_score("qcm")
                if session["qcm_current_score"] > score.best_score:
                    score.best_score = session["qcm_current_score"]
                    db.session.commit()
            else:
                session["qcm_current_score"] = 0
                feedback = f"Mauvaise réponse, c’était {pokemon.name}."
                is_correct = False

    # Générer une nouvelle question + 4 choix
    correct = _get_random_pokemon()
    if correct:
        session["qcm_current_number"] = correct.number
        correct, choices = _prepare_qcm_choices(correct)
    else:
        choices = []

    current_score = session.get("qcm_current_score", 0)
    best_score = _get_or_create_score("qcm").best_score

    return render_template(
        "mode_qcm.html",
        question=correct,
        choices=choices,
        feedback=feedback,
        is_correct=is_correct,
        current_score=current_score,
        best_score=best_score,
    )

