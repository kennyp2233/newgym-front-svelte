// src/features/pagos/api.ts
import { api } from '$lib/services/api';

// Interfaces actualizadas según la documentación
export interface PagoDTO {
    idPago?: number;
    idCliente: number;
    idInscripcion?: number;
    monto: number;
    fechaPago: string;
    metodoPago?: 'Efectivo' | 'Transferencia' | 'Tarjeta'; // DEPRECATED: Payment method no longer tracked in new payments
    estado?: 'Completado' | 'Pendiente' | 'Anulado'; // Automatically managed by backend based on payment total
    referencia?: string;
    observaciones?: string;
    esRenovacion?: boolean;
    // Campos para cuotas de mantenimiento
    incluyeAnualidad?: boolean;
    montoAnualidad?: number;
    idCuotaMantenimiento?: number;
    cuotasMantenimiento?: Array<{
        idCuota: number;
        anio: number;
        monto: number;
        estado: string;
        fechaPago?: string;
    }>;

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
    metodoPago?: 'Efectivo' | 'Transferencia' | 'Tarjeta'; // DEPRECATED: Payment method no longer tracked in new payments
    monto?: number;
    fechaInicio?: string;
    referencia?: string;
    observaciones?: string;

    // Campos para cuotas de mantenimiento
    incluyeAnualidad?: boolean;
    pagaCuotasPendientes?: boolean;
    cuotasPorPagar?: number[];
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
        }; pago: {
            idPago: number;
            monto: number;
            fechaPago: string;
            metodoPago: string; // Backend still returns this for backwards compatibility
            estado: string;
        };
    };
}

