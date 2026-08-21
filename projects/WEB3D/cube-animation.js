const MOVE_DEFINITIONS = {
    R: {
        layerAxis: "x",
        layer: 1,
        rotationAxis: "x",
        angle: -Math.PI / 2
    },

    L: {
        layerAxis: "x",
        layer: -1,
        rotationAxis: "x",
        angle: Math.PI / 2
    },

    U: {
        layerAxis: "z",
        layer: 1,
        rotationAxis: "y",
        angle: -Math.PI / 2
    },

    D: {
        layerAxis: "z",
        layer: -1,
        rotationAxis: "y",
        angle: Math.PI / 2
    },

    F: {
        layerAxis: "y",
        layer: -1,
        rotationAxis: "z",
        angle: -Math.PI / 2
    },

    B: {
        layerAxis: "y",
        layer: 1,
        rotationAxis: "z",
        angle: Math.PI / 2
    }
};


const AXIS_VECTORS = {
    x: new THREE.Vector3(1, 0, 0),
    y: new THREE.Vector3(0, 1, 0),
    z: new THREE.Vector3(0, 0, 1)
};


function parseMove(move) {
    const match = move.match(/^([URFDLB])(2|')?$/);

    if (!match) {
        throw new Error(`Invalid move: ${move}`);
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


/*
Cubie names use Blender's axes, while the exported model uses:

logical x -> Three.js x
logical y -> Three.js -z
logical z -> Three.js y
*/

function logicalToModel(position) {
    return new THREE.Vector3(
        position.x,
        position.z,
        -position.y
    );
}


function modelToLogical(position) {
    return {
        x: Math.round(position.x),
        y: Math.round(-position.z),
        z: Math.round(position.y)
    };
}


function updateGridPosition(
    position,
    definition,
    quarterTurns
) {
    const modelPosition = logicalToModel(position);

    const totalAngle =
        definition.angle * quarterTurns;

    modelPosition.applyAxisAngle(
        AXIS_VECTORS[definition.rotationAxis],
        totalAngle
    );

    return modelToLogical(modelPosition);
}


function easeInOutCubic(t) {
    if (t < 0.5) {
        return 4 * t * t * t;
    }

    return 1 - Math.pow(-2 * t + 2, 3) / 2;
}


function animateMove(viewer, move, duration = 600) {
    let parsedMove;

    try {
        parsedMove = parseMove(move);
    } catch (error) {
        return Promise.reject(error);
    }

    if (viewer.animationInProgress) {
        return Promise.reject(
            new Error("Wait for the current move to finish.")
        );
    }

    const definition =
        MOVE_DEFINITIONS[parsedMove.face];

    const totalAngle =
        definition.angle * parsedMove.quarterTurns;

    const selectedCubies = viewer.cubies.filter(
        function (cubie) {
            return (
                cubie.userData.gridPosition[
                    definition.layerAxis
                ] === definition.layer
            );
        }
    );

    if (selectedCubies.length !== 9) {
        return Promise.reject(
            new Error(
                `Expected 9 cubies, found ${selectedCubies.length}.`
            )
        );
    }

    const cubieParent = selectedCubies[0].parent;

    if (!selectedCubies.every(
        cubie => cubie.parent === cubieParent
    )) {
        return Promise.reject(
            new Error(
                "The selected cubies do not share one parent."
            )
        );
    }

    viewer.animationInProgress = true;

    const pivot = new THREE.Group();
    pivot.name = "movePivot";
    cubieParent.add(pivot);

    selectedCubies.forEach(function (cubie) {
        pivot.attach(cubie);
    });

    return new Promise(function (resolve) {
        let startTime;

        function frame(timestamp) {
            if (startTime === undefined) {
                startTime = timestamp;
            }

            const elapsed = timestamp - startTime;
            const progress = Math.min(
                elapsed / duration,
                1
            );

            const easedProgress =
                easeInOutCubic(progress);

            pivot.rotation[definition.rotationAxis] =
                totalAngle * easedProgress;

            if (progress < 1) {
                requestAnimationFrame(frame);
                return;
            }

            pivot.rotation[definition.rotationAxis] =
                totalAngle;

            pivot.updateMatrixWorld(true);

            selectedCubies.forEach(function (cubie) {
                cubieParent.attach(cubie);

                cubie.userData.gridPosition =
                    updateGridPosition(
                        cubie.userData.gridPosition,
                        definition,
                        parsedMove.quarterTurns
                    );
            });

            cubieParent.remove(pivot);
            viewer.animationInProgress = false;

            resolve();
        }

        requestAnimationFrame(frame);
    });
}

function parseSequence(sequence) {
    const trimmedSequence = sequence.trim().toUpperCase();

    if (trimmedSequence === "") {
        throw new Error("Enter at least one move.");
    }

    const moves = trimmedSequence.split(/\s+/);

    // Validate the whole sequence before animating anything.
    moves.forEach(parseMove);

    return moves;
}


async function animateSequence(
    viewer,
    sequence,
    duration = 600,
    onMoveComplete = null
) {
    const moves = parseSequence(sequence);

    for (const move of moves) {
        await animateMove(viewer, move, duration);

        if (onMoveComplete) {
            onMoveComplete(move);
        }
    }

    return moves;
}