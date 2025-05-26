// src/features/pagos/api.ts
import { api } from '$lib/services/api';

// Interfaces actualizadas según la documentación
export interface PagoDTO {
    idPago?: number;
    idCliente: number;
    idInscripcion?: number;
    monto: number;
    fechaPago: string;
    metodoPago?: 'Efectivo' | 'Transferencia' | 'Tarjeta';
    estado?: 'Completado' | 'Pendiente' | 'Anulado';
    referencia?: string;
    observaciones?: string;
    esRenovacion?: boolean;

    // Relaciones con datos expandidos
    cliente?: {
        idCliente: number;
        nombre: string;
        apellido: string;
        cedula: string;
        celular: string;
    };
    inscripcion?: {
        idInscripcion: number;
        idCliente: number;
        idPlan: number;
        fechaInicio: string;
        fechaFin: string;
        plan?: {
            idPlan: number;
            nombre: string;
            duracionMeses: number;
            precio: number;
            descripcion?: string;
        };
    };
}

export interface RenovacionPlanDTO {
    idCliente: number;
    idPlan: number;
    metodoPago?: 'Efectivo' | 'Transferencia' | 'Tarjeta';
    monto?: number;
    fechaInicio?: string;
    referencia?: string;
    observaciones?: string;
}

export interface RenovacionResponse {
    mensaje: string;
    datos: {
        cliente: {
            idCliente: number;
            nombre: string;
            apellido: string;
            cedula: string;
        };
        inscripcion: {
            idInscripcion: number;
            fechaInicio: string;
            fechaFin: string;
        };
        plan: {
            idPlan: number;
            nombre: string;
            duracionMeses: number;
            precio: number;
        };
        pago: {
            idPago: number;
            monto: number;
            fechaPago: string;
            metodoPago: string;
            estado: string;
        };
    };
}

class PagoService {
    // Renovar plan de un cliente
    async renovarPlan(renovacionData: RenovacionPlanDTO): Promise<RenovacionResponse> {
        try {
            const response = await api.post('/pagos/renovar', renovacionData);
            return response.data;
        } catch (error: any) {
            console.error('Error al renovar plan:', error);

            // Manejar errores específicos de renovación
            if (error.response?.status === 403) {
                throw new Error('No se puede renovar el plan. La inscripción actual debe estar próxima a vencer (5 días o menos).');
            }

            throw error;
        }
    }

    // Obtener todos los pagos
    async getPagos(): Promise<PagoDTO[]> {
        try {
            const response = await api.get('/pagos');
            return response.data;
        } catch (error) {
            console.error('Error al obtener pagos:', error);
            return [];
        }
    }

    // Obtener pagos por cliente
    async getPagosByCliente(idCliente: number): Promise<PagoDTO[]> {
        try {
            const response = await api.get(`/pagos/cliente/${idCliente}`);
            return response.data;
        } catch (error) {
            console.error(`Error al obtener pagos del cliente ${idCliente}:`, error);
            return [];
        }
    }

    // Obtener un pago por ID
    async getPagoById(id: number): Promise<PagoDTO | null> {
        try {
            const response = await api.get(`/pagos/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error al obtener pago con ID ${id}:`, error);
            return null;
        }
    }

    // Crear un nuevo pago
    async createPago(pagoData: Partial<PagoDTO>): Promise<PagoDTO | null> {
        try {
            const response = await api.post('/pagos', pagoData);
            return response.data;
        } catch (error) {
            console.error('Error al crear pago:', error);
            throw error;
        }
    }

    // Actualizar un pago existente (para completar pago parcial)
    async updatePago(id: number, pagoData: Partial<PagoDTO>): Promise<PagoDTO | null> {
        try {
            const response = await api.patch(`/pagos/${id}`, pagoData);
            return response.data;
        } catch (error) {
            console.error(`Error al actualizar pago con ID ${id}:`, error);
            throw error;
        }
    }

    // Eliminar un pago
    async deletePago(id: number): Promise<boolean> {
        try {
            await api.delete(`/pagos/${id}`);
            return true;
        } catch (error) {
            console.error(`Error al eliminar pago con ID ${id}:`, error);
            return false;
        }
    }

    // Completar pago pendiente (helper method)
    async completarPago(idPago: number, montoTotal: number, observaciones?: string): Promise<PagoDTO | null> {
        try {
            return await this.updatePago(idPago, {
                monto: montoTotal,
                estado: 'Completado',
                observaciones: observaciones
            });
        } catch (error) {
            console.error('Error al completar pago:', error);
            throw error;
        }
    }

    // Verificar si un cliente tiene deuda pendiente
    async clienteTieneDeudaPendiente(idCliente: number): Promise<boolean> {
        try {
            const pagos = await this.getPagosByCliente(idCliente);
            return pagos.some(pago => pago.estado === 'Pendiente');
        } catch (error) {
            console.error('Error al verificar deuda pendiente:', error);
            return false;
        }
    }

    // Obtener último pago de un cliente
    async getUltimoPago(idCliente: number): Promise<PagoDTO | null> {
        try {
            const pagos = await this.getPagosByCliente(idCliente);
            if (pagos.length === 0) return null;

            // Ordenar por fecha de pago (más reciente primero)
            const pagosOrdenados = pagos.sort((a, b) =>
                new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime()
            );

            return pagosOrdenados[0];
        } catch (error) {
            console.error('Error al obtener último pago:', error);
            return null;
        }
    }

    // Calcular monto restante de un pago
    calcularMontoRestante(pago: PagoDTO): number {
        if (!pago.inscripcion?.plan) return 0;

        // Precio del plan + $10 renovación anual
        const precioTotal = pago.inscripcion.plan.precio + 10;
        return Math.max(0, precioTotal - pago.monto);
    }
}

// Exportamos una instancia del servicio
export const pagoService = new PagoService();