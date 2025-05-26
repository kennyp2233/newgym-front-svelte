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
            return response.data;
        } catch (error) {
            console.error('Error al obtener resumen del dashboard:', error);
            throw error;
        }
    }

    // Obtener distribución de membresías
    async getDistribucionMembresias(): Promise<DistribucionMembresia[]> {
        try {
            const response = await api.get('/estadisticas/distribucion-membresias');
            return response.data;
        } catch (error) {
            console.error('Error al obtener distribución de membresías:', error);
            throw error;
        }
    }

    // Obtener tendencia mensual de clientes e ingresos
    async getTendenciaMensual(anio: number = new Date().getFullYear()): Promise<TendenciaMensual> {
        try {
            const response = await api.get(`/estadisticas/tendencia-clientesingresos?anio=${anio}`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener tendencia mensual:', error);
            throw error;
        }
    }

    // Obtener actividades semanales
    async getActividadesSemanales(
        mes: number = new Date().getMonth(),
        anio: number = new Date().getFullYear()
    ): Promise<ActividadSemanal[]> {
        try {
            const response = await api.get(`/estadisticas/actividades-semanales?mes=${mes}&anio=${anio}`);
            return response.data;
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
            return response.data;
        } catch (error) {
            console.error('Error al obtener comparativa mensual:', error);
            throw error;
        }
    }
}

// Exportamos una instancia del servicio
export const estadisticasService = new EstadisticasService();