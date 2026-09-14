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

def kociemba_solve(cube: str) -> list[str]:
    cube = cube.upper()
    validate_cube_string(cube)

    if cube == SOLVED_CUBE: return []

    try:
        solution = kociemba.solve(cube)
    except Exception as exc:
        raise ValueError(
            "invalid scramble"
        ) from exc

    return solution.split()



# this builds the facelet positions in 3d space
# Face order: U, R, F, D, L, B
# each sticker is represented as: ((x, y, z), (nx, ny, nz)) where (x, y, z) is the sticker position and (nx, ny, nz) is the sticker's outward-facing normal
def build_facelets():
    specs = []

    # U face: rows go back to front, columns left to right
    for z in [-1, 0, 1]:
        for x in [-1, 0, 1]:
            specs.append(((x, 1, z), (0, 1, 0)))

    # R face: rows top to bottom, columns front to back
    for y in [1, 0, -1]:
        for z in [1, 0, -1]:
            specs.append(((1, y, z), (1, 0, 0)))

    # F face: rows top to bottom, columns left to right
    for y in [1, 0, -1]:
        for x in [-1, 0, 1]:
            specs.append(((x, y, 1), (0, 0, 1)))

    # D face: rows front to back, columns left to right
    for z in [1, 0, -1]:
        for x in [-1, 0, 1]:
            specs.append(((x, -1, z), (0, -1, 0)))

    # L face: rows top to bottom, columns back to front
    for y in [1, 0, -1]:
        for z in [-1, 0, 1]:
            specs.append(((-1, y, z), (-1, 0, 0)))

    # B face: rows top to bottom, columns right to left
    for y in [1, 0, -1]:
        for x in [1, 0, -1]:
            specs.append(((x, y, -1), (0, 0, -1)))

    return specs

FACELETS = build_facelets()

# this function rotates a vector, v, by +90 degrees around the given axis in 3d linear space
def rotate_once(v, axis):
    
    x, y, z = v

    if axis == 0:  # x axis
        return (x, -z, y)

    if axis == 1:  # y axis
        return (z, y, -x)

    if axis == 2: # z axis
        return (-y, x, z)

    raise ValueError(f"Invalid axis: {axis}")


# this is a wrapper around rotate once that executes multple rotations
def rotate(v, axis, quarter_turns):
    
    # find the number of quarter turns mod(4)
    quarter_turns %= 4

    for i in range(quarter_turns):
        v = rotate_once(v, axis)
 
    return v


MOVE_DEFS = {
    # face: axis, layer, clockwise turn direction
    "R": (0, 1, -1),
    "L": (0, -1, 1),
    "U": (1, 1, -1),
    "D": (1, -1, 1),
    "F": (2, 1, -1),
    "B": (2, -1, 1),
}

def parse_move(move):
    
    if not move:
        raise ValueError("no move")

    face = move[0]
    suffix = move[1:]

    if face not in MOVE_DEFS:
        raise ValueError(f"Invalid move face: {face}")

    if suffix == "":
        amount = 1
    elif suffix == "2":
        amount = 2
    elif suffix == "'":
        amount = 3
    else:
        raise ValueError(f"Invalid move suffix in move {move!r}")

    return face, amount

# convert a 54 character cube string into a sticker dictionary.
def cube_string_to_stickers(cube):
    pass # to do

def apply_move(cube, move):
    """Apply one move to a Kociemba cube string.
    Example:
        cube = apply_move(cube, "R")"""
