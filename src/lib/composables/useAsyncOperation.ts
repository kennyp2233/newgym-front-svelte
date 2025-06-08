import { writable } from 'svelte/store';
import { toasts } from '$lib/stores/toastStore';

export interface AsyncOperationState<T = any> {
	data: T | null;
	isLoading: boolean;
	error: string | null;
	lastUpdated: Date | null;
}

export function createAsyncOperation<T = any>(initialData: T | null = null) {
	const { subscribe, set, update } = writable<AsyncOperationState<T>>({
		data: initialData,
		isLoading: false,
		error: null,
		lastUpdated: null
	});

	return {
		subscribe,
		
		async execute(
			operation: () => Promise<T>,
			options: {
				loadingMessage?: string;
				successMessage?: string;
				errorMessage?: string;
				showSuccessToast?: boolean;
				showErrorToast?: boolean;
			} = {}
		): Promise<T | null> {
			const {
				loadingMessage,
				successMessage,
				errorMessage = 'Error en la operación',
				showSuccessToast = false,
				showErrorToast = true
			} = options;

			update(state => ({ ...state, isLoading: true, error: null }));
			
			if (loadingMessage) {
				toasts.showToast(loadingMessage, 'info');
			}

			try {
				const result = await operation();
				
				set({
					data: result,
					isLoading: false,
					error: null,
					lastUpdated: new Date()
				});

				if (successMessage && showSuccessToast) {
					toasts.showToast(successMessage, 'success');
				}

				return result;
			} catch (error) {
				const errorMsg = error instanceof Error ? error.message : errorMessage;
				
				update(state => ({ 
					...state, 
					isLoading: false, 
					error: errorMsg 
				}));

				if (showErrorToast) {
					toasts.showToast(errorMsg, 'error');
				}

				console.error('Async operation failed:', error);
				return null;
			}
		},

		reset() {
			set({
				data: initialData,
				isLoading: false,
				error: null,
				lastUpdated: null
			});
		},

		setData(data: T) {
			update(state => ({
				...state,
				data,
				lastUpdated: new Date()
			}));
		}
	};
}

// Utility for parallel async operations
export async function executeParallel<T extends Record<string, () => Promise<any>>>(
	operations: T,
	options: {
		continueOnError?: boolean;
		showErrorToast?: boolean;
	} = {}
): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]>> | null }> {
	const { continueOnError = true, showErrorToast = true } = options;
	const results: any = {};

	if (continueOnError) {
		// Execute all operations, collect successes and failures
		const promises = Object.entries(operations).map(async ([key, operation]) => {
			try {
				results[key] = await operation();
			} catch (error) {
				results[key] = null;
				if (showErrorToast) {
					const errorMsg = error instanceof Error ? error.message : `Error en ${key}`;
					toasts.showToast(errorMsg, 'error');
				}
				console.error(`Operation ${key} failed:`, error);
			}
		});

		await Promise.all(promises);
	} else {
		// Execute all operations, fail if any fails
		const promises = Object.entries(operations).map(([key, operation]) =>
			operation().then(result => ({ key, result }))
		);

		try {
			const settled = await Promise.all(promises);
			settled.forEach(({ key, result }) => {
				results[key] = result;
			});
		} catch (error) {
			if (showErrorToast) {
				const errorMsg = error instanceof Error ? error.message : 'Error en operaciones paralelas';
				toasts.showToast(errorMsg, 'error');
			}
			throw error;
		}
	}

	return results;
}
