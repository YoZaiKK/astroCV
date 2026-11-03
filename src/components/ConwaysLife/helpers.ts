import { DEFAULT_PATTERN_ID, PATTERNS, type PatternId } from './patterns.ts';

export const GRID_SIZE = 20;
export type GridSize = 20 | 30;
export const STEP_INTERVAL_MS = 250;

export type Grid = boolean[][];

export function createEmptyGrid(size: GridSize = GRID_SIZE): Grid {
	return Array.from({ length: size }, () => Array<boolean>(size).fill(false));
}

export function createInitialGrid(size: GridSize = GRID_SIZE, patternId: PatternId = DEFAULT_PATTERN_ID): Grid {
	const grid = createEmptyGrid(size);
	const { rows } = PATTERNS.find(pattern => pattern.id === patternId)!;
	const top = Math.floor((size - rows.length) / 2);
	const left = Math.floor((size - Math.max(...rows.map(row => row.length))) / 2);
	rows.forEach((row, r) => [...row].forEach((cell, c) => { grid[top + r][left + c] = cell === 'O'; }));
	return grid;
}

export function resizeGrid(grid: Grid, size: GridSize): Grid {
	const resized = createEmptyGrid(size);
	const offset = (size - grid.length) / 2;
	grid.forEach((row, r) => row.forEach((alive, c) => {
		const targetRow = r + offset;
		const targetColumn = c + offset;
		if (targetRow >= 0 && targetRow < size && targetColumn >= 0 && targetColumn < size) {
			resized[targetRow][targetColumn] = alive;
		}
	}));
	return resized;
}

export function countNeighbors(grid: Grid, row: number, column: number): number {
	let neighbors = 0;
	for (let dr = -1; dr <= 1; dr++) {
		for (let dc = -1; dc <= 1; dc++) {
			if (dr === 0 && dc === 0) continue;
			// The board has fixed edges: cells outside it are dead.
			if (grid[row + dr]?.[column + dc]) neighbors++;
		}
	}
	return neighbors;
}

export function nextGeneration(grid: Grid): Grid {
	return grid.map((line, row) => line.map((alive, column) => {
		const neighbors = countNeighbors(grid, row, column);
		return neighbors === 3 || (alive && neighbors === 2);
	}));
}
