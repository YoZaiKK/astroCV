export const STATUSES = ['todo', 'doing', 'done'] as const;
export type Status = (typeof STATUSES)[number];

export interface Task {
	id: string;
	title: string;
	status: Status;
}

interface SavedBoard {
	version: 1;
	tasks: Task[];
}

interface MiniKanbanMessages {
	labels: Record<Status, string>;
	persistenceSaved: string;
	persistenceReadError: string;
	persistenceMemoryFallback: string;
	persistenceInvalidRestored: string;
	progressSummary: string;
	progressValueText: string;
	emptyColumn: string;
	added: string;
	moved: string;
	deleted: string;
	undoDone: string;
	resetDone: string;
	titleLengthValidation: string;
	maxTasksValidation: string;
	taskActions: string;
	moveToStatus: string;
	moveToPrevious: string;
	moveToNext: string;
	moveUp: string;
	moveDown: string;
	deleteTask: string;
}

const MAX_TASKS = 30;
const MAX_TITLE = 80;
const HISTORY_LIMIT = 20;
const DRAG_TYPE = 'application/x-mini-kanban-task';
const SAMPLE_TASKS: Task[] = [
	{ id: 'sample-layout', title: 'Sketch the page layout', status: 'todo' },
	{ id: 'sample-widget', title: 'Build a small interactive widget', status: 'doing' },
	{ id: 'sample-content', title: 'Write the introduction', status: 'done' },
];

const memoryBoards = new Map<string, SavedBoard>();

const DEFAULT_MESSAGES: MiniKanbanMessages = {
	labels: { todo: 'To do', doing: 'In progress', done: 'Done' },
	persistenceSaved: 'Changes are saved in this browser.',
	persistenceReadError: 'Saved data could not be read. You can still use the board.',
	persistenceMemoryFallback: 'Browser storage is unavailable. Changes will last for this session only.',
	persistenceInvalidRestored: 'Saved data was invalid. The sample board has been restored.',
	progressSummary: '{{done}} of {{total}} done',
	progressValueText: '{{done}} of {{total}} tasks completed',
	emptyColumn: 'No tasks here yet.',
	added: 'Added {{title}} to {{status}}.',
	moved: 'Moved {{title}} to {{status}}.',
	deleted: 'Deleted {{title}}. Use Undo to restore it.',
	undoDone: 'Last change undone.',
	resetDone: 'Sample board restored. Use Undo to recover the previous board.',
	titleLengthValidation: 'Enter a task between 1 and {{max}} characters.',
	maxTasksValidation: 'This demo supports up to {{max}} tasks. Delete a task before adding another.',
	taskActions: 'Actions for {{title}}',
	moveToStatus: 'Move {{title}} to {{status}}',
	moveToPrevious: 'Move {{title}} to the previous column',
	moveToNext: 'Move {{title}} to the next column',
	moveUp: 'Move {{title}} up',
	moveDown: 'Move {{title}} down',
	deleteTask: 'Delete {{title}}',
};

const copy = (tasks: Task[]): Task[] =>
	tasks.map(task => ({ ...task }));

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null;

const isStatus = (value: unknown): value is Status =>
	typeof value === 'string' && STATUSES.some(status => status === value);

const format = (
	template: string,
	values: Record<string, string | number>,
): string =>
	template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
		String(values[key] ?? `{{${key}}}`),
	);

const validateBoard = (value: unknown): value is SavedBoard => {
	if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.tasks)) {
		return false;
	}

	if (value.tasks.length > MAX_TASKS) return false;

	const ids = new Set<string>();
	return value.tasks.every((task: unknown) => {
		if (
			!isRecord(task) ||
			typeof task.id !== 'string' ||
			!task.id ||
			task.id.length > 100
		) {
			return false;
		}

		if (
			typeof task.title !== 'string' ||
			!task.title.trim() ||
			task.title.length > MAX_TITLE
		) {
			return false;
		}

		if (!isStatus(task.status) || ids.has(task.id)) return false;
		ids.add(task.id);
		return true;
	});
};

