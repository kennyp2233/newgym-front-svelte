// src/features/clientes/composables/clienteComposables.ts
import { writable, derived, get } from 'svelte/store';
import type { Writable, Readable } from 'svelte/store';
import { clienteService, type Cliente, type RegistroCompletoDTO, TipoOcupacion } from '../api';
import { toasts } from '$lib/stores/toastStore';
import { createForm } from 'svelte-forms-lib';
import { EditClienteSchema, createEditClienteFormValues } from '../forms/validation';

/**
 * Composable para manejar la lógica de clientes individuales
 */
export function createClienteStore(clienteId?: number) {
    // Estados internos
    const _cliente = writable<Cliente | null>(null);
    const _isLoading = writable(false);
    const _lastUpdated = writable<Date | null>(null);
    const _error = writable<string | null>(null);

    // Estados derivados
    const esActivo: Readable<boolean> = derived(_cliente, $cliente => {
        if (!$cliente?.inscripciones?.length) return false;
        
        const inscripcionActiva = $cliente.inscripciones.sort(
            (a, b) => new Date(b.fechaFin || '').getTime() - new Date(a.fechaFin || '').getTime()
        )[0];
        
        return inscripcionActiva ? new Date(inscripcionActiva.fechaFin || '') > new Date() : false;
    });

    const inscripcionActiva: Readable<any | null> = derived(_cliente, $cliente => {
        if (!$cliente?.inscripciones?.length) return null;
        
        return $cliente.inscripciones.sort(
            (a, b) => new Date(b.fechaFin || '').getTime() - new Date(a.fechaFin || '').getTime()
        )[0];
    });

    const diasRestantes: Readable<number> = derived(inscripcionActiva, $inscripcion => {
        if (!$inscripcion?.fechaFin) return 0;
        
        const fechaFin = new Date($inscripcion.fechaFin);
        const hoy = new Date();
        const diferencia = Math.ceil((fechaFin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        
        return Math.max(0, diferencia);
    });

    // Acciones
    async function cargarCliente(): Promise<void> {
        if (!clienteId) return;

        _isLoading.set(true);
        _error.set(null);
        
        try {
            const cliente = await clienteService.getClienteById(clienteId);
            if (cliente) {
                _cliente.set(cliente);
                _lastUpdated.set(new Date());
            } else {
                _error.set('Cliente no encontrado');
            }
        } catch (error) {
            console.error('Error al cargar cliente:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error al cargar cliente';
            _error.set(errorMessage);
            toasts.showToast(errorMessage, 'error');
        } finally {
            _isLoading.set(false);
        }
    }

    async function actualizarCliente(datos: Partial<Cliente>): Promise<boolean> {
        if (!clienteId) return false;

        _isLoading.set(true);
        try {
            const clienteActualizado = await clienteService.updateCliente(clienteId, datos);
            if (clienteActualizado) {
                _cliente.set(clienteActualizado);
                _lastUpdated.set(new Date());
                toasts.showToast('Cliente actualizado correctamente', 'success');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error al actualizar cliente:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error al actualizar cliente';
            toasts.showToast(errorMessage, 'error');
            return false;
        } finally {
            _isLoading.set(false);
        }
    }

    async function eliminarCliente(): Promise<boolean> {
        if (!clienteId) return false;

        try {
            const exito = await clienteService.deleteCliente(clienteId);
            if (exito) {
                _cliente.set(null);
                toasts.showToast('Cliente eliminado correctamente', 'success');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error al eliminar cliente:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error al eliminar cliente';
            toasts.showToast(errorMessage, 'error');
            return false;
        }
    }

    async function buscarPorCedula(cedula: string): Promise<Cliente | null> {
        try {
            const cliente = await clienteService.getClienteByCedula(cedula);
            if (cliente) {
                _cliente.set(cliente);
                _lastUpdated.set(new Date());
            }
            return cliente;
        } catch (error) {
            console.error('Error al buscar cliente por cédula:', error);
            return null;
        }
    }

    return {
        // Estados readonly
        cliente: { subscribe: _cliente.subscribe },
        isLoading: { subscribe: _isLoading.subscribe },
        error: { subscribe: _error.subscribe },
        lastUpdated: { subscribe: _lastUpdated.subscribe },
        
        // Estados derivados
        esActivo,
        inscripcionActiva,
        diasRestantes,
        
        // Acciones
        cargarCliente,
        actualizarCliente,
        eliminarCliente,
        buscarPorCedula,
        
        // Métodos de utilidad
        setCliente: (cliente: Cliente | null) => _cliente.set(cliente),
        clearError: () => _error.set(null)
    };
}

/**
 * Composable para manejar la lista de clientes
 */
export function createClientesListStore() {
    // Estados internos
    const _clientes = writable<Cliente[]>([]);
    const _isLoading = writable(false);
    const _error = writable<string | null>(null);
    const _searchTerm = writable('');
    const _lastUpdated = writable<Date | null>(null);

    // Estados derivados
    const clientesFiltrados: Readable<Cliente[]> = derived(
        [_clientes, _searchTerm], 
        ([$clientes, $searchTerm]) => {
            if (!$searchTerm.trim()) return $clientes;
            
            const term = $searchTerm.toLowerCase();
            return $clientes.filter(cliente => 
                cliente &&
                cliente.idCliente &&
                (
                    `${cliente.nombre} ${cliente.apellido}`.toLowerCase().includes(term) ||
                    cliente.cedula.includes($searchTerm) ||
                    cliente.celular.includes($searchTerm)
                )
            );
        }
    );

    const totalClientes: Readable<number> = derived(_clientes, $clientes => $clientes.length);

    const clientesActivos: Readable<Cliente[]> = derived(_clientes, $clientes => 
        $clientes.filter(cliente => {
            if (!cliente?.inscripciones?.length) return false;
            
            const inscripcionActiva = cliente.inscripciones.sort(
                (a, b) => new Date(b.fechaFin || '').getTime() - new Date(a.fechaFin || '').getTime()
            )[0];
            
            return inscripcionActiva ? new Date(inscripcionActiva.fechaFin || '') > new Date() : false;
        })
    );

    const clientesInactivos: Readable<Cliente[]> = derived(_clientes, $clientes => 
        $clientes.filter(cliente => {
            if (!cliente?.inscripciones?.length) return true;
            
            const inscripcionActiva = cliente.inscripciones.sort(
                (a, b) => new Date(b.fechaFin || '').getTime() - new Date(a.fechaFin || '').getTime()
            )[0];
            
            return inscripcionActiva ? new Date(inscripcionActiva.fechaFin || '') <= new Date() : true;
        })
    );

    // Acciones
    async function cargarClientes(): Promise<void> {
        _isLoading.set(true);
        _error.set(null);
        
        try {
            const clientes = await clienteService.getClientes();
            _clientes.set(clientes);
            _lastUpdated.set(new Date());
        } catch (error) {
            console.error('Error al cargar clientes:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error al cargar clientes';
            _error.set(errorMessage);
            toasts.showToast(errorMessage, 'error');
        } finally {
            _isLoading.set(false);
        }
    }

    async function crearCliente(registroData: RegistroCompletoDTO): Promise<Cliente | null> {
        _isLoading.set(true);
        try {
            const nuevoCliente = await clienteService.registrarCompleto(registroData);
            
            if (nuevoCliente) {
                // Refrescar la lista completa para asegurar consistencia
                await cargarClientes();
                toasts.showToast('Cliente registrado correctamente', 'success');
                return nuevoCliente;
            }
            return null;
        } catch (error) {
            console.error('Error al crear cliente:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error al registrar cliente';
            toasts.showToast(errorMessage, 'error');
            throw error;
        } finally {
            _isLoading.set(false);
        }
    }

    async function actualizarCliente(id: number, datos: Partial<Cliente>): Promise<boolean> {
        try {
            const clienteActualizado = await clienteService.updateCliente(id, datos);
            if (clienteActualizado) {
                _clientes.update(clientes => 
                    clientes.map(c => c.idCliente === id ? clienteActualizado : c)
                );
                _lastUpdated.set(new Date());
                toasts.showToast('Cliente actualizado correctamente', 'success');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error al actualizar cliente:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error al actualizar cliente';
            toasts.showToast(errorMessage, 'error');
            return false;
        }
    }

    async function eliminarCliente(id: number): Promise<boolean> {
        try {
            const exito = await clienteService.deleteCliente(id);
            if (exito) {
                _clientes.update(clientes => 
                    clientes.filter(c => c.idCliente !== id)
                );
                _lastUpdated.set(new Date());
                toasts.showToast('Cliente eliminado correctamente', 'success');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error al eliminar cliente:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error al eliminar cliente';
            toasts.showToast(errorMessage, 'error');
            return false;
        }
    }

    function setSearchTerm(term: string): void {
        _searchTerm.set(term);
    }

    function clearSearch(): void {
        _searchTerm.set('');
    }

    function reset(): void {
        _clientes.set([]);
        _isLoading.set(false);
        _error.set(null);
        _searchTerm.set('');
        _lastUpdated.set(null);
    }

    return {
        // Estados readonly
        clientes: { subscribe: _clientes.subscribe },
        isLoading: { subscribe: _isLoading.subscribe },
        error: { subscribe: _error.subscribe },
        searchTerm: { subscribe: _searchTerm.subscribe },
        lastUpdated: { subscribe: _lastUpdated.subscribe },
        
        // Estados derivados
        clientesFiltrados,
        totalClientes,
        clientesActivos,
        clientesInactivos,
        
        // Acciones
        cargarClientes,
        crearCliente,
        actualizarCliente,
        eliminarCliente,
        setSearchTerm,
        clearSearch,
        reset
    };
}

/**
 * Utilidades para cálculos y formateo de clientes
 */
export const clienteUtils = {
    /**
     * Determina el estado de membresía de un cliente
     */
    determinarEstado(cliente: Cliente): string {
        if (!cliente?.inscripciones?.length) {
            return 'Sin membresía';
        }

        const inscripcionActiva = cliente.inscripciones.sort(
            (a, b) => new Date(b.fechaFin || '').getTime() - new Date(a.fechaFin || '').getTime()
        )[0];

        if (!inscripcionActiva?.fechaFin) {
            return 'Sin membresía';
        }

        const fechaFin = new Date(inscripcionActiva.fechaFin);
        const hoy = new Date();

        if (fechaFin > hoy) {
            return 'Activo';
        } else {
            return 'Vencido';
        }
    },

    /**
     * Calcula los días restantes de membresía
     */
    calcularDiasRestantes(cliente: Cliente): number {
        if (!cliente?.inscripciones?.length) return 0;

        const inscripcionActiva = cliente.inscripciones.sort(
            (a, b) => new Date(b.fechaFin || '').getTime() - new Date(a.fechaFin || '').getTime()
        )[0];

        if (!inscripcionActiva?.fechaFin) return 0;

        const fechaFin = new Date(inscripcionActiva.fechaFin);
        const hoy = new Date();
        const diferencia = Math.ceil((fechaFin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

        return Math.max(0, diferencia);
    },

    /**
     * Formatea el nombre completo del cliente
     */
    formatearNombreCompleto(cliente: Cliente): string {
        return `${cliente.nombre} ${cliente.apellido}`;
    },

    /**
     * Obtiene el color del estado de membresía
     */
    obtenerColorEstado(estado: string): string {
        switch (estado) {
            case 'Activo':
                return 'text-green-600 bg-green-100';
            case 'Vencido':
                return 'text-red-600 bg-red-100';
            case 'Sin membresía':
                return 'text-gray-600 bg-gray-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    },

    /**
     * Formatea la fecha de nacimiento como edad
     */
    calcularEdad(fechaNacimiento?: string): number | null {
        if (!fechaNacimiento) return null;

        const hoy = new Date();
        const nacimiento = new Date(fechaNacimiento);
        let edad = hoy.getFullYear() - nacimiento.getFullYear();
        const mesActual = hoy.getMonth();
        const mesNacimiento = nacimiento.getMonth();

        if (mesActual < mesNacimiento || (mesActual === mesNacimiento && hoy.getDate() < nacimiento.getDate())) {
            edad--;
        }

        return edad;
    },

    /**
     * Verifica si un cliente es menor de edad
     */
    esMenorDeEdad(cliente: Cliente): boolean {
        const edad = this.calcularEdad(cliente.fechaNacimiento);
        return edad !== null && edad < 18;
    },    /**
     * Obtiene la información de contacto principal
     */
    obtenerContactoPrincipal(cliente: Cliente): { tipo: string; valor: string } {
        if (cliente.celular) {
            return { tipo: 'Celular', valor: cliente.celular };
        }
        if (cliente.correo) {
            return { tipo: 'Email', valor: cliente.correo };
        }
        return { tipo: 'Sin contacto', valor: '-' };
    },

    /**
     * Formatea una fecha para mostrar
     */
    formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    },

    /**
     * Obtiene información de membresía del cliente
     */
    getMembresia(cliente: Cliente): string {
        if (!cliente?.inscripciones?.length) return 'Sin membresía';
        
        const inscripcionActiva = cliente.inscripciones.sort(
            (a, b) => new Date(b.fechaFin || '').getTime() - new Date(a.fechaFin || '').getTime()
        )[0];
        
        if (!inscripcionActiva?.plan) return 'Sin plan activo';
        
        const fechaFin = inscripcionActiva.fechaFin ? new Date(inscripcionActiva.fechaFin) : null;
        const hoy = new Date();
        const estado = fechaFin && fechaFin > hoy ? 'Activo' : 'Vencido';
        
        return `${inscripcionActiva.plan.nombre} (${estado})`;
    },

    /**
     * Obtiene el ID del plan actual del cliente
     */
    getPlanActualId(cliente: Cliente): number | undefined {
        if (!cliente?.inscripciones?.length) return undefined;
        
        const inscripcionActiva = cliente.inscripciones.sort(
            (a, b) => new Date(b.fechaFin || '').getTime() - new Date(a.fechaFin || '').getTime()
        )[0];
        
        return inscripcionActiva?.plan?.idPlan;
    }
};

/**
 * Composable para validación de renovación de clientes
 */
export function createRenovacionValidator(cliente: Cliente) {
    const _puedeRenovar = writable(false);
    const _mensaje = writable('');
    const _isLoading = writable(false);

    async function validarRenovacion(): Promise<void> {
        _isLoading.set(true);
        
        try {
            if (!cliente.inscripciones?.length) {
                _puedeRenovar.set(false);
                _mensaje.set('El cliente no tiene inscripciones previas');
                return;
            }

            const inscripcionActiva = cliente.inscripciones.sort(
                (a, b) => new Date(b.fechaFin || '').getTime() - new Date(a.fechaFin || '').getTime()
            )[0];

            if (!inscripcionActiva) {
                _puedeRenovar.set(false);
                _mensaje.set('No se encontró inscripción activa');
                return;
            }

            const fechaFin = new Date(inscripcionActiva.fechaFin || '');
            const hoy = new Date();
            const diferenciaDias = Math.ceil((fechaFin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

            // Permitir renovación si la membresía vence en 7 días o menos, o ya venció
            if (diferenciaDias <= 7) {
                _puedeRenovar.set(true);
                if (diferenciaDias <= 0) {
                    _mensaje.set('La membresía ha vencido. Se puede renovar.');
                } else {
                    _mensaje.set(`La membresía vence en ${diferenciaDias} día(s). Se puede renovar.`);
                }
            } else {
                _puedeRenovar.set(false);
                _mensaje.set(`La membresía aún tiene ${diferenciaDias} días válidos. No se puede renovar todavía.`);
            }
        } catch (error) {
            console.error('Error al validar renovación:', error);
            _puedeRenovar.set(false);
            _mensaje.set('Error al validar renovación');
        } finally {
            _isLoading.set(false);
        }
    }

    const puedeRenovar = derived(_puedeRenovar, $puede => ({ 
        puede: $puede, 
        mensaje: '' 
    }));

    return {
        puedeRenovar: { subscribe: puedeRenovar.subscribe },
        mensaje: { subscribe: _mensaje.subscribe },
        isLoading: { subscribe: _isLoading.subscribe },
        validarRenovacion
    };
}

/**
 * Composable específico para editar información personal del cliente
 */
export function createEditClienteForm(cliente: Cliente, onSuccess?: () => void) {
    const isSubmitting = writable(false);

    // Configuración del formulario con svelte-forms-lib
    const { form, errors, touched, updateField } = createForm({
        initialValues: createEditClienteFormValues(cliente),
        onSubmit: () => {} // Manejo manual del submit
    });    // Wrapper para updateField que fuerza reactividad
    const updateFieldWrapper = (field: string, value: any) => {
        // Simplemente usar updateField directamente para evitar problemas de tipos
        (updateField as any)(field, value);
        form.update((current) => ({
            ...current,
            [field]: value
        }));
    };

    // Función de validación manual
    async function validateForm(): Promise<boolean> {
        try {
            const currentForm = get(form);
            await EditClienteSchema.validate(currentForm, { abortEarly: false });
            // Limpiar errores si la validación pasa
            const emptyErrors: Record<string, string> = {};
            Object.keys(currentForm).forEach(key => emptyErrors[key] = '');
            errors.set(emptyErrors);
            return true;
        } catch (yupError: any) {
            const newErrors: Record<string, string> = {};
            if (yupError.inner && yupError.inner.length > 0) {
                yupError.inner.forEach((err: any) => {
                    if (err.path) {
                        newErrors[err.path] = err.message;
                    }
                });
            } else if (yupError.path) {
                newErrors[yupError.path] = yupError.message;
            }

            errors.set(newErrors);

            // Marcar campos como touched
            const currentForm = get(form);
            const newTouched: Record<string, boolean> = {};
            Object.keys(currentForm).forEach((key) => (newTouched[key] = true));
            touched.set(newTouched as any);
            return false;
        }
    }

    // Función de submit
    async function handleSubmit(): Promise<boolean> {
        const isValid = await validateForm();
        
        if (!isValid) {
            toasts.showToast('Por favor, corrige los errores en el formulario.', 'warning');
            return false;
        }

        isSubmitting.set(true);
        try {
            const formData = get(form);
            const success = await clienteService.updateCliente(cliente.idCliente, {
                nombre: formData.nombre,
                apellido: formData.apellido,
                cedula: formData.cedula,
                celular: formData.celular,
                direccion: formData.direccion,
                ciudad: formData.ciudad,
                pais: formData.pais,
                correo: formData.correo,
                ocupacion: formData.ocupacion as TipoOcupacion,
                puestoTrabajo: formData.ocupacion === TipoOcupacion.TRABAJO ? formData.puestoTrabajo : undefined,
                fechaNacimiento: formData.fechaNacimiento || undefined
            });

            if (success) {
                toasts.showToast('Cliente actualizado correctamente', 'success');
                if (onSuccess) onSuccess();
                return true;
            }
            return false;
        } catch (error: any) {
            console.error('Error al actualizar cliente:', error);
            const errorMessage = error.response?.data?.message || 'Error al actualizar cliente';
            toasts.showToast(errorMessage, 'error');
            return false;
        } finally {
            isSubmitting.set(false);
        }
    }

    return {
        // Estados del formulario
        form: { subscribe: form.subscribe },
        errors: { subscribe: errors.subscribe },
        touched: { subscribe: touched.subscribe },
        isSubmitting: { subscribe: isSubmitting.subscribe },
        
        // Acciones
        updateField: updateFieldWrapper,
        handleSubmit,
        validateForm
    };
}
