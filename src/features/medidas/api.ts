// src/features/medidas/api.ts
import { api } from '$lib/services/api';
import { calcularIMC } from '$lib/utils';

// Interfaz para la entidad Medida
export interface Medida {
    idMedida: number;
    idCliente: number;
    peso?: number;
    altura?: number;
    brazos?: number;
    pantorrillas?: number;
    cuello?: number;
    muslos?: number;
    pecho?: number;
    cintura?: number;
    gluteo?: number;
    imc?: number;
    categoriaPeso?: string;
    createdAt: string;
    updatedAt: string;
}

export interface MedidaDTO {
    id?: number;
    idCliente?: number;
    peso?: number;
    altura?: number;
    brazos?: number;
    pantorrillas?: number;
    cuello?: number;
    muslos?: number;
    pecho?: number;
    cintura?: number;
    gluteo?: number;
    imc?: number;
    categoriaPeso?: string;
}

class MedidaService {
    calcularIMC(peso?: number, altura?: number) {
        return calcularIMC(peso, altura);
    }

    async getMedidas(): Promise<Medida[]> {
        try {
            const response = await api.get('/medidas');
            return response.data;
        } catch (error) {
            console.error('Error al obtener medidas:', error);
            return [];
        }
    }    async getMedidaById(id: number): Promise<Medida | null> {
        try {
            const response = await api.get(`/medidas/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error al obtener medida con ID ${id}:`, error);
            return null;
        }
    }    async getMedidasByCliente(idCliente: number): Promise<Medida[]> {
        try {
            const response = await api.get(`/medidas/cliente/${idCliente}`);
            return Array.isArray(response.data) ? response.data : [];
        } catch (error) {
            console.error(`Error al obtener medidas del cliente ${idCliente}:`, error);
            return [];
        }
    }    async getUltimaMedida(idCliente: number): Promise<Medida | null> {
        try {
            const response = await api.get(`/medidas/cliente/${idCliente}/ultima`);
            return response.data;
        } catch (error) {
            console.error(`Error al obtener última medida del cliente ${idCliente}:`, error);
            return null;
        }
    }

    async createMedida(medidaData: MedidaDTO): Promise<Medida | null> {
        try {
            // Calcular IMC automáticamente si no se proporciona
            if ((!medidaData.imc || !medidaData.categoriaPeso) && medidaData.peso && medidaData.altura) {
                const imcResult = this.calcularIMC(medidaData.peso, medidaData.altura);
                if (imcResult) {
                    medidaData.imc = medidaData.imc || imcResult.imc;
                    medidaData.categoriaPeso = medidaData.categoriaPeso || imcResult.categoria;
                }
            }

            const response = await api.post('/medidas', medidaData);
            return response.data;
        } catch (error) {
            console.error('Error al crear medida:', error);
            throw error;
        }
    }

    async updateMedida(id: number, medidaData: Partial<MedidaDTO>): Promise<Medida | null> {
        try {
            // Recalcular IMC si se actualiza peso o altura
            if ((medidaData.peso || medidaData.altura) && (!medidaData.imc || !medidaData.categoriaPeso)) {
                const existingMedida = await this.getMedidaById(id);
                if (existingMedida) {
                    const peso = medidaData.peso || existingMedida.peso;
                    const altura = medidaData.altura || existingMedida.altura;

                    if (peso && altura) {
                        const imcResult = this.calcularIMC(peso, altura);
                        if (imcResult) {
                            medidaData.imc = medidaData.imc || imcResult.imc;
                            medidaData.categoriaPeso = medidaData.categoriaPeso || imcResult.categoria;
                        }
                    }
                }
            }

            const response = await api.patch(`/medidas/${id}`, medidaData);
            return response.data;
        } catch (error) {
            console.error(`Error al actualizar medida con ID ${id}:`, error);
            throw error;
        }
    }

    async deleteMedida(id: number): Promise<boolean> {
        try {
            await api.delete(`/medidas/${id}`);
            return true;
        } catch (error) {
            console.error(`Error al eliminar medida con ID ${id}:`, error);
            return false;
        }
    }
}

export const medidaService = new MedidaService();