// src/lib/stores/clienteStore.ts
import { writable } from 'svelte/store';
import { clienteService, type Cliente } from '../api';

interface ClienteState {
    clientes: Cliente[];
    loading: boolean;
    error: string | null;
    searchTerm: string;
}

const initialState: ClienteState = {
    clientes: [],
    loading: false,
    error: null,
    searchTerm: ''
};

function createClienteStore() {
    const { subscribe, set, update } = writable<ClienteState>(initialState);

    return {
        subscribe,

        // Cargar todos los clientes
        async loadClientes() {
            update(state => ({ ...state, loading: true, error: null }));
            try {
                const clientes = await clienteService.getClientes();
                update(state => ({ ...state, clientes, loading: false }));
            } catch (error) {
                update(state => ({
                    ...state,
                    loading: false,
                    error: error instanceof Error ? error.message : 'Error desconocido'
                }));
            }
        },

        // Agregar cliente
        async addCliente(clienteData: any) {
            update(state => ({ ...state, loading: true }));
            try {
                const nuevoCliente = await clienteService.registrarCompleto(clienteData);
                if (nuevoCliente) {
                    update(state => ({
                        ...state,
                        clientes: [nuevoCliente, ...state.clientes],
                        loading: false
                    }));
                }
                return nuevoCliente;
            } catch (error) {
                update(state => ({ ...state, loading: false }));
                throw error;
            }
        },

        // Actualizar cliente
        async updateCliente(id: number, clienteData: any) {
            update(state => ({ ...state, loading: true }));
            try {
                const clienteActualizado = await clienteService.updateCliente(id, clienteData);
                if (clienteActualizado) {
                    update(state => ({
                        ...state,
                        clientes: state.clientes.map(c =>
                            c.idCliente === id ? clienteActualizado : c
                        ),
                        loading: false
                    }));
                }
                return clienteActualizado;
            } catch (error) {
                update(state => ({ ...state, loading: false }));
                throw error;
            }
        },

        // Eliminar cliente
        async deleteCliente(id: number) {
            update(state => ({ ...state, loading: true }));
            try {
                const success = await clienteService.deleteCliente(id);
                if (success) {
                    update(state => ({
                        ...state,
                        clientes: state.clientes.filter(c => c.idCliente !== id),
                        loading: false
                    }));
                }
                return success;
            } catch (error) {
                update(state => ({ ...state, loading: false }));
                throw error;
            }
        },

        // Actualizar término de búsqueda
        setSearchTerm(term: string) {
            update(state => ({ ...state, searchTerm: term }));
        },

        // Reset store
        reset() {
            set(initialState);
        }
    };
}

export const clienteStore = createClienteStore();