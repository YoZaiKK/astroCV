export const PATTERNS = [
	{
		id: 'classic-mix', name: 'Classic mix',
		rows: [
			'.O........', '..O.......', 'OOO.......', '..........', '..........',
			'..........', '..........', '........OO', 'OOO.....OO',
		],
	},
	{ id: 'glider', name: 'Glider', rows: ['.O.', '..O', 'OOO'] },
	{ id: 'lwss', name: 'Lightweight spaceship', rows: ['.O..O', 'O....', 'O...O', 'OOOO.'] },
	{ id: 'toad', name: 'Toad', rows: ['.OOO', 'OOO.'] },
	{ id: 'beacon', name: 'Beacon', rows: ['OO..', 'OO..', '..OO', '..OO'] },
	{
		id: 'pulsar', name: 'Pulsar',
		rows: [
			'..OOO...OOO..', '.............', 'O....O.O....O', 'O....O.O....O',
			'O....O.O....O', '..OOO...OOO..', '.............', '..OOO...OOO..',
			'O....O.O....O', 'O....O.O....O', 'O....O.O....O', '.............',
			'..OOO...OOO..',
		],
	},
] as const;

export type PatternId = typeof PATTERNS[number]['id'];
export const DEFAULT_PATTERN_ID: PatternId = 'classic-mix';

export function randomPatternId(current: PatternId, random = Math.random): PatternId {
	const choices = PATTERNS.filter(pattern => pattern.id !== current);
	return choices[Math.floor(random() * choices.length)].id;
}
