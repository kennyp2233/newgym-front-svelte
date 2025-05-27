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
    // Renovar plan de un cliente - ACTUALIZADO según documentación
    async renovarPlan(renovacionData: RenovacionPlanDTO): Promise<RenovacionResponse> {
        try {
            const response = await api.post('/pagos/renovar', renovacionData);
            return response.data;
        } catch (error: any) {
            console.error('Error al renovar plan:', error);

            // Manejar errores específicos de renovación según documentación
            if (error.response?.status === 403) {
                throw new Error('No se puede renovar el plan. La inscripción actual debe estar próxima a vencer (5 días o menos).');
            }

            // Manejar otros errores específicos
            if (error.response?.status === 404) {
                throw new Error('Cliente no encontrado');
            }

            if (error.response?.status === 400) {
                throw new Error(error.response?.data?.message || 'Datos de renovación inválidos');
            }

            throw error;
        }
    }

    // Helper para convertir strings numéricos a number en PagoDTO y relaciones anidadas
    private parsePagoDTO(pago: any): PagoDTO {
        // Convertir campos principales
        if (typeof pago.idPago === 'string' && !isNaN(Number(pago.idPago))) pago.idPago = Number(pago.idPago);
        if (typeof pago.idCliente === 'string' && !isNaN(Number(pago.idCliente))) pago.idCliente = Number(pago.idCliente);
        if (typeof pago.idInscripcion === 'string' && !isNaN(Number(pago.idInscripcion))) pago.idInscripcion = Number(pago.idInscripcion);
        if (typeof pago.monto === 'string' && !isNaN(Number(pago.monto))) pago.monto = Number(pago.monto);

        // Cliente anidado
        if (pago.cliente) {
            if (typeof pago.cliente.idCliente === 'string' && !isNaN(Number(pago.cliente.idCliente))) pago.cliente.idCliente = Number(pago.cliente.idCliente);
        }

        // Inscripción anidada
        if (pago.inscripcion) {
            if (typeof pago.inscripcion.idInscripcion === 'string' && !isNaN(Number(pago.inscripcion.idInscripcion))) pago.inscripcion.idInscripcion = Number(pago.inscripcion.idInscripcion);
            if (typeof pago.inscripcion.idCliente === 'string' && !isNaN(Number(pago.inscripcion.idCliente))) pago.inscripcion.idCliente = Number(pago.inscripcion.idCliente);
            if (typeof pago.inscripcion.idPlan === 'string' && !isNaN(Number(pago.inscripcion.idPlan))) pago.inscripcion.idPlan = Number(pago.inscripcion.idPlan);

            // Plan anidado
            if (pago.inscripcion.plan) {
                if (typeof pago.inscripcion.plan.idPlan === 'string' && !isNaN(Number(pago.inscripcion.plan.idPlan))) pago.inscripcion.plan.idPlan = Number(pago.inscripcion.plan.idPlan);
                if (typeof pago.inscripcion.plan.duracionMeses === 'string' && !isNaN(Number(pago.inscripcion.plan.duracionMeses))) pago.inscripcion.plan.duracionMeses = Number(pago.inscripcion.plan.duracionMeses);
                if (typeof pago.inscripcion.plan.precio === 'string' && !isNaN(Number(pago.inscripcion.plan.precio))) pago.inscripcion.plan.precio = Number(pago.inscripcion.plan.precio);
            }
        }

        return pago;
    }

    // Obtener todos los pagos
    async getPagos(): Promise<PagoDTO[]> {
        try {
            const response = await api.get('/pagos');
            // pasar todos los strings q sean numeros a number
            return Array.isArray(response.data)
                ? response.data.map(this.parsePagoDTO)
                : [];
        } catch (error) {
            console.error('Error al obtener pagos:', error);
            return [];
        }
    }

    // Obtener pagos por cliente
    async getPagosByCliente(idCliente: number): Promise<PagoDTO[]> {
        try {
            const response = await api.get(`/pagos/cliente/${idCliente}`);
            return Array.isArray(response.data)
                ? response.data.map(this.parsePagoDTO)
                : [];
        } catch (error) {
            console.error(`Error al obtener pagos del cliente ${idCliente}:`, error);
            return [];
        }
    }

    // Obtener un pago por ID
    async getPagoById(id: number): Promise<PagoDTO | null> {
        try {
            const response = await api.get(`/pagos/${id}`);
            return response.data ? this.parsePagoDTO(response.data) : null;
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

    // Actualizar un pago existente (para completar pago parcial) - ACTUALIZADO según documentación
    async updatePago(id: number, pagoData: Partial<PagoDTO>): Promise<PagoDTO | null> {
        try {
            const response = await api.patch(`/pagos/${id}`, pagoData);
            return response.data;
        } catch (error: any) {
            console.error(`Error al actualizar pago con ID ${id}:`, error);

            // Manejar errores específicos
            if (error.response?.status === 404) {
                throw new Error('Pago no encontrado');
            }

            if (error.response?.status === 400) {
                throw new Error(error.response?.data?.message || 'Datos de pago inválidos');
            }

            throw error;
        }
    }

    // Eliminar un pago
    async deletePago(id: number): Promise<boolean> {
        try {
            await api.delete(`/pagos/${id}`);
            return true;
        } catch (error: any) {
            console.error(`Error al eliminar pago con ID ${id}:`, error);

            // Manejar errores específicos
            if (error.response?.status === 404) {
                throw new Error('Pago no encontrado');
            }

            if (error.response?.status === 403) {
                throw new Error('No se puede eliminar este pago');
            }

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

    // Calcular monto restante de un pago - ACTUALIZADO según documentación
    calcularMontoRestante(pago: PagoDTO): number {
        if (!pago.inscripcion?.plan) return 0;

        // Precio del plan + $10 renovación anual (según documentación)
        const precioTotal = pago.inscripcion.plan.precio + 10;
        return Math.max(0, precioTotal - pago.monto);
    }

    // Obtener pagos pendientes de un cliente
    async getPagosPendientes(idCliente: number): Promise<PagoDTO[]> {
        try {
            const pagos = await this.getPagosByCliente(idCliente);
            return pagos.filter(pago => pago.estado === 'Pendiente');
        } catch (error) {
            console.error('Error al obtener pagos pendientes:', error);
            return [];
        }
    }

    // Verificar si se puede renovar un plan (debe estar próximo a vencer)
    async puedeRenovarPlan(idCliente: number): Promise<{ puede: boolean; mensaje: string; diasRestantes?: number }> {
        try {
            // Esta lógica debería estar en el backend, pero podemos hacer una verificación previa
            const response = await api.get(`/clientes/${idCliente}`);
            const cliente = response.data;

            if (!cliente.inscripciones || cliente.inscripciones.length === 0) {
                return { puede: false, mensaje: 'El cliente no tiene inscripciones activas' };
            }

            // Obtener la inscripción más reciente
            const inscripcionActiva = cliente.inscripciones.sort(
                (a: any, b: any) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime()
            )[0];

            if (!inscripcionActiva.fechaFin) {
                return { puede: false, mensaje: 'La inscripción no tiene fecha de fin definida' };
            }

            const fechaFin = new Date(inscripcionActiva.fechaFin);
            const hoy = new Date();
            const diffTime = fechaFin.getTime() - hoy.getTime();
            const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diasRestantes > 5) {
                return {
                    puede: false,
                    mensaje: `La inscripción vence en ${diasRestantes} días. Solo se puede renovar cuando falten 5 días o menos.`,
                    diasRestantes
                };
            }

            return {
                puede: true,
                mensaje: 'El plan puede ser renovado',
                diasRestantes
            };
        } catch (error) {
            console.error('Error al verificar renovación:', error);
            return { puede: false, mensaje: 'Error al verificar el estado de la inscripción' };
        }
    }
}

// Exportamos una instancia del servicio
export const pagoService = new PagoService();