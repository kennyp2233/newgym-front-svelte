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


class PlanService {    // Obtener todos los planes
    async getPlanes(): Promise<Plan[]> {
        try {
            const response = await api.get('/planes');
            return response.data;
        } catch (error) {
            console.error('Error al obtener planes:', error);
            return [];
        }
    }    // Obtener un plan por ID
    async getPlanById(id: number): Promise<Plan | null> {
        try {
            const response = await api.get(`/planes/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error al obtener plan con ID ${id}:`, error);
            return null;
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
