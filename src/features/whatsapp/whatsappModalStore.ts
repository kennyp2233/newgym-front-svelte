// src/features/whatsapp/whatsappModalStore.ts
import { writable } from 'svelte/store';

interface WhatsAppModalState {
	showTestModal: boolean;
}

const initialState: WhatsAppModalState = {
	showTestModal: false
};

function createWhatsAppModalStore() {
	const { subscribe, update } = writable(initialState);

	return {
		subscribe,
		openTestModal: () => update(state => ({ ...state, showTestModal: true })),
		closeTestModal: () => update(state => ({ ...state, showTestModal: false }))
	};
}

export const whatsappModalStore = createWhatsAppModalStore();
