// src/features/clientes/forms/validation.ts
import * as yup from 'yup';
import { TipoOcupacion, clienteService } from '../api';
import type { PagoDTO } from '../../pagos/api';

// Helper function para validación asíncrona de cédula
export const createCedulaValidation = (isEditMode: boolean = false, currentCedula?: string) => {
    return yup
        .string()
        .min(10, 'La cédula debe tener al menos 10 dígitos')
        .required('La cédula es requerida')
        .test(
            'cedula-unique',
            'Esta cédula ya está registrada',
            async function (value) {
                if (!value) return false;
                
                // Si está en modo edición y la cédula no cambió, no validar
                if (isEditMode && value === currentCedula) {
                    return true;
                }
                
                try {
                    const exists = await clienteService.verificarCedulaExiste(value);
                    return !exists;
                } catch (error) {
                    // En caso de error de red, permitir continuar
                    console.warn('Error verificando cédula:', error);
                    return true;
                }
            }
        );
};

// Esquemas por paso
// Función para crear Step1Schema con validación de cédula personalizada
export const createStep1Schema = (isEditMode: boolean = false, currentCedula?: string) => {
    return yup.object({
        nombre: yup.string().required('El nombre es requerido'),
        apellido: yup.string().required('El apellido es requerido'),
        cedula: createCedulaValidation(isEditMode, currentCedula),
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
};

// Esquema Step1 por defecto (para nuevos clientes)
export const Step1Schema = createStep1Schema();

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

// STEP 3 ACTUALIZADO CON NUEVAS REGLAS DE ANUALIDAD
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
        .required('El monto es requerido')
        .test('is-number', 'Debe ser un número válido', (value) => {
            return !isNaN(Number(value)) && Number(value) > 0;
        })
        .test('decimal-places', 'Solo se permiten hasta 2 decimales', (value) => {
            if (!value) return true;
            const decimal = value.toString().split('.')[1];
            return !decimal || decimal.length <= 2;
        })        .test('monto-minimo-cuota', 'Si incluye cuota de mantenimiento, debe pagar el monto completo del plan + $10', function (value) {
            const incluyeCuotaMantenimiento = this.parent.incluyeCuotaMantenimiento;
            if (!incluyeCuotaMantenimiento) return true; // Si no incluye cuota, cualquier monto es válido
            
            // Esta validación se complementa en el componente con el precio específico del plan
            return Number(value) > 0;
        }),
    referencia: yup.string().nullable(),
    observaciones: yup
        .string()
        .max(150, 'Las observaciones no pueden exceder 150 caracteres')
        .nullable(),    // Campos de cuota de mantenimiento actualizados
    incluyeCuotaMantenimiento: yup.boolean().default(false), // Por defecto NO incluir cuota
    observacionesCuota: yup.string().max(150, 'Las observaciones no pueden exceder 150 caracteres').nullable(),
});

// Helper para validar monto máximo considerando plan + renovación anual
export const createMontoValidation = (planes: any[]) => {
    return yup
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
        .test('max-amount', 'El monto no puede exceder el precio del plan + renovación anual ($10)', function (value) {
            if (!value) return true;
            const planId = this.parent.idPlan;
            if (!planId) return true;
            
            const plan = planes.find(p => p.idPlan === parseInt(planId));
            if (!plan) return true;
            
            const precioTotal = plan.precio + 10; // Plan + $10 renovación anual
            return Number(value) <= precioTotal;
        })
        .nullable();
};

// Helper para crear Step3Schema with validación de monto específica según nuevas reglas
export const createStep3SchemaWithPlanValidation = (planes: any[]) => {
    return yup.object({
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
            .required('El monto es requerido')
            .test('is-number', 'Debe ser un número válido', (value) => {
                return !isNaN(Number(value)) && Number(value) > 0;
            })
            .test('decimal-places', 'Solo se permiten hasta 2 decimales', (value) => {
                if (!value) return true;
                const decimal = value.toString().split('.')[1];
                return !decimal || decimal.length <= 2;
            })            .test('monto-reglas-cuota', 'Monto no válido según las opciones de pago', function (value) {
                const incluyeCuotaMantenimiento = this.parent.incluyeCuotaMantenimiento;
                const planId = this.parent.idPlan;
                
                if (!planId || !value) return false;
                
                const plan = planes.find(p => p.idPlan === parseInt(planId));
                if (!plan) return false;
                
                const monto = Number(value);
                
                if (incluyeCuotaMantenimiento) {
                    // Si incluye cuota de mantenimiento, debe pagar mínimo $10 (cuota anual)
                    if (monto < 10) {
                        return this.createError({ message: 'Con cuota de mantenimiento debe pagar mínimo $10.00 (cuota anual)' });
                    }
                    return true;
                } else {
                    // Si no incluye cuota, puede pagar cualquier cantidad positiva
                    return monto > 0;
                }
            }),
        referencia: yup.string().nullable(),
        observaciones: yup
            .string()
            .max(150, 'Las observaciones no pueden exceder 150 caracteres')
            .nullable(),        // Nuevos campos para cuota de mantenimiento - por defecto FALSE
        incluyeCuotaMantenimiento: yup.boolean().default(false),
        observacionesCuota: yup.string().max(150, 'Las observaciones no pueden exceder 150 caracteres').nullable(),
    });
};

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
    // CAMPOS DE PAGO
    monto: null,
    referencia: null,    observaciones: null,
    // NUEVOS CAMPOS DE CUOTA DE MANTENIMIENTO - POR DEFECTO FALSE
    incluyeCuotaMantenimiento: false,
    observacionesCuota: null,
};

