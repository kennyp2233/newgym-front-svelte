// src/features/clientes/forms/validation.ts
import * as yup from 'yup';
import { TipoOcupacion } from '../api';

// Esquemas por paso
export const Step1Schema = yup.object({
    nombre: yup.string().required('El nombre es requerido'),
    apellido: yup.string().required('El apellido es requerido'),
    cedula: yup
        .string()
        .min(10, 'La cédula debe tener al menos 10 dígitos')
        .required('La cédula es requerida'),
    celular: yup
        .string()
        .min(10, 'El celular debe tener al menos 10 dígitos')
        .required('El celular es requerido'),
    ciudad: yup.string().required('La ciudad es requerida'),
    pais: yup.string().required('El país es requerido'),
    direccion: yup.string().required('La dirección es requerida'),
    fechaNacimiento: yup.string().required('La fecha de nacimiento es requerida'),
    correo: yup.string().email('El correo no es válido').required('El correo es requerido'),
    ocupacion: yup
        .mixed<TipoOcupacion>()
        .oneOf(Object.values(TipoOcupacion))
        .required('La ocupación es requerida'),
    puestoTrabajo: yup.string().when('ocupacion', {
        is: TipoOcupacion.TRABAJO,
        then: (schema) => schema.required('El puesto de trabajo es requerido para trabajadores'),
        otherwise: (schema) => schema.notRequired(),
    }),
});

export const Step2Schema = yup.object({
    peso: yup
        .number()
        .typeError('Peso debe ser un número')
        .min(1, 'Peso ≥ 1kg')
        .max(300, 'Peso ≤ 300kg')
        .nullable(),
    altura: yup
        .number()
        .typeError('Altura debe ser un número')
        .min(30, 'Altura ≥ 30cm')
        .max(250, 'Altura ≤ 250cm')
        .nullable(),
    brazos: yup.number().typeError('Debe ser número').min(1, '≥1cm').max(200, '≤200cm').nullable(),
    pantorrillas: yup
        .number()
        .typeError('Debe ser número')
        .min(1, '≥1cm')
        .max(200, '≤200cm')
        .nullable(),
    gluteo: yup.number().typeError('Debe ser número').min(1, '≥1cm').max(200, '≤200cm').nullable(),
    muslos: yup.number().typeError('Debe ser número').min(1, '≥1cm').max(200, '≤200cm').nullable(),
    pecho: yup.number().typeError('Debe ser número').min(1, '≥1cm').max(200, '≤200cm').nullable(),
    cintura: yup.number().typeError('Debe ser número').min(1, '≥1cm').max(200, '≤200cm').nullable(),
    cuello: yup.number().typeError('Debe ser número').min(1, '≥1cm').max(100, '≤100cm').nullable(),
});

export const Step3Schema = yup.object({
    idPlan: yup.string().required('Debe seleccionar un plan'),
    fechaInicio: yup
        .string()
        .required('La fecha de inicio es requerida')
        .test('is-valid-date', 'La fecha no es válida', (val) => {
            return !!val && !isNaN(Date.parse(val));
        })
        .test('not-in-past', 'La fecha de inicio no puede ser anterior a hoy', (val) => {
            if (!val) return false;
            const fecha = new Date(val);
            fecha.setHours(0, 0, 0, 0);
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            return fecha >= hoy;
        }),
});

// Tipo combinado de datos del formulario
export type ClienteFormData = yup.InferType<
    typeof Step1Schema & typeof Step2Schema & typeof Step3Schema
>;

// Valores iniciales
export const defaultClienteFormValues: ClienteFormData = {
    nombre: '',
    apellido: '',
    cedula: '',
    celular: '',
    ciudad: '',
    pais: '',
    direccion: '',
    fechaNacimiento: '',
    correo: '',
    ocupacion: TipoOcupacion.ESTUDIANTE,
    puestoTrabajo: '',
    peso: null,
    altura: null,
    brazos: null,
    pantorrillas: null,
    gluteo: null,
    muslos: null,
    pecho: null,
    cintura: null,
    cuello: null,
    idPlan: '',
    fechaInicio: new Date().toISOString().split('T')[0],
};