const mergeMessages = (value: unknown): MiniKanbanMessages => {
	if (!isRecord(value)) return { ...DEFAULT_MESSAGES };

	const readString = (
		key: keyof Omit<MiniKanbanMessages, 'labels'>,
	): string => {
		const candidate = value[key];
		return typeof candidate === 'string' ? candidate : DEFAULT_MESSAGES[key];
	};

	const labelsRaw = isRecord(value.labels) ? value.labels : {};
	const labels: Record<Status, string> = {
		todo: typeof labelsRaw.todo === 'string'
			? labelsRaw.todo
			: DEFAULT_MESSAGES.labels.todo,
		doing: typeof labelsRaw.doing === 'string'
			? labelsRaw.doing
			: DEFAULT_MESSAGES.labels.doing,
		done: typeof labelsRaw.done === 'string'
			? labelsRaw.done
			: DEFAULT_MESSAGES.labels.done,
	};

	return {
		labels,
		persistenceSaved: readString('persistenceSaved'),
		persistenceReadError: readString('persistenceReadError'),
		persistenceMemoryFallback: readString('persistenceMemoryFallback'),
		persistenceInvalidRestored: readString('persistenceInvalidRestored'),
		progressSummary: readString('progressSummary'),
		progressValueText: readString('progressValueText'),
		emptyColumn: readString('emptyColumn'),
		added: readString('added'),
		moved: readString('moved'),
		deleted: readString('deleted'),
		undoDone: readString('undoDone'),
		resetDone: readString('resetDone'),
		titleLengthValidation: readString('titleLengthValidation'),
		maxTasksValidation: readString('maxTasksValidation'),
		taskActions: readString('taskActions'),
		moveToStatus: readString('moveToStatus'),
		moveToPrevious: readString('moveToPrevious'),
		moveToNext: readString('moveToNext'),
		moveUp: readString('moveUp'),
		moveDown: readString('moveDown'),
		deleteTask: readString('deleteTask'),
	};
};

const decodeMessages = (payload: string | undefined): MiniKanbanMessages => {
	if (!payload) return { ...DEFAULT_MESSAGES };

	try {
		const decoded = decodeURIComponent(payload);
		const parsed: unknown = JSON.parse(decoded);
		return mergeMessages(parsed);
	} catch {
		return { ...DEFAULT_MESSAGES };
	}
};

