// src/features/estadisticas/stores/estadisticasStore.ts
import { writable, derived } from 'svelte/store';
import { toasts } from '$lib/stores/toastStore';
import {
    estadisticasService,
    type ResumenDashboard,
    type DistribucionMembresia,
    type TendenciaMensual,
    type ActividadSemanal
} from '../api';

interface EstadisticasState {
    // Datos
    resumenData: ResumenDashboard | null;
    distribucionData: DistribucionMembresia[] | null;
    tendenciaData: TendenciaMensual | null;
    actividadData: ActividadSemanal[] | null;

    // Estados de carga individuales
    loadingResumen: boolean;
    loadingDistribucion: boolean;
    loadingTendencia: boolean;
    loadingActividad: boolean;

    // Estado de carga general
    loading: boolean;
    error: string | null;

    // Filtros
    anioSeleccionado: number;
    mesSeleccionado: number;

    // Estado de inicialización
    initialized: boolean;
}

const initialState: EstadisticasState = {
    resumenData: null,
    distribucionData: null,
    tendenciaData: null,
    actividadData: null,
    loadingResumen: false,
    loadingDistribucion: false,
    loadingTendencia: false,
    loadingActividad: false,
    loading: false,
    error: null,
    anioSeleccionado: new Date().getFullYear(),
    mesSeleccionado: new Date().getMonth(),
    initialized: false
};

const estadisticasStore = writable<EstadisticasState>(initialState);

