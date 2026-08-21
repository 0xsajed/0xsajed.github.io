const MASTERMORPHIX_CENTER_FACES = [
    "U", "R", "F", "D", "L", "B"
];


const OPPOSITE_CENTER_FACE = {
    U: "D",
    D: "U",
    R: "L",
    L: "R",
    F: "B",
    B: "F"
};


function createCenterOrientationState() {
    return {
        U: 0,
        R: 0,
        F: 0,
        D: 0,
        L: 0,
        B: 0
    };
}


function moduloFour(value) {
    return ((value % 4) + 4) % 4;
}


function parseCenterMove(move) {
    const match = move.match(/^([URFDLB])(2|')?$/);

    if (!match) {
        throw new Error(
            `Cannot track centre orientation for move: ${move}`
        );
    }

    const suffix = match[2] || "";

    return {
        face: match[1],
        quarterTurns:
            suffix === "'" ? -1 :
            suffix === "2" ? 2 :
            1
    };
}


function applyMoveToCenterOrientation(state, move) {
    const parsedMove = parseCenterMove(move);

    state[parsedMove.face] = moduloFour(
        state[parsedMove.face] + parsedMove.quarterTurns
    );
}


function isCenterOrientationSolved(state) {
    return MASTERMORPHIX_CENTER_FACES.every(
        face => moduloFour(state[face]) === 0
    );
}


function repeatMoves(moves, repetitions) {
    const result = [];

    for (let i = 0; i < repetitions; i++) {
        result.push(...moves);
    }

    return result;
}


/*
These are supercube algorithms. They restore all ordinary 3x3 pieces,
but change the orientation of the otherwise untracked face centres.

The half-turn algorithm rotates U by 180 degrees.
The quarter-pair algorithm rotates U anticlockwise and R clockwise.
*/
const CENTER_HALF_TURN_ALGORITHM = repeatMoves(
    ["R", "L", "U2", "R'", "L'", "U"],
    2
);


const CENTER_QUARTER_PAIR_ALGORITHM = repeatMoves(
    [
        "R2", "U", "R", "U", "R'", "U'",
        "R'", "U'", "R'", "U", "R'"
    ],
    3
);


function remapAlgorithm(algorithm, faceMap) {
    return algorithm.map(function (move) {
        const face = move[0];
        const suffix = move.slice(1);

        if (faceMap[face]) {
            return faceMap[face] + suffix;
        }

        throw new Error(
            `Unexpected face in centre algorithm: ${face}`
        );
    });
}


function areAdjacentCenterFaces(firstFace, secondFace) {
    return (
        firstFace !== secondFace &&
        OPPOSITE_CENTER_FACE[firstFace] !== secondFace
    );
}


function findAdjacentHelperFace(face) {
    return MASTERMORPHIX_CENTER_FACES.find(
        candidate => areAdjacentCenterFaces(face, candidate)
    );
}


function findCommonAdjacentFace(firstFace, secondFace) {
    return MASTERMORPHIX_CENTER_FACES.find(
        candidate => (
            areAdjacentCenterFaces(firstFace, candidate) &&
            areAdjacentCenterFaces(candidate, secondFace)
        )
    );
}


function centerHalfTurnAlgorithm(face) {
    const helperFace = findAdjacentHelperFace(face);

    return remapAlgorithm(
        CENTER_HALF_TURN_ALGORITHM,
        {
            U: face,
            R: helperFace,
            L: OPPOSITE_CENTER_FACE[helperFace]
        }
    );
}


/*
Return an algorithm with effect:

    negativeFace -= 1 quarter turn
    positiveFace += 1 quarter turn

If the faces are opposite, route the twist through an adjacent face.
*/
function centerQuarterPairAlgorithm(
    negativeFace,
    positiveFace
) {
    if (areAdjacentCenterFaces(
        negativeFace,
        positiveFace
    )) {
        return remapAlgorithm(
            CENTER_QUARTER_PAIR_ALGORITHM,
            {
                U: negativeFace,
                R: positiveFace
            }
        );
    }

    const helperFace = findCommonAdjacentFace(
        negativeFace,
        positiveFace
    );

    if (!helperFace) {
        throw new Error(
            "Could not route the Mastermorphix centre correction."
        );
    }

    return [
        ...remapAlgorithm(
            CENTER_QUARTER_PAIR_ALGORITHM,
            {
                U: negativeFace,
                R: helperFace
            }
        ),
        ...remapAlgorithm(
            CENTER_QUARTER_PAIR_ALGORITHM,
            {
                U: helperFace,
                R: positiveFace
            }
        )
    ];
}


function simulateCenterMoves(state, moves) {
    const result = { ...state };

    moves.forEach(function (move) {
        applyMoveToCenterOrientation(result, move);
    });

    return result;
}


function buildMastermorphixCenterSolution(state) {
    const requiredTurns = {};

    MASTERMORPHIX_CENTER_FACES.forEach(function (face) {
        requiredTurns[face] = moduloFour(-state[face]);
    });

    const correction = [];

    // A centre requiring two quarter turns can be fixed alone.
    MASTERMORPHIX_CENTER_FACES.forEach(function (face) {
        if (requiredTurns[face] === 2) {
            correction.push(...centerHalfTurnAlgorithm(face));
        }
    });

    const oddFaces = MASTERMORPHIX_CENTER_FACES.filter(
        face => requiredTurns[face] % 2 === 1
    );

    if (oddFaces.length % 2 !== 0) {
        throw new Error(
            "The tracked Mastermorphix centre state is not reachable."
        );
    }

    for (let i = 0; i < oddFaces.length; i += 2) {
        const firstFace = oddFaces[i];
        const secondFace = oddFaces[i + 1];
        const firstTurns = requiredTurns[firstFace];
        const secondTurns = requiredTurns[secondFace];

        if (firstTurns === 3 && secondTurns === 1) {
            correction.push(
                ...centerQuarterPairAlgorithm(
                    firstFace,
                    secondFace
                )
            );
        } else if (
            firstTurns === 1 &&
            secondTurns === 3
        ) {
            correction.push(
                ...centerQuarterPairAlgorithm(
                    secondFace,
                    firstFace
                )
            );
        } else if (
            firstTurns === 1 &&
            secondTurns === 1
        ) {
            correction.push(
                ...centerQuarterPairAlgorithm(
                    secondFace,
                    firstFace
                ),
                ...centerHalfTurnAlgorithm(secondFace)
            );
        } else {
            // Both centres require an anticlockwise quarter turn.
            correction.push(
                ...centerQuarterPairAlgorithm(
                    firstFace,
                    secondFace
                ),
                ...centerHalfTurnAlgorithm(secondFace)
            );
        }
    }

    const finalState = simulateCenterMoves(
        state,
        correction
    );

    if (!isCenterOrientationSolved(finalState)) {
        throw new Error(
            "Could not construct a complete Mastermorphix centre solution."
        );
    }

    return correction;
}


if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        MASTERMORPHIX_CENTER_FACES,
        createCenterOrientationState,
        applyMoveToCenterOrientation,
        isCenterOrientationSolved,
        buildMastermorphixCenterSolution,
        simulateCenterMoves
    };
}
