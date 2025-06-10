// composables/useRenovacionForm.ts
import { createForm } from 'svelte-forms-lib';
import { derived } from 'svelte/store';
import { createRenovacionValidationSchema } from '../forms/validationSchemas';
import type { Cliente } from '../../clientes/api';

export function useRenovacionForm(
	cliente: Cliente,
	planActualId?: number
) {
	// Configuración del formulario
	const { form, errors, touched, updateField } = createForm({
		initialValues: {
			idPlan: planActualId?.toString() || '',
			monto: '',
			fechaInicio: new Date().toISOString().split('T')[0],
			referencia: '',
			observaciones: ''
		},
		onSubmit: () => {} // Se manejará externamente
	});
	// Función de validación modular
	async function validateForm(cuotasPendientes: any[], planes: any[]): Promise<boolean> {
		try {
			const validationSchema = createRenovacionValidationSchema(cuotasPendientes, planes);
			let currentFormValue: any;
			form.subscribe(value => currentFormValue = value)();
			
			await validationSchema.validate(currentFormValue, { abortEarly: false });
			
			// Limpiar errores si la validación pasa
			const emptyErrors: Record<string, string> = {};
			Object.keys(currentFormValue).forEach((key) => (emptyErrors[key] = ''));
			errors.set(emptyErrors);
			return true;
		} catch (yupError: any) {
			const newErrors: Record<string, string> = {};
			if (yupError.inner && yupError.inner.length > 0) {
				yupError.inner.forEach((err: any) => {
					if (err.path) {
						newErrors[err.path] = err.message;
					}
				});
			} else if (yupError.path) {
				newErrors[yupError.path] = yupError.message;
			}
			errors.set(newErrors);
			
			// Marcar campos como touched
			const newTouched: Record<string, boolean> = {};
			let currentFormValue: any;
			form.subscribe(value => currentFormValue = value)();
			Object.keys(currentFormValue).forEach((key) => (newTouched[key] = true));
			touched.set(newTouched as any);
			return false;
		}
	}

	// Wrapper para updateField
	function updateFieldWrapper(field: string, value: any) {
		form.update((current) => ({
			...current,
			[field]: value
		}));
	}
	// Caracteres restantes para observaciones como store derivado
	const caracteresRestantes = derived(form, ($form) => 
		150 - ($form.observaciones?.length || 0)
	);

	return {
		form,
		errors,
		touched,
		updateField,
		updateFieldWrapper,
		validateForm,
		caracteresRestantes
	};
}
