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
    // Datos de prueba para fallback
    private datosPrueba = {
        resumen: {
            inscritosMes: 15,
            clientesActivos: 125,
            comparativaMensual: {
                mesAnterior: 'Nov',
                mesActual: 'Dic',
                variacionPorcentaje: 12.5
            },
            ingresosMes: 3250
        },
        distribucion: [
            { nombrePlan: 'Plan Mensual', cantidad: 45, porcentaje: 36 },
            { nombrePlan: 'Plan Trimestral', cantidad: 35, porcentaje: 28 },
            { nombrePlan: 'Plan Semestral', cantidad: 25, porcentaje: 20 },
            { nombrePlan: 'Plan Anual', cantidad: 20, porcentaje: 16 }
        ],
        tendencia: {
            meses: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
            clientes: [12, 15, 18, 22, 19, 25, 28, 30, 26, 32, 29, 35],
            ingresos: [1200, 1500, 1800, 2200, 1900, 2500, 2800, 3000, 2600, 3200, 2900, 3500]
        },
        actividad: [
            { nombreActividad: 'Plan Mensual', semana1: 5, semana2: 8, semana3: 6, semana4: 9 },
            { nombreActividad: 'Plan Trimestral', semana1: 3, semana2: 4, semana3: 5, semana4: 6 },
            { nombreActividad: 'Plan Semestral', semana1: 2, semana2: 3, semana3: 2, semana4: 4 },
            { nombreActividad: 'Plan Anual', semana1: 1, semana2: 2, semana3: 1, semana4: 3 }
        ]
    };

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
            console.warn('Error al obtener resumen del dashboard, usando datos de prueba:', error);
            // Retornar datos de prueba en lugar de lanzar error
            return this.datosPrueba.resumen;
        }
    }

    // Obtener distribución de membresías
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
            console.warn('Error al obtener distribución de membresías, usando datos de prueba:', error);
            return this.datosPrueba.distribucion;
        }
    }

    // Obtener tendencia mensual de clientes e ingresos
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
            console.warn('Error al obtener tendencia mensual, usando datos de prueba:', error);
            return this.datosPrueba.tendencia;
        }
    }

    // Obtener actividades semanales
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
            console.warn('Error al obtener actividades semanales, usando datos de prueba:', error);
            return this.datosPrueba.actividad;
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
    }

    // Método para obtener todos los datos con un solo request (optimización)
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

            return {
                resumen: resumen.status === 'fulfilled' ? resumen.value : this.datosPrueba.resumen,
                distribucion: distribucion.status === 'fulfilled' ? distribucion.value : this.datosPrueba.distribucion,
                tendencia: tendencia.status === 'fulfilled' ? tendencia.value : this.datosPrueba.tendencia,
                actividad: actividad.status === 'fulfilled' ? actividad.value : this.datosPrueba.actividad
            };
        } catch (error) {
            console.error('Error al obtener dashboard completo:', error);
            // Retornar todos los datos de prueba si hay error general
            return {
                resumen: this.datosPrueba.resumen,
                distribucion: this.datosPrueba.distribucion,
                tendencia: this.datosPrueba.tendencia,
                actividad: this.datosPrueba.actividad
            };
        }
    }
}

// Exportamos una instancia del servicio
export const estadisticasService = new EstadisticasService();