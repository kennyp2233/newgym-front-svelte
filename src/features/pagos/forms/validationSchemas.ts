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
 * Esquema de validación para editar pago existente
 */
export const editarPagoValidationSchema = yup.object({
    monto: yup.number()
        .required('El monto es requerido')
        .min(1, 'El monto debe ser mayor a $1.00')
        .test('decimal-places', 'Solo se permiten hasta 2 decimales', (value) => {
            if (!value) return true;
            const decimal = value.toString().split('.')[1];
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
export const createEditarPagoValidationSchema = (montoMaximo: number) => {
    return yup.object({
        monto: yup.number()
            .required('El monto es requerido')
            .min(1, 'El monto debe ser mayor a $1.00')
            .max(montoMaximo, `El monto no puede exceder $${montoMaximo.toFixed(2)}`)
            .test('decimal-places', 'Solo se permiten hasta 2 decimales', (value) => {
                if (!value) return true;
                const decimal = value.toString().split('.')[1];
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
