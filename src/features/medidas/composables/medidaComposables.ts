// src/features/medidas/composables/medidaComposables.ts
import { writable, derived, type Writable, type Readable } from 'svelte/store';
import { medidaService, type Medida, type MedidaDTO } from '../api';
import { toasts } from '$lib/stores/toastStore';
import { formatDate } from '$lib/utils';

// Re-exportar tipos para fácil acceso
export type { Medida, MedidaDTO } from '../api';

// ============= COMPOSABLE PARA LISTA DE MEDIDAS =============
export function createMedidasListStore(clienteId: number) {
    // Estados internos
    const _medidas = writable<Medida[]>([]);
    const _isLoading = writable(false);
    const _error = writable<string | null>(null);
    const _lastUpdated = writable<Date | null>(null);

    // Estados derivados
    const medidasOrdenadas: Readable<Medida[]> = derived(_medidas, $medidas => 
        $medidas.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    );

    const ultimaMedida: Readable<Medida | null> = derived(medidasOrdenadas, $medidas => 
        $medidas.length > 0 ? $medidas[0] : null
    );

    const totalMedidas: Readable<number> = derived(_medidas, $medidas => $medidas.length);

    // Acciones
    async function cargarMedidas(): Promise<void> {
        if (!clienteId) return;
        
        _isLoading.set(true);
        _error.set(null);
        
        try {
            const medidas = await medidaService.getMedidasByCliente(clienteId);
            _medidas.set(medidas);
            _lastUpdated.set(new Date());
        } catch (error) {
            console.error('Error al cargar medidas:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error al cargar medidas';
            _error.set(errorMessage);
            toasts.showToast(errorMessage, 'error');
        } finally {
            _isLoading.set(false);
        }
    }

    async function crearMedida(medidaData: MedidaDTO): Promise<Medida | null> {
        _isLoading.set(true);
        try {
            // Asegurar que tenga el clienteId
            const medidaCompleta = { ...medidaData, idCliente: clienteId };
            const nuevaMedida = await medidaService.createMedida(medidaCompleta);
            
            if (nuevaMedida) {
                // Refrescar la lista completa para asegurar consistencia
                await cargarMedidas();
                toasts.showToast('Medida registrada correctamente', 'success');
                return nuevaMedida;
            }
            return null;
        } catch (error) {
            console.error('Error al crear medida:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error al registrar medida';
            toasts.showToast(errorMessage, 'error');
            throw error;
        } finally {
            _isLoading.set(false);
        }
    }

    async function actualizarMedida(id: number, datos: Partial<MedidaDTO>): Promise<boolean> {
        try {
            const medidaActualizada = await medidaService.updateMedida(id, datos);
            if (medidaActualizada) {
                // Actualizar el elemento en la lista local
                _medidas.update(medidas => 
                    medidas.map(medida => 
                        medida.idMedida === id ? medidaActualizada : medida
                    )
                );
                toasts.showToast('Medida actualizada correctamente', 'success');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error al actualizar medida:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error al actualizar medida';
            toasts.showToast(errorMessage, 'error');
            return false;
        }
    }

    async function eliminarMedida(id: number): Promise<boolean> {
        try {
            const eliminada = await medidaService.deleteMedida(id);
            if (eliminada) {
                // Remover de la lista local
                _medidas.update(medidas => medidas.filter(medida => medida.idMedida !== id));
                toasts.showToast('Medida eliminada correctamente', 'success');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error al eliminar medida:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error al eliminar medida';
            toasts.showToast(errorMessage, 'error');
            return false;
        }
    }

    function reset(): void {
        _medidas.set([]);
        _isLoading.set(false);
        _error.set(null);
        _lastUpdated.set(null);
    }

    return {
        // Estados reactivos
        medidas: _medidas as Readable<Medida[]>,
        medidasOrdenadas,
        ultimaMedida,
        totalMedidas,
        isLoading: _isLoading as Readable<boolean>,
        error: _error as Readable<string | null>,
        lastUpdated: _lastUpdated as Readable<Date | null>,
        
        // Acciones
        cargarMedidas,
        crearMedida,
        actualizarMedida,
        eliminarMedida,
        reset
    };
}

// ============= COMPOSABLE PARA MEDIDA INDIVIDUAL =============
export function createMedidaStore(medidaId: number) {
    // Estados internos
    const _medida = writable<Medida | null>(null);
    const _isLoading = writable(false);
    const _error = writable<string | null>(null);

    // Acciones
    async function cargarMedida(): Promise<void> {
        if (!medidaId) return;
        
        _isLoading.set(true);
        _error.set(null);
        
        try {
            const medida = await medidaService.getMedidaById(medidaId);
            _medida.set(medida);
        } catch (error) {
            console.error('Error al cargar medida:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error al cargar medida';
            _error.set(errorMessage);
            toasts.showToast(errorMessage, 'error');
        } finally {
            _isLoading.set(false);
        }
    }

    async function actualizarMedida(datos: Partial<MedidaDTO>): Promise<boolean> {
        if (!medidaId) return false;
        
        try {
            const medidaActualizada = await medidaService.updateMedida(medidaId, datos);
            if (medidaActualizada) {
                _medida.set(medidaActualizada);
                toasts.showToast('Medida actualizada correctamente', 'success');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error al actualizar medida:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error al actualizar medida';
            toasts.showToast(errorMessage, 'error');
            return false;
        }
    }

    async function eliminarMedida(): Promise<boolean> {
        if (!medidaId) return false;
        
        try {
            const eliminada = await medidaService.deleteMedida(medidaId);
            if (eliminada) {
                _medida.set(null);
                toasts.showToast('Medida eliminada correctamente', 'success');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error al eliminar medida:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error al eliminar medida';
            toasts.showToast(errorMessage, 'error');
            return false;
        }
    }

    function reset(): void {
        _medida.set(null);
        _isLoading.set(false);
        _error.set(null);
    }

    return {
        // Estados reactivos
        medida: _medida as Readable<Medida | null>,
        isLoading: _isLoading as Readable<boolean>,
        error: _error as Readable<string | null>,
        
        // Acciones
        cargarMedida,
        actualizarMedida,
        eliminarMedida,
        reset
    };
}

// ============= UTILIDADES PARA MEDIDAS =============
export const medidaUtils = {
    /**
     * Formatea una fecha para mostrar
     */
    formatDate(dateString: string): string {
        return formatDate(dateString);
    },

    /**
     * Calcula el IMC y devuelve IMC + categoría
     */
    calcularIMC(peso?: number, altura?: number): { imc: number; categoria: string } | null {
        if (!peso || !altura) return null;
        
        // Convertir altura a metros si viene en cm
        const alturaMetros = altura > 3 ? altura / 100 : altura;
        const imcValue = peso / (alturaMetros * alturaMetros);

        let categoria = '';
        if (imcValue < 18.5) categoria = 'Bajo peso';
        else if (imcValue < 25) categoria = 'Normal';
        else if (imcValue < 30) categoria = 'Sobrepeso';
        else categoria = 'Obesidad';

        return {
            imc: parseFloat(imcValue.toFixed(2)),
            categoria
        };
    },

    /**
     * Valida que un valor esté en el rango esperado
     */
    validateRange(value: string | number, min: number, max: number): boolean {
        if (value === null || value === undefined || value === '') return true;
        const num = typeof value === 'number' ? value : parseFloat(String(value));
        if (isNaN(num)) return false;
        return num >= min && num <= max;
    },

    /**
     * Obtiene mensaje de advertencia para rangos
     */
    getRangeWarning(field: string, value: string | number): string {
        if (value === null || value === undefined || value === '') return '';
        const num = typeof value === 'number' ? value : parseFloat(String(value));

        const ranges: Record<string, { min: number; max: number; unit: string }> = {
            peso: { min: 20, max: 300, unit: 'kg' },
            altura: { min: 50, max: 250, unit: 'cm' },
            brazos: { min: 15, max: 60, unit: 'cm' },
            pantorrillas: { min: 20, max: 80, unit: 'cm' },
            gluteo: { min: 60, max: 200, unit: 'cm' },
            muslos: { min: 30, max: 100, unit: 'cm' },
            pecho: { min: 60, max: 200, unit: 'cm' },
            cintura: { min: 40, max: 200, unit: 'cm' },
            cuello: { min: 20, max: 60, unit: 'cm' }
        };

        const range = ranges[field];
        if (!range) return '';

        if (isNaN(num) || num < range.min || num > range.max) {
            return `Valor fuera del rango esperado (${range.min}-${range.max} ${range.unit})`;
        }

        return '';
    },    /**
     * Obtiene los datos para gráficos de evolución
     */
    getChartData(medidas: Medida[], metrica: string): Array<Record<string, any>> {
        return medidas
            .filter(medida => medida[metrica as keyof Medida] != null)
            .map(medida => ({
                fecha: formatDate(medida.createdAt),
                [metrica]: Number(medida[metrica as keyof Medida]) || 0
            }))
            .reverse(); // Orden cronológico para el gráfico
    },

    /**
     * Obtiene las métricas disponibles según el tipo de cliente
     */
    getMetricasDisponibles(esNino: boolean = false) {
        const metricasBase = [
            { key: 'peso', label: 'Peso (kg)', color: '#8C3D87' },
            { key: 'altura', label: 'Altura (cm)', color: '#4A90E2' },
            { key: 'imc', label: 'IMC', color: '#3777C6' }
        ];

        if (esNino) {
            return metricasBase;
        }

        return [
            ...metricasBase,
            { key: 'brazos', label: 'Brazos (cm)', color: '#E74C3C' },
            { key: 'pantorrillas', label: 'Pantorrillas (cm)', color: '#F39C12' },
            { key: 'gluteo', label: 'Glúteo (cm)', color: '#9B59B6' },
            { key: 'muslos', label: 'Muslos (cm)', color: '#1ABC9C' },
            { key: 'pecho', label: 'Pecho (cm)', color: '#2ECC71' },
            { key: 'cintura', label: 'Cintura (cm)', color: '#E67E22' },
            { key: 'cuello', label: 'Cuello (cm)', color: '#34495E' }
        ];
    }
};
