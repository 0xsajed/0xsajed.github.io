let cubeViewer;
let cubeState;
let controlsLocked = false;

const SCRAMBLE_LENGTH = 20;
const MOVE_DURATION = 600;


function generateScramble(length = SCRAMBLE_LENGTH) {
    const faces = ["U", "R", "F", "D", "L", "B"];
    const suffixes = ["", "'", "2"];

    const moves = [];
    let previousFace = null;

    for (let i = 0; i < length; i++) {
        let face;

        // Prevent moves such as R R' appearing consecutively.
        do {
            face = faces[
                Math.floor(Math.random() * faces.length)
            ];
        } while (face === previousFace);

        const suffix = suffixes[
            Math.floor(Math.random() * suffixes.length)
        ];

        moves.push(face + suffix);
        previousFace = face;
    }

    return moves.join(" ");
}


async function start() {
    

    try {
        const cubeSelect =
            document.getElementById("cubeSelect");

        cubeViewer = await createCubeViewer(
            "cubeCanvas",
            cubeSelect.value
        );
                

        cubeState = new Cube();
        Cube.initSolver();

        console.log("Cube loaded and CubeJS initialised.");

        const movesInput =
            document.getElementById("moves");

        const executeButton =
            document.getElementById("executeButton");

        const scrambleButton =
            document.getElementById("scrambleButton");

        const solveButton =
            document.getElementById("solveButton");

        const solutionOutput =
            document.getElementById("solution");

        const resetButton =
            document.getElementById("resetButton");

        const actionButtons = [
            executeButton,
            scrambleButton,
            solveButton,
            resetButton
        ];


        function setControlsLocked(locked) {
            controlsLocked = locked;

            actionButtons.forEach(function (button) {
                button.disabled = locked;
            });

            movesInput.disabled = locked;
            cubeSelect.disabled = locked;
        }


        async function animateAndSync(sequence) {
            return animateSequence(
                cubeViewer,
                sequence,
                MOVE_DURATION,
                function (completedMove) {
                    cubeState.move(completedMove);
                }
            );
        }


        async function runLocked(action) {
            if (controlsLocked) {
                return;
            }

            setControlsLocked(true);

            try {
                await action();
            } catch (error) {
                console.error(error);
                solutionOutput.textContent = error.message;
            } finally {
                setControlsLocked(false);
            }
        }


        // Execute
        executeButton.addEventListener(
            "click",
            function () {
                runLocked(async function () {
                    const sequence = movesInput.value;

                    const moves =
                        await animateAndSync(sequence);

                    solutionOutput.textContent =
                        "Executed: " + moves.join(" ");

                    console.log(
                        "CubeJS solved:",
                        cubeState.isSolved()
                    );
                });
            }
        );


        cubeSelect.addEventListener(
            "change",
            function () {
                const requestedPath = cubeSelect.value;

                const requestedName =
                    cubeSelect.options[
                        cubeSelect.selectedIndex
                    ].text;

                const previousPath = cubeViewer.modelPath;

                runLocked(async function () {
                    solutionOutput.textContent =
                        `Loading ${requestedName}...`;

                    try {
                        await replaceCubeModel(
                            cubeViewer,
                            requestedPath
                        );
                    } catch (error) {
                        cubeSelect.value = previousPath;
                        throw error;
                    }

                    // Every newly loaded model begins solved.
                    cubeState = new Cube();

                    movesInput.value = "";
                    solutionOutput.textContent =
                        `${requestedName} loaded.`;
                });
            }
        );

        // Scramble
        scrambleButton.addEventListener(
            "click",
            function () {
                runLocked(async function () {
                    const scramble = generateScramble();

                    movesInput.value = scramble;
                    solutionOutput.textContent =
                        "Scrambling...";

                    const moves =
                        await animateAndSync(scramble);

                    solutionOutput.textContent =
                        "Scramble: " + moves.join(" ");

                    console.log(
                        "CubeJS solved after scramble:",
                        cubeState.isSolved()
                    );
                });
            }
        );


        // Solve
        solveButton.addEventListener(
            "click",
            function () {
                runLocked(async function () {
                    if (cubeState.isSolved()) {
                        solutionOutput.textContent =
                            "The cube is already solved.";
                        return;
                    }

                    const solution =
                        cubeState.solve().trim();

                    if (solution === "") {
                        throw new Error(
                            "CubeJS returned an empty solution."
                        );
                    }

                    movesInput.value = solution;
                    solutionOutput.textContent =
                        "Solving...";

                    const moves =
                        await animateAndSync(solution);

                    if (!cubeState.isSolved()) {
                        throw new Error(
                            "The solution finished, but CubeJS is not solved."
                        );
                    }

                    solutionOutput.textContent =
                        "Solution: " + moves.join(" ");

                    console.log(
                        "CubeJS solved:",
                        cubeState.isSolved()
                    );
                });
            }
        );


        // Reset
        resetButton.addEventListener(
            "click",
            function () {
                runLocked(async function () {
                    resetCubeViewer(cubeViewer);

                    // Discard the scrambled CubeJS state.
                    cubeState = new Cube();

                    movesInput.value = "";
                    solutionOutput.textContent = "Cube reset.";

                    console.log(
                        "CubeJS solved:",
                        cubeState.isSolved()
                    );
                });
            }
        );
    } catch (error) {
        console.error("Could not initialise cube:", error);
    }
}


start();