<script lang="ts">
	import { onMount } from 'svelte';
	import { createForm } from 'svelte-forms-lib';
	import BaseModal from '$lib/components/modals/BaseModal.svelte';
	import StepProgress from '$lib/components/modals/StepProgress.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import InformacionPersonalStep from './InformacionPersonalStep.svelte';
	import MedidasStep from './MedidasStep.svelte';
	import ResumenStep from './ResumenStep.svelte';
	import {
		Step1Schema,
		Step2Schema,
		Step3Schema,
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

	// Configuración de svelte-forms-lib
	const { form, errors, touched, handleSubmit } = createForm<ClienteFormData>({
		initialValues: defaultClienteFormValues as ClienteFormData,
		validationSchema: Step1Schema,
		onSubmit: async (vals: ClienteFormData) => {
			if (currentStep < 2) {
				currentStep += 1;
			} else {
				isSubmitting = true;
				try {
					const registro: RegistroCompletoDTO = {
						cliente: {
							nombre: vals.nombre,
							apellido: vals.apellido,
							cedula: vals.cedula,
							celular: vals.celular,
							ciudad: vals.ciudad,
							pais: vals.pais,
							direccion: vals.direccion,
							fechaNacimiento: vals.fechaNacimiento,
							correo: vals.correo,
							ocupacion: vals.ocupacion,
							puestoTrabajo: vals.puestoTrabajo || undefined
						},
						medidas: {
							peso: vals.peso ?? undefined,
							altura: vals.altura ?? undefined,
							brazos: vals.brazos ?? undefined,
							pantorrillas: vals.pantorrillas ?? undefined,
							gluteo: vals.gluteo ?? undefined,
							muslos: vals.muslos ?? undefined,
							pecho: vals.pecho ?? undefined,
							cintura: vals.cintura ?? undefined,
							cuello: vals.cuello ?? undefined,
							imc: vals.imc ?? undefined,
							categoriaPeso: vals.categoriaPeso ?? undefined
						},
						inscripcion: {
							idPlan: parseInt(vals.idPlan, 10),
							fechaInicio: vals.fechaInicio!,
							fechaFin: planService.calcularFechaFin(
								vals.fechaInicio!,
								planes.find((p) => p.idPlan === +vals.idPlan)?.duracionMeses ?? 1
							)
						}
					};
					await onSubmit(registro);
					form.set(defaultClienteFormValues as ClienteFormData);
					currentStep = 0;
					onClose();
				} catch {
					toasts.showToast('Error al registrar cliente', 'error');
				} finally {
					isSubmitting = false;
				}
			}
		}
	});

	// Cambiar esquema cuando avanza o retrocede
	$: {
		const schema = currentStep === 0 ? Step1Schema : currentStep === 1 ? Step2Schema : Step3Schema;
		form.update((f) => ({ ...f, validationSchema: schema }));
	}
	// Carga de planes y datos de edición
	onMount(async () => {
		planes = await planService.getPlanes();
		if (clienteToEdit) {
			form.set({ ...defaultClienteFormValues, ...clienteToEdit } as ClienteFormData);
		}
	});
</script>

<BaseModal
	{isOpen}
	{onClose}
	size="lg"
	closeOnClickOutside={false}
	asForm
	onSubmit={handleSubmit}
	novalidate
>
	<svelte:fragment slot="header">
		<h3 class="text-lg font-semibold">{steps[currentStep]}</h3>
		<StepProgress {currentStep} totalSteps={3} />
	</svelte:fragment>

	<!-- Este slot va dentro del <form> -->
	{#if currentStep === 0}
		<InformacionPersonalStep data={$form} {errors} {touched} {planes} />
	{:else if currentStep === 1}
		<MedidasStep data={$form} {errors} {touched} />
	{:else}
		<ResumenStep data={$form} {errors} {touched} {planes} />
	{/if}

	<svelte:fragment slot="footer">
		<div class="flex w-full justify-between">
			<Button
				variant="outline"
				type="button"
				on:click={() => {
					if (currentStep > 0) {
						currentStep -= 1;
						const schema =
							currentStep === 0 ? Step1Schema : currentStep === 1 ? Step2Schema : Step3Schema;
						form.update((f) => ({ ...f, validationSchema: schema }));
					} else {
						onClose();
					}
				}}
			>
				{currentStep > 0 ? 'Regresar' : 'Cancelar'}
			</Button>

			<Button variant="primary" type="submit" isLoading={isSubmitting}>
				{currentStep < 2 ? 'Siguiente' : clienteToEdit ? 'Actualizar' : 'Registrar'}
			</Button>
		</div>
	</svelte:fragment>
</BaseModal>
