<!-- src/features/clientes/components/general/ClienteFormModal.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { createForm } from 'felte';
	import { validator } from '@felte/validator-zod';
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
		createMedidasSchemaWithOccupation,
		type ClienteFormData
	} from '../../forms/validation';
	import { planService, type Plan } from '../../../planes/api';
	import { clienteService, TipoOcupacion, type RegistroCompletoDTO } from '../../api';
	import { toasts } from '$lib/stores/toastStore';
	import { get } from 'svelte/store';
	import type { ZodError } from 'zod';

	export let isOpen = false;
	export let onClose = () => {};
	export let onSubmit: (data: RegistroCompletoDTO) => Promise<void>;
	export let clienteToEdit: Partial<ClienteFormData> | null = null;
	export let isEditing = false;

	let currentStep = 0;
	let planes: Plan[] = [];
	let isSubmitting = false;
	let skipMedidas = false;

	const steps = [
		{
			title: isEditing ? 'Editar información del cliente' : 'Información del cliente',
			component: InformacionPersonalStep
		},
		{
			title: isEditing ? 'Actualizar medidas del cliente' : 'Medidas del cliente',
			component: MedidasStep,
			optional: true
		},
		{
			title: isEditing ? 'Actualizar detalles de la membresía' : 'Detalles de la membresía',
			component: ResumenStep
		}
	];

	$: currentStepConfig = steps[currentStep];
	$: isLastStep = currentStep === steps.length - 1;
	$: isFirstStep = currentStep === 0;
	$: isMedidasStep = currentStep === 1;

	const { informacionPersonalSchema, medidasSchema, resumenSchema } = getStepValidationSchemas();

	// Variables para el formulario
	let form: any;
	let data: any;
	let errors: any;
	let touched: any;
	let isValid: any;
	let setData: any;
	let validate: any;

	// Función para obtener el schema actual basado en el paso
	function getCurrentSchema() {
		if (currentStep === 0) return informacionPersonalSchema;
		if (currentStep === 1) {
			// Para medidas, usar schema condicional basado en ocupación
			const currentData = (get(data) as Partial<ClienteFormData>) || {};
			const ocupacion = currentData.ocupacion || TipoOcupacion.ESTUDIANTE;
			// .partial() must be called on the base object, not on a ZodEffects wrapper
			// If informacionPersonalSchema is wrapped in effects, unwrap to base schema before .partial()
			const baseInfoSchema =
				(informacionPersonalSchema as any)._def?.schema ?? informacionPersonalSchema;
			return skipMedidas ? baseInfoSchema.partial() : createMedidasSchemaWithOccupation(ocupacion);
		}
		if (currentStep === 2) return resumenSchema;
		return informacionPersonalSchema;
	}

	// Función para inicializar el formulario
	function initializeForm() {
		const initialValues = clienteToEdit
			? { ...defaultClienteFormValues, ...clienteToEdit }
			: defaultClienteFormValues;

		const formInstance = createForm<ClienteFormData>({
			initialValues,
			extend: [validator({ schema: getCurrentSchema() }), reporter()],
			onSubmit: async (values) => {
				if (isLastStep) {
					await handleFinalSubmit(values);
				} else {
					const isStepValid = await validateCurrentStep();
					if (isStepValid) {
						handleNextStep();
					}
				}
			}
		});

		form = formInstance.form;
		data = formInstance.data;
		errors = formInstance.errors;
		touched = formInstance.touched;
		isValid = formInstance.isValid;
		setData = formInstance.setData;
		validate = formInstance.validate;
	}

	// Inicializar formulario al montar
	onMount(async () => {
		initializeForm();

		try {
			planes = await planService.getPlanes();
		} catch (error) {
			console.error('Error al cargar planes:', error);
			toasts.showToast('Error al cargar planes', 'error');
		}
	});

	// Reactividad para cambios importantes
	$: if (clienteToEdit && isOpen && setData) {
		const formData = { ...defaultClienteFormValues, ...clienteToEdit };
		setData(formData);
		currentStep = 0;
		skipMedidas = false;
	}

	// Reinicializar cuando cambie el esquema de validación
	$: if (form && (currentStep >= 0 || skipMedidas !== undefined)) {
		// Recrear formulario con nuevo schema
		setTimeout(() => {
			const currentData = get(data);
			initializeForm();
			if (currentData && setData) {
				setData(currentData);
			}
		}, 0);
	}

	async function validateCurrentStep(): Promise<boolean> {
		if (!validate || !data) return false;

		try {
			const currentData = get(data);
			const currentSchema = getCurrentSchema();
			await currentSchema.parseAsync(currentData);
			return true;
		} catch (err) {
			if (err instanceof Error && 'issues' in err) {
				const zodError = err as ZodError;
				const errorsObj: Record<string, string[]> = {};
				const touchedObj: Record<string, boolean> = {};

				zodError.issues.forEach((issue) => {
					const path = issue.path.join('.');
					if (!errorsObj[path]) errorsObj[path] = [];
					errorsObj[path].push(issue.message);
					touchedObj[path] = true;
				});

				errors.set(errorsObj);
				touched.set(touchedObj);
			}
			return false;
		}
	}

	function handleNextStep() {
		if (currentStep < steps.length - 1) {
			currentStep++;
			// Si el siguiente paso es medidas y se omiten, saltar
			if (currentStep === 1 && skipMedidas) {
				currentStep++;
			}
		}
	}

	function handlePrevStep() {
		if (currentStep > 0) {
			currentStep--;
			// Si el paso anterior es medidas y se omitieron, saltar hacia atrás
			if (currentStep === 1 && skipMedidas) {
				currentStep--;
			}
		} else {
			onClose();
		}
	}

	function handleSkipMedidas() {
		skipMedidas = true;
		// Limpiar datos de medidas excepto peso y altura básicos
		if (data && setData) {
			const currentData = get(data);
			setData({
				...((currentData ?? {}) as object),
				brazos: '',
				pantorrillas: '',
				gluteo: '',
				muslos: '',
				pecho: '',
				cintura: '',
				cuello: ''
			});
		}
		handleNextStep();
	}

	async function handleFinalSubmit(formData: ClienteFormData) {
		isSubmitting = true;
		try {
			if (!validateFormData(formData)) return;

			const registroData = prepareRegistroData(formData);
			await onSubmit(registroData);

			if (!isEditing) {
				setData(defaultClienteFormValues);
				currentStep = 0;
				skipMedidas = false;
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

		// Solo validar medidas si no se omitieron y no es niño
		if (!skipMedidas && formData.ocupacion !== TipoOcupacion.NINO) {
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

		// Calcular IMC solo si hay peso y altura
		let imc = 0;
		let categoriaPeso = 'No calculado';

		if (formData.peso && formData.altura) {
			const alturaNumero = parseFloat(String(formData.altura));
			const pesoNumero = parseFloat(String(formData.peso));
			const alturaMetros = alturaNumero > 3 ? alturaNumero / 100 : alturaNumero;
			imc = pesoNumero / (alturaMetros * alturaMetros);

			if (imc < 18.5) categoriaPeso = 'Bajo peso';
			else if (imc < 25) categoriaPeso = 'Normal';
			else if (imc < 30) categoriaPeso = 'Sobrepeso';
			else categoriaPeso = 'Obesidad';
		}

		const esNino = formData.ocupacion === TipoOcupacion.NINO;

		const medidasDTO = {
			...(formData.peso && { peso: parseFloat(String(formData.peso)) }),
			...(formData.altura && { altura: parseFloat(String(formData.altura)) }),
			...(skipMedidas || esNino
				? {}
				: {
						...(formData.brazos && { brazos: parseFloat(String(formData.brazos)) }),
						...(formData.pantorrillas && {
							pantorrillas: parseFloat(String(formData.pantorrillas))
						}),
						...(formData.gluteo && { gluteo: parseFloat(String(formData.gluteo)) }),
						...(formData.muslos && { muslos: parseFloat(String(formData.muslos)) }),
						...(formData.pecho && { pecho: parseFloat(String(formData.pecho)) }),
						...(formData.cintura && { cintura: parseFloat(String(formData.cintura)) }),
						...(formData.cuello && { cuello: parseFloat(String(formData.cuello)) })
					}),
			...(imc > 0 && { imc: parseFloat(imc.toFixed(2)), categoriaPeso })
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

		if (!data) return;

		// Actualizar el valor en el store de felte
		data.update((current: ClienteFormData) => {
			const newData = { ...current, [field]: value };

			// Lógica para selección automática de planes
			if (field === 'ocupacion') {
				const ocupacion = value as TipoOcupacion;
				let planesFiltrados: Plan[] = [];

				if (ocupacion === TipoOcupacion.NINO) {
					planesFiltrados = planes.filter((plan) => plan.tag === 'Niño');
				} else if (ocupacion === TipoOcupacion.ESTUDIANTE) {
					planesFiltrados = planes.filter((plan) => plan.tag === 'Estudiante');
				} else {
					planesFiltrados = planes.filter((plan) => plan.tag === 'Trabajo');
				}

				// Seleccionar automáticamente el primer plan disponible
				if (planesFiltrados.length > 0) {
					newData.idPlan = planesFiltrados[0].idPlan.toString();
				}

				// Limpiar puesto de trabajo si no es Trabajo
				if (ocupacion !== TipoOcupacion.TRABAJO) {
					newData.puestoTrabajo = '';
				}
			}

			return newData;
		});
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

	{#if form}
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
	{/if}

	<svelte:fragment slot="footer">
		<div class="flex w-full justify-between">
			<Button variant="outline" type="button" on:click={handlePrevStep}>
				{isFirstStep ? 'Cancelar' : 'Regresar'}
			</Button>

			<div class="flex gap-2">
				{#if isMedidasStep && !skipMedidas}
					<Button variant="ghost" type="button" on:click={handleSkipMedidas}>Omitir Medidas</Button>
				{/if}

				<Button
					variant="primary"
					type="button"
					disabled={isSubmitting}
					isLoading={isSubmitting}
					on:click={handleManualSubmit}
				>
					{isLastStep ? (isEditing ? 'Actualizar Cliente' : 'Registrar Cliente') : 'Siguiente'}
				</Button>
			</div>
		</div>
	</svelte:fragment>
</BaseModal>
