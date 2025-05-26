// src/features/clientes/forms/validation.ts
import { z } from 'zod';
import { TipoOcupacion } from '../api';

// Schema base para el formulario (campos como vienen del form)
export const ClienteFormSchema = z.object({
    // Paso 1: Información Personal
    nombre: z.string(),
    apellido: z.string(),
    cedula: z.string(),
    celular: z.string(),
    ciudad: z.string(),
    pais: z.string(),
    direccion: z.string(),
    fechaNacimiento: z.string(),
    correo: z.string(),
    ocupacion: z.nativeEnum(TipoOcupacion),
    puestoTrabajo: z.string().optional(),
    fechaInicio: z.string(),
    idPlan: z.string(),

    // Paso 2: Medidas (como strings porque vienen de inputs)
    peso: z.string(),
    altura: z.string(),
    brazos: z.string(),
    pantorrillas: z.string(),
    gluteo: z.string(),
    muslos: z.string(),
    pecho: z.string(),
    cintura: z.string(),
    cuello: z.string(),
});

// Helper para convertir string a number con validación
const numericString = (fieldName: string, min: number = 0, max: number = 1000) =>
    z.string()
        .refine((val) => {
            if (!val || val.trim() === '') return true; // Permitir vacío
            const num = parseFloat(val);
            return !isNaN(num);
        }, `${fieldName} debe ser un número válido`)
        .refine((val) => {
            if (!val || val.trim() === '') return true; // Permitir vacío
            const num = parseFloat(val);
            return num >= min && num <= max;
        }, `${fieldName} debe estar entre ${min} y ${max}`);

export type ClienteFormData = z.infer<typeof ClienteFormSchema>;

// Valores iniciales del formulario
export const defaultClienteFormValues: ClienteFormData = {
    cedula: '',
    celular: '',
    nombre: '',
    apellido: '',
    ciudad: '',
    pais: '',
    direccion: '',
    fechaNacimiento: '',
    correo: '',
    ocupacion: TipoOcupacion.ESTUDIANTE,
    puestoTrabajo: '',
    fechaInicio: new Date().toISOString().split('T')[0],
    idPlan: '',

    peso: '',
    altura: '',
    brazos: '',
    pantorrillas: '',
    gluteo: '',
    muslos: '',
    pecho: '',
    cintura: '',
    cuello: '',
};

