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
    idPlan: yup.string()
        .required('Debe seleccionar un plan')
        .test('not-empty', 'Debe seleccionar un plan', (value) => {
            return value !== '' && value !== null && value !== undefined;
        }),
});

export const Step2Schema = yup.object({
    peso: yup
        .mixed()
        .test('is-number', 'Peso debe ser un número', (value) => {
            if (value === '' || value === null || value === undefined) return false;
            return !isNaN(Number(value));
        })
        .test('min', 'Peso ≥ 1kg', (value) => {
            if (value === '' || value === null || value === undefined) return false;
            return Number(value) >= 1;
        })
        .test('max', 'Peso ≤ 300kg', (value) => {
            if (value === '' || value === null || value === undefined) return false;
            return Number(value) <= 300;
        })
        .required('El peso es requerido'),
    altura: yup
        .mixed()
        .test('is-number', 'Altura debe ser un número', (value) => {
            if (value === '' || value === null || value === undefined) return false;
            return !isNaN(Number(value));
        })
        .test('min', 'Altura ≥ 30cm', (value) => {
            if (value === '' || value === null || value === undefined) return false;
            return Number(value) >= 30;
        })
        .test('max', 'Altura ≤ 250cm', (value) => {
            if (value === '' || value === null || value === undefined) return false;
            return Number(value) <= 250;
        })
        .required('La altura es requerida'),
    brazos: yup.mixed().test('is-number-or-empty', 'Debe ser número', (value) => {
        if (value === '' || value === null || value === undefined) return true;
        return !isNaN(Number(value)) && Number(value) >= 1 && Number(value) <= 200;
    }).nullable(),
    pantorrillas: yup.mixed().test('is-number-or-empty', 'Debe ser número', (value) => {
        if (value === '' || value === null || value === undefined) return true;
        return !isNaN(Number(value)) && Number(value) >= 1 && Number(value) <= 200;
    }).nullable(),
    gluteo: yup.mixed().test('is-number-or-empty', 'Debe ser número', (value) => {
        if (value === '' || value === null || value === undefined) return true;
        return !isNaN(Number(value)) && Number(value) >= 1 && Number(value) <= 200;
    }).nullable(),
    muslos: yup.mixed().test('is-number-or-empty', 'Debe ser número', (value) => {
        if (value === '' || value === null || value === undefined) return true;
        return !isNaN(Number(value)) && Number(value) >= 1 && Number(value) <= 200;
    }).nullable(),
    pecho: yup.mixed().test('is-number-or-empty', 'Debe ser número', (value) => {
        if (value === '' || value === null || value === undefined) return true;
        return !isNaN(Number(value)) && Number(value) >= 1 && Number(value) <= 200;
    }).nullable(),
    cintura: yup.mixed().test('is-number-or-empty', 'Debe ser número', (value) => {
        if (value === '' || value === null || value === undefined) return true;
        return !isNaN(Number(value)) && Number(value) >= 1 && Number(value) <= 200;
    }).nullable(),
    cuello: yup.mixed().test('is-number-or-empty', 'Debe ser número', (value) => {
        if (value === '' || value === null || value === undefined) return true;
        return !isNaN(Number(value)) && Number(value) >= 1 && Number(value) <= 100;
    }).nullable(),
    imc: yup.mixed().nullable(),
    categoriaPeso: yup.string().nullable()
});

// STEP 3 ACTUALIZADO CON CAMPOS DE PAGO
export const Step3Schema = yup.object({
    fechaInicio: yup
        .string()
        .required('La fecha de inicio es requerida')
        .test('is-valid-date', 'La fecha no es válida', (val) => {
            return !!val && !isNaN(Date.parse(val));
        }).test('not-in-past', 'La fecha de inicio no puede ser anterior a hoy', (val) => {
            if (!val) return false;
            const [year, month, day] = val.split('-').map(Number);
            const fechaSeleccionada = new Date(year, month - 1, day);
            const hoy = new Date();
            const fechaHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
            return fechaSeleccionada >= fechaHoy;
        }),
    monto: yup
        .mixed()
        .test('is-number-or-empty', 'Debe ser un número válido', (value) => {
            if (value === '' || value === null || value === undefined) return true;
            return !isNaN(Number(value)) && Number(value) >= 0;
        })
        .test('decimal-places', 'Solo se permiten hasta 2 decimales', (value) => {
            if (!value) return true;
            const decimal = value.toString().split('.')[1];
            return !decimal || decimal.length <= 2;
        })
        .nullable(),
    referencia: yup.string().nullable(),
    observaciones: yup
        .string()
        .max(150, 'Las observaciones no pueden exceder 150 caracteres')
        .nullable()
});

// Esquema completo combinado para svelte-forms-lib
export const CompleteSchema = yup.object().shape({
    ...Step1Schema.fields,
    ...Step2Schema.fields,
    ...Step3Schema.fields,
});

// Tipo combinado de datos del formulario
export type ClienteFormData = yup.InferType<typeof CompleteSchema>;

// VALORES INICIALES ACTUALIZADOS
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
    peso: '' as any,
    altura: '' as any,
    brazos: null,
    pantorrillas: null,
    gluteo: null,
    muslos: null,
    pecho: null,
    cintura: null,
    cuello: null,
    imc: null,
    categoriaPeso: null,
    idPlan: '',
    fechaInicio: new Date().toISOString().split('T')[0],
    // NUEVOS CAMPOS DE PAGO
    monto: null,
    referencia: null,
    observaciones: null,
};