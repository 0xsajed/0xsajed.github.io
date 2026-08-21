console.log("Initialising cube solver...");

Cube.initSolver();

const testCube = new Cube();
const scramble = "R U R' U'";

testCube.move(scramble);

const solution = testCube.solve();

console.log("Scramble:", scramble);
console.log("Solution:", solution);

testCube.move(solution);

console.log("Solved:", testCube.isSolved());