<script lang="ts">
	import BaseModal from './BaseModal.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	export let isOpen: boolean = false;
	export let onClose: () => void = () => {};
	export let title: string = '';
	export let onSubmit: () => void;
	export let submitLabel: string = 'Guardar';
	export let cancelLabel: string = 'Cancelar';
	export let isLoading: boolean = false;

	// Props de BaseModal que puedas necesitar:
	export let size: 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'md';
	export let closeOnClickOutside: boolean = false;
	export let closeOnEsc: boolean = true;
</script>

<BaseModal {isOpen} {onClose} {size} {closeOnClickOutside} {closeOnEsc}>
	<svelte:fragment slot="header">
		<h3 class="font-[family-name:var(--font-secondary)] text-lg text-[var(--letter)]">
			{title}
		</h3>
	</svelte:fragment>

	<form on:submit|preventDefault={onSubmit}>
		<slot />
	</form>

	<svelte:fragment slot="footer">
		<Button variant="outline" type="button" on:click={onClose}>
			{cancelLabel}
		</Button>
		<Button variant="primary" type="submit" {isLoading}>
			{submitLabel}
		</Button>
	</svelte:fragment>
</BaseModal>
