// src/features/cuotas-mantenimiento/api.ts
import { api } from '$lib/services/api';

// Interface para las cuotas de mantenimiento
export interface CuotaMantenimientoDTO {
    idCuota?: number;
    idCliente: number;
    anio: number;
    monto: number;
    estado: 'Pendiente' | 'Pagada';
    fechaVencimiento: string;
    fechaPago?: string;
    idPago?: number;
    observaciones?: string;
    
    // Relaciones expandidas
    cliente?: {
        idCliente: number;
        nombre: string;
        apellido: string;
        cedula: string;
        celular: string;
    };
    pago?: {
        idPago: number;
        monto: number;
        fechaPago: string;
        referencia?: string;
        metodoPago?: string;
        montoTotal: number;
    };
}

// Interface para verificar cuotas pendientes
export interface CuotasPendientesResponse {
    tienePendientes: boolean;
    cantidad: number;
    cuotas?: CuotaMantenimientoDTO[];
}

// Interface para crear/actualizar cuotas
export interface CrearCuotaDTO {
    idCliente: number;
    anio: number;
    monto?: number; // Si no se proporciona, se usa el valor por defecto de $10
    observaciones?: string;
}

class CuotaMantenimientoService {
    // Obtener todas las cuotas de un cliente
    async getCuotasByCliente(idCliente: number): Promise<CuotaMantenimientoDTO[]> {
        try {
            const response = await api.get(`/cuotas-mantenimiento/cliente/${idCliente}`);
            return Array.isArray(response.data) ? response.data : [];
        } catch (error) {
            console.error(`Error al obtener cuotas del cliente ${idCliente}:`, error);
            return [];
        }
    }    // Verificar si un cliente tiene cuotas pendientes - MEJORADO según documentación
    async tieneCuotasPendientes(idCliente: number): Promise<CuotasPendientesResponse> {
        try {
            const response = await api.get(`/cuotas-mantenimiento/cliente/${idCliente}/tiene-pendientes`);
            return response.data;
        } catch (error) {
            console.error(`Error al verificar cuotas pendientes del cliente ${idCliente}:`, error);
            return { tienePendientes: false, cantidad: 0 };
        }
    }

    // Verificar si puede proceder con renovación - NUEVO método según documentación
    async puedeRenovarConCuotasPendientes(idCliente: number, montoPago: number, incluyeAnualidad: boolean = false): Promise<{ puede: boolean; mensaje: string; montoMinimo?: number }> {
        try {
            const cuotasResponse = await this.tieneCuotasPendientes(idCliente);
            
            if (!cuotasResponse.tienePendientes) {
                return { puede: true, mensaje: 'No hay cuotas pendientes' };
            }

            // Obtener cuotas detalladas para calcular monto
            const cuotasPendientes = await this.getCuotasPendientes(idCliente);
            const totalCuotasPendientes = cuotasPendientes.reduce((sum, cuota) => sum + cuota.monto, 0);
            
            // El monto mínimo debe incluir las cuotas pendientes
            const montoMinimo = totalCuotasPendientes + (incluyeAnualidad ? 10 : 0);
            
            if (montoPago < montoMinimo) {
                return {
                    puede: false,
                    mensaje: `Para renovar debe incluir el pago de ${cuotasPendientes.length} cuota(s) pendiente(s) por $${totalCuotasPendientes.toFixed(2)}`,
                    montoMinimo
                };
            }

            return { puede: true, mensaje: 'Puede proceder con la renovación' };
        } catch (error) {
            console.error('Error al verificar renovación con cuotas pendientes:', error);
            return { puede: false, mensaje: 'Error al verificar cuotas pendientes' };
        }
    }

    // Crear una nueva cuota de mantenimiento
    async crearCuota(cuotaData: CrearCuotaDTO): Promise<CuotaMantenimientoDTO | null> {
        try {
            const response = await api.post('/cuotas-mantenimiento', cuotaData);
            return response.data;
        } catch (error) {
            console.error('Error al crear cuota de mantenimiento:', error);
            throw error;
        }
    }

    // Marcar una cuota como pagada (asociarla con un pago)
    async marcarComoPagada(idCuota: number, idPago: number): Promise<CuotaMantenimientoDTO | null> {
        try {
            const response = await api.patch(`/cuotas-mantenimiento/${idCuota}/pagar`, {
                idPago,
                estado: 'Pagada',
                fechaPago: new Date().toISOString()
            });
            return response.data;
        } catch (error) {
            console.error(`Error al marcar cuota ${idCuota} como pagada:`, error);
            throw error;
        }
    }

    // Obtener cuotas pendientes de un cliente específico
    async getCuotasPendientes(idCliente: number): Promise<CuotaMantenimientoDTO[]> {
        try {
            const cuotas = await this.getCuotasByCliente(idCliente);
            return cuotas.filter(cuota => cuota.estado === 'Pendiente');
        } catch (error) {
            console.error(`Error al obtener cuotas pendientes del cliente ${idCliente}:`, error);
            return [];
        }
    }

