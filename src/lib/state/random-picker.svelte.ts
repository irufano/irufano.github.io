const STORAGE_KEY = 'tools:random-picker';

export const RANDOM_PICKER_EXAMPLE = `Alice
Bob
Charlie
Diana
Ethan`;

export type RandomPickerHistoryEntry = {
	value: string;
	at: number;
};

type PersistedState = {
	input: string;
	removeOnPick: boolean;
	noImmediateRepeat: boolean;
	history: RandomPickerHistoryEntry[];
	remaining: string[];
	poolSourceKey: string;
};

function loadPersisted(): PersistedState {
	const fallback: PersistedState = {
		input: RANDOM_PICKER_EXAMPLE,
		removeOnPick: false,
		noImmediateRepeat: true,
		history: [],
		remaining: [],
		poolSourceKey: ''
	};

	if (typeof localStorage === 'undefined') return fallback;

	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return fallback;
		const parsed = JSON.parse(raw);
		return {
			input: typeof parsed.input === 'string' ? parsed.input : fallback.input,
			removeOnPick:
				typeof parsed.removeOnPick === 'boolean' ? parsed.removeOnPick : fallback.removeOnPick,
			noImmediateRepeat:
				typeof parsed.noImmediateRepeat === 'boolean'
					? parsed.noImmediateRepeat
					: fallback.noImmediateRepeat,
			history: Array.isArray(parsed.history) ? parsed.history : fallback.history,
			remaining: Array.isArray(parsed.remaining) ? parsed.remaining : fallback.remaining,
			poolSourceKey: typeof parsed.poolSourceKey === 'string' ? parsed.poolSourceKey : fallback.poolSourceKey
		};
	} catch {
		return fallback;
	}
}

export const randomPickerState = $state(loadPersisted());

export function saveRandomPickerState() {
	if (typeof localStorage === 'undefined') return;

	const payload: PersistedState = {
		input: randomPickerState.input,
		removeOnPick: randomPickerState.removeOnPick,
		noImmediateRepeat: randomPickerState.noImmediateRepeat,
		history: randomPickerState.history.slice(0, 50),
		remaining: randomPickerState.remaining,
		poolSourceKey: randomPickerState.poolSourceKey
	};

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
	} catch {
		// storage unavailable or full - ignore
	}
}
