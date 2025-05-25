<!-- src/features/clientes/components/general/ClienteFormModal.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { createForm } from 'felte';
	import { validator } from '@felte/validator-yup';
	import { reporter } from '@felte/reporter-svelte';
	import BaseModal from '$lib/components/modals/BaseModal.svelte';
	import StepProgress from '$lib/components/modals/StepProgress.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import InformacionPersonalStep from './InformacionPersonalStep.svelte';
	import MedidasStep from './MedidasStep.svelte';
	import ResumenStep from './ResumenStep.svelte';
	import {
		defaultClienteFormValues,
		getStepValidationSchemas,
		type ClienteFormData
	} from '../../forms/validation';
	import { planService, type Plan } from '../../../planes/api';
	import { clienteService, TipoOcupacion, type RegistroCompletoDTO } from '../../api';
	import { toasts } from '$lib/stores/toastStore';
	import { get } from 'svelte/store';
	import type { ValidationError } from 'yup';

	export let isOpen = false;
	export let onClose = () => {};
	export let onSubmit: (data: RegistroCompletoDTO) => Promise<void>;
	export let clienteToEdit: Partial<ClienteFormData> | null = null;
	export let isEditing = false;

	let currentStep = 0;
	let planes: Plan[] = [];
	let isSubmitting = false;

	const steps = [
		{
			title: isEditing ? 'Editar información del cliente' : 'Información del cliente',
			component: InformacionPersonalStep
		},
		{
			title: isEditing ? 'Actualizar medidas del cliente' : 'Medidas del cliente',
			component: MedidasStep
		},
		{
			title: isEditing ? 'Actualizar detalles de la membresía' : 'Detalles de la membresía',
			component: ResumenStep
		}
	];

	$: currentStepConfig = steps[currentStep];
	$: isLastStep = currentStep === steps.length - 1;
	$: isFirstStep = currentStep === 0;

	const { informacionPersonalSchema, medidasSchema, resumenSchema } = getStepValidationSchemas();
	const stepSchemas = [informacionPersonalSchema, medidasSchema, resumenSchema];

	// Crear formulario con valores iniciales
	const { form, data, errors, touched, isValid, setData, validate } = createForm<any>({
		initialValues: clienteToEdit || defaultClienteFormValues,
		extend: [
			validator({ schema: stepSchemas[currentStep] as import('yup').ObjectSchema<any> }),
			reporter()
		],
		onSubmit: async (values) => {
			if (isLastStep) {
				await handleFinalSubmit(values);
			} else {
				// Validar paso actual antes de continuar
				const isStepValid = await validateCurrentStep();
				if (isStepValid) {
					handleNextStep();
				}
			}
		}
	});

	// Cargar planes al montar
	onMount(async () => {
		try {
			planes = await planService.getPlanes();
		} catch (error) {
			console.error('Error al cargar planes:', error);
			toasts.showToast('Error al cargar planes', 'error');
		}
	});

	// Actualizar datos cuando cambie clienteToEdit
	$: if (clienteToEdit && isOpen) {
		const formData = { ...defaultClienteFormValues, ...clienteToEdit };
		setData(formData);
		currentStep = 0;
	}

	async function validateCurrentStep(): Promise<boolean> {
		// Limpio errores previos
		errors.set({});
		touched.set({});

		try {
			await stepSchemas[currentStep].validate(get(data), { abortEarly: false });
			return true;
		} catch (err: any) {
			if (err.inner && Array.isArray(err.inner)) {
				const errObj: Record<string, string> = {};
				const touchedObj: Record<string, boolean> = {};
				(err.inner as ValidationError[]).forEach((e) => {
					if (e.path) {
						errObj[e.path] = e.message;
						touchedObj[e.path] = true;
					}
				});
				errors.set(errObj);
				touched.set(touchedObj);
			}
			return false;
		}
	}

	function handleNextStep() {
		if (currentStep < steps.length - 1) {
			currentStep++;
		}
	}

	function handlePrevStep() {
		if (currentStep > 0) {
			currentStep--;
		} else {
			onClose();
		}
	}

	async function handleFinalSubmit(formData: ClienteFormData) {
		isSubmitting = true;
		try {
			// Validaciones previas
			if (!validateFormData(formData)) return;

			const registroData = prepareRegistroData(formData);
			await onSubmit(registroData);

			if (!isEditing) {
				// Resetear formulario para nuevo registro
				setData(defaultClienteFormValues);
				currentStep = 0;
			}
		} catch (error: any) {
			handleSubmitError(error, formData);
			throw error;
		} finally {
			isSubmitting = false;
		}
	}

	function validateFormData(formData: ClienteFormData): boolean {
		// Validar fechas
		const hoy = new Date();
		hoy.setHours(0, 0, 0, 0);

		const [year, month, day] = formData.fechaInicio.split('-').map(Number);
		const fechaInicioDate = new Date(year, month - 1, day);
		fechaInicioDate.setHours(0, 0, 0, 0);

		if (fechaInicioDate.getTime() < hoy.getTime()) {
			toasts.showToast('La fecha de inicio no puede ser anterior a la fecha actual', 'error');
			return false;
		}

		// Validar medidas según ocupación
		if (formData.ocupacion === TipoOcupacion.NINO) {
			const camposExcedentes = [
				'brazos',
				'pantorrillas',
				'gluteo',
				'muslos',
				'pecho',
				'cintura',
				'cuello'
			].filter((campo) => formData[campo as keyof ClienteFormData]);

			if (camposExcedentes.length > 0) {
				toasts.showToast('Para niños, solo se deben registrar peso y altura', 'warning');
			}
		} else {
			const camposFaltantes = [
				'brazos',
				'pantorrillas',
				'gluteo',
				'muslos',
				'pecho',
				'cintura'
			].filter((campo) => !formData[campo as keyof ClienteFormData]);

			if (camposFaltantes.length > 0) {
				toasts.showToast(`Faltan las siguientes medidas: ${camposFaltantes.join(', ')}`, 'error');
				return false;
			}
		}

		return true;
	}

	function prepareRegistroData(formData: ClienteFormData): RegistroCompletoDTO {
		const planId = parseInt(formData.idPlan);
		const planSeleccionado = planes.find((p) => p.idPlan === planId);
		const duracionMeses = planSeleccionado?.duracionMeses || 1;

		const fechaFin = planService.calcularFechaFin(formData.fechaInicio, duracionMeses);

		// Calcular IMC
		const alturaNumero = parseFloat(formData.altura);
		const pesoNumero = parseFloat(formData.peso);
		const alturaMetros = alturaNumero > 3 ? alturaNumero / 100 : alturaNumero;
		const imc = pesoNumero / (alturaMetros * alturaMetros);

		let categoriaPeso = '';
		if (imc < 18.5) categoriaPeso = 'Bajo peso';
		else if (imc < 25) categoriaPeso = 'Normal';
		else if (imc < 30) categoriaPeso = 'Sobrepeso';
		else categoriaPeso = 'Obesidad';

		const esNino = formData.ocupacion === TipoOcupacion.NINO;

		const medidasDTO = {
			peso: parseFloat(formData.peso),
			altura: parseFloat(formData.altura),
			...(esNino
				? {}
				: {
						brazos: parseFloat(formData.brazos),
						pantorrillas: parseFloat(formData.pantorrillas),
						gluteo: parseFloat(formData.gluteo),
						muslos: parseFloat(formData.muslos),
						pecho: parseFloat(formData.pecho),
						cintura: parseFloat(formData.cintura),
						cuello: formData.cuello ? parseFloat(formData.cuello) : undefined
					}),
			imc: parseFloat(imc.toFixed(2)),
			categoriaPeso
		};

		return {
			cliente: {
				nombre: formData.nombre,
				apellido: formData.apellido,
				cedula: formData.cedula,
				celular: formData.celular,
				direccion: formData.direccion,
				ciudad: formData.ciudad,
				pais: formData.pais,
				correo: formData.correo,
				ocupacion: formData.ocupacion,
				puestoTrabajo:
					formData.ocupacion === TipoOcupacion.TRABAJO ? formData.puestoTrabajo : undefined,
				fechaNacimiento: formData.fechaNacimiento
			},
			medidas: medidasDTO,
			inscripcion: {
				idPlan: parseInt(formData.idPlan),
				fechaInicio: formData.fechaInicio,
				fechaFin: fechaFin
			}
		};
	}

	function handleSubmitError(error: any, formData: ClienteFormData) {
		if (error.response) {
			if (error.response.status === 409) {
				toasts.showToast(`Ya existe un cliente con la cédula ${formData.cedula}`, 'error');
			} else if (error.response.status === 400) {
				toasts.showToast(
					`Datos incorrectos: ${error.response.data?.message || 'Verifica los campos'}`,
					'error'
				);
			} else {
				toasts.showToast(`Error del servidor: ${error.response.status}`, 'error');
			}
		} else if (error.request) {
			toasts.showToast('No se pudo conectar con el servidor. Verifica tu conexión', 'error');
		} else {
			toasts.showToast(`Error al registrar: ${error.message || 'Error desconocido'}`, 'error');
		}
	}

	function handleUpdateField(event: CustomEvent) {
		const { field, value } = event.detail as { field: keyof ClienteFormData; value: any };

		// Actualizar el valor en el store de felte
		data.update((current) => ({
			...current,
			[field]: value
		}));
	}

	// Función para manejar submit manual del botón
	function handleManualSubmit() {
		const formElement = document.querySelector('form[data-felte-form]') as HTMLFormElement;
		if (formElement) {
			formElement.requestSubmit();
		}
	}
</script>

<BaseModal {isOpen} {onClose} size="lg" closeOnClickOutside={false}>
	<svelte:fragment slot="header">
		<div class="flex flex-col gap-1">
			<h3 class="text-lg font-semibold text-[var(--letter)]">
				{currentStepConfig.title}
			</h3>
			<StepProgress {currentStep} totalSteps={steps.length} />
		</div>
	</svelte:fragment>

	<form use:form data-felte-form>
		<div class="space-y-4">
			<svelte:component
				this={currentStepConfig.component}
				formData={$data}
				errors={$errors}
				touched={$touched}
				{planes}
				on:updateField={handleUpdateField}
			/>
		</div>
	</form>

	<svelte:fragment slot="footer">
		<Button variant="outline" type="button" on:click={handlePrevStep}>
			{isFirstStep ? 'Cancelar' : 'Regresar'}
		</Button>
		<Button
			variant="primary"
			type="button"
			disabled={isSubmitting}
			isLoading={isSubmitting}
			on:click={handleManualSubmit}
		>
			{isLastStep ? (isEditing ? 'Actualizar Cliente' : 'Registrar Cliente') : 'Siguiente'}
		</Button>
	</svelte:fragment>
</BaseModal>
