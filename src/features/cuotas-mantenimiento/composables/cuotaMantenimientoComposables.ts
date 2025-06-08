// src/features/cuotas-mantenimiento/composables/cuotaMantenimientoComposables.ts
import { writable, derived } from 'svelte/store';
import type { Writable, Readable } from 'svelte/store';
import { cuotaMantenimientoService, type CuotaMantenimientoDTO, type CrearCuotaDTO } from '../api';
import { toasts } from '$lib/stores/toastStore';

/**
 * Composable para manejar la lógica de cuotas de mantenimiento de un cliente
 */
export function createCuotaMantenimientoStore(clienteId: number) {
    // Estados internos
    const _cuotas = writable<CuotaMantenimientoDTO[]>([]);
    const _isLoading = writable(false);
    const _lastUpdated = writable<Date | null>(null);
    const _tieneCuotasPendientes = writable(false);

    // Estados derivados
    const cuotasPendientes: Readable<CuotaMantenimientoDTO[]> = derived(_cuotas, $cuotas => 
        $cuotas.filter(cuota => cuota.estado === 'Pendiente')
    );
    
    const cuotasPagadas: Readable<CuotaMantenimientoDTO[]> = derived(_cuotas, $cuotas => 
        $cuotas.filter(cuota => cuota.estado === 'Pagada')
    );
    
    const totalPendiente: Readable<number> = derived(cuotasPendientes, $pendientes => 
        $pendientes.reduce((sum, cuota) => sum + Number(cuota.monto), 0)
    );
    
    const proximaCuotaPendiente: Readable<CuotaMantenimientoDTO | null> = derived(cuotasPendientes, $pendientes => {
        if ($pendientes.length === 0) return null;
        // Retornar la cuota más antigua (menor año)
        return $pendientes.sort((a, b) => a.anio - b.anio)[0];
    });

    const requiereAnualidad: Readable<boolean> = derived(_cuotas, $cuotas => {
        const añoActual = new Date().getFullYear();
        const tieneCuotaEsteAño = $cuotas.some(cuota => cuota.anio === añoActual);
        return !tieneCuotaEsteAño;
    });

    // Acciones
    async function cargarCuotas(): Promise<void> {
        _isLoading.set(true);
        try {
            const cuotas = await cuotaMantenimientoService.getCuotasByCliente(clienteId);
            const cuotasOrdenadas = cuotas.sort((a, b) => b.anio - a.anio); // Más recientes primero
            _cuotas.set(cuotasOrdenadas);
            _lastUpdated.set(new Date());
            
            // Actualizar estado de cuotas pendientes
            const tienePendientes = cuotas.some(cuota => cuota.estado === 'Pendiente');
            _tieneCuotasPendientes.set(tienePendientes);
        } catch (error) {
            console.error('Error al cargar cuotas de mantenimiento:', error);
            toasts.showToast('Error al cargar cuotas de mantenimiento', 'error');
        } finally {
            _isLoading.set(false);
        }
    }

    async function verificarCuotasPendientes(): Promise<void> {
        try {
            const resultado = await cuotaMantenimientoService.tieneCuotasPendientes(clienteId);
            _tieneCuotasPendientes.set(resultado.tienePendientes);
        } catch (error) {
            console.error('Error al verificar cuotas pendientes:', error);
        }
    }

    async function crearCuota(datos: CrearCuotaDTO): Promise<boolean> {
        try {
            _isLoading.set(true);
            const nuevaCuota = await cuotaMantenimientoService.crearCuota(datos);
            
            if (nuevaCuota) {
                await cargarCuotas(); // Recargar todas las cuotas
                toasts.showToast('Cuota de mantenimiento creada correctamente', 'success');
                return true;
            }
            return false;
        } catch (error: any) {
            console.error('Error al crear cuota:', error);
            const errorMessage = error.message || 'Error al crear cuota de mantenimiento';
            toasts.showToast(errorMessage, 'error');
            return false;
        } finally {
            _isLoading.set(false);
        }
    }

    async function marcarComoPagada(idCuota: number, idPago: number): Promise<boolean> {
        try {
            const cuotaActualizada = await cuotaMantenimientoService.marcarComoPagada(idCuota, idPago);
            
            if (cuotaActualizada) {
                await cargarCuotas(); // Recargar cuotas
                toasts.showToast('Cuota marcada como pagada', 'success');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error al marcar cuota como pagada:', error);
            toasts.showToast('Error al actualizar cuota', 'error');
            return false;
        }
    }

    async function actualizarCuota(idCuota: number, datos: Partial<CuotaMantenimientoDTO>): Promise<boolean> {
        try {
            const cuotaActualizada = await cuotaMantenimientoService.actualizarCuota(idCuota, datos);
            
            if (cuotaActualizada) {
                await cargarCuotas(); // Recargar todas las cuotas
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error al actualizar cuota:', error);
            toasts.showToast('Error al actualizar cuota', 'error');
            return false;
        }
    }

    async function eliminarCuota(idCuota: number): Promise<boolean> {
        try {
            const exito = await cuotaMantenimientoService.eliminarCuota(idCuota);
            
            if (exito) {
                await cargarCuotas(); // Recargar cuotas
                toasts.showToast('Cuota eliminada correctamente', 'success');
                return true;
            }
            return false;
        } catch (error: any) {
            console.error('Error al eliminar cuota:', error);
            const errorMessage = error.message || 'Error al eliminar cuota';
            toasts.showToast(errorMessage, 'error');
            return false;
        }
    }

    async function verificarYCrearCuotaAnual(): Promise<CuotaMantenimientoDTO | null> {
        try {
            const cuota = await cuotaMantenimientoService.verificarYCrearCuotaAnual(clienteId);
            
            if (cuota) {
                await cargarCuotas(); // Recargar cuotas
            }
            
            return cuota;
        } catch (error) {
            console.error('Error al verificar/crear cuota anual:', error);
            return null;
        }
    }

    // Retornar API del store
    return {
        // Estados reactivos
        cuotas: { subscribe: _cuotas.subscribe },
        cuotasPendientes,
        cuotasPagadas,
        totalPendiente,
        proximaCuotaPendiente,
        requiereAnualidad,
        isLoading: { subscribe: _isLoading.subscribe },
        lastUpdated: { subscribe: _lastUpdated.subscribe },
        tieneCuotasPendientes: { subscribe: _tieneCuotasPendientes.subscribe },
        
        // Acciones
        cargarCuotas,
        verificarCuotasPendientes,
        crearCuota,
        marcarComoPagada,
        actualizarCuota,
        eliminarCuota,
        verificarYCrearCuotaAnual
    };
}

/**
 * Utilidades para cálculos y formateo de cuotas de mantenimiento
 */
export const cuotaMantenimientoUtils = {
    // Calcular monto total incluyendo cuota de mantenimiento
    calcularMontoTotal(montoPlan: number, incluyeCuota: boolean = true): number {
        const montoCuota = incluyeCuota ? 10 : 0;
        return montoPlan + montoCuota;
    },

    // Formatear información de cuota para mostrar
    formatearInfoCuota(cuota: CuotaMantenimientoDTO): string {
        return `Cuota ${cuota.anio} - $${cuota.monto.toFixed(2)} (${cuota.estado})`;
    },

    // Verificar si un año requiere cuota nueva
    requiereCuotaNueva(cuotas: CuotaMantenimientoDTO[], año: number = new Date().getFullYear()): boolean {
        return !cuotas.some(cuota => cuota.anio === año);
    },

    // Obtener próxima cuota vencida
    obtenerProximaVencida(cuotas: CuotaMantenimientoDTO[]): CuotaMantenimientoDTO | null {
        const pendientes = cuotas.filter(cuota => cuota.estado === 'Pendiente');
        if (pendientes.length === 0) return null;

        const ahora = new Date();
        const vencidas = pendientes.filter(cuota => 
            new Date(cuota.fechaVencimiento) < ahora
        );

        if (vencidas.length === 0) return null;

        // Retornar la más antigua
        return vencidas.sort((a, b) => 
            new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime()
        )[0];
    },

    // Calcular desglose de pago con cuotas pendientes
    calcularDesglosePago(montoPlan: number, cuotasPendientes: CuotaMantenimientoDTO[]): {
        plan: number;
        cuotasPendientes: number;
        nuevaAnualidad: number;
        total: number;
    } {
        const plan = montoPlan;
        const cuotasPendientesTotal = cuotasPendientes.reduce((sum, cuota) => sum + cuota.monto, 0);
        const nuevaAnualidad = 10; // Cuota fija de $10
        const total = plan + cuotasPendientesTotal + nuevaAnualidad;

        return {
            plan,
            cuotasPendientes: cuotasPendientesTotal,
            nuevaAnualidad,
            total
        };
    },

    // Formatear fecha para mostrar
    formatearFecha(fecha: string): string {
        return new Date(fecha).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    },

    // Formatear monto
    formatearMonto(monto: number): string {
        return `$${monto.toFixed(2)}`;
    }
};

/**
 * Validador para lógica de cuotas anuales
 */
export function createCuotaAnualValidator(clienteId: number) {
    const cuotaStore = createCuotaMantenimientoStore(clienteId);
    
    // Estado para validaciones
    const _puedeIncluirAnualidad = writable(true);
    const _mensajeValidacion = writable('');

    // Estado derivado para la validación
    const validacion: Readable<{ puede: boolean; mensaje: string }> = derived(
        [_puedeIncluirAnualidad, _mensajeValidacion],
        ([$puede, $mensaje]) => ({ puede: $puede, mensaje: $mensaje })
    );

    async function validarAnualidad(): Promise<void> {
        try {
            await cuotaStore.cargarCuotas();
            const añoActual = new Date().getFullYear();
            
            // Obtener estado actual de las cuotas
            const cuotas = await cuotaMantenimientoService.getCuotasByCliente(clienteId);
            const tieneCuotaEsteAño = cuotas.some(cuota => cuota.anio === añoActual);
            
            if (tieneCuotaEsteAño) {
                _puedeIncluirAnualidad.set(false);
                _mensajeValidacion.set(`Ya existe una cuota de mantenimiento para el año ${añoActual}`);
            } else {
                _puedeIncluirAnualidad.set(true);
                _mensajeValidacion.set('Se incluirá cuota de mantenimiento anual ($10.00)');
            }
        } catch (error) {
            console.error('Error al validar anualidad:', error);
            _puedeIncluirAnualidad.set(true);
            _mensajeValidacion.set('Error al validar cuota anual');
        }
    }

    return {
        // Estados
        validacion,
        
        // Acciones
        validarAnualidad,
        
        // Acceso al store de cuotas
        cuotaStore
    };
}
