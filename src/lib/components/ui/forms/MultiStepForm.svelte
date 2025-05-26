<!-- src/lib/components/ui/forms/MultiStepForm.svelte -->
<script lang="ts">
	import { createForm } from 'felte';
	import { validator } from '@felte/validator-zod';
	import { reporter } from '@felte/reporter-svelte';
	import Button from '../Button.svelte';
	import BaseModal from '$lib/components/modals/BaseModal.svelte';
	import StepProgress from '$lib/components/modals/StepProgress.svelte';
	import type { ZodSchema, ZodError } from 'zod';
	import { get } from 'svelte/store';

	export let steps: Array<{
		title: string;
		component: any;
		validationSchema: ZodSchema<any>;
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
	let form: any;
	let data: any;
	let errors: any;
	let touched: any;
	let isValid: any;
	let setData: any;
	let validate: any;

	$: currentStepConfig = steps[currentStep];
	$: isLastStep = currentStep === steps.length - 1;
	$: isFirstStep = currentStep === 0;

	// Función para obtener el schema actual
	function getCurrentSchema() {
		return currentStepConfig?.validationSchema || steps[0]?.validationSchema;
	}

	// Función para inicializar el formulario
	function initializeForm() {
		const formInstance = createForm({
			initialValues,
			extend: [validator({ schema: getCurrentSchema() }), reporter()],
			onSubmit: async (values) => {
				if (isLastStep) {
					isSubmitting = true;
					try {
						await onSubmit(values);
					} finally {
						isSubmitting = false;
					}
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

	// Inicializar formulario cuando cambien los steps o initialValues
	$: if (steps.length > 0) {
		initializeForm();
	}

	// Actualizar datos cuando cambien los valores iniciales
	$: if (initialValues && setData) {
		setData(initialValues);
	}

	// Reinicializar cuando cambie el paso actual
	$: if (form && currentStep >= 0) {
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
		}
	}

	function handlePrevStep() {
		if (currentStep > 0) {
			currentStep--;
		} else {
			onCancel();
		}
	}

	function handleUpdateField(event: CustomEvent) {
		const { field, value } = event.detail;
		if (data) {
			data.update((current: any) => ({
				...current,
				[field]: value
			}));
		}
	}

	// Función para manejar submit manual del botón
	function handleManualSubmit() {
		const formElement = document.querySelector('form[data-felte-form]') as HTMLFormElement;
		if (formElement) {
			formElement.requestSubmit();
		}
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

		{#if form}
			<form use:form data-felte-form>
				<div class="space-y-4">
					{#if currentStepConfig?.component}
						<svelte:component
							this={currentStepConfig.component}
							formData={$data}
							errors={$errors}
							touched={$touched}
							on:updateField={handleUpdateField}
						/>
					{/if}
				</div>
			</form>
		{/if}

		<svelte:fragment slot="footer">
			<Button variant="outline" type="button" on:click={handlePrevStep}>
				{isFirstStep ? cancelButtonText : prevButtonText}
			</Button>
			<Button
				variant="primary"
				type="button"
				disabled={isSubmitting}
				isLoading={isSubmitting}
				on:click={handleManualSubmit}
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

		{#if form}
			<form use:form data-felte-form>
				<div class="space-y-4">
					{#if currentStepConfig?.component}
						<svelte:component
							this={currentStepConfig.component}
							formData={$data}
							errors={$errors}
							touched={$touched}
							on:updateField={handleUpdateField}
						/>
					{/if}
				</div>
			</form>
		{/if}

		<div class="mt-4 flex justify-center space-x-2 border-t border-gray-200 pt-4">
			<Button variant="outline" type="button" on:click={handlePrevStep}>
				{isFirstStep ? cancelButtonText : prevButtonText}
			</Button>
			<Button
				variant="primary"
				type="button"
				disabled={isSubmitting}
				isLoading={isSubmitting}
				on:click={handleManualSubmit}
			>
				{isLastStep ? submitButtonText : nextButtonText}
			</Button>
		</div>
	</div>
{/if}
