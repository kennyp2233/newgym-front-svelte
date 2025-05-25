// src/features/planes/api.ts
import { api } from '$lib/services/api';

// Interfaz para la entidad Plan
export interface Plan {
    idPlan: number;
    nombre: string;
    duracionMeses: number;
    precio: number;
    descripcion?: string;
    tag?: string; // Tag opcional para filtrar por ocupación
}

// Mock de planes para usar mientras se implementa el backend
export const PLANES_MOCK: Plan[] = [
    {
        idPlan: 1,
        nombre: 'Silver',
        duracionMeses: 1,
        precio: 30,
        descripcion: 'Plan básico de 1 mes',
        tag: 'Trabajo'
    },
    {
        idPlan: 2,
        nombre: 'Gold',
        duracionMeses: 3,
        precio: 80,
        descripcion: 'Plan intermedio de 3 meses',
        tag: 'Trabajo'
    },
    {
        idPlan: 3,
        nombre: 'Platino',
        duracionMeses: 6,
        precio: 140,
        descripcion: 'Plan premium de 6 meses',
        tag: 'Trabajo'
    },
    {
        idPlan: 4,
        nombre: 'Estudiante',
        duracionMeses: 1,
        precio: 20,
        descripcion: 'Plan especial para estudiantes',
        tag: 'Estudiante'
    },
    {
        idPlan: 5,
        nombre: 'Niño',
        duracionMeses: 1,
        precio: 15,
        descripcion: 'Plan especial para niños',
        tag: 'Niño'
    }
];

class PlanService {
    // Obtener todos los planes
    async getPlanes(): Promise<Plan[]> {
        try {
            const response = await api.get('/planes');
            return response.data;
        } catch (error) {
            console.error('Error al obtener planes:', error);
            // Si falla la API, devolvemos los datos mock
            return PLANES_MOCK;
        }
    }

    // Obtener un plan por ID
    async getPlanById(id: number): Promise<Plan | null> {
        try {
            const response = await api.get(`/planes/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error al obtener plan con ID ${id}:`, error);
            // Si falla la API, buscamos en los datos mock
            return PLANES_MOCK.find(plan => plan.idPlan === id) || null;
        }
    }

    // Calcular fecha de fin basada en la fecha de inicio y el plan seleccionado
    calcularFechaFin(fechaInicio: string, duracionMeses: number): string {
        if (!fechaInicio) return '';

        const fecha = new Date(fechaInicio);
        fecha.setMonth(fecha.getMonth() + duracionMeses);
        return fecha.toISOString().split('T')[0];
    }

    // Filtrar planes por ocupación
    filtrarPorOcupacion(planes: Plan[], ocupacion: string): Plan[] {
        if (!planes || planes.length === 0) return [];

        if (ocupacion === 'Niño') {
            return planes.filter(plan => plan.tag === 'Niño');
        } else if (ocupacion === 'Estudiante') {
            return planes.filter(plan => plan.tag === 'Estudiante');
        } else {
            return planes.filter(plan => plan.tag === 'Trabajo');
        }
    }
}

// Exportamos una instancia del servicio
export const planService = new PlanService();