<script lang="ts">
	import { onMount } from 'svelte';
	import { createForm } from 'svelte-forms-lib';
	import BaseModal from '$lib/components/modals/BaseModal.svelte';
	import StepProgress from '$lib/components/modals/StepProgress.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import InformacionPersonalStepFixed from './InformacionPersonalStepFixed.svelte';
	import MedidasStepFixed from './MedidasStepFixed.svelte';
	import ResumenStepFixed from './ResumenStepFixed.svelte';
	import {
		Step1Schema,
		Step2Schema,
		Step3Schema,
		CompleteSchema,
		defaultClienteFormValues,
		type ClienteFormData
	} from '../../forms/validation';
	import { planService, type Plan } from '../../../planes/api';
	import { TipoOcupacion, type RegistroCompletoDTO } from '../../api';
	import { toasts } from '$lib/stores/toastStore';

	export let isOpen = false;
	export let onClose: () => void = () => {};
	export let onSubmit: (data: RegistroCompletoDTO) => Promise<void>;
	export let clienteToEdit: Partial<ClienteFormData> | null = null;

	let currentStep = 0;
	let planes: Plan[] = [];
	let isSubmitting = false;
	const steps = ['Información del cliente', 'Medidas del cliente', 'Detalles de la membresía'];

	const resolvedInitialValues = clienteToEdit
		? { ...defaultClienteFormValues, ...clienteToEdit }
		: defaultClienteFormValues;

	const { form, errors, touched, updateField } = createForm<ClienteFormData>({
		initialValues: resolvedInitialValues as ClienteFormData,
		onSubmit: () => {} // Empty function since we handle submission manually
		// Manual validation and submission handling per step
	});

	async function validateCurrentStep(): Promise<boolean> {
		const currentSchema = getSchemaForCurrentStep();
		const fieldsToValidate = getFieldsForCurrentStep();

		try {
			await currentSchema.validate($form, { abortEarly: false });
			// If validation passes, clear errors for this step's fields from the global $errors
			const stepErrorsUpdate = { ...$errors };
			fieldsToValidate.forEach((field) => {
				delete stepErrorsUpdate[field as keyof ClienteFormData];
			});
			errors.set(stepErrorsUpdate);
			return true;
		} catch (yupError: any) {
			const newStepErrors: Record<string, string> = {};
			if (yupError.inner && yupError.inner.length > 0) {
				yupError.inner.forEach((err: any) => {
					if (err.path && fieldsToValidate.includes(err.path)) {
						newStepErrors[err.path] = err.message;
					}
				});
			} else if (yupError.path && fieldsToValidate.includes(yupError.path)) {
				// Handle single error if not 'inner'
				newStepErrors[yupError.path] = yupError.message;
			}

			// Update global errors with new errors from this step
			const updatedGlobalErrors = { ...$errors };
			fieldsToValidate.forEach((field) => {
				if (newStepErrors[field]) {
					updatedGlobalErrors[field as keyof ClienteFormData] = newStepErrors[field];
				} else {
					delete updatedGlobalErrors[field as keyof ClienteFormData];
				}
			});
			errors.set(updatedGlobalErrors);

			// Mark fields as touched
			const newTouched = { ...$touched };
			fieldsToValidate.forEach((field) => {
				newTouched[field as keyof ClienteFormData] = true;
			});
			touched.set(newTouched);
			return false;
		}
	}

	async function handleNextOrSubmit() {
		const isStepValid = await validateCurrentStep();

		if (!isStepValid) {
			toasts.showToast('Por favor, corrige los errores.', 'warning');
			return;
		}

		if (currentStep < steps.length - 1) {
			currentStep += 1;
		} else {
			// Final step, validate with CompleteSchema before submitting
			try {
				await CompleteSchema.validate($form, { abortEarly: false });
				await submitFormLogic($form);
			} catch (yupError: any) {
				const finalErrors: Record<string, string> = {};
				if (yupError.inner && yupError.inner.length > 0) {
					yupError.inner.forEach((err: any) => {
						if (err.path) finalErrors[err.path] = err.message;
					});
				} else if (yupError.path) {
					finalErrors[yupError.path] = yupError.message;
				}
				errors.set(finalErrors);

				const finalTouched: Record<string, boolean> = {};
				Object.keys($form).forEach((key) => (finalTouched[key] = true));
				touched.set(finalTouched as any);
				toasts.showToast('Hay errores en el formulario completo.', 'error');
			}
		}
	}

	function handlePrevious() {
		if (currentStep > 0) {
			currentStep -= 1;
			// Optionally clear errors when going back, or leave them
			// errors.set({}); // Clears all errors
		}
	}

	// Obtener el esquema para el paso actual
	function getSchemaForCurrentStep() {
		switch (currentStep) {
			case 0:
				return Step1Schema;
			case 1:
				return Step2Schema;
			case 2:
				return Step3Schema;
			default:
				return Step1Schema;
		}
	}

	function getFieldsForCurrentStep(): string[] {
		if (currentStep === 0) {
			return [
				'nombre',
				'apellido',
				'cedula',
				'celular',
				'ciudad',
				'pais',
				'direccion',
				'fechaNacimiento',
				'correo',
				'ocupacion',
				'puestoTrabajo',
				'idPlan'
			];
		} else if (currentStep === 1) {
			return [
				'peso',
				'altura',
				'brazos',
				'pantorrillas',
				'gluteo',
				'muslos',
				'pecho',
				'cintura',
				'cuello'
			];
		} else {
			// AGREGAMOS LOS NUEVOS CAMPOS DE PAGO AL STEP 3
			return ['fechaInicio', 'monto', 'referencia', 'observaciones'];
		}
	}
	async function submitFormLogic(formData: ClienteFormData) {
		isSubmitting = true;
		try {
			const planSeleccionado = planes.find(
				(p) => p.idPlan === parseInt(formData.idPlan as string, 10)
			);
			const duracionMeses = planSeleccionado?.duracionMeses ?? 1;

			const registro: RegistroCompletoDTO = {
				cliente: {
					nombre: formData.nombre as string,
					apellido: formData.apellido as string,
					cedula: formData.cedula as string,
					celular: formData.celular as string,
					ciudad: formData.ciudad as string,
					pais: formData.pais as string,
					direccion: formData.direccion as string,
					fechaNacimiento: formData.fechaNacimiento as string,
					correo: formData.correo as string,
					ocupacion: formData.ocupacion as TipoOcupacion,
					puestoTrabajo:
						typeof formData.puestoTrabajo === 'string' ? formData.puestoTrabajo : undefined
				},
				medidas: {
					peso: formData.peso ? Number(formData.peso) : undefined,
					altura: formData.altura ? Number(formData.altura) : undefined,
					brazos: formData.brazos ? Number(formData.brazos) : undefined,
					pantorrillas: formData.pantorrillas ? Number(formData.pantorrillas) : undefined,
					gluteo: formData.gluteo ? Number(formData.gluteo) : undefined,
					muslos: formData.muslos ? Number(formData.muslos) : undefined,
					pecho: formData.pecho ? Number(formData.pecho) : undefined,
					cintura: formData.cintura ? Number(formData.cintura) : undefined,
					cuello: formData.cuello ? Number(formData.cuello) : undefined,
					imc: formData.imc ? Number(formData.imc) : undefined,
					categoriaPeso: formData.categoriaPeso ? String(formData.categoriaPeso) : undefined
				},
				inscripcion: {
					idPlan: parseInt(formData.idPlan as string, 10),
					fechaInicio: formData.fechaInicio as string,
					fechaFin: planService.calcularFechaFin(formData.fechaInicio as string, duracionMeses)
				},
				// AGREGAMOS EL OBJETO PAGO
				pago: {
					monto: formData.monto ? Number(formData.monto) : undefined,
					referencia: formData.referencia ? String(formData.referencia) : undefined,
					observaciones: formData.observaciones ? String(formData.observaciones) : undefined
				}
			};

			await onSubmit(registro);
			form.set(defaultClienteFormValues); // Reset form to default values
			currentStep = 0;
			onClose();
		} catch (err) {
			console.error('Error submitting form:', err);
			toasts.showToast('Error al registrar cliente', 'error');
		} finally {
			isSubmitting = false;
		}
	}
	const updateFieldWrapper = (field: string, value: any) => {
		updateField(field as keyof ClienteFormData, value);
		// Force reactivity by updating the form store directly
		form.update((current) => ({
			...current,
			[field]: value
		}));
	};

	onMount(async () => {
		planes = await planService.getPlanes();
		// initialValues are already set in createForm
		// If clienteToEdit could change reactively and form needs to reset:
		// $: if (clienteToEdit && isOpen) { // Check isOpen to avoid reset when modal is closed
		//   const newInitialValues = { ...defaultClienteFormValues, ...clienteToEdit };
		//   resetForm({ values: newInitialValues as ClienteFormData });
		// } else if (!clienteToEdit && isOpen) {
		//   resetForm({ values: defaultClienteFormValues as ClienteFormData });
		// }
	});
