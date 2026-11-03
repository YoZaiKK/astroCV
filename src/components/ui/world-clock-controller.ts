export class WorldClock extends HTMLElement {
	private timer: ReturnType<typeof setInterval> | undefined;
	private events?: AbortController;

	connectedCallback() {
		this.events?.abort();
		this.events = new AbortController();
		const { signal } = this.events;
		this.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
			button.disabled = false;
			button.addEventListener('click', () => this.setLocation(button), { signal });
		});
		this.updateClock();
		this.timer = setInterval(() => this.updateClock(), 1000);
	}

	disconnectedCallback() {
		clearInterval(this.timer);
		this.timer = undefined;
		this.events?.abort();
	}

	private setLocation(button: HTMLButtonElement) {
		const timezone = button.dataset.timezone;
		const location = button.dataset.location;
		if (!timezone || !location) return;

		this.dataset.timezone = timezone === 'local' ? this.localTimezone() : timezone;
		this.dataset.location = location;
		this.querySelectorAll<HTMLButtonElement>('button').forEach((option) => {
			option.setAttribute('aria-pressed', String(option === button));
		});
		this.updateClock();
	}

	private updateClock() {
		const timezone = this.dataset.timezone;
		const location = this.dataset.location;
		if (!timezone || !location) return;

		const hourHand = this.querySelector<HTMLElement>('.clock-hand-hour');
		const minuteHand = this.querySelector<HTMLElement>('.clock-hand-minute');
		const secondHand = this.querySelector<HTMLElement>('.clock-hand-second');
		const timeOutput = this.querySelector<HTMLOutputElement>('[data-time]');
		const locationOutput = this.querySelector<HTMLElement>('[data-location-output]');
		const analogClock = this.querySelector<HTMLElement>('.analog-clock');
		const templates = this.querySelector<HTMLElement>('.clock-templates');
		if (!hourHand || !minuteHand || !secondHand || !timeOutput || !locationOutput || !analogClock || !templates) return;

		const parts = new Intl.DateTimeFormat('en-US', {
			timeZone: timezone,
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hourCycle: 'h23',
		}).formatToParts(new Date());
		const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
		const hours = Number(values.hour);
		const minutes = Number(values.minute);
		const seconds = Number(values.second);

		hourHand.style.transform = `rotate(${(hours % 12) * 30 + minutes * 0.5}deg)`;
		minuteHand.style.transform = `rotate(${minutes * 6 + seconds * 0.1}deg)`;
		secondHand.style.transform = `rotate(${seconds * 6}deg)`;
		timeOutput.value = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
		timeOutput.textContent = timeOutput.value;
		locationOutput.textContent = location;
		analogClock.setAttribute(
			'aria-label',
			this.formatTemplate(templates.dataset.analogTemplate ?? '', location),
		);
	}

	private localTimezone() {
		return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
	}

	private formatTemplate(template: string, location: string) {
		return template.replace('{{location}}', location);
	}
}