    // Obtener próxima cuota pendiente de un cliente
    async getProximaCuotaPendiente(idCliente: number): Promise<CuotaMantenimientoDTO | null> {
        try {
            const cuotasPendientes = await this.getCuotasPendientes(idCliente);
            if (cuotasPendientes.length === 0) return null;

            // Retornar la cuota más antigua (menor año)
            return cuotasPendientes.sort((a, b) => a.anio - b.anio)[0];
        } catch (error) {
            console.error(`Error al obtener próxima cuota pendiente del cliente ${idCliente}:`, error);
            return null;
        }
    }

    // Actualizar una cuota de mantenimiento
    async actualizarCuota(idCuota: number, cuotaData: Partial<CuotaMantenimientoDTO>): Promise<CuotaMantenimientoDTO | null> {
        try {
            const response = await api.patch(`/cuotas-mantenimiento/${idCuota}`, cuotaData);
            return response.data;
        } catch (error) {
            console.error(`Error al actualizar cuota ${idCuota}:`, error);
            throw error;
        }
    }

    // Eliminar una cuota de mantenimiento
    async eliminarCuota(idCuota: number): Promise<boolean> {
        try {
            await api.delete(`/cuotas-mantenimiento/${idCuota}`);
            return true;
        } catch (error: any) {
            console.error(`Error al eliminar cuota ${idCuota}:`, error);
            
            if (error.response?.status === 403) {
                throw new Error('No se puede eliminar esta cuota porque ya está pagada');
            }
            
            if (error.response?.status === 404) {
                throw new Error('Cuota no encontrada');
            }
            
            return false;
        }
    }

    // Calcular monto de cuota con costo de plan
    calcularMontoConCuota(montoPlan: number, montoCuota: number = 10): number {
        return montoPlan + montoCuota;
    }

    // Formatear información de cuota para mostrar en la UI
    formatearInfoCuota(cuota: CuotaMantenimientoDTO): string {
        return `Cuota ${cuota.anio} - $${cuota.monto.toFixed(2)} (${cuota.estado})`;
    }    // Verificar si debe crearse cuota automáticamente para un cliente nuevo - ACTUALIZADO
    async verificarYCrearCuotaAnual(idCliente: number): Promise<CuotaMantenimientoDTO | null> {
        try {
            const añoActual = new Date().getFullYear();
            const cuotas = await this.getCuotasByCliente(idCliente);
            
            // Verificar si ya existe cuota para el año actual
            const cuotaExistente = cuotas.find(cuota => cuota.anio === añoActual);
            
            if (!cuotaExistente) {
                // Crear cuota automáticamente
                return await this.crearCuota({
                    idCliente,
                    anio: añoActual,
                    monto: 10,
                    observaciones: 'Cuota creada automáticamente'
                });
            }
            
            return cuotaExistente;
        } catch (error) {
            console.error(`Error al verificar/crear cuota anual para cliente ${idCliente}:`, error);
            return null;
        }
    }

    // Nuevo método: Verificar restricciones para renovación con cuotas pendientes
    async verificarRestriccionesRenovacion(idCliente: number, montoPlan: number, incluyeAnualidad: boolean = false): Promise<{ 
        permitido: boolean; 
        montoMinimo: number; 
        mensaje: string; 
        cuotasPendientes: CuotaMantenimientoDTO[] 
    }> {
        try {
            const cuotasPendientes = await this.getCuotasPendientes(idCliente);
            const totalCuotasPendientes = cuotasPendientes.reduce((sum, cuota) => sum + cuota.monto, 0);
            
            let montoMinimo = montoPlan;
            
            // Agregar cuotas pendientes
            if (cuotasPendientes.length > 0) {
                montoMinimo += totalCuotasPendientes;
            }
            
            // Agregar anualidad si aplica
            if (incluyeAnualidad) {
                montoMinimo += 10;
            }
            
            const mensaje = cuotasPendientes.length > 0 
                ? `Debe pagar mínimo $${montoMinimo.toFixed(2)} (plan + ${cuotasPendientes.length} cuota${cuotasPendientes.length > 1 ? 's' : ''} pendiente${cuotasPendientes.length > 1 ? 's' : ''}${incluyeAnualidad ? ' + anualidad' : ''})` 
                : `Monto mínimo: $${montoMinimo.toFixed(2)}`;
            
            return {
                permitido: true, // Siempre permitido, pero con restricciones de monto
                montoMinimo,
                mensaje,
                cuotasPendientes
            };
        } catch (error) {
            console.error('Error al verificar restricciones de renovación:', error);
            return {
                permitido: false,
                montoMinimo: montoPlan,
                mensaje: 'Error al verificar cuotas pendientes',
                cuotasPendientes: []
            };
        }
    }
}

// Exportar instancia del servicio
export const cuotaMantenimientoService = new CuotaMantenimientoService();