// Esquemas de validación para cada paso
export const getStepValidationSchemas = () => {
    // Paso 1: Información Personal
    const informacionPersonalSchema = z.object({
        cedula: z
            .string()
            .min(1, 'La cédula es requerida')
            .min(10, 'La cédula debe tener al menos 10 dígitos')
            .regex(/^\d+$/, 'La cédula solo debe contener números'),

        celular: z
            .string()
            .min(1, 'El celular es requerido')
            .min(10, 'El celular debe tener al menos 10 dígitos')
            .regex(/^\d+$/, 'El celular solo debe contener números'),

        nombre: z
            .string()
            .min(1, 'El nombre es requerido')
            .min(2, 'El nombre debe tener al menos 2 caracteres')
            .max(50, 'El nombre no puede exceder 50 caracteres'),

        apellido: z
            .string()
            .min(1, 'El apellido es requerido')
            .min(2, 'El apellido debe tener al menos 2 caracteres')
            .max(50, 'El apellido no puede exceder 50 caracteres'),

        ciudad: z
            .string()
            .min(1, 'La ciudad es requerida')
            .min(2, 'La ciudad debe tener al menos 2 caracteres'),

        pais: z
            .string()
            .min(1, 'El país es requerido')
            .min(2, 'El país debe tener al menos 2 caracteres'),

        direccion: z
            .string()
            .min(1, 'La dirección es requerida')
            .min(5, 'La dirección debe tener al menos 5 caracteres'),

        fechaNacimiento: z
            .string()
            .min(1, 'La fecha de nacimiento es requerida')
            .refine((value) => {
                if (!value) return false;
                const fecha = new Date(value);
                const hoy = new Date();
                return fecha <= hoy;
            }, 'La fecha de nacimiento no puede ser futura'),

        correo: z
            .string()
            .min(1, 'El correo es requerido')
            .email('El correo electrónico no es válido'),

        ocupacion: z
            .nativeEnum(TipoOcupacion, {
                errorMap: () => ({ message: 'Seleccione una ocupación válida' })
            }),

        idPlan: z
            .string()
            .min(1, 'Debe seleccionar un plan'),

        puestoTrabajo: z.string().optional(),

        // Campos opcionales para este paso
        peso: z.string().optional(),
        altura: z.string().optional(),
        brazos: z.string().optional(),
        pantorrillas: z.string().optional(),
        gluteo: z.string().optional(),
        muslos: z.string().optional(),
        pecho: z.string().optional(),
        cintura: z.string().optional(),
        cuello: z.string().optional(),
        fechaInicio: z.string().optional(),
    }).refine((data) => {
        // Validación condicional para puesto de trabajo
        if (data.ocupacion === TipoOcupacion.TRABAJO) {
            return data.puestoTrabajo && data.puestoTrabajo.trim().length > 0;
        }
        return true;
    }, {
        message: 'El puesto de trabajo es requerido para trabajadores',
        path: ['puestoTrabajo']
    }).transform((data) => ({
        ...data,
        puestoTrabajo: data.ocupacion === TipoOcupacion.TRABAJO ? (data.puestoTrabajo || '') : ''
    }));

    // Paso 2: Medidas
    const medidasSchema = z.object({
        peso: z
            .string()
            .pipe(numericString('El peso', 1, 300)),

        altura: z
            .string()
            .pipe(numericString('La altura', 30, 250)),

        // Medidas detalladas opcionales con validación numérica
        brazos: numericString('La medida de brazos', 1, 200).optional().or(z.literal('')),
        pantorrillas: numericString('La medida de pantorrillas', 1, 200).optional().or(z.literal('')),
        gluteo: numericString('La medida de glúteo', 1, 200).optional().or(z.literal('')),
        muslos: numericString('La medida de muslos', 1, 200).optional().or(z.literal('')),
        pecho: numericString('La medida de pecho', 1, 200).optional().or(z.literal('')),
        cintura: numericString('La medida de cintura', 1, 200).optional().or(z.literal('')),
        cuello: numericString('La medida de cuello', 1, 100).optional().or(z.literal('')),

        // Incluir campos que pueden estar presentes de otros pasos
        cedula: z.string().optional(),
        celular: z.string().optional(),
        nombre: z.string().optional(),
        apellido: z.string().optional(),
        ciudad: z.string().optional(),
        pais: z.string().optional(),
        direccion: z.string().optional(),
        fechaNacimiento: z.string().optional(),
        correo: z.string().optional(),
        ocupacion: z.nativeEnum(TipoOcupacion).optional(),
        puestoTrabajo: z.string().optional(),
        idPlan: z.string().optional(),
        fechaInicio: z.string().optional(),
    });

    // Paso 3: Resumen
    const resumenSchema = z.object({
        fechaInicio: z
            .string()
            .min(1, 'La fecha de inicio es requerida')
            .refine((value) => {
                if (!value) return false;
                const fecha = new Date(value);
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);
                fecha.setHours(0, 0, 0, 0);
                return fecha >= hoy;
            }, 'La fecha de inicio no puede ser anterior a hoy'),

        // Incluir todos los demás campos como opcionales
        cedula: z.string().optional(),
        celular: z.string().optional(),
        nombre: z.string().optional(),
        apellido: z.string().optional(),
        ciudad: z.string().optional(),
        pais: z.string().optional(),
        direccion: z.string().optional(),
        fechaNacimiento: z.string().optional(),
        correo: z.string().optional(),
        ocupacion: z.nativeEnum(TipoOcupacion).optional(),
        puestoTrabajo: z.string().optional(),
        idPlan: z.string().optional(),
        peso: z.string().optional(),
        altura: z.string().optional(),
        brazos: z.string().optional(),
        pantorrillas: z.string().optional(),
        gluteo: z.string().optional(),
        muslos: z.string().optional(),
        pecho: z.string().optional(),
        cintura: z.string().optional(),
        cuello: z.string().optional(),
    });

    return {
        informacionPersonalSchema,
        medidasSchema,
        resumenSchema
    };
};

// Helper para validación condicional basada en ocupación
export const shouldValidateMedidasDetalladas = (ocupacion: TipoOcupacion): boolean => {
    return ocupacion !== TipoOcupacion.NINO;
};

// Helper para crear schema de medidas con validación condicional
export const createMedidasSchemaWithOccupation = (ocupacion: TipoOcupacion) => {
    const baseSchema = getStepValidationSchemas().medidasSchema;

    if (!shouldValidateMedidasDetalladas(ocupacion)) {
        // Para niños, solo validar peso y altura básicos
        return z.object({
            peso: numericString('El peso', 1, 300).optional().or(z.literal('')),
            altura: numericString('La altura', 30, 250).optional().or(z.literal('')),

            // Hacer las medidas detalladas completamente opcionales para niños
            brazos: z.string().optional(),
            pantorrillas: z.string().optional(),
            gluteo: z.string().optional(),
            muslos: z.string().optional(),
            pecho: z.string().optional(),
            cintura: z.string().optional(),
            cuello: z.string().optional(),

            // Incluir campos opcionales de otros pasos
            cedula: z.string().optional(),
            celular: z.string().optional(),
            nombre: z.string().optional(),
            apellido: z.string().optional(),
            ciudad: z.string().optional(),
            pais: z.string().optional(),
            direccion: z.string().optional(),
            fechaNacimiento: z.string().optional(),
            correo: z.string().optional(),
            ocupacion: z.nativeEnum(TipoOcupacion).optional(),
            puestoTrabajo: z.string().optional(),
            idPlan: z.string().optional(),
            fechaInicio: z.string().optional(),
        });
    }

    return baseSchema;
};