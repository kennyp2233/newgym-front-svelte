<!-- src/lib/components/ui/DatePicker.svelte -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import flatpickr from 'flatpickr';
	import { Spanish } from 'flatpickr/dist/l10n/es.js';
	import 'flatpickr/dist/flatpickr.min.css';

	export let value: string = '';
	export let label: string = '';
	export let placeholder: string = 'Seleccione fecha';
	export let helperText: string = '';
	export let errorMessage: string = '';
	export let error: boolean = false;
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let id: string = '';
	export let name: string = '';
	export let minDate: string | Date | null = null;
	export let maxDate: string | Date | null = null;
	export let disabled: boolean = false;
	export let required: boolean = false;

	let inputElement: HTMLInputElement;
	let flatpickrInstance: flatpickr.Instance;

	onMount(() => {
		if (inputElement) {
			flatpickrInstance = flatpickr(inputElement, {
				locale: Spanish,
				dateFormat: 'Y-m-d',
				allowInput: true,
				disableMobile: true,
				minDate: minDate || undefined,
				maxDate: maxDate || undefined,
				defaultDate: value || undefined,
				onChange: (selectedDates) => {
					if (selectedDates.length > 0) {
						const date = selectedDates[0];
						value = date.toISOString().split('T')[0];
					}
				}
			});
		}
	});

	onDestroy(() => {
		if (flatpickrInstance) {
			flatpickrInstance.destroy();
		}
	});

	// Actualizar valor cuando cambie externamente
	$: if (flatpickrInstance && value !== inputElement?.value) {
		flatpickrInstance.setDate(value, false);
	}
</script>

<div class="w-full space-y-1.5">
	{#if label}
		<label for={id} class="text-md font-bold text-[var(--letter)]">
			{label}
			{#if required}<span class="text-red-500">*</span>{/if}
		</label>
	{/if}

	<div class="relative">
		<input
			bind:this={inputElement}
			{value}
			{id}
			{name}
			{disabled}
			{required}
			{placeholder}
			class={`w-full rounded-md border border-[var(--border)] bg-[var(--sections)] px-3 py-2 focus:ring-2 focus:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50
        ${size === 'sm' && 'h-8 text-sm'}
        ${size === 'md' && 'h-10 text-base'}
        ${size === 'lg' && 'h-12 text-lg'}
        ${error && 'border-red-500 focus:ring-red-500'}`}
			on:input
			on:change
			on:focus
			on:blur
		/>
	</div>

	{#if error && errorMessage}
		<p class="text-sm text-red-500">{errorMessage}</p>
	{:else if helperText}
		<p class="text-sm text-gray-500">{helperText}</p>
	{/if}
</div>

<style>
	/* Estilos personalizados para flatpickr */
	:global(.flatpickr-calendar) {
		background: var(--sections);
		border: 1px solid var(--border);
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		border-radius: 8px;
	}

	:global(.flatpickr-day) {
		color: var(--letter);
	}

	:global(.flatpickr-day.selected) {
		background: var(--primary);
		border-color: var(--primary);
	}

	:global(.flatpickr-day:hover) {
		background: var(--primary-hover);
		border-color: var(--primary-hover);
		color: white;
	}

	:global(.flatpickr-months .flatpickr-month) {
		background: var(--primary);
		color: white;
	}

	:global(.flatpickr-current-month .flatpickr-monthDropdown-months),
	:global(.flatpickr-current-month input.cur-year) {
		color: white;
	}

	:global(.flatpickr-months .flatpickr-prev-month),
	:global(.flatpickr-months .flatpickr-next-month) {
		fill: white;
	}
</style>
