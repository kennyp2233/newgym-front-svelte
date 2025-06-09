import { api } from '$lib/services/api';
import type { Medida } from '../medidas/api';

// Enums que deben coincidir con el backend
export enum TipoOcupacion {
    TRABAJO = 'Trabajo',
    ESTUDIANTE = 'Estudiante',
    NINO = 'Niño',
}

// Interfaces para los DTOs
export interface ClienteDTO {
    id?: number;
    nombre: string;
    apellido: string;
    cedula: string;
    celular: string;
    direccion: string;
    ciudad: string;
    pais: string;
    correo: string;
    ocupacion: TipoOcupacion;
    puestoTrabajo?: string;
    fechaNacimiento?: string;
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

export interface InscripcionDTO {
    id?: number;
    idCliente?: number;
    idPlan?: number;
    fechaInicio: string;
    fechaFin?: string;
    plan?: {
        idPlan: number;
        nombre: string;
        duracionMeses: number;
        precio: number;
        descripcion?: string;
    };
}

// DTO para registro completo
export interface RegistroCompletoDTO {
    cliente: ClienteDTO;
    medidas: MedidaDTO;
    inscripcion: InscripcionDTO;
    pago: {
        monto: number;
        referencia?: string;
        observaciones?: string;
    };
    cuotaMantenimiento?: {
        pagarAhora: boolean;
        observaciones?: string;
    };
}

// Tipo para la estructura de un cliente (como se retornará del backend)
export interface Cliente {
    idCliente: number;
    nombre: string;
    apellido: string;
    cedula: string;
    celular: string;
    direccion: string;
    ciudad: string;
    pais: string;
    correo: string;
    ocupacion: TipoOcupacion;
    puestoTrabajo?: string;
    fechaNacimiento?: string;
    createdAt: string;
    updatedAt: string;
    inscripciones?: InscripcionDTO[];
    medidas?: Medida[];
}

// Servicio para las operaciones de clientes
class ClienteService {
    // Obtener todos los clientes
    async getClientes(): Promise<Cliente[]> {
        try {
            const response = await api.get('/clientes');
            return response.data;
        } catch (error) {
            console.error('Error al obtener clientes:', error);
            return [];
        }
    }

    // Obtener un cliente por ID
    async getClienteById(id: number): Promise<Cliente | null> {
        try {
            const response = await api.get(`/clientes/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error al obtener cliente con ID ${id}:`, error);
            return null;
        }
    }    // Buscar cliente por cédula
    async getClienteByCedula(cedula: string): Promise<Cliente | null> {
        try {
            const response = await api.get(`/clientes/cedula/${cedula}`);
            return response.data;
        } catch (error) {
            console.error(`Error al buscar cliente con cédula ${cedula}:`, error);
            return null;
        }
    }

    // Verificar si existe una cédula en la base de datos
    async verificarCedulaExiste(cedula: string): Promise<boolean> {
        try {
            const response = await api.get(`/clientes/chequeoCI/${cedula}`);
            return response.data === true || response.data === "true";
        } catch (error) {
            console.error(`Error al verificar cédula ${cedula}:`, error);
            return false;
        }
    }

    // Crear un nuevo cliente
    async createCliente(clienteData: ClienteDTO): Promise<Cliente | null> {
        try {
            const response = await api.post('/clientes', clienteData);
            return response.data;
        } catch (error) {
            console.error('Error al crear cliente:', error);
            throw error;
        }
    }

    // Actualizar un cliente existente
    async updateCliente(id: number, clienteData: Partial<ClienteDTO>): Promise<Cliente | null> {
        try {
            const response = await api.patch(`/clientes/${id}`, clienteData);
            return response.data;
        } catch (error) {
            console.error(`Error al actualizar cliente con ID ${id}:`, error);
            throw error;
        }
    }

    // Eliminar un cliente
    async deleteCliente(id: number): Promise<boolean> {
        try {
            await api.delete(`/clientes/${id}`);
            return true;
        } catch (error) {
            console.error(`Error al eliminar cliente con ID ${id}:`, error);
            return false;
        }
    }    // Registrar cliente completo (con medidas, inscripción y pago)
    async registrarCompleto(registroData: RegistroCompletoDTO): Promise<Cliente | null> {
        try {
            // Estructurar los datos según la documentación del backend
            const data: any = {
                cliente: registroData.cliente,
                medidas: registroData.medidas,
                inscripcion: {
                    ...registroData.inscripcion,
                    // Asegurarnos que las fechas estén en formato Date para el backend
                    fechaInicio: new Date(registroData.inscripcion.fechaInicio),
                    fechaFin: registroData.inscripcion.fechaFin
                        ? new Date(registroData.inscripcion.fechaFin)
                        : undefined
                },
                pago: {
                    monto: registroData.pago.monto,
                    referencia: registroData.pago.referencia,
                    observaciones: registroData.pago.observaciones
                }
            };

            // Solo agregar cuotaMantenimiento si está presente
            if (registroData.cuotaMantenimiento) {
                data.cuotaMantenimiento = registroData.cuotaMantenimiento;
            }

            console.log('Enviando datos completos al backend:', data);

            const response = await api.post('/clientes/registro', data);
            return response.data;
            return response.data;
        } catch (error) {
            console.error('Error al registrar cliente completo:', error);
            throw error;
        }
    }
}

// Exportamos una instancia del servicio
export const clienteService = new ClienteService();