// Esquema específico para edición de información personal del cliente
export const createEditClienteSchema = (currentCedula?: string) => {
    return yup.object({
        nombre: yup.string().required('El nombre es requerido'),
        apellido: yup.string().required('El apellido es requerido'),
        cedula: createCedulaValidation(true, currentCedula),
        celular: yup.string().required('El celular es requerido'),
        ciudad: yup.string().required('La ciudad es requerida'),
        pais: yup.string().required('El país es requerido'),
        direccion: yup.string().required('La dirección es requerida'),
        correo: yup.string().email('Correo inválido').required('El correo es requerido'),
        ocupacion: yup.string().required('La ocupación es requerida'),
        puestoTrabajo: yup.string().when('ocupacion', {
            is: TipoOcupacion.TRABAJO,
            then: (schema) => schema.required('El puesto de trabajo es requerido'),
            otherwise: (schema) => schema.notRequired()
        }),
        fechaNacimiento: yup.string().nullable()
    });
};

// Esquema por defecto para edición (para compatibilidad)
export const EditClienteSchema = createEditClienteSchema();

// Valores iniciales para edición de cliente
export const createEditClienteFormValues = (cliente: any) => ({
    nombre: cliente.nombre || '',
    apellido: cliente.apellido || '',
    cedula: cliente.cedula || '',
    celular: cliente.celular || '',
    ciudad: cliente.ciudad || '',
    pais: cliente.pais || '',
    direccion: cliente.direccion || '',
    correo: cliente.correo || '',
    ocupacion: cliente.ocupacion || TipoOcupacion.ESTUDIANTE,
    puestoTrabajo: cliente.puestoTrabajo || '',
    fechaNacimiento: cliente.fechaNacimiento || ''
});

// Función para filtrar planes según ocupación
export function filtrarPlanesPorOcupacion(planes: any[], ocupacion: TipoOcupacion) {
    if (!planes || planes.length === 0) return [];

    if (ocupacion === TipoOcupacion.NINO) {
        return planes.filter((plan) => plan.tag === 'Niño');
    } else if (ocupacion === TipoOcupacion.ESTUDIANTE) {
        return planes.filter((plan) => plan.tag === 'Estudiante');
    } else {
        return planes.filter((plan) => plan.tag === 'Trabajo');
    }
}

// Función para determinar si debe aplicarse el fee anual de $10
export function shouldApplyAnnualFee(pagos: PagoDTO[] = [], isNewClient: boolean = false): boolean {
	// Si es un cliente nuevo (primer registro), siempre se aplica el fee
	if (isNewClient || pagos.length === 0) {
		return true;
	}

	// Buscar el último pago que incluía fee anual
	// Los pagos de inscripción inicial y renovaciones anuales incluyen el fee
	const now = new Date();
	const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

	// Buscar pagos que podrían haber incluido fee anual en el último año
	const recentPaymentsWithFee = pagos.filter(pago => {
		const fechaPago = new Date(pago.fechaPago);
		// Si es un pago de inscripción inicial o es una renovación
		const includesFee = !pago.esRenovacion || pago.esRenovacion;
		return fechaPago >= oneYearAgo && includesFee;
	});

	// Si no hay pagos con fee en el último año, debe aplicarse
	return recentPaymentsWithFee.length === 0;
}

// Función para calcular el precio total considerando el fee anual
export function calculateTotalPrice(planPrice: number, pagos: PagoDTO[] = [], isNewClient: boolean = false): number {
	const annualFee = shouldApplyAnnualFee(pagos, isNewClient) ? 10 : 0;
	return planPrice + annualFee;
}