/** Call from an Astro processed <script>, not from component frontmatter. */
export const defineMiniKanban = (): void => {
	if (typeof window === 'undefined' || customElements.get('mini-kanban')) return;

	class MiniKanban extends HTMLElement {
		private tasks: Task[] = [];
		private history: Task[][] = [];
		private listeners: AbortController | null = null;
		private draggedId: string | null = null;
		private storageKey = '';
		private text: MiniKanbanMessages = { ...DEFAULT_MESSAGES };

		connectedCallback(): void {
			if (this.listeners) return;

			queueMicrotask(() => {
				if (!this.isConnected || this.listeners) return;
				if (!this.querySelector('[data-task-template]')) return;

				this.listeners = new AbortController();
				const options = { signal: this.listeners.signal };
				this.storageKey = this.dataset.storageKey || 'portfolio:lab:mini-kanban:v1';
				this.text = decodeMessages(this.dataset.i18n);
				this.history = [];
				this.tasks = this.load();

				this.addEventListener('submit', this.onSubmit, options);
				this.addEventListener('click', this.onClick, options);
				this.addEventListener('input', this.onInput, options);
				this.addEventListener('dragstart', this.onDragStart, options);
				this.addEventListener('dragover', this.onDragOver, options);
				this.addEventListener('drop', this.onDrop, options);
				this.addEventListener('dragend', this.clearDrag, options);
				this.addEventListener('dragleave', this.onDragLeave, options);
				this.render();
			});
		}

		disconnectedCallback(): void {
			this.listeners?.abort();
			this.listeners = null;
			this.clearDrag();
		}

		private required<T extends Element>(selector: string): T {
			const element = this.querySelector<T>(selector);
			if (!element) throw new Error(`MiniKanban: missing ${selector}`);
			return element;
		}

		private announce(message: string): void {
			this.required<HTMLElement>('[data-feedback]').textContent = message;
		}

		private persistence(message: string): void {
			this.required<HTMLElement>('[data-persistence]').textContent = message;
		}

		private load(): Task[] {
			const memory = memoryBoards.get(this.storageKey);

			try {
				const raw = localStorage.getItem(this.storageKey);
				if (raw === null) {
					if (memory) return copy(memory.tasks);
					return copy(SAMPLE_TASKS);
				}

				const value: unknown = JSON.parse(raw);
				if (validateBoard(value)) {
					memoryBoards.set(this.storageKey, { version: 1, tasks: copy(value.tasks) });
					return copy(value.tasks);
				}

				this.announce(this.text.persistenceInvalidRestored);
			} catch {
				this.persistence(this.text.persistenceReadError);
				if (memory) return copy(memory.tasks);
			}

			return copy(SAMPLE_TASKS);
		}

		private save(): void {
			const value: SavedBoard = { version: 1, tasks: copy(this.tasks) };
			memoryBoards.set(this.storageKey, value);
			try {
				localStorage.setItem(this.storageKey, JSON.stringify(value));
				this.persistence(this.text.persistenceSaved);
			} catch {
				this.persistence(this.text.persistenceMemoryFallback);
			}
		}

		private commit(tasks: Task[], message: string): void {
			if (JSON.stringify(tasks) === JSON.stringify(this.tasks)) return;
			this.history.push(copy(this.tasks));
			if (this.history.length > HISTORY_LIMIT) this.history.shift();
			this.tasks = copy(tasks);
			this.save();
			this.render();
			this.announce(message);
		}

		private focusTask(id: string, action?: string): void {
			const card = Array
				.from(this.querySelectorAll<HTMLElement>('[data-task-id]'))
				.find(element => element.dataset.taskId === id);
			const button = action
				? card?.querySelector<HTMLButtonElement>(`[data-action="${action}"]`)
				: null;

			if (button && !button.disabled) button.focus();
			else if (card) card.focus();
			else this.required<HTMLInputElement>('[name="title"]').focus();
		}

		private statusLabel(status: Status): string {
			return this.text.labels[status];
		}

		private moveTask(id: string, status: Status, beforeId: string | null = null): void {
			const task = this.tasks.find(item => item.id === id);
			if (!task || beforeId === id) return;

			const next = this.tasks.filter(item => item.id !== id);
			const before = next.findIndex(item =>
				item.id === beforeId && item.status === status);
			next.splice(before < 0 ? next.length : before, 0, { ...task, status });

			this.commit(next, format(this.text.moved, {
				title: task.title,
				status: this.statusLabel(status),
			}));
		}

		private onInput = (event: Event): void => {
			if (
				event.target instanceof HTMLInputElement &&
				event.target.name === 'title'
			) {
				event.target.setCustomValidity('');
			}
		};

		private onSubmit = (event: Event): void => {
			if (
				!(event.target instanceof HTMLFormElement) ||
				!event.target.matches('[data-form]')
			) {
				return;
			}

			event.preventDefault();
			const input = this.required<HTMLInputElement>('[name="title"]');
			const title = input.value.trim().replace(/\s+/g, ' ');

			if (!title || title.length > MAX_TITLE) {
				input.setCustomValidity(format(this.text.titleLengthValidation, { max: MAX_TITLE }));
				input.reportValidity();
				return;
			}

			if (this.tasks.length >= MAX_TASKS) {
				this.announce(format(this.text.maxTasksValidation, { max: MAX_TASKS }));
				return;
			}

			const id = globalThis.crypto?.randomUUID?.()
				?? `task-${Date.now()}-${Math.random().toString(36).slice(2)}`;

			this.commit(
				[...this.tasks, { id, title, status: 'todo' }],
				format(this.text.added, { title, status: this.statusLabel('todo') }),
			);
			input.value = '';
			input.focus();
		};

		private onClick = (event: Event): void => {
			const button = event.target instanceof Element
				? event.target.closest<HTMLButtonElement>('button[data-action]')
				: null;
			if (!button || button.disabled || !this.contains(button)) return;

			const action = button.dataset.action;

			if (action === 'undo') {
				const previous = this.history.pop();
				if (!previous) return;
				this.tasks = previous;
				this.save();
				this.render();
				this.announce(this.text.undoDone);
				if (this.history.length === 0) {
					this.required<HTMLInputElement>('[name="title"]').focus();
				}
				return;
			}

			if (action === 'reset') {
				this.commit(copy(SAMPLE_TASKS), this.text.resetDone);
				return;
			}

			const id = button.closest<HTMLElement>('[data-task-id]')?.dataset.taskId;
			const task = this.tasks.find(item => item.id === id);
			if (!task) return;

			if (action === 'delete') {
				const next = this.tasks.filter(item => item.id !== task.id);
				this.commit(next, format(this.text.deleted, { title: task.title }));
				this.focusTask(next.find(item => item.status === task.status)?.id ?? '');
				return;
			}

			const statusIndex = STATUSES.indexOf(task.status);
			if (action === 'left' || action === 'right') {
				const status = STATUSES[statusIndex + (action === 'left' ? -1 : 1)];
				if (status) this.moveTask(task.id, status);
			} else if (action === 'up' || action === 'down') {
				const column = this.tasks.filter(item => item.status === task.status);
				const index = column.findIndex(item => item.id === task.id);
				const previous = column[index - 1];

				if (action === 'up' && previous) {
					this.moveTask(task.id, task.status, previous.id);
				}

				if (action === 'down' && index < column.length - 1) {
					this.moveTask(task.id, task.status, column[index + 2]?.id ?? null);
				}
			}

			this.focusTask(task.id, action);
		};

		private onDragStart = (event: DragEvent): void => {
			const card = event.target instanceof Element
				? event.target.closest<HTMLElement>('[data-task-id]')
				: null;
			if (!card?.dataset.taskId || !event.dataTransfer) return;

			this.draggedId = card.dataset.taskId;
			event.dataTransfer.setData(DRAG_TYPE, this.draggedId);
			event.dataTransfer.effectAllowed = 'move';
			card.dataset.dragging = 'true';
		};

		private onDragOver = (event: DragEvent): void => {
			const column = event.target instanceof Element
				? event.target.closest<HTMLElement>('[data-column]')
				: null;
			if (!this.draggedId || !column || !event.dataTransfer) return;

			event.preventDefault();
			event.dataTransfer.dropEffect = 'move';
			this.querySelectorAll<HTMLElement>('[data-column]').forEach(item => {
				item.toggleAttribute('data-drop-active', item === column);
			});
		};

		private onDragLeave = (event: DragEvent): void => {
			const column = event.target instanceof Element
				? event.target.closest<HTMLElement>('[data-column]')
				: null;
			if (
				column &&
				(
					!(event.relatedTarget instanceof Node) ||
					!column.contains(event.relatedTarget)
				)
			) {
				column.removeAttribute('data-drop-active');
			}
		};

		private onDrop = (event: DragEvent): void => {
			const column = event.target instanceof Element
				? event.target.closest<HTMLElement>('[data-column]')
				: null;
			const status = column?.dataset.column;
			const id = this.draggedId;

			if (
				!id ||
				!column ||
				!isStatus(status) ||
				event.dataTransfer?.getData(DRAG_TYPE) !== id
			) {
				return;
			}

			event.preventDefault();
			const cards = Array
				.from(column.querySelectorAll<HTMLElement>('[data-task-id]'))
				.filter(card => card.dataset.taskId !== id);
			const before = cards.find(card => {
				const bounds = card.getBoundingClientRect();
				return event.clientY < bounds.top + bounds.height / 2;
			});

			this.moveTask(id, status, before?.dataset.taskId ?? null);
			this.clearDrag();
			this.focusTask(id);
		};

		private clearDrag = (): void => {
			this.draggedId = null;
			this.querySelectorAll('[data-dragging]').forEach(item => {
				item.removeAttribute('data-dragging');
			});
			this.querySelectorAll('[data-drop-active]').forEach(item => {
				item.removeAttribute('data-drop-active');
			});
		};

		private render(): void {
			const template = this.required<HTMLTemplateElement>('[data-task-template]');

			for (const status of STATUSES) {
				const tasks = this.tasks.filter(task => task.status === status);
				const list = this.required<HTMLUListElement>(`[data-list="${status}"]`);
				const fragment = document.createDocumentFragment();

				tasks.forEach((task, index) => {
					const card = template.content.firstElementChild?.cloneNode(true) as HTMLLIElement;
					card.dataset.taskId = task.id;
					card.querySelector<HTMLElement>('[data-task-title]')!.textContent = task.title;
					card
						.querySelector('[role="group"]')
						?.setAttribute('aria-label', format(this.text.taskActions, { title: task.title }));

					const statusIndex = STATUSES.indexOf(status);
					const previousStatus = STATUSES[statusIndex - 1];
					const nextStatus = STATUSES[statusIndex + 1];
					const config: Record<string, { label: string; disabled: boolean }> = {
						left: {
							label: previousStatus
								? format(this.text.moveToStatus, { title: task.title, status: this.statusLabel(previousStatus) })
								: format(this.text.moveToPrevious, { title: task.title }),
							disabled: !previousStatus,
						},
						right: {
							label: nextStatus
								? format(this.text.moveToStatus, { title: task.title, status: this.statusLabel(nextStatus) })
								: format(this.text.moveToNext, { title: task.title }),
							disabled: !nextStatus,
						},
						up: {
							label: format(this.text.moveUp, { title: task.title }),
							disabled: index === 0,
						},
						down: {
							label: format(this.text.moveDown, { title: task.title }),
							disabled: index === tasks.length - 1,
						},
						delete: {
							label: format(this.text.deleteTask, { title: task.title }),
							disabled: false,
						},
					};

					card.querySelectorAll<HTMLButtonElement>('button[data-action]').forEach(button => {
						const setting = config[button.dataset.action ?? ''];
						if (!setting) return;
						button.disabled = setting.disabled;
						button.setAttribute('aria-label', setting.label);
						button.title = setting.label;
					});

					fragment.append(card);
				});

				if (tasks.length === 0) {
					const empty = document.createElement('li');
					empty.className = 'mk-empty';
					empty.textContent = this.text.emptyColumn;
					fragment.append(empty);
				}

				list.replaceChildren(fragment);
				this.required<HTMLElement>(`[data-count="${status}"]`).textContent = String(tasks.length);
			}

			const done = this.tasks.filter(task => task.status === 'done').length;
			const total = this.tasks.length;
			this.required<HTMLElement>('[data-progress-label]').textContent = format(
				this.text.progressSummary,
				{ done, total },
			);

			const progress = this.required<HTMLProgressElement>('[data-progress]');
			progress.max = Math.max(total, 1);
			progress.value = done;
			progress.setAttribute(
				'aria-valuetext',
				format(this.text.progressValueText, { done, total }),
			);

			this.required<HTMLButtonElement>('[data-action="undo"]').disabled =
				this.history.length === 0;
		}
	}

	customElements.define('mini-kanban', MiniKanban);
};
