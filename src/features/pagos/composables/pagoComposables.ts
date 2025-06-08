// src/features/clientes/components/individual/pagos/composables/pagoComposables.ts
import { writable, derived } from 'svelte/store';
import type { Writable, Readable } from 'svelte/store';
import { pagoService, type PagoDTO, type RenovacionPlanDTO } from '../api';
import { planService, type Plan } from '../../planes/api';
import type { Cliente } from '../../clientes/api';
import { calculateTotalPrice } from '../../clientes/forms/validation';
import { toasts } from '$lib/stores/toastStore';

/**
 * Composable para manejar la lógica de pagos de un cliente
 */
export function createPagoStore(clienteId: number) {
    // Estados internos
    const _pagos = writable<PagoDTO[]>([]);
    const _isLoading = writable(false);
    const _lastUpdated = writable<Date | null>(null);
    const _tieneDeudaActiva = writable(false);

    // Estados derivados
    const pagosPendientes: Readable<PagoDTO[]> = derived(_pagos, $pagos => 
        $pagos.filter(pago => pago.estado === 'Pendiente')
    );
    
    const pagosCompletados: Readable<PagoDTO[]> = derived(_pagos, $pagos => 
        $pagos.filter(pago => pago.estado === 'Completado')
    );
    
    const totalPagado: Readable<number> = derived(_pagos, $pagos => 
        $pagos.reduce((sum, pago) => sum + Number(pago.monto), 0)
    );
      const tieneDeudaPendiente: Readable<boolean> = derived(pagosPendientes, $pendientes => 
        $pendientes.length > 0
    );
    
    // Acciones
    async function cargarPagos(): Promise<void> {
        _isLoading.set(true);
        try {
            const pagos = await pagoService.getPagosByCliente(clienteId);
            const pagosOrdenados = pagos.sort(
                (a, b) => new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime()
            );
            _pagos.set(pagosOrdenados);
            _lastUpdated.set(new Date());
        } catch (error) {
            console.error('Error al cargar pagos:', error);
            toasts.showToast('Error al cargar el historial de pagos', 'error');
        } finally {
            _isLoading.set(false);
        }
    }

    async function verificarDeudaActiva(): Promise<void> {
        try {
            const tieneDeuda = await pagoService.clienteTieneDeudaPendiente(clienteId);
            _tieneDeudaActiva.set(tieneDeuda);
        } catch (error) {
            console.error('Error al verificar deuda activa:', error);
        }
    }

    async function actualizarPago(pagoId: number, datos: Partial<PagoDTO>): Promise<boolean> {
        try {
            const pagoActualizado = await pagoService.updatePago(pagoId, datos);
            if (pagoActualizado) {
                await cargarPagos(); // Recargar todos los pagos
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error al actualizar pago:', error);
            toasts.showToast('Error al actualizar pago', 'error');
            return false;
        }
    }

    async function eliminarPago(pagoId: number): Promise<boolean> {
        try {
            const exito = await pagoService.deletePago(pagoId);
            if (exito) {
                await cargarPagos(); // Recargar pagos
                toasts.showToast('Pago eliminado correctamente', 'success');
                return true;
            }
            return false;        } catch (error) {
            console.error('Error al eliminar pago:', error);
            toasts.showToast('Error al eliminar pago', 'error');
            return false;
        }
    }

    async function completarPago(pagoId: number, observaciones?: string): Promise<boolean> {
        try {
            // Obtener pago actual
            const pagos = await pagoService.getPagosByCliente(clienteId);
            const pago = pagos.find(p => p.idPago === pagoId);
            if (!pago || !pago.inscripcion?.plan) {
                throw new Error('Pago no encontrado o sin plan asociado');
            }

            // Calcular monto total
            const precioTotal = calculateTotalPrice(pago.inscripcion.plan.precio, pagos, false);
            const montoTotal = precioTotal;

            // Actualizar pago
            const actualizado = await actualizarPago(pagoId, {
                monto: montoTotal,
                estado: 'Completado',
                observaciones: observaciones ? 
                    `${pago.observaciones || ''}. ${observaciones}` : 
                    `${pago.observaciones || ''}. Pago completado - Monto anterior: ${pago.monto.toFixed(2)}, Monto final: ${montoTotal.toFixed(2)}`
            });

            if (actualizado) {
                toasts.showToast('Pago completado correctamente', 'success');
            }
            
            return actualizado;
        } catch (error) {
            console.error('Error al completar pago:', error);
            toasts.showToast('Error al completar pago', 'error');
            return false;
        }
    }

    async function crearPago(data: RenovacionPlanDTO): Promise<boolean> {
        try {
            _isLoading.set(true);
            const response = await pagoService.renovarPlan(data);

            // Mostrar mensaje de éxito según el estado del pago
            if (response.datos.pago.estado === 'Completado') {
                toasts.showToast('Pago registrado correctamente', 'success');
            } else {
                toasts.showToast('Pago parcial registrado', 'info');
            }

            // Recargar datos
            await cargarPagos();
            await verificarDeudaActiva();
            
            return true;
        } catch (error: any) {
            console.error('Error al crear pago:', error);
            const errorMessage = error.message || 'Error al procesar pago';
            toasts.showToast(errorMessage, 'error');
            return false;
        } finally {
            _isLoading.set(false);        }
    }

    return {
        // Estados readonly
        pagos: { subscribe: _pagos.subscribe },
        pagosPendientes,
        pagosCompletados,
        totalPagado,
        tieneDeudaPendiente,
        tieneDeudaActiva: { subscribe: _tieneDeudaActiva.subscribe },
        isLoading: { subscribe: _isLoading.subscribe },
        lastUpdated: { subscribe: _lastUpdated.subscribe },
        
        // Acciones
        cargarPagos,
        verificarDeudaActiva,
        actualizarPago,
        eliminarPago,
        completarPago,
        crearPago
    };
}

/**
 * Composable para manejar planes disponibles
 */
export function createPlanStore() {
    const _planes = writable<Plan[]>([]);
    const _isLoading = writable(false);

    async function cargarPlanes(): Promise<void> {
        _isLoading.set(true);
        try {
            const planes = await planService.getPlanes();
            _planes.set(planes);
        } catch (error) {
            console.error('Error al cargar planes:', error);
            toasts.showToast('Error al cargar planes', 'error');
        } finally {
            _isLoading.set(false);
        }
    }

    return {
        planes: { subscribe: _planes.subscribe },
        isLoading: { subscribe: _isLoading.subscribe },
        cargarPlanes
    };
}

/**
 * Utilidades para cálculos de pagos
 */
export const pagoUtils = {
    /**
     * Calcula el monto restante de un pago
     */
    calcularMontoRestante(pago: PagoDTO, historialPagos: PagoDTO[]): number {
        if (!pago.inscripcion?.plan) return 0;
        const precioTotal = calculateTotalPrice(pago.inscripcion.plan.precio, historialPagos, false);
        return Math.max(0, precioTotal - pago.monto);
    },

    /**
     * Determina si un pago es el más reciente
     */
    esUltimoPago(pago: PagoDTO, pagos: PagoDTO[]): boolean {
        if (pagos.length === 0) return false;
        const ultimoPago = pagos.reduce((latest, current) => {
            const latestDate = new Date(latest.fechaPago);
            const currentDate = new Date(current.fechaPago);
            return currentDate > latestDate ? current : latest;
        });
        return pago.idPago === ultimoPago.idPago;
    },

    /**
     * Formatea una fecha para mostrar
     */
    formatearFecha(fechaString: string): string {
        return new Date(fechaString).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    },

    /**
     * Formatea un monto para mostrar
     */
    formatearMonto(monto: number): string {
        return `$${Number(monto).toFixed(2)}`;
    },

    /**
     * Obtiene el color del estado de un pago
     */
    obtenerColorEstado(estado: string): string {
        switch (estado) {
            case 'Completado':
                return 'bg-green-100 text-green-800';
            case 'Pendiente':
                return 'bg-yellow-100 text-yellow-800';
            case 'Anulado':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    },    /**
     * Obtiene el color del método de pago
     */
    obtenerColorMetodoPago(metodo: string): string {
        switch (metodo) {
            case 'Efectivo':
                return 'bg-green-100 text-green-800';
            case 'Transferencia':
                return 'bg-blue-100 text-blue-800';
            case 'Tarjeta':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    },

    /**
     * Verifica si un pago es el último pago del cliente
     */
    isUltimoPago(pago: PagoDTO, pagos: PagoDTO[]): boolean {
        if (!pago.fechaPago) return false;
        
        // Buscar el pago más reciente
        const pagoMasReciente = pagos.reduce((ultimo, actual) => {
            if (!actual.fechaPago) return ultimo;
            if (!ultimo.fechaPago) return actual;
            
            return new Date(actual.fechaPago) > new Date(ultimo.fechaPago) ? actual : ultimo;
        });
        
        return pagoMasReciente.idPago === pago.idPago;
    }
};

/**
 * Hook para validación de renovaciones
 */
export function createRenovacionValidator(cliente: Cliente) {
    const _puedeRenovar = writable({ puede: true, mensaje: '', diasRestantes: 0 });
    const _isValidating = writable(false);    async function validarRenovacion(): Promise<void> {
        _isValidating.set(true);
        try {
            const resultado = await pagoService.puedeRenovarPlan(cliente.idCliente);
            _puedeRenovar.set({
                puede: resultado.puede,
                mensaje: resultado.mensaje,
                diasRestantes: resultado.diasRestantes || 0
            });
        } catch (error) {
            console.error('Error al validar renovación:', error);
            _puedeRenovar.set({ puede: false, mensaje: 'Error al validar renovación', diasRestantes: 0 });
        } finally {
            _isValidating.set(false);
        }
    }

    return {
        puedeRenovar: { subscribe: _puedeRenovar.subscribe },
        isValidating: { subscribe: _isValidating.subscribe },
        validarRenovacion
    };
}
