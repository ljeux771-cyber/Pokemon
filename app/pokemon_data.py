import csv
from dataclasses import dataclass
from typing import List


@dataclass
class Pokemon:
    number: int
    name: str


def load_pokemon_data(csv_path: str) -> List[Pokemon]:
    pokemon_list: List[Pokemon] = []
    try:
        with open(csv_path, newline="", encoding="utf-8") as f:
            reader = csv.reader(f)
            for row in reader:
                if not row or len(row) < 2:
                    continue
                try:
                    number = int(row[0])
                except ValueError:
                    # Ignore header or invalid lines
                    continue
                name = row[1].strip()
                if not name:
                    continue
                pokemon_list.append(Pokemon(number=number, name=name))
    except FileNotFoundError:
        # On démarre sans données, l’app pourra afficher un message d’erreur plus tard
        pokemon_list = []

    return pokemon_list