class PagoService {
    // Renovar plan de un cliente - ACTUALIZADO según documentación
    async renovarPlan(renovacionData: RenovacionPlanDTO): Promise<RenovacionResponse> {
        try {
            // Verificar cuotas pendientes antes de renovar
            const { cuotaMantenimientoService } = await import('../cuotas-mantenimiento/api');
            const cuotasPendientes = await cuotaMantenimientoService.getCuotasPendientes(renovacionData.idCliente);

            // Si hay cuotas pendientes, agregarlas al payload
            if (cuotasPendientes.length > 0 && !renovacionData.pagaCuotasPendientes) {
                const totalCuotasPendientes = cuotasPendientes.reduce((sum, cuota) => sum + cuota.monto, 0);
                console.warn(`Cliente tiene ${cuotasPendientes.length} cuotas pendientes por $${totalCuotasPendientes.toFixed(2)}`);
            }

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

    // Obtener todos los pagos
    async getPagos(): Promise<PagoDTO[]> {
        try {
            const response = await api.get('/pagos');
            return Array.isArray(response.data) ? response.data : [];
        } catch (error) {
            console.error('Error al obtener pagos:', error);
            return [];
        }
    }

    // Obtener pagos por cliente
    async getPagosByCliente(idCliente: number): Promise<PagoDTO[]> {
        try {
            const response = await api.get(`/pagos/cliente/${idCliente}`);
            return Array.isArray(response.data) ? response.data : [];
        } catch (error) {
            console.error(`Error al obtener pagos del cliente ${idCliente}:`, error);
            return [];
        }
    }

    // Obtener un pago por ID
    async getPagoById(id: number): Promise<PagoDTO | null> {
        try {
            const response = await api.get(`/pagos/${id}`);
            return response.data || null;
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
    }    // Verificar si un cliente tiene deuda pendiente
    async clienteTieneDeudaPendiente(idCliente: number): Promise<boolean> {
        try {
            const pagos = await this.getPagosByCliente(idCliente);
            // Solo verificar pagos de planes pendientes (que tienen inscripcion), no cuotas de mantenimiento
            return pagos.some(pago => pago.estado === 'Pendiente' && pago.inscripcion);
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
    }    // Calcular monto restante de un pago - ACTUALIZADO para incluir cuotas de mantenimiento
    calcularMontoRestante(pago: PagoDTO): number {
        if (!pago.inscripcion?.plan) return 0;

        let precioTotal = pago.inscripcion.plan.precio;

        // Agregar cuota de mantenimiento si aplica según documentación
        if (pago.incluyeAnualidad && pago.montoAnualidad) {
            precioTotal += pago.montoAnualidad;
        }

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
    }    // Verificar si se puede renovar un plan (debe estar próximo a vencer)
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
    }    // Calcular monto total con cuotas de mantenimiento - MEJORADO para escenarios de renovación
    async calcularMontoTotalConCuotas(idCliente: number, idPlan: number, incluyeAnualidad: boolean = false): Promise<{ montoTotal: number; desglose: { plan: number; anualidad: number; cuotasPendientes: number } }> {
        try {
            // Importar servicios necesarios
            const { cuotaMantenimientoService } = await import('../cuotas-mantenimiento/api');
            const { planService } = await import('../planes/api');

            // Obtener precio del plan
            const plan = await planService.getPlanById(idPlan);
            if (!plan) throw new Error('Plan no encontrado');

            const desglose = {
                plan: plan.precio,
                anualidad: 0,
                cuotasPendientes: 0
            };

            // Agregar cuota anual si aplica - valor según documentación
            if (incluyeAnualidad) {
                desglose.anualidad = 10; // Valor estándar de anualidad
            }

            // Verificar cuotas pendientes - CRÍTICO para renovaciones
            const cuotasPendientes = await cuotaMantenimientoService.getCuotasPendientes(idCliente);
            if (cuotasPendientes.length > 0) {
                desglose.cuotasPendientes = cuotasPendientes.reduce((sum, cuota) => sum + cuota.monto, 0);
                console.log(`Cliente tiene ${cuotasPendientes.length} cuotas pendientes por $${desglose.cuotasPendientes.toFixed(2)}`);
            }

            const montoTotal = desglose.plan + desglose.anualidad + desglose.cuotasPendientes;

            return { montoTotal, desglose };
        } catch (error) {
            console.error('Error al calcular monto total con cuotas:', error);
            throw error;
        }
    }    // Formatear información de pago con cuotas - ACTUALIZADO según requisitos
    formatearPagoConCuotas(pago: PagoDTO): string {
        if (!pago.inscripcion?.plan) return 'Plan no especificado';

        const montoPlanCompleto = pago.inscripcion.plan.precio;

        // Solo mostrar formato con cuotas si efectivamente tiene cuotasMantenimiento con elementos
        if (pago.cuotasMantenimiento && pago.cuotasMantenimiento.length > 0) {
            const montoCuotas = pago.cuotasMantenimiento.reduce((sum, cuota) => sum + cuota.monto, 0);
            
            // Calcular cuánto se depositó del plan (restando las cuotas del monto total)
            const montoDepositadoDelPlan = pago.monto - montoCuotas;
            
            // Siempre mostrar el desglose: monto depositado del plan + cuotas fijas
            return `$${montoDepositadoDelPlan.toFixed(2)} + $${montoCuotas.toFixed(2)} (cuotas)`;
        }

        return `$${montoPlanCompleto.toFixed(2)}`;
    }// Identificar si un pago tiene cuotas de mantenimiento asociadas - ACTUALIZADO según requisitos
    identificarPagoConCuotas(pago: PagoDTO): boolean {
        // Solo considerar que tiene cuotas si hay un array de cuotasMantenimiento con elementos
        return !!(pago.cuotasMantenimiento && pago.cuotasMantenimiento.length > 0);
    }

    // Calcular monto mínimo para renovación con cuotas pendientes - NUEVO según documentación
    async calcularMontoMinimoRenovacion(idCliente: number, idPlan: number, incluyeAnualidad: boolean = false): Promise<{ montoMinimo: number; desglose: { plan: number; anualidad: number; cuotasPendientes: number } }> {
        try {
            const resultado = await this.calcularMontoTotalConCuotas(idCliente, idPlan, incluyeAnualidad);
            return {
                montoMinimo: resultado.montoTotal,
                desglose: resultado.desglose
            };
        } catch (error) {
            console.error('Error al calcular monto mínimo de renovación:', error);
            throw error;
        }
    }
}

// Exportamos una instancia del servicio
export const pagoService = new PagoService();