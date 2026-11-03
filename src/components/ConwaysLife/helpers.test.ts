import assert from 'node:assert/strict';
import { test } from 'node:test';
import { countNeighbors, createEmptyGrid, createInitialGrid, GRID_SIZE, nextGeneration, resizeGrid } from './helpers.ts';
import { PATTERNS, randomPatternId } from './patterns.ts';

function pattern(cells: number[][]) {
	const grid = createEmptyGrid();
	for (const [row, column] of cells) grid[row][column] = true;
	return grid;
}

test('boards have 20 independent rows and 20 columns', () => {
	const grid = createEmptyGrid();
	assert.equal(grid.length, GRID_SIZE);
	assert(grid.every(row => row.length === GRID_SIZE && row.every(alive => !alive)));
	grid[0][0] = true;
	assert.equal(grid[1][0], false);
	const example = createInitialGrid();
	assert(example.some(row => row.some(Boolean)));
	assert.deepEqual(createInitialGrid(), example);
});

test('isolated cells die and dead boards remain empty', () => {
	assert.deepEqual(nextGeneration(pattern([[10, 10]])), createEmptyGrid());
	assert.deepEqual(nextGeneration(createEmptyGrid()), createEmptyGrid());
});

test('a block survives unchanged and the input is not mutated', () => {
	const block = pattern([[8, 8], [8, 9], [9, 8], [9, 9]]);
	const before = structuredClone(block);
	assert.deepEqual(nextGeneration(block), before);
	assert.deepEqual(block, before);
});

test('a blinker alternates with simultaneous births and deaths', () => {
	const horizontal = pattern([[10, 9], [10, 10], [10, 11]]);
	const vertical = pattern([[9, 10], [10, 10], [11, 10]]);
	assert.deepEqual(nextGeneration(horizontal), vertical);
	assert.deepEqual(nextGeneration(vertical), horizontal);
});

test('overcrowding kills a living cell', () => {
	const grid = pattern([[10, 10], [9, 10], [10, 9], [10, 11], [11, 10]]);
	assert.equal(nextGeneration(grid)[10][10], false);
});

test('edges do not wrap to the opposite side', () => {
	const grid = pattern([[0, 19], [19, 0], [19, 19]]);
	assert.equal(countNeighbors(grid, 0, 0), 0);
	assert.equal(nextGeneration(grid)[0][0], false);
	const corner = pattern([[0, 0], [0, 1], [1, 0]]);
	assert.equal(nextGeneration(corner)[1][1], true);
});

test('a glider moves one cell diagonally after four generations', () => {
	let grid = pattern([[5, 6], [6, 7], [7, 5], [7, 6], [7, 7]]);
	for (let step = 0; step < 4; step++) grid = nextGeneration(grid);
	assert.deepEqual(grid, pattern([[6, 7], [7, 8], [8, 6], [8, 7], [8, 8]]));
});

test('all six patterns fit both board sizes and stay centered', () => {
	const counts = [12, 5, 9, 6, 8, 48];
	for (const [index, preset] of PATTERNS.entries()) {
		for (const size of [20, 30] as const) {
			const grid = createInitialGrid(size, preset.id);
			assert.equal(grid.length, size);
			assert(grid.every(row => row.length === size));
			assert.equal(grid.flat().filter(Boolean).length, counts[index]);
			assert.deepEqual(resizeGrid(createInitialGrid(20, preset.id), 30), createInitialGrid(30, preset.id));
		}
	}
});

test('toad and beacon repeat after two generations, pulsar after three', () => {
	for (const [id, period] of [['toad', 2], ['beacon', 2], ['pulsar', 3]] as const) {
		for (const size of [20, 30] as const) {
			const original = createInitialGrid(size, id);
			let grid = nextGeneration(original);
			assert.notDeepEqual(grid, original);
			for (let step = 1; step < period; step++) grid = nextGeneration(grid);
			assert.deepEqual(grid, original);
		}
	}
});

test('lightweight spaceship moves two columns after four generations', () => {
	const original = createInitialGrid(30, 'lwss');
	let grid = original;
	for (let i = 0; i < 4; i++) grid = nextGeneration(grid);
	const shifted = original.map(row => row.map((_, column) => row[column + 2] ?? false));
	assert.deepEqual(grid, shifted);
});

test('resize preserves centered cells, crops edges and does not mutate the input', () => {
	const original = createInitialGrid();
	const before = structuredClone(original);
	const larger = resizeGrid(original, 30);
	assert.deepEqual(resizeGrid(larger, 20), original);
	assert.deepEqual(original, before);
	larger[0][0] = true;
	larger[29][29] = true;
	assert.deepEqual(resizeGrid(larger, 20), original);
	assert.equal(larger[0][0], true);
});

test('random selection reaches every other preset and avoids immediate repetition', () => {
	for (const current of PATTERNS) {
		const selected = Array.from({ length: 5 }, (_, i) => randomPatternId(current.id, () => (i + 0.5) / 5));
		assert.equal(new Set(selected).size, 5);
		assert(!selected.includes(current.id));
	}
});