export const estadisticas = {
    subscribe: estadisticasStore.subscribe,

    // Acciones para cambiar filtros
    setAnio: (anio: number) => {
        estadisticasStore.update(state => ({ ...state, anioSeleccionado: anio }));
    },

    setMes: (mes: number) => {
        estadisticasStore.update(state => ({ ...state, mesSeleccionado: mes }));
    },

    // Cargar resumen del dashboard
    async cargarResumenDashboard() {
        estadisticasStore.update(state => ({ ...state, loadingResumen: true, error: null }));

        try {
            const data = await estadisticasService.getResumenDashboard();
            estadisticasStore.update(state => ({
                ...state,
                resumenData: data,
                loadingResumen: false
            }));
            return data;
        } catch (error: any) {
            console.error('Error al cargar resumen:', error);
            const errorMsg = 'Error al cargar el resumen del dashboard';
            estadisticasStore.update(state => ({
                ...state,
                error: errorMsg,
                loadingResumen: false,
                // Usar datos de prueba en caso de error
                resumenData: {
                    inscritosMes: 15,
                    clientesActivos: 125,
                    comparativaMensual: {
                        mesAnterior: 'Nov',
                        mesActual: 'Dic',
                        variacionPorcentaje: 12.5
                    },
                    ingresosMes: 3250
                }
            }));
            toasts.showToast(errorMsg, 'warning');
            return null;
        }
    },

    // Cargar distribución de membresías
    async cargarDistribucionMembresias() {
        estadisticasStore.update(state => ({ ...state, loadingDistribucion: true, error: null }));

        try {
            const data = await estadisticasService.getDistribucionMembresias();
            estadisticasStore.update(state => ({
                ...state,
                distribucionData: data,
                loadingDistribucion: false
            }));
            return data;
        } catch (error: any) {
            console.error('Error al cargar distribución:', error);
            const errorMsg = 'Error al cargar la distribución de membresías';
            estadisticasStore.update(state => ({
                ...state,
                error: errorMsg,
                loadingDistribucion: false,
                // Datos de prueba
                distribucionData: [
                    { nombrePlan: 'Plan Mensual', cantidad: 45, porcentaje: 36 },
                    { nombrePlan: 'Plan Trimestral', cantidad: 35, porcentaje: 28 },
                    { nombrePlan: 'Plan Semestral', cantidad: 25, porcentaje: 20 },
                    { nombrePlan: 'Plan Anual', cantidad: 20, porcentaje: 16 }
                ]
            }));
            toasts.showToast(errorMsg, 'warning');
            return null;
        }
    },

    // Cargar tendencia mensual
    async cargarTendenciaMensual(anio?: number) {
        estadisticasStore.update(state => ({ ...state, loadingTendencia: true, error: null }));

        try {
            let currentState: EstadisticasState;
            estadisticasStore.subscribe(state => currentState = state)();

            const anioToUse = anio || currentState!.anioSeleccionado;
            const data = await estadisticasService.getTendenciaMensual(anioToUse);

            estadisticasStore.update(state => ({
                ...state,
                tendenciaData: data,
                loadingTendencia: false,
                anioSeleccionado: anioToUse
            }));
            return data;
        } catch (error: any) {
            console.error('Error al cargar tendencia:', error);
            const errorMsg = 'Error al cargar la tendencia mensual';
            estadisticasStore.update(state => ({
                ...state,
                error: errorMsg,
                loadingTendencia: false,
                // Datos de prueba
                tendenciaData: {
                    meses: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
                    clientes: [12, 15, 18, 22, 19, 25, 28, 30, 26, 32, 29, 35],
                    ingresos: [1200, 1500, 1800, 2200, 1900, 2500, 2800, 3000, 2600, 3200, 2900, 3500]
                }
            }));
            toasts.showToast(errorMsg, 'warning');
            return null;
        }
    },

    // Cargar actividades semanales
    async cargarActividadesSemanales(mes?: number, anio?: number) {
        estadisticasStore.update(state => ({ ...state, loadingActividad: true, error: null }));

        try {
            let currentState: EstadisticasState;
            estadisticasStore.subscribe(state => currentState = state)();

            const mesToUse = mes !== undefined ? mes : currentState!.mesSeleccionado;
            const anioToUse = anio || currentState!.anioSeleccionado;

            const data = await estadisticasService.getActividadesSemanales(mesToUse, anioToUse);

            estadisticasStore.update(state => ({
                ...state,
                actividadData: data,
                loadingActividad: false,
                mesSeleccionado: mesToUse,
                anioSeleccionado: anioToUse
            }));
            return data;
        } catch (error: any) {
            console.error('Error al cargar actividades:', error);
            const errorMsg = 'Error al cargar las actividades semanales';
            estadisticasStore.update(state => ({
                ...state,
                error: errorMsg,
                loadingActividad: false,
                // Datos de prueba
                actividadData: [
                    { nombreActividad: 'Plan Mensual', semana1: 5, semana2: 8, semana3: 6, semana4: 9 },
                    { nombreActividad: 'Plan Trimestral', semana1: 3, semana2: 4, semana3: 5, semana4: 6 },
                    { nombreActividad: 'Plan Semestral', semana1: 2, semana2: 3, semana3: 2, semana4: 4 },
                    { nombreActividad: 'Plan Anual', semana1: 1, semana2: 2, semana3: 1, semana4: 3 }
                ]
            }));
            toasts.showToast(errorMsg, 'warning');
            return null;
        }
    },

    // Cargar todos los datos del dashboard
    async cargarDashboardCompleto() {
        estadisticasStore.update(state => ({ ...state, loading: true, error: null }));

        try {
            await Promise.allSettled([
                this.cargarResumenDashboard(),
                this.cargarDistribucionMembresias(),
                this.cargarTendenciaMensual(),
                this.cargarActividadesSemanales()
            ]);

            estadisticasStore.update(state => ({ ...state, initialized: true }));
        } catch (error) {
            console.error('Error al cargar dashboard:', error);
            toasts.showToast('Error al cargar los datos del dashboard', 'error');
        } finally {
            estadisticasStore.update(state => ({ ...state, loading: false }));
        }
    },

    // Reset store
    reset() {
        estadisticasStore.set(initialState);
    }
};

// Derived stores útiles
export const loading = derived(estadisticasStore, $store => $store.loading);
export const error = derived(estadisticasStore, $store => $store.error);
export const resumenData = derived(estadisticasStore, $store => $store.resumenData);
export const distribucionData = derived(estadisticasStore, $store => $store.distribucionData);
export const tendenciaData = derived(estadisticasStore, $store => $store.tendenciaData);
export const actividadData = derived(estadisticasStore, $store => $store.actividadData);
export const anioSeleccionado = derived(estadisticasStore, $store => $store.anioSeleccionado);
export const mesSeleccionado = derived(estadisticasStore, $store => $store.mesSeleccionado);
export const initialized = derived(estadisticasStore, $store => $store.initialized);