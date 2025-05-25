// src/lib/forms/validation.ts
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
    const informacionPersonalSchema = yup.object({
        cedula: yup.string().required('La cédula es requerida'),
        celular: yup.string().required('El celular es requerido'),
        nombre: yup.string().required('El nombre es requerido'),
        apellido: yup.string().required('El apellido es requerido'),
        ciudad: yup.string().required('La ciudad es requerida'),
        pais: yup.string().required('El país es requerido'),
        direccion: yup.string().required('La dirección es requerida'),
        fechaNacimiento: yup.string().required('La fecha de nacimiento es requerida'),
        correo: yup.string().email('Correo inválido').required('El correo es requerido'),
        ocupacion: yup.string().required('La ocupación es requerida'),
        idPlan: yup.string().required('El plan es requerido'),
        puestoTrabajo: yup.string().when('ocupacion', {
            is: (ocupacion: string) => ocupacion === TipoOcupacion.TRABAJO,
            then: (schema) => schema.required('El puesto de trabajo es requerido'),
            otherwise: (schema) => schema.notRequired(),
        }),
    });

    const medidasSchema = yup.object().shape({
        peso: yup.string().required('El peso es requerido'),
        altura: yup.string().required('La altura es requerida'),
        brazos: yup.string().when('ocupacion', {
            is: (ocupacion: string) => ocupacion !== 'Niño',
            then: (schema) => schema.required('La medida de brazos es requerida'),
            otherwise: (schema) => schema.notRequired(),
        }),
        pantorrillas: yup.string().when('ocupacion', {
            is: (ocupacion: string) => ocupacion !== 'Niño',
            then: (schema) => schema.required('La medida de pantorrillas es requerida'),
            otherwise: (schema) => schema.notRequired(),
        }),
        gluteo: yup.string().when('ocupacion', {
            is: (ocupacion: string) => ocupacion !== 'Niño',
            then: (schema) => schema.required('La medida de glúteo es requerida'),
            otherwise: (schema) => schema.notRequired(),
        }),
        muslos: yup.string().when('ocupacion', {
            is: (ocupacion: string) => ocupacion !== 'Niño',
            then: (schema) => schema.required('La medida de muslos es requerida'),
            otherwise: (schema) => schema.notRequired(),
        }),
        pecho: yup.string().when('ocupacion', {
            is: (ocupacion: string) => ocupacion !== 'Niño',
            then: (schema) => schema.required('La medida de pecho es requerido'),
            otherwise: (schema) => schema.notRequired(),
        }),
        cintura: yup.string().when('ocupacion', {
            is: (ocupacion: string) => ocupacion !== 'Niño',
            then: (schema) => schema.required('La medida de cintura es requerida'),
            otherwise: (schema) => schema.notRequired(),
        }),
    });

    const resumenSchema = yup.object({
        fechaInicio: yup.string().required('La fecha de inicio es requerida')
    });

    return {
        informacionPersonalSchema,
        medidasSchema,
        resumenSchema
    };
};