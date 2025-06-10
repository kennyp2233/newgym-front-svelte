import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration: number;
}

const createToastStore = () => {
    const { subscribe, update } = writable<Toast[]>([]);

    function showToast(message: string, type: ToastType, duration = 5000) {
        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const toast: Toast = { id, message, type, duration };
        update((all) => [toast, ...all].slice(0, 5));
        setTimeout(() => hideToast(id), duration);
    }

    function hideToast(id: string) {
        update((all) => all.filter((t) => t.id !== id));
    }

    return { subscribe, showToast, hideToast };
};

export const toasts = createToastStore();
