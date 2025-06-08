// composables/renovacionComposables.ts
import { writable, derived, type Readable } from 'svelte/store';
import { planService, type Plan } from '../../planes/api';
import { cuotaMantenimientoService } from '../../cuotas-mantenimiento/api';
import type { Cliente } from '../../clientes/api';

export interface RenovacionState {
	planes: Plan[];
	planSeleccionado: Plan | null;
	cuotasPendientes: any[];
	loadingCuotas: boolean;
	precioTotal: number;
	montoMinimo: number;
}

export function createRenovacionManager(cliente: Cliente, planActualId?: number) {
	// Estados base
	const planes = writable<Plan[]>([]);
	const planSeleccionado = writable<Plan | null>(null);
	const cuotasPendientes = writable<any[]>([]);
	const loadingCuotas = writable(false);
	// Cálculos derivados - CORREGIDO según documentación
	// precioTotal = solo el precio del plan (para el input)
	const precioTotal = derived(
		[planSeleccionado],
		([$planSeleccionado]) => {
			return $planSeleccionado ? $planSeleccionado.precio : 0;
		}
	);

	// montoTotal = precio plan + cuotas pendientes (total real a pagar)
	const montoTotal = derived(
		[planSeleccionado, cuotasPendientes],
		([$planSeleccionado, $cuotasPendientes]) => {
			let total = 0;
			
			if ($planSeleccionado) {
				total += $planSeleccionado.precio;
			}
			
			if ($cuotasPendientes && $cuotasPendientes.length > 0) {
				const totalPendientes = $cuotasPendientes.reduce((sum, cuota) => sum + cuota.monto, 0);
				total += totalPendientes;
			}
			
			return total;
		}
	);

	const montoMinimo = derived(
		[cuotasPendientes],
		([$cuotasPendientes]) => {
			// Si hay cuotas pendientes, el mínimo es cubrirlas
			const cuotasPendientesTotal = getTotalCuotasPendientes($cuotasPendientes);
			return cuotasPendientesTotal > 0 ? cuotasPendientesTotal : 0.01;
		}
	);

	// Funciones utilitarias
	function getTotalCuotasPendientes(cuotas: any[]): number {
		if (!cuotas || cuotas.length === 0) return 0;
		return cuotas.reduce((sum, cuota) => sum + cuota.monto, 0);
	}

	// Acciones
	async function cargarDatos(): Promise<void> {
		try {
			// Cargar planes
			const planesData = await planService.getPlanes();
			planes.set(planesData);

			// Cargar cuotas pendientes
			await cargarCuotasPendientes();

			// Establecer plan inicial si se proporciona
			if (planActualId) {
				const plan = planesData.find((p) => p.idPlan === planActualId);
				if (plan) {
					planSeleccionado.set(plan);
				}
			}
		} catch (error) {
			console.error('Error al cargar datos de renovación:', error);
			throw error;
		}
	}

	async function cargarCuotasPendientes(): Promise<void> {
		try {
			loadingCuotas.set(true);
			const response = await cuotaMantenimientoService.tieneCuotasPendientes(cliente.idCliente);
			cuotasPendientes.set(response.cuotas || []);
		} catch (error) {
			console.error('Error al cargar cuotas pendientes:', error);
			cuotasPendientes.set([]);
			throw error;
		} finally {
			loadingCuotas.set(false);
		}
	}

	function seleccionarPlan(idPlan: string): void {
		planes.subscribe((planesData) => {
			const plan = planesData.find((p) => p.idPlan === parseInt(idPlan));
			planSeleccionado.set(plan || null);
		})();
	}

	function calcularAñoRenovacion(): number {
		if (!cliente.inscripciones || cliente.inscripciones.length === 0) {
			return new Date().getFullYear();
		}

		const primeraInscripcion = cliente.inscripciones.sort(
			(a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime()
		)[0];

		const fechaInicial = new Date(primeraInscripcion.fechaInicio);
		const añoActual = new Date().getFullYear();
		const añoInicial = fechaInicial.getFullYear();

		return añoInicial + (añoActual - añoInicial) + 1;
	}
	return {
		// Estados
		planes: { subscribe: planes.subscribe },
		planSeleccionado: { subscribe: planSeleccionado.subscribe },
		cuotasPendientes: { subscribe: cuotasPendientes.subscribe },
		loadingCuotas: { subscribe: loadingCuotas.subscribe },
		precioTotal, // Precio solo del plan
		montoTotal,  // Precio plan + cuotas (total real)
		montoMinimo,
		
		// Acciones
		cargarDatos,
		cargarCuotasPendientes,
		seleccionarPlan,
		calcularAñoRenovacion,
		
		// Utils
		getTotalCuotasPendientes: (cuotas: any[]) => getTotalCuotasPendientes(cuotas)
	};
}
