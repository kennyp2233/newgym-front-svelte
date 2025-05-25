<!-- src/lib/components/forms/MultiStepForm.svelte -->
<script lang="ts">
	import { createForm } from 'felte';
	import { validator } from '@felte/validator-yup';
	import { reporter } from '@felte/reporter-svelte';
	import Button from '../Button.svelte';
	import BaseModal from '$lib/components/modals/BaseModal.svelte';
	import StepProgress from '$lib/components/modals/StepProgress.svelte';

	export let steps: Array<{
		title: string;
		component: any;
		validationSchema: any;
	}> = [];
	export let initialValues: Record<string, any> = {};
	export let onSubmit: (values: any) => Promise<void> | void;
	export let onCancel: () => void = () => {};
	export let isModal: boolean = false;
	export let modalProps: {
		isOpen: boolean;
		onClose: () => void;
		size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
	} = { isOpen: false, onClose: () => {} };
	export let submitButtonText: string = 'Terminar';
	export let cancelButtonText: string = 'Cancelar';
	export let nextButtonText: string = 'Siguiente';
	export let prevButtonText: string = 'Regresar';

	let currentStep = 0;
	let isSubmitting = false;

	$: currentStepConfig = steps[currentStep];
	$: isLastStep = currentStep === steps.length - 1;
	$: isFirstStep = currentStep === 0;

	// Crear formulario con Felte
	const { form, data, errors, touched, isValid } = createForm({
		initialValues,
		extend: [validator({ schema: currentStepConfig?.validationSchema }), reporter()],
		onSubmit: async (values) => {
			if (isLastStep) {
				isSubmitting = true;
				try {
					await onSubmit(values);
				} finally {
					isSubmitting = false;
				}
			} else {
				handleNextStep();
			}
		}
	});

	function handleNextStep() {
		if (currentStep < steps.length - 1) {
			currentStep++;
		}
	}

	function handlePrevStep() {
		if (currentStep > 0) {
			currentStep--;
		} else {
			onCancel();
		}
	}

	// Actualizar esquema de validación cuando cambie el paso
	$: if (currentStepConfig?.validationSchema) {
		// Aquí necesitarías recrear el form con el nuevo schema
		// Esto es una limitación de Felte que requiere una solución más compleja
	}
</script>

{#if isModal}
	<BaseModal
		isOpen={modalProps.isOpen}
		onClose={modalProps.onClose}
		size={modalProps.size || 'md'}
		closeOnClickOutside={false}
	>
		<svelte:fragment slot="header">
			<div class="flex flex-col gap-1">
				<h3 class="text-lg font-semibold text-[var(--letter)]">
					{currentStepConfig?.title || 'Formulario'}
				</h3>
				<StepProgress {currentStep} totalSteps={steps.length} />
			</div>
		</svelte:fragment>

		<form use:form>
			<div class="space-y-4">
				{#if currentStepConfig?.component}
					<svelte:component
						this={currentStepConfig.component}
						formData={$data}
						{errors}
						{touched}
						on:updateField={(e: { detail: { field: string | number; value: any } }) => {
							$data[e.detail.field] = e.detail.value;
						}}
					/>
				{/if}
			</div>
		</form>

		<svelte:fragment slot="footer">
			<Button variant="outline" type="button" on:click={handlePrevStep}>
				{isFirstStep ? cancelButtonText : prevButtonText}
			</Button>
			<Button
				variant="primary"
				type="submit"
				disabled={!$isValid || isSubmitting}
				isLoading={isSubmitting}
			>
				{isLastStep ? submitButtonText : nextButtonText}
			</Button>
		</svelte:fragment>
	</BaseModal>
{:else}
	<div class="space-y-4">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-xl font-semibold">{currentStepConfig?.title || 'Formulario'}</h2>
			<div class="text-sm text-gray-500">
				Paso {currentStep + 1} de {steps.length}
			</div>
		</div>

		<StepProgress {currentStep} totalSteps={steps.length} />

		<form use:form>
			<div class="space-y-4">
				{#if currentStepConfig?.component}
					<svelte:component
						this={currentStepConfig.component}
						formData={$data}
						{errors}
						{touched}
						on:updateField={(e: { detail: { field: string | number; value: any } }) => {
							$data[e.detail.field] = e.detail.value;
						}}
					/>
				{/if}
			</div>
		</form>

		<div class="mt-4 flex justify-center space-x-2 border-t border-gray-200 pt-4">
			<Button variant="outline" type="button" on:click={handlePrevStep}>
				{isFirstStep ? cancelButtonText : prevButtonText}
			</Button>
			<Button
				variant="primary"
				type="submit"
				disabled={!$isValid || isSubmitting}
				isLoading={isSubmitting}
			>
				{isLastStep ? submitButtonText : nextButtonText}
			</Button>
		</div>
	</div>
{/if}
