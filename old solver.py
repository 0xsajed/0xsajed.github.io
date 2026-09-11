import numpy as np
from collections import Counter
import kociemba

'''
This file solves 3x3 rubiks cubes using the kociemba module.
This module contains Herbert Kociemba's algorithm which is a solver.
The solver represents the cube as a 54 character string with 6 facelets corresponding to each face as follows:
U: up, R: right, F: front, D: down, L: left, B: back
The solved cube is represented with "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB"
An unsolved cube is simply some permutation of this string.

'''

# constants:

SOLVED_CUBE = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB"
# used to validate the cube string
VALID_FACELETS = set("URFDLB")

# this function takes a string as input and check if its a valid cube string or not by throwing errors.
def validate_cube_string(cube: str) -> None:

    # check if the cube has the correct number of facelets (9 per face) * (6 faces) = 54
    if len(cube) != 54:
        raise ValueError(f"Cube string must have length 54, got {len(cube)}.")
    
    # check if the cube has any facelets not in {U, R, F, D, L, B}
    invalid = set(cube) - VALID_FACELETS
    if invalid:
        raise ValueError(f"Invalid facelet symbols: {invalid}. Use only U, R, F, D, L, B.")

    # make sure that each facelet appears exactly 9 times in the string.
    counts = Counter(cube)
    bad_counts = {face: counts[face] for face in VALID_FACELETS if counts[face] != 9}
    if bad_counts:
        raise ValueError(f"Each facelet symbol must appear exactly 9 times. Bad counts: {bad_counts}.")

# this function takes in a cube state as a string and returns a solution as a list of moves.
# this is essentially a wrapper for kociemba's solver.
def solve_cube(cube: str) -> list[str]:



    '''
    The cube's facelet string must be in this order: 
    UUUUUUUUU RRRRRRRRR FFFFFFFFF DDDDDDDDD LLLLLLLLL BBBBBBBBB

    each character says which colour is currently in the position represented by the string.
    '''

    #make sure all the characters in the string are uppercase
    cube = "".join(cube.split()).upper()
    validate_cube_string(cube)

    # return an empty list if the cube is already solved
    if cube == SOLVED_CUBE:
        return []

    # call the kociemba.solve function
    try:
        solution = kociemba.solve(cube)
    except Exception as exc:
        raise ValueError(
            "invalid scramble"
        ) from exc

    # return the solution as a list
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

# this function parses moves like "R", "R'", and "R2"
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
    # check if the string is the right size
    if len(cube) != 54:
        raise ValueError(f"Cube string must have length 54, got {len(cube)}.")

    # return the dictionary with the facelets as defined above.
    return {
        spec: cube[i]
        for i, spec in enumerate(FACELETS)
    }


def stickers_to_cube_string(stickers):
    """Convert a sticker dictionary back into a Kociemba cube string."""
    return "".join(stickers[spec] for spec in FACELETS)


def apply_move(cube, move):
    """Apply one move to a Kociemba cube string.
    Example:
        cube = apply_move(cube, "R")"""
    face, amount = parse_move(move)

    axis, layer, base_turn = MOVE_DEFS[face]
    quarter_turns = base_turn * amount

    stickers = cube_string_to_stickers(cube)
    new_stickers = {}

    for (position, normal), colour in stickers.items():
        if position[axis] == layer:
            new_position = rotate(position, axis, quarter_turns)
            new_normal = rotate(normal, axis, quarter_turns)
            new_stickers[(new_position, new_normal)] = colour
        else:
            new_stickers[(position, normal)] = colour

    return stickers_to_cube_string(new_stickers)

# allows for sequences of moves
def apply_algorithm(cube, algorithm):
    """apply a sequence of moves
    xample:
        cube = apply_algorithm(SOLVED_CUBE, "R U R' U'")
    """
    moves = algorithm.split()

    for move in moves:
        cube = apply_move(cube, move)

    return cube

# start from a solved cube and apply the scramble as an algorithm
def state_from_scramble(scramble):
    return apply_algorithm(SOLVED_CUBE, scramble)


def solve_from_scramble(scramble):
    """
    Convert a scramble into a cube state, then solve it using Kociemba.
    """
    import kociemba

    scrambled_state = state_from_scramble(scramble)
    return kociemba.solve(scrambled_state)


if __name__ == "__main__":
    cube = state_from_scramble("R U R U F L2 D' L2 B2 F R F D")
    print(cube)
    solution = solve_cube(cube)
    solution = " ".join(solution)
    print(solution)
    cube = apply_algorithm(cube, solution)
    print(cube)
