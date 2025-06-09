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
		openTestModal: () => {
			console.log('WhatsApp Modal Store: Opening test modal...');
			update(state => ({ ...state, showTestModal: true }));
		},
		closeTestModal: () => {
			console.log('WhatsApp Modal Store: Closing test modal...');
			update(state => ({ ...state, showTestModal: false }));
		}
	};
}

export const whatsappModalStore = createWhatsAppModalStore();
