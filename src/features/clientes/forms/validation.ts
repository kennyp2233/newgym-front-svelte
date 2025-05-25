// src/features/clientes/forms/validation.ts
import * as yup from 'yup';
import { TipoOcupacion } from '../api';

// Interfaz para los datos del formulario
export interface ClienteFormData {
    // Paso 1: Información Personal
    nombre: string;
    apellido: string;
    cedula: string;
    celular: string;
    ciudad: string;
    pais: string;
    direccion: string;
    fechaNacimiento: string;
    correo: string;
    ocupacion: TipoOcupacion;
    puestoTrabajo?: string;
    fechaInicio: string;
    idPlan: string;

    // Paso 2: Medidas
    peso: string;
    altura: string;
    brazos: string;
    pantorrillas: string;
    gluteo: string;
    muslos: string;
    pecho: string;
    cintura: string;
    cuello: string;
}

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
    const informacionPersonalSchema = yup.object().shape({
        cedula: yup
            .string()
            .required('La cédula es requerida')
            .min(10, 'La cédula debe tener al menos 10 dígitos')
            .matches(/^\d+$/, 'La cédula solo debe contener números'),

        celular: yup
            .string()
            .required('El celular es requerido')
            .min(10, 'El celular debe tener al menos 10 dígitos')
            .matches(/^\d+$/, 'El celular solo debe contener números'),

        nombre: yup
            .string()
            .required('El nombre es requerido')
            .min(2, 'El nombre debe tener al menos 2 caracteres')
            .max(50, 'El nombre no puede exceder 50 caracteres'),

        apellido: yup
            .string()
            .required('El apellido es requerido')
            .min(2, 'El apellido debe tener al menos 2 caracteres')
            .max(50, 'El apellido no puede exceder 50 caracteres'),

        ciudad: yup
            .string()
            .required('La ciudad es requerida')
            .min(2, 'La ciudad debe tener al menos 2 caracteres'),

        pais: yup
            .string()
            .required('El país es requerido')
            .min(2, 'El país debe tener al menos 2 caracteres'),

        direccion: yup
            .string()
            .required('La dirección es requerida')
            .min(5, 'La dirección debe tener al menos 5 caracteres'),

        fechaNacimiento: yup
            .string()
            .required('La fecha de nacimiento es requerida')
            .test('is-valid-date', 'La fecha de nacimiento no puede ser futura', function (value) {
                if (!value) return false;
                const fecha = new Date(value);
                const hoy = new Date();
                return fecha <= hoy;
            }),

        correo: yup
            .string()
            .email('El correo electrónico no es válido')
            .required('El correo es requerido'),

        ocupacion: yup
            .string()
            .oneOf(Object.values(TipoOcupacion), 'Seleccione una ocupación válida')
            .required('La ocupación es requerida'),

        idPlan: yup
            .string()
            .required('Debe seleccionar un plan'),

        puestoTrabajo: yup
            .string()
            .when('ocupacion', {
                is: TipoOcupacion.TRABAJO,
                then: (schema) => schema.required('El puesto de trabajo es requerido para trabajadores'),
                otherwise: (schema) => schema.notRequired(),
            }),
    });

    // Paso 2: Medidas
    const medidasSchema = yup.object().shape({
        peso: yup
            .string()
            .required('El peso es requerido')
            .test('is-valid-weight', 'El peso debe estar entre 1 y 300 kg', function (value) {
                if (!value) return false;
                const peso = parseFloat(value);
                return !isNaN(peso) && peso > 0 && peso <= 300;
            }),

        altura: yup
            .string()
            .required('La altura es requerida')
            .test('is-valid-height', 'La altura debe estar entre 30 y 250 cm', function (value) {
                if (!value) return false;
                const altura = parseFloat(value);
                return !isNaN(altura) && altura >= 30 && altura <= 250;
            }),

        // Medidas condicionales según la ocupación
        brazos: yup
            .string()
            .when('ocupacion', {
                is: (ocupacion: string) => ocupacion !== TipoOcupacion.NINO,
                then: (schema) => schema
                    .required('La medida de brazos es requerida')
                    .test('is-valid-brazos', 'La medida de brazos debe ser válida', function (value) {
                        if (!value) return false;
                        const medida = parseFloat(value);
                        return !isNaN(medida) && medida > 0 && medida <= 200;
                    }),
                otherwise: (schema) => schema.notRequired(),
            }),

        pantorrillas: yup
            .string()
            .when('ocupacion', {
                is: (ocupacion: string) => ocupacion !== TipoOcupacion.NINO,
                then: (schema) => schema
                    .required('La medida de pantorrillas es requerida')
                    .test('is-valid-pantorrillas', 'La medida de pantorrillas debe ser válida', function (value) {
                        if (!value) return false;
                        const medida = parseFloat(value);
                        return !isNaN(medida) && medida > 0 && medida <= 200;
                    }),
                otherwise: (schema) => schema.notRequired(),
            }),

        gluteo: yup
            .string()
            .when('ocupacion', {
                is: (ocupacion: string) => ocupacion !== TipoOcupacion.NINO,
                then: (schema) => schema
                    .required('La medida de glúteo es requerida')
                    .test('is-valid-gluteo', 'La medida de glúteo debe ser válida', function (value) {
                        if (!value) return false;
                        const medida = parseFloat(value);
                        return !isNaN(medida) && medida > 0 && medida <= 200;
                    }),
                otherwise: (schema) => schema.notRequired(),
            }),

        muslos: yup
            .string()
            .when('ocupacion', {
                is: (ocupacion: string) => ocupacion !== TipoOcupacion.NINO,
                then: (schema) => schema
                    .required('La medida de muslos es requerida')
                    .test('is-valid-muslos', 'La medida de muslos debe ser válida', function (value) {
                        if (!value) return false;
                        const medida = parseFloat(value);
                        return !isNaN(medida) && medida > 0 && medida <= 200;
                    }),
                otherwise: (schema) => schema.notRequired(),
            }),

        pecho: yup
            .string()
            .when('ocupacion', {
                is: (ocupacion: string) => ocupacion !== TipoOcupacion.NINO,
                then: (schema) => schema
                    .required('La medida de pecho es requerida')
                    .test('is-valid-pecho', 'La medida de pecho debe ser válida', function (value) {
                        if (!value) return false;
                        const medida = parseFloat(value);
                        return !isNaN(medida) && medida > 0 && medida <= 200;
                    }),
                otherwise: (schema) => schema.notRequired(),
            }),

        cintura: yup
            .string()
            .when('ocupacion', {
                is: (ocupacion: string) => ocupacion !== TipoOcupacion.NINO,
                then: (schema) => schema
                    .required('La medida de cintura es requerida')
                    .test('is-valid-cintura', 'La medida de cintura debe ser válida', function (value) {
                        if (!value) return false;
                        const medida = parseFloat(value);
                        return !isNaN(medida) && medida > 0 && medida <= 200;
                    }),
                otherwise: (schema) => schema.notRequired(),
            }),

        cuello: yup
            .string()
            .optional()
            .test('is-valid-cuello', 'La medida de cuello debe ser válida', function (value) {
                if (!value) return true; // Es opcional
                const medida = parseFloat(value);
                return !isNaN(medida) && medida > 0 && medida <= 100;
            }),
    });

    // Paso 3: Resumen
    const resumenSchema = yup.object().shape({
        fechaInicio: yup
            .string()
            .required('La fecha de inicio es requerida')
            .test('is-not-past', 'La fecha de inicio no puede ser anterior a hoy', function (value) {
                if (!value) return false;
                const fecha = new Date(value);
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);
                fecha.setHours(0, 0, 0, 0);
                return fecha >= hoy;
            }),
    });

    return {
        informacionPersonalSchema,
        medidasSchema,
        resumenSchema
    };
};