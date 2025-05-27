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
    }

    async getMedidaById(id: number): Promise<Medida | null> {
        try {
            const response = await api.get(`/medidas/${id}`);
            const data = response.data;
            if (data) {
                // Parsear campos numéricos
                data.idMedida = Number(data.idMedida);
                data.idCliente = Number(data.idCliente);
                data.peso = data.peso !== undefined ? Number(data.peso) : undefined;
                data.altura = data.altura !== undefined ? Number(data.altura) : undefined;
                data.brazos = data.brazos !== undefined ? Number(data.brazos) : undefined;
                data.pantorrillas = data.pantorrillas !== undefined ? Number(data.pantorrillas) : undefined;
                data.cuello = data.cuello !== undefined ? Number(data.cuello) : undefined;
                data.muslos = data.muslos !== undefined ? Number(data.muslos) : undefined;
                data.pecho = data.pecho !== undefined ? Number(data.pecho) : undefined;
                data.cintura = data.cintura !== undefined ? Number(data.cintura) : undefined;
                data.gluteo = data.gluteo !== undefined ? Number(data.gluteo) : undefined;
                data.imc = data.imc !== undefined ? Number(data.imc) : undefined;
            }
            return data;
        } catch (error) {
            console.error(`Error al obtener medida con ID ${id}:`, error);
            return null;
        }
    }

    async getMedidasByCliente(idCliente: number): Promise<Medida[]> {
        try {
            const response = await api.get(`/medidas/cliente/${idCliente}`);
            const medidas = response.data;
            if (Array.isArray(medidas)) {
                return medidas.map((data) => ({
                    ...data,
                    idMedida: Number(data.idMedida),
                    idCliente: Number(data.idCliente),
                    peso: data.peso !== undefined ? Number(data.peso) : undefined,
                    altura: data.altura !== undefined ? Number(data.altura) : undefined,
                    brazos: data.brazos !== undefined ? Number(data.brazos) : undefined,
                    pantorrillas: data.pantorrillas !== undefined ? Number(data.pantorrillas) : undefined,
                    cuello: data.cuello !== undefined ? Number(data.cuello) : undefined,
                    muslos: data.muslos !== undefined ? Number(data.muslos) : undefined,
                    pecho: data.pecho !== undefined ? Number(data.pecho) : undefined,
                    cintura: data.cintura !== undefined ? Number(data.cintura) : undefined,
                    gluteo: data.gluteo !== undefined ? Number(data.gluteo) : undefined,
                    imc: data.imc !== undefined ? Number(data.imc) : undefined,
                }));
            }
            return [];
        } catch (error) {
            console.error(`Error al obtener medidas del cliente ${idCliente}:`, error);
            return [];
        }
    }

    async getUltimaMedida(idCliente: number): Promise<Medida | null> {
        try {
            const response = await api.get(`/medidas/cliente/${idCliente}/ultima`);
            const data = response.data;
            if (data) {
                data.idMedida = Number(data.idMedida);
                data.idCliente = Number(data.idCliente);
                data.peso = data.peso !== undefined ? Number(data.peso) : undefined;
                data.altura = data.altura !== undefined ? Number(data.altura) : undefined;
                data.brazos = data.brazos !== undefined ? Number(data.brazos) : undefined;
                data.pantorrillas = data.pantorrillas !== undefined ? Number(data.pantorrillas) : undefined;
                data.cuello = data.cuello !== undefined ? Number(data.cuello) : undefined;
                data.muslos = data.muslos !== undefined ? Number(data.muslos) : undefined;
                data.pecho = data.pecho !== undefined ? Number(data.pecho) : undefined;
                data.cintura = data.cintura !== undefined ? Number(data.cintura) : undefined;
                data.gluteo = data.gluteo !== undefined ? Number(data.gluteo) : undefined;
                data.imc = data.imc !== undefined ? Number(data.imc) : undefined;
            }
            return data;
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