</script>

<BaseModal {isOpen} {onClose} size="lg" closeOnClickOutside={false} asForm={false} novalidate>
	<svelte:fragment slot="header">
		<h3 class="text-lg font-semibold">{steps[currentStep]}</h3>
		<StepProgress {currentStep} totalSteps={steps.length} />
	</svelte:fragment>

	<!-- We need to wrap content in a form tag for HTML5 validation accessibility if not using asForm and for enter key submission -->
	<form on:submit|preventDefault={handleNextOrSubmit} class="contents">
		{#if currentStep === 0}
			<InformacionPersonalStepFixed
				data={$form}
				errors={$errors}
				touched={$touched}
				{planes}
				updateField={updateFieldWrapper}
			/>
		{:else if currentStep === 1}
			<MedidasStepFixed
				data={$form}
				errors={$errors}
				touched={$touched}
				updateField={updateFieldWrapper}
			/>
		{:else}
			<ResumenStepFixed
				data={$form}
				errors={$errors}
				touched={$touched}
				{planes}
				updateField={updateFieldWrapper}
			/>
		{/if}
	</form>

	<svelte:fragment slot="footer">
		<div class="flex w-full justify-between">
			<Button
				variant="outline"
				type="button"
				on:click={handlePrevious}
				disabled={currentStep === 0 || isSubmitting}
			>
				Anterior
			</Button>
			<Button type="button" on:click={handleNextOrSubmit} disabled={isSubmitting}>
				{currentStep === steps.length - 1 ? 'Finalizar Registro' : 'Siguiente'}
			</Button>
		</div>
	</svelte:fragment>
</BaseModal>
