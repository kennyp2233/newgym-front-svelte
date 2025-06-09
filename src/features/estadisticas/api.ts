// src/features/estadisticas/api.ts
import { api } from '$lib/services/api';

// Interfaces para las respuestas del backend
export interface ResumenDashboard {
    inscritosMes: number;
    clientesActivos: number;
    comparativaMensual: {
        mesAnterior: string;
        mesActual: string;
        variacionPorcentaje: number;
    };
    ingresosMes: number;
}

export interface DistribucionMembresia {
    nombrePlan: string;
    cantidad: number;
    porcentaje: number;
}

export interface TendenciaMensual {
    meses: string[];
    clientes: number[];
    ingresos: number[];
}

export interface ActividadSemanal {
    nombreActividad: string;
    semana1: number;
    semana2: number;
    semana3: number;
    semana4: number;
}

export interface ComparativaMensual {
    mes: string;
    cantidadAnterior: number;
    cantidadActual: number;
    variacionPorcentaje: number;
}

class EstadisticasService {

    // Obtener resumen del dashboard
    async getResumenDashboard(): Promise<ResumenDashboard> {
        try {
            const response = await api.get('/estadisticas/dashboard');

            // Validar que la respuesta tenga la estructura esperada
            if (!response.data || typeof response.data !== 'object') {
                throw new Error('Respuesta inválida del servidor');
            }

            return {
                inscritosMes: Number(response.data.inscritosMes) || 0,
                clientesActivos: Number(response.data.clientesActivos) || 0,
                comparativaMensual: {
                    mesAnterior: response.data.comparativaMensual?.mesAnterior || 'Mes Anterior',
                    mesActual: response.data.comparativaMensual?.mesActual || 'Mes Actual',
                    variacionPorcentaje: Number(response.data.comparativaMensual?.variacionPorcentaje) || 0
                },
                ingresosMes: Number(response.data.ingresosMes) || 0
            };
        } catch (error) {
            console.error('Error al obtener resumen del dashboard:', error);
            throw error;
        }
    }    // Obtener distribución de membresías
    async getDistribucionMembresias(): Promise<DistribucionMembresia[]> {
        try {
            const response = await api.get('/estadisticas/distribucion-membresias');

            if (!Array.isArray(response.data)) {
                throw new Error('Respuesta inválida del servidor');
            }

            return response.data.map(item => ({
                nombrePlan: String(item.nombrePlan) || 'Plan Desconocido',
                cantidad: Number(item.cantidad) || 0,
                porcentaje: Number(item.porcentaje) || 0
            }));
        } catch (error) {
            console.error('Error al obtener distribución de membresías:', error);
            throw error;
        }
    }    // Obtener tendencia mensual de clientes e ingresos
    async getTendenciaMensual(anio: number = new Date().getFullYear()): Promise<TendenciaMensual> {
        try {
            const response = await api.get(`/estadisticas/tendencia-clientesingresos?anio=${anio}`);

            if (!response.data || !Array.isArray(response.data.meses)) {
                throw new Error('Respuesta inválida del servidor');
            }

            return {
                meses: response.data.meses || [],
                clientes: (response.data.clientes || []).map((c: any) => Number(c) || 0),
                ingresos: (response.data.ingresos || []).map((i: any) => Number(i) || 0)
            };
        } catch (error) {
            console.error('Error al obtener tendencia mensual:', error);
            throw error;
        }
    }    // Obtener actividades semanales
    async getActividadesSemanales(
        mes: number = new Date().getMonth(),
        anio: number = new Date().getFullYear()
    ): Promise<ActividadSemanal[]> {
        try {
            const response = await api.get(`/estadisticas/actividades-semanales?mes=${mes}&anio=${anio}`);

            if (!Array.isArray(response.data)) {
                throw new Error('Respuesta inválida del servidor');
            }

            return response.data.map(item => ({
                nombreActividad: String(item.nombreActividad) || 'Actividad Desconocida',
                semana1: Number(item.semana1) || 0,
                semana2: Number(item.semana2) || 0,
                semana3: Number(item.semana3) || 0,
                semana4: Number(item.semana4) || 0
            }));
        } catch (error) {
            console.error('Error al obtener actividades semanales:', error);
            throw error;
        }
    }

    // Obtener comparativa mensual
    async getComparativaMensual(
        mes1: number,
        mes2: number,
        anio1: number = new Date().getFullYear(),
        anio2: number = new Date().getFullYear()
    ): Promise<ComparativaMensual> {
        try {
            const response = await api.get(
                `/estadisticas/comparativa-mensual?mes1=${mes1}&mes2=${mes2}&anio1=${anio1}&anio2=${anio2}`
            );

            if (!response.data || typeof response.data !== 'object') {
                throw new Error('Respuesta inválida del servidor');
            }

            return {
                mes: String(response.data.mes) || 'Mes',
                cantidadAnterior: Number(response.data.cantidadAnterior) || 0,
                cantidadActual: Number(response.data.cantidadActual) || 0,
                variacionPorcentaje: Number(response.data.variacionPorcentaje) || 0
            };
        } catch (error) {
            console.error('Error al obtener comparativa mensual:', error);
            throw error;
        }
    }

    // Método para verificar si la API está disponible
    async verificarConexion(): Promise<boolean> {
        try {
            const response = await api.get('/estadisticas/health-check');
            return response.status === 200;
        } catch (error) {
            console.warn('API de estadísticas no disponible:', error);
            return false;
        }
    }    // Método para obtener todos los datos con un solo request (optimización)
    async getDashboardCompleto(): Promise<{
        resumen: ResumenDashboard;
        distribucion: DistribucionMembresia[];
        tendencia: TendenciaMensual;
        actividad: ActividadSemanal[];
    }> {
        try {
            // Intentar obtener todos los datos en paralelo
            const [resumen, distribucion, tendencia, actividad] = await Promise.allSettled([
                this.getResumenDashboard(),
                this.getDistribucionMembresias(),
                this.getTendenciaMensual(),
                this.getActividadesSemanales()
            ]);

            // Si algún método falla, lanzar error
            if (resumen.status === 'rejected' ||
                distribucion.status === 'rejected' ||
                tendencia.status === 'rejected' ||
                actividad.status === 'rejected') {
                throw new Error('Error al obtener algunos datos del dashboard');
            }

            return {
                resumen: resumen.value,
                distribucion: distribucion.value,
                tendencia: tendencia.value,
                actividad: actividad.value
            };
        } catch (error) {
            console.error('Error al obtener dashboard completo:', error);
            throw error;
        }
    }
}

// Exportamos una instancia del servicio
export const estadisticasService = new EstadisticasService();