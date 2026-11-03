import { languageNavigationTarget } from './navigation';

export class LanguagePicker extends HTMLElement {
	private trigger!: HTMLElement;
	private panel!: HTMLElement;
	private options: HTMLElement[] = [];
	private events?: AbortController;
	private observer?: ResizeObserver;
	private opened = false;
	private selected = 0;
	private active = 0;
	private navigating = false;
	private search = '';
	private lastTypedAt = 0;

	connectedCallback() {
		this.events?.abort();
		this.observer?.disconnect();
		this.events = new AbortController();
		const { signal } = this.events;
		this.trigger = this.querySelector<HTMLElement>('[role="combobox"]')!;
		this.panel = this.panel ?? this.querySelector<HTMLElement>('[role="listbox"]')!;
		this.options = Array.from(this.panel.querySelectorAll<HTMLElement>('[role="option"]'));
		this.selected = this.options.findIndex(option => option.dataset.locale === this.dataset.locale);
		this.active = this.selected;
		this.navigating = false;
		// Escape header backdrop filters and overflow without changing ARIA ownership.
		document.body.append(this.panel);
		this.close(false);

		this.trigger.addEventListener('click', () => {
			this.trigger.focus();
			if (this.opened) this.close(false);
			else this.open();
		}, { signal });
		this.trigger.addEventListener('keydown', event => this.onKeydown(event), { signal });
		this.trigger.addEventListener('blur', () => this.close(false), { signal });
		this.panel.addEventListener('pointerdown', event => {
			if ((event.target as Element).closest('[role="option"]')) event.preventDefault();
		}, { signal });
		this.panel.addEventListener('click', event => {
			const option = (event.target as Element).closest<HTMLElement>('[role="option"]');
			if (option) this.confirm(this.options.indexOf(option));
		}, { signal });
		document.addEventListener('pointerdown', event => {
			const target = event.target as Node;
			if (!this.contains(target) && !this.panel.contains(target)) this.close(false);
		}, { signal, capture: true });
		document.addEventListener('astro:before-swap', () => this.close(false), { signal });
		document.addEventListener('scroll', () => this.reposition(), { signal, capture: true, passive: true });
		window.addEventListener('resize', () => this.reposition(), { signal, passive: true });
		window.addEventListener('pageshow', () => {
			this.navigating = false;
			this.close(false);
		}, { signal });
		window.visualViewport?.addEventListener('resize', () => this.reposition(), { signal, passive: true });
		window.visualViewport?.addEventListener('scroll', () => this.reposition(), { signal, passive: true });
		this.observer = new ResizeObserver(() => this.reposition());
		this.observer.observe(this.trigger);
	}

	disconnectedCallback() {
		this.close(false);
		this.events?.abort();
		this.observer?.disconnect();
		this.panel?.remove();
	}

	private open() {
		if (this.opened || this.navigating) return;
		this.opened = true;
		this.panel.hidden = false;
		this.trigger.setAttribute('aria-expanded', 'true');
		this.reposition();
		this.activate(this.selected);
	}

	private close(restoreFocus: boolean) {
		this.opened = false;
		this.search = '';
		this.trigger?.setAttribute('aria-expanded', 'false');
		this.trigger?.removeAttribute('aria-activedescendant');
		if (this.panel) this.panel.hidden = true;
		for (const option of this.options) delete option.dataset.active;
		if (restoreFocus) this.trigger.focus({ preventScroll: true });
	}

	private activate(index: number) {
		this.active = Math.max(0, Math.min(this.options.length - 1, index));
		this.options.forEach((option, i) => { option.dataset.active = String(i === this.active); });
		const option = this.options[this.active];
		this.trigger.setAttribute('aria-activedescendant', option.id);
		option.scrollIntoView({ block: 'nearest', behavior: 'instant' });
	}

	private confirm(index: number) {
		if (!this.opened || this.navigating) return;
		const option = this.options[index];
		if (!option) return;
		this.close(true);
		if (index === this.selected) return;
		this.navigating = true;
		// Preserve the existing route-based locale selection and section anchor.
		const hash = window.location.hash ?? '';
		window.location.assign(languageNavigationTarget(option.dataset.locale ?? 'en', hash));
	}

	private onKeydown(event: KeyboardEvent) {
		const { key } = event;
		if (key === 'Tab') {
			this.close(false);
			return;
		}
		if (key === 'Escape') {
			if (this.opened) { event.preventDefault(); this.close(true); }
			return;
		}
		if (key === 'Enter' || key === ' ') {
			event.preventDefault();
			if (event.repeat) return;
			if (this.opened) this.confirm(this.active);
			else this.open();
			return;
		}
		if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(key)) {
			event.preventDefault();
			if (key === 'ArrowUp' && event.altKey) { this.close(true); return; }
			const wasOpen = this.opened;
			this.open();
			if (key === 'Home') this.activate(0);
			else if (key === 'End') this.activate(this.options.length - 1);
			else if (wasOpen && !event.altKey) this.activate(this.active + (key === 'ArrowDown' ? 1 : -1));
			return;
		}
		if (key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
			event.preventDefault();
			this.open();
			const now = performance.now();
			this.search = now - this.lastTypedAt > 700 ? key.toLowerCase() : this.search + key.toLowerCase();
			this.lastTypedAt = now;
			const query = [...this.search].every(char => char === this.search[0]) ? this.search[0] : this.search;
			for (let offset = 1; offset <= this.options.length; offset++) {
				const index = (this.active + offset) % this.options.length;
				if (this.options[index].textContent!.trim().toLowerCase().startsWith(query)) { this.activate(index); break; }
			}
		}
	}

	private reposition() {
		if (!this.opened) return;
		const rect = this.trigger.getBoundingClientRect();
		if (rect.width === 0 || rect.height === 0) { this.close(false); return; }
		const viewport = window.visualViewport;
		const leftEdge = (viewport?.offsetLeft ?? 0) + 12;
		const topEdge = (viewport?.offsetTop ?? 0) + 12;
		const rightEdge = leftEdge + (viewport?.width ?? innerWidth) - 24;
		const bottomEdge = topEdge + (viewport?.height ?? innerHeight) - 24;
		const gap = 8;
		this.panel.style.minWidth = `${Math.min(rect.width, rightEdge - leftEdge)}px`;
		this.panel.style.maxWidth = `${rightEdge - leftEdge}px`;
		const neededHeight = this.panel.scrollHeight;
		const below = Math.max(0, bottomEdge - rect.bottom - gap);
		const above = Math.max(0, rect.top - topEdge - gap);
		const upwards = below < neededHeight && above > below;
		this.panel.dataset.placement = upwards ? 'top' : 'bottom';
		this.panel.style.maxHeight = `${upwards ? above : below}px`;
		const panel = this.panel.getBoundingClientRect();
		this.panel.style.left = `${Math.max(leftEdge, Math.min(rect.right - panel.width, rightEdge - panel.width))}px`;
		this.panel.style.top = `${Math.max(topEdge, Math.min(upwards ? rect.top - gap - panel.height : rect.bottom + gap, bottomEdge - panel.height))}px`;
	}
}
