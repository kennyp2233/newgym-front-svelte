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

    // Estados de carga
    loading: boolean;
    error: string | null;

    // Filtros
    anioSeleccionado: number;
    mesSeleccionado: number;
}

const initialState: EstadisticasState = {
    resumenData: null,
    distribucionData: null,
    tendenciaData: null,
    actividadData: null,
    loading: false,
    error: null,
    anioSeleccionado: new Date().getFullYear(),
    mesSeleccionado: new Date().getMonth()
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
        estadisticasStore.update(state => ({ ...state, loading: true, error: null }));

        try {
            const data = await estadisticasService.getResumenDashboard();
            estadisticasStore.update(state => ({
                ...state,
                resumenData: data,
                loading: false
            }));
            return data;
        } catch (error: any) {
            const errorMsg = 'Error al cargar el resumen del dashboard';
            estadisticasStore.update(state => ({
                ...state,
                error: errorMsg,
                loading: false
            }));
            toasts.showToast(errorMsg, 'error');
            return null;
        }
    },

    // Cargar distribución de membresías
    async cargarDistribucionMembresias() {
        estadisticasStore.update(state => ({ ...state, loading: true, error: null }));

        try {
            const data = await estadisticasService.getDistribucionMembresias();
            estadisticasStore.update(state => ({
                ...state,
                distribucionData: data,
                loading: false
            }));
            return data;
        } catch (error: any) {
            const errorMsg = 'Error al cargar la distribución de membresías';
            estadisticasStore.update(state => ({
                ...state,
                error: errorMsg,
                loading: false
            }));
            toasts.showToast(errorMsg, 'error');
            return null;
        }
    },

    // Cargar tendencia mensual
    async cargarTendenciaMensual(anio?: number) {
        estadisticasStore.update(state => ({ ...state, loading: true, error: null }));

        try {
            let currentState: EstadisticasState;
            estadisticasStore.subscribe(state => currentState = state)();

            const anioToUse = anio || currentState!.anioSeleccionado;
            const data = await estadisticasService.getTendenciaMensual(anioToUse);

            estadisticasStore.update(state => ({
                ...state,
                tendenciaData: data,
                loading: false,
                anioSeleccionado: anioToUse
            }));
            return data;
        } catch (error: any) {
            const errorMsg = 'Error al cargar la tendencia mensual';
            estadisticasStore.update(state => ({
                ...state,
                error: errorMsg,
                loading: false
            }));
            toasts.showToast(errorMsg, 'error');
            return null;
        }
    },

    // Cargar actividades semanales
    async cargarActividadesSemanales(mes?: number, anio?: number) {
        estadisticasStore.update(state => ({ ...state, loading: true, error: null }));

        try {
            let currentState: EstadisticasState;
            estadisticasStore.subscribe(state => currentState = state)();

            const mesToUse = mes !== undefined ? mes : currentState!.mesSeleccionado;
            const anioToUse = anio || currentState!.anioSeleccionado;

            const data = await estadisticasService.getActividadesSemanales(mesToUse, anioToUse);

            estadisticasStore.update(state => ({
                ...state,
                actividadData: data,
                loading: false,
                mesSeleccionado: mesToUse,
                anioSeleccionado: anioToUse
            }));
            return data;
        } catch (error: any) {
            const errorMsg = 'Error al cargar las actividades semanales';
            estadisticasStore.update(state => ({
                ...state,
                error: errorMsg,
                loading: false
            }));
            toasts.showToast(errorMsg, 'error');
            return null;
        }
    },

    // Cargar todos los datos del dashboard
    async cargarDashboardCompleto() {
        estadisticasStore.update(state => ({ ...state, loading: true, error: null }));

        try {
            await Promise.all([
                this.cargarResumenDashboard(),
                this.cargarDistribucionMembresias(),
                this.cargarTendenciaMensual(),
                this.cargarActividadesSemanales()
            ]);
        } catch (error) {
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