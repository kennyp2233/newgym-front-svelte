// types.ts - Client-related TypeScript interfaces
export type { Cliente, TipoOcupacion } from './api';

export interface ClienteModalConfig {
	edit: boolean;
	pago: boolean;
	medida: boolean;
	delete: boolean;
	completarPago: boolean;
}

export interface ModalActions {
	openEditModal: () => void;
	closeEditModal: () => void;
	openPagoModal: () => void;
	closePagoModal: () => void;
	openMedidaModal: () => void;
	closeMedidaModal: () => void;
	openDeleteModal: () => void;
	closeDeleteModal: () => void;
	openCompletarPagoModal: (pago?: any) => void;
	closeCompletarPagoModal: () => void;
}
