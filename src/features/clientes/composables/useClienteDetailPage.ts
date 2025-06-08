import { writable, derived, get, type Readable } from 'svelte/store';
import { pagoService } from '../../pagos/api';
import { cuotaMantenimientoService, type CuotaMantenimientoDTO } from '../../cuotas-mantenimiento/api';
import { toasts } from '$lib/stores/toastStore';
import { createClienteStore } from './clienteComposables';

export interface ClienteDetailPageState {
	// Modal states
	showEditModal: boolean;
	showPagoModal: boolean;
	showMedidaModal: boolean;
	showDeleteModal: boolean;
	showCompletarPagoModal: boolean;
	
	// Payment states
	tieneDeudaPendiente: boolean;
	pagosPendientes: any[];
	historialPagos: any[];
	preselectedPago: any | null;
	
	// Maintenance fee states
	cuotasPendientes: CuotaMantenimientoDTO[];
	tieneCuotasPendientes: boolean;
	
	// UI states
	activeTab: string;
	componentKey: number;
}

export function useClienteDetailPage(clienteId: number) {
	// Initialize client store
	const clienteStore = createClienteStore(clienteId);
	
	// Page state
	const pageState = writable<ClienteDetailPageState>({
		showEditModal: false,
		showPagoModal: false,
		showMedidaModal: false,
		showDeleteModal: false,
		showCompletarPagoModal: false,
		tieneDeudaPendiente: false,
		pagosPendientes: [],
		historialPagos: [],
		preselectedPago: null,
		cuotasPendientes: [],
		tieneCuotasPendientes: false,
		activeTab: 'medidas',
		componentKey: 0
	});

	// Derived states
	const tabs = derived(
		[clienteStore.cliente, pageState],
		([$cliente, $pageState]) => {
			if (!$cliente) return [];
			
			return [
				{
					key: 'medidas',
					label: 'Medidas',
					leftIcon: 'dashboard',
					props: {
						clienteId,
						cliente: $cliente,
						onUpdate: reloadClienteData,
						key: $pageState.componentKey
					}
				},
				{
					key: 'pagos',
					label: 'Historial de Pagos',
					leftIcon: 'dashboard',
					props: {
						clienteId,
						cliente: $cliente,
						onUpdate: reloadClienteData,
						key: $pageState.componentKey
					}
				}
			];
		}
	);

	// Actions
	async function loadInitialData() {
		if (isNaN(clienteId)) {
			toasts.showToast('ID de cliente inválido', 'error');
			return false;
		}

		try {
			await clienteStore.cargarCliente();
			await Promise.all([
				checkDeudaPendiente(),
				loadPagosPendientes(),
				loadCuotasPendientes()
			]);
			return true;
		} catch (error) {
			console.error('Error loading initial data:', error);
			toasts.showToast('Error al cargar datos del cliente', 'error');
			return false;
		}
	}

	async function checkDeudaPendiente() {
		try {
			const pagos = await pagoService.getPagosByCliente(clienteId);
			
			pageState.update(state => ({
				...state,
				historialPagos: pagos,
				tieneDeudaPendiente: pagos.some(
					(pago) => pago.estado === 'Pendiente' && pago.inscripcion
				)
			}));
		} catch (error) {
			console.error('Error al verificar deuda:', error);
		}
	}	async function loadPagosPendientes() {
		try {
			// Get current state directly using get()
			const currentState = get(pageState);
			
			const pagos = currentState.historialPagos.length > 0 
				? currentState.historialPagos 
				: await pagoService.getPagosByCliente(clienteId);
			
			pageState.update(state => ({
				...state,
				historialPagos: pagos,
				pagosPendientes: pagos.filter(
					(p: any) => p.estado === 'Pendiente' && p.inscripcion
				)
			}));
		} catch (error) {
			console.error('Error al cargar pagos pendientes:', error);
		}
	}

	async function loadCuotasPendientes() {
		try {
			const cuotasResponse = await cuotaMantenimientoService.tieneCuotasPendientes(clienteId);
			
			let cuotasPendientes: CuotaMantenimientoDTO[] = [];
			if (cuotasResponse.tienePendientes) {
				cuotasPendientes = cuotasResponse.cuotas || 
					(await cuotaMantenimientoService.getCuotasByCliente(clienteId))
						.filter(cuota => cuota.estado === 'Pendiente');
			}

			pageState.update(state => ({
				...state,
				cuotasPendientes,
				tieneCuotasPendientes: cuotasResponse.tienePendientes
			}));
		} catch (error) {
			console.error('Error al cargar cuotas pendientes:', error);
			pageState.update(state => ({
				...state,
				cuotasPendientes: [],
				tieneCuotasPendientes: false
			}));
		}
	}

	async function reloadClienteData() {
		try {
			await clienteStore.cargarCliente();
			
			// Reset payment data for fresh load
			pageState.update(state => ({
				...state,
				historialPagos: [],
				componentKey: state.componentKey + 1
			}));
			
			await Promise.all([
				checkDeudaPendiente(),
				loadPagosPendientes(),
				loadCuotasPendientes()
			]);
		} catch (error) {
			console.error('Error al recargar datos:', error);
			toasts.showToast('Error al recargar datos del cliente', 'error');
		}
	}

	// Modal actions
	const modalActions = {
		openEditModal: () => pageState.update(s => ({ ...s, showEditModal: true })),
		closeEditModal: () => pageState.update(s => ({ ...s, showEditModal: false })),
		
		openPagoModal: () => pageState.update(s => ({ ...s, showPagoModal: true })),
		closePagoModal: () => pageState.update(s => ({ ...s, showPagoModal: false })),
		
		openMedidaModal: () => pageState.update(s => ({ ...s, showMedidaModal: true })),
		closeMedidaModal: () => pageState.update(s => ({ ...s, showMedidaModal: false })),
		
		openDeleteModal: () => pageState.update(s => ({ ...s, showDeleteModal: true })),
		closeDeleteModal: () => pageState.update(s => ({ ...s, showDeleteModal: false })),
		
		openCompletarPagoModal: () => {
			pageState.update(state => {
				let preselectedPago = null;
				if (state.pagosPendientes.length > 0) {
					const pagosOrdenados = [...state.pagosPendientes].sort(
						(a, b) => new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime()
					);
					preselectedPago = pagosOrdenados[0];
				}
				
				return {
					...state,
					showCompletarPagoModal: true,
					preselectedPago
				};
			});
		},
		closeCompletarPagoModal: () => pageState.update(s => ({ 
			...s, 
			showCompletarPagoModal: false,
			preselectedPago: null 
		}))
	};

	return {
		// Stores
		...clienteStore,
		pageState,
		tabs,
		
		// Actions
		loadInitialData,
		reloadClienteData,
		modalActions
	};
}
