// src/features/cuotas-mantenimiento/forms/validationSchemas.ts
import * as yup from 'yup';

// Esquema de validación para crear cuota de mantenimiento
export const crearCuotaValidationSchema = yup.object({
    idCliente: yup.number().required('El ID del cliente es requerido').positive(),
    anio: yup.number()
        .required('El año es requerido')
        .min(2020, 'El año debe ser mayor a 2020')
        .max(new Date().getFullYear() + 1, 'El año no puede ser mayor al próximo año'),
    monto: yup.number()
        .positive('El monto debe ser mayor a 0')
        .max(100, 'El monto no puede exceder $100')
        .default(10),
    observaciones: yup.string()
        .max(150, 'Las observaciones no pueden exceder 150 caracteres')
        .nullable()
});

// Esquema de validación para actualizar cuota
export const actualizarCuotaValidationSchema = yup.object({
    monto: yup.number()
        .positive('El monto debe ser mayor a 0')
        .max(100, 'El monto no puede exceder $100'),
    estado: yup.string()
        .oneOf(['Pendiente', 'Pagada'], 'Estado debe ser Pendiente o Pagada'),
    observaciones: yup.string()
        .max(150, 'Las observaciones no pueden exceder 150 caracteres')
        .nullable()
});

// Esquema para validar inclusión de anualidad en formularios
export const anualidadFormValidationSchema = yup.object({
    incluyeAnualidad: yup.boolean().default(true),
    montoAnualidad: yup.number()
        .when('incluyeAnualidad', {
            is: true,
            then: (schema) => schema.required('El monto de anualidad es requerido cuando se incluye').min(1),
            otherwise: (schema) => schema.nullable()
        })
});

// Tipos TypeScript inferidos
export type CrearCuotaFormData = yup.InferType<typeof crearCuotaValidationSchema>;
export type ActualizarCuotaFormData = yup.InferType<typeof actualizarCuotaValidationSchema>;
export type AnualidadFormData = yup.InferType<typeof anualidadFormValidationSchema>;
