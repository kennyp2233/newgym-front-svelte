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
 * Esquema de validación para renovación con validación de cuotas pendientes
 */
export const createRenovacionValidationSchema = (cuotasPendientes: any[] = [], planes: Plan[] = []) => {
    const totalCuotasPendientes = cuotasPendientes.reduce((sum, cuota) => sum + cuota.monto, 0);
    
    return nuevoPagoValidationSchema.concat(
        yup.object({
            monto: yup
                .number()
                .nullable()
                .test(
                    'min-pending-fees',
                    'El monto debe cubrir las cuotas de mantenimiento pendientes',
                    function (value) {
                        if (!value) return false;
                        
                        // Si hay cuotas pendientes, debe cubrirlas como mínimo
                        if (totalCuotasPendientes > 0 && value < totalCuotasPendientes) {
                            return this.createError({
                                message: `Debe pagar mínimo $${totalCuotasPendientes.toFixed(2)} para cubrir las cuotas pendientes`
                            });
                        }
                        
                        // Si no hay cuotas pendientes, validar contra el plan seleccionado
                        if (totalCuotasPendientes === 0) {
                            const { idPlan } = this.parent;
                            if (idPlan) {
                                const plan = planes.find((p) => p.idPlan === parseInt(idPlan));
                                if (plan && value < plan.precio) {
                                    return this.createError({
                                        message: `El monto mínimo para el plan es $${plan.precio.toFixed(2)}`
                                    });
                                }
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
export const createEditarPagoValidationSchema = (montoMaximo: number, allowZero: boolean = false) => {
    const montoMinimo = allowZero ? 0 : 1;
    const mensajeMinimo = allowZero ? 'El monto debe ser mayor o igual a $0.00' : 'El monto debe ser mayor a $1.00';
    
    return yup.object({
        monto: yup.number()
            .required('El monto es requerido')
            .min(montoMinimo, mensajeMinimo)
            .max(montoMaximo, `El monto no puede exceder $${montoMaximo.toFixed(2)}`)
            .test('decimal-places', 'Solo se permiten hasta 2 decimales', (value) => {
                if (value === null || value === undefined) return true;
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
