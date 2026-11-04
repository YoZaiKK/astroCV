import { createEmptyGrid, createInitialGrid, GRID_SIZE, nextGeneration, resizeGrid, STEP_INTERVAL_MS, type GridSize } from './helpers';
import { DEFAULT_PATTERN_ID, randomPatternId, type PatternId } from './patterns';

export class ConwaysLife extends HTMLElement {
	private grid = createInitialGrid();
	private generation = 0;
	private size: GridSize = GRID_SIZE;
	private patternId: PatternId = DEFAULT_PATTERN_ID;
	private patternLabel = '';
	private messages: Record<string, string> = {};
	private timer: ReturnType<typeof setInterval> | undefined;
	private events?: AbortController;
	private cells: HTMLButtonElement[] = [];

	connectedCallback() {
		this.messages = JSON.parse(this.dataset.i18n ?? '{}');
		this.patternLabel = this.message(this.patternId);
		this.events?.abort();
		this.events = new AbortController();
		const { signal } = this.events;
		this.rebuildBoard();
		this.querySelectorAll<HTMLButtonElement>('button').forEach(button => { button.disabled = false; });
		this.querySelector('[data-play]')?.addEventListener('click', () => {
			if (this.timer !== undefined) this.pause();
			else this.play();
		}, { signal });
		this.querySelector('[data-reset]')?.addEventListener('click', () => {
			this.patternLabel = this.message(this.patternId);
			this.replaceGrid(createInitialGrid(this.size, this.patternId), this.message('restored', { pattern: this.patternLabel }));
		}, { signal });
		this.querySelector('[data-clear]')?.addEventListener('click', () => {
			this.patternLabel = this.message('empty');
			this.replaceGrid(createEmptyGrid(this.size), this.message('cleared'));
		}, { signal });
		this.querySelector('[data-random]')?.addEventListener('click', () => {
			this.patternId = randomPatternId(this.patternId);
			this.patternLabel = this.message(this.patternId);
			this.replaceGrid(createInitialGrid(this.size, this.patternId), this.message('loaded', { pattern: this.patternLabel }));
		}, { signal });
		this.querySelector('[data-size]')?.addEventListener('click', () => {
			this.pause(false);
			this.size = this.size === 20 ? 30 : 20;
			this.grid = resizeGrid(this.grid, this.size);
			this.generation = 0;
			this.rebuildBoard();
			this.render();
			this.announce(this.message('resized', { size: this.size }));
		}, { signal });
		this.querySelector('.life-board')?.addEventListener('click', event => {
			const cell = (event.target as HTMLElement).closest<HTMLButtonElement>('.life-cell');
			if (!cell) return;
			this.pause(false);
			const row = Number(cell.dataset.row);
			const column = Number(cell.dataset.column);
			this.grid[row][column] = !this.grid[row][column];
			this.generation = 0;
			this.patternLabel = this.message('custom');
			this.setActiveCell(cell);
			this.render();
			this.announce(this.message('updated'));
		}, { signal });
		this.addEventListener('keydown', event => this.moveFocus(event), { signal });
		document.addEventListener('visibilitychange', () => {
			if (document.hidden && this.timer !== undefined) this.pause();
		}, { signal });
		this.render();
	}

	disconnectedCallback() {
		this.pause(false);
		this.events?.abort();
	}

	private message(key: string, values: Record<string, string | number> = {}) {
		return this.messages[key].replace(/\{\{(\w+)\}\}/g, (_, name: string) => String(values[name] ?? `{{${name}}}`));
	}

	private play() {
		if (!this.grid.some(line => line.some(Boolean))) {
			this.announce(this.message('emptyPlay'));
			return;
		}
		this.timer = setInterval(() => {
			const next = nextGeneration(this.grid);
			const stable = next.every((line, row) => line.every((alive, column) => alive === this.grid[row][column]));
			this.grid = next;
			this.generation++;
			this.render();
			if (stable) {
				this.pause(false);
				this.announce(this.message('stopped'));
			}
		}, STEP_INTERVAL_MS);
		this.updatePlayButton(true);
		this.announce(this.message('running'));
	}

	private pause(announce = true) {
		clearInterval(this.timer);
		this.timer = undefined;
		this.updatePlayButton(false);
		if (announce) this.announce(this.message('paused'));
	}

	private replaceGrid(grid: boolean[][], message: string) {
		this.pause(false);
		this.grid = grid;
		this.generation = 0;
		this.render();
		this.announce(message);
	}

	private render() {
		for (const cell of this.cells) {
			cell.setAttribute('aria-pressed', String(this.grid[Number(cell.dataset.row)][Number(cell.dataset.column)]));
		}
		const counter = this.querySelector('[data-generation]');
		if (counter) counter.textContent = String(this.generation);
		const pattern = this.querySelector('[data-pattern]');
		if (pattern) pattern.textContent = this.patternLabel;
		const sizeButton = this.querySelector('[data-size]');
		if (sizeButton) {
			sizeButton.textContent = `${this.size} × ${this.size}`;
			const nextSize = this.size === 20 ? 30 : 20;
			sizeButton.setAttribute('aria-label', this.message('sizeLabel', { size: nextSize }));
		}
	}

	private rebuildBoard() {
		const board = this.querySelector<HTMLElement>('.life-board');
		if (!board) return;
		board.style.setProperty('--life-size', String(this.size));
		board.setAttribute('aria-label', this.message('boardLabel', { size: this.size }));
		const fragment = document.createDocumentFragment();
		this.cells = [];
		for (let row = 0; row < this.size; row++) {
			for (let column = 0; column < this.size; column++) {
				const cell = document.createElement('button');
				cell.type = 'button';
				cell.className = 'life-cell';
				cell.dataset.row = String(row);
				cell.dataset.column = String(column);
				cell.setAttribute('aria-label', this.message('cellLabel', { row: row + 1, column: column + 1 }));
				cell.tabIndex = row === 0 && column === 0 ? 0 : -1;
				this.cells.push(cell);
				fragment.append(cell);
			}
		}
		board.replaceChildren(fragment);
	}

	private updatePlayButton(running: boolean) {
		const button = this.querySelector('[data-play]');
		button?.setAttribute('aria-pressed', String(running));
		button?.setAttribute('aria-label', this.message(running ? 'pauseLabel' : 'playLabel'));
		const label = this.querySelector('[data-play-label]');
		if (label) label.textContent = this.message(running ? 'pause' : 'play');
	}

	private announce(message: string) {
		const status = this.querySelector('[data-status]');
		if (status) status.textContent = message;
	}

	private setActiveCell(active: HTMLButtonElement) {
		for (const cell of this.cells) cell.tabIndex = cell === active ? 0 : -1;
	}

	private moveFocus(event: KeyboardEvent) {
		const cell = (event.target as HTMLElement).closest<HTMLButtonElement>('.life-cell');
		if (!cell) return;
		const directions: Record<string, [number, number]> = {
			ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1],
		};
		const offset = directions[event.key];
		if (!offset) return;
		event.preventDefault();
		const row = Math.max(0, Math.min(this.size - 1, Number(cell.dataset.row) + offset[0]));
		const column = Math.max(0, Math.min(this.size - 1, Number(cell.dataset.column) + offset[1]));
		const next = this.cells[row * this.size + column];
		this.setActiveCell(next);
		next.focus();
	}
}
