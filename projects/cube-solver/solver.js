console.log("Initialising cube solver...");

Cube.initSolver();

let cube = new Cube();

const movesInput = document.getElementById("moves");
const solutionOutput = document.getElementById("solution");

const executeButton = document.getElementById("executeButton");
const scrambleButton = document.getElementById("scrambleButton");
const solveButton = document.getElementById("solveButton");
const resetButton = document.getElementById("resetButton");


function validateMoves(moves) {
    if (moves === "") {
        throw new Error("Enter at least one move.");
    }

    const tokens = moves.split(/\s+/);
    const validMove = /^[URFDLB](2|')?$/;

    for (const token of tokens) {
        if (!validMove.test(token)) {
            throw new Error("Invalid move: " + token);
        }
    }
}


function generateScramble(length = 20) {
    const faces = ["U", "R", "F", "D", "L", "B"];
    const suffixes = ["", "'", "2"];

    const scramble = [];
    let previousFace = "";

    while (scramble.length < length) {
        const face = faces[Math.floor(Math.random() * faces.length)];

        if (face === previousFace) {
            continue;
        }

        const suffix =
            suffixes[Math.floor(Math.random() * suffixes.length)];

        scramble.push(face + suffix);
        previousFace = face;
    }

    return scramble.join(" ");
}


executeButton.addEventListener("click", function () {
    try {
        const moves = movesInput.value.trim().toUpperCase();

        validateMoves(moves);
        cube.move(moves);

        solutionOutput.textContent = "Executed: " + moves;
        movesInput.value = "";
    } catch (error) {
        solutionOutput.textContent = error.message;
    }
});


scrambleButton.addEventListener("click", function () {
    const scramble = generateScramble();

    cube.move(scramble);
    movesInput.value = scramble;
    solutionOutput.textContent = "Scramble: " + scramble;
});


solveButton.addEventListener("click", function () {
    try {
        if (cube.isSolved()) {
            solutionOutput.textContent = "The cube is already solved.";
            return;
        }

        const solution = cube.solve();

        solutionOutput.textContent = "Solution: " + solution;

        // Update the internal cube state to solved.
        cube.move(solution);
    } catch (error) {
        solutionOutput.textContent =
            "The cube could not be solved: " + error.message;
    }
});


resetButton.addEventListener("click", function () {
    cube = new Cube();

    movesInput.value = "";
    solutionOutput.textContent = "Cube reset to solved state.";
});