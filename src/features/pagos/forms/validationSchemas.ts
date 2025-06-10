// src/features/clientes/components/individual/pagos/forms/validationSchemas.ts
import * as yup from 'yup';
import type { Plan } from '../../planes/api';

/**
 * Esquema de validación para nuevo pago/renovación
 */
export const nuevoPagoValidationSchema = yup.object({
    idPlan: yup.string().required('Debe seleccionar un plan'),
    // metodoPago field removed as per new requirements
    monto: yup
        .number()
        .nullable()
        .min(1, 'El monto debe ser mayor a $1.00')
        .test('decimal-places', 'Solo se permiten hasta 2 decimales', (value) => {
            if (!value) return true;
            const decimal = value.toString().split('.')[1];
            return !decimal || decimal.length <= 2;
        }),
    fechaInicio: yup.string().nullable(),
    referencia: yup.string().nullable(),
    observaciones: yup
        .string()
        .max(150, 'Las observaciones no pueden exceder 150 caracteres')
        .nullable()
});

/**
 * Esquema de validación para renovación con lógica de cuotas separadas
 */
export const createRenovacionValidationSchema = (cuotasPendientes: any[] = [], planes: Plan[] = []) => {
    return nuevoPagoValidationSchema.concat(
        yup.object({
            monto: yup
                .number()
                .required('El monto del plan es requerido')
                .min(0.01, 'El monto mínimo es $0.01')
                .test(
                    'max-plan-amount',
                    'El monto no puede exceder el precio del plan',
                    function (value) {
                        if (!value) return false;
                        
                        const { idPlan } = this.parent;
                        if (idPlan) {
                            const plan = planes.find((p) => p.idPlan === parseInt(idPlan));
                            if (plan && value > plan.precio) {
                                return this.createError({
                                    message: `El monto máximo para este plan es $${plan.precio.toFixed(2)}`
                                });
                            }
                        }
                        
                        return true;
                    }
                )
        })
    );
};

/**
 * Esquema de validación para editar pago existente
 */
export const editarPagoValidationSchema = yup.object({
    monto: yup.mixed()
        .test('is-required-number', 'El monto es requerido', (value: any) => {
            // Handle empty strings and null/undefined
            if (value === '' || value === null || value === undefined) {
                return false;
            }
            // Convert to number and check if it's valid
            const numValue = parseFloat(value);
            return !isNaN(numValue);
        })
        .test('min-value', 'El monto debe ser mayor a $1.00', (value: any) => {
            if (value === '' || value === null || value === undefined) return true;
            const numValue = parseFloat(value);
            return !isNaN(numValue) && numValue >= 1;
        })
        .test('decimal-places', 'Solo se permiten hasta 2 decimales', (value: any) => {
            if (value === '' || value === null || value === undefined) return true;
            const numValue = parseFloat(value);
            if (isNaN(numValue)) return true;
            const decimal = numValue.toString().split('.')[1];
            return !decimal || decimal.length <= 2;
        }),
    // metodoPago field removed as per new requirements
    // estado field removed - calculated automatically by backend based on payment amount
    referencia: yup.string().nullable(),
    observaciones: yup
        .string()
        .max(150, 'Las observaciones no pueden exceder 150 caracteres')
        .nullable()
});

/**
 * Función para crear esquema de validación dinámico basado en planes disponibles
 */
export function createDynamicValidationSchema(planes: Plan[], includeMaxAmountTest: boolean = true) {
    return nuevoPagoValidationSchema.concat(
        yup.object({
            monto: includeMaxAmountTest ? 
                yup.number()
                    .nullable()
                    .test(
                        'max-amount',
                        'El monto no puede exceder el precio del plan + renovación',
                        function (value) {
                            const { idPlan } = this.parent;
                            if (!value || !idPlan) return true;
                            const plan = planes.find((p) => p.idPlan === parseInt(idPlan));
                            if (!plan) return true;
                            const precioTotal = plan.precio + 10; // Plan + $10 renovación anual
                            return value <= precioTotal;
                        }
                    )
                : yup.number().nullable()
        })
    );
}

/**
 * Crea un esquema de validación dinámico para editar pago con validación de monto máximo
 */
export const createEditarPagoValidationSchema = (montoMaximo: number, allowZero: boolean = false) => {
    const montoMinimo = allowZero ? 0 : 1;
    const mensajeMinimo = allowZero ? 'El monto debe ser mayor o igual a $0.00' : 'El monto debe ser mayor a $1.00';
    
    return yup.object({
        monto: yup.mixed()
            .test('is-required-number', 'El monto es requerido', (value: any) => {
                // Handle empty strings and null/undefined
                if (value === '' || value === null || value === undefined) {
                    return false;
                }
                // Convert to number and check if it's valid
                const numValue = parseFloat(value);
                return !isNaN(numValue);
            })
            .test('min-value', mensajeMinimo, (value: any) => {
                if (value === '' || value === null || value === undefined) return true;
                const numValue = parseFloat(value);
                return !isNaN(numValue) && numValue >= montoMinimo;
            })
            .test('max-value', `El monto no puede exceder $${montoMaximo.toFixed(2)}`, (value: any) => {
                if (value === '' || value === null || value === undefined) return true;
                const numValue = parseFloat(value);
                return !isNaN(numValue) && numValue <= montoMaximo;
            })
            .test('decimal-places', 'Solo se permiten hasta 2 decimales', (value: any) => {
                if (value === '' || value === null || value === undefined) return true;
                const numValue = parseFloat(value);
                if (isNaN(numValue)) return true;
                const decimal = numValue.toString().split('.')[1];
                return !decimal || decimal.length <= 2;
            }),
        // metodoPago field removed as per new requirements
        // estado field removed - calculated automatically by backend based on payment amount
        referencia: yup.string().nullable(),
        observaciones: yup
            .string()
            .max(150, 'Las observaciones no pueden exceder 150 caracteres')
            .nullable()
    });
};
