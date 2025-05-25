<script lang="ts">
	import BaseModal from './BaseModal.svelte';
	import StepProgress from './StepProgress.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	export let isOpen: boolean = false;
	export let onClose: () => void = () => {};
	export let steps: { title: string; component: any }[] = [];
	export let currentStep: number = 0;
	export let formValues: Record<string, any> = {};
	export let isSubmitting: boolean = false;
	export let isCurrentFormValid: boolean = true;
	export let onNext: () => void = () => {};
	export let onBack: () => void = () => {};
	export let onSubmit: () => void = () => {};

	// Props de BaseModal
	export let size: 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'md';
	export let closeOnClickOutside: boolean = false;
	export let closeOnEsc: boolean = true;

	const isLastStep = currentStep === steps.length - 1;
</script>

<BaseModal {isOpen} {onClose} {size} {closeOnClickOutside} {closeOnEsc}>
	<svelte:fragment slot="header">
		<div class="flex flex-col gap-1">
			<h3 class="font-[family-name:var(--font-secondary)] text-lg text-[var(--letter)]">
				{steps[currentStep].title}
			</h3>
			<StepProgress {currentStep} totalSteps={steps.length} />
		</div>
	</svelte:fragment>

	<div>
		<svelte:component this={steps[currentStep].component} bind:formValues />
	</div>

	<svelte:fragment slot="footer">
		<Button variant="outline" type="button" on:click={onBack}>
			{currentStep === 0 ? 'Cancelar' : 'Anterior'}
		</Button>
		<Button
			variant="primary"
			type="button"
			on:click={isLastStep ? onSubmit : onNext}
			isLoading={isSubmitting}
			disabled={!isCurrentFormValid || isSubmitting}
		>
			{isLastStep ? 'Finalizar' : 'Siguiente'}
		</Button>
	</svelte:fragment>
</BaseModal>
