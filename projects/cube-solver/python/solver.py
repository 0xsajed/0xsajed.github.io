import numpy as np
from collections import Counter
import kociemba

# in the order: Up, Right, Front, Down, Left, Back
SOLVED_CUBE = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB"
# used to validate the cube string
VALID_FACELETS = set("URFDLB")

def validate_cube_string(cube: str) -> None:
    if len(cube) != 54:
        raise ValueError(f"cube string should have 54 characters, it has {len(cube)} instead.")

    if set(cube) - VALID_FACELETS != set():
        raise ValueError(f"cube string contains invalid facelets, found {set(cube) - VALID_FACELETS}.")

    counts = Counter(cube)
    bad_counts = {face: counts[face] for face in VALID_FACELETS if counts[face] != 9}
    if bad_counts:
        raise ValueError(f"Each facelet symbol must appear exactly 9 times. Bad counts: {bad_counts}.")

