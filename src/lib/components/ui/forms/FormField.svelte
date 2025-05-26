<script lang="ts">
	import Input from '../Input.svelte';
	import NumberInput from '../NumberInput.svelte';
	import Select from '../Select.svelte';
	import DatePicker from '../DatePicker.svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let name: string;
	export let label: string = '';
	export let type: string = 'text';
	export let placeholder: string = '';
	export let helperText: string = '';
	export let options: { value: string; label: string }[] = [];
	export let leftIcon: string = '';
	export let rightIcon: string = '';
	export let unit: string = '';
	export let min: number | undefined = undefined;
	export let max: number | undefined = undefined;
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let disabled: boolean = false;
	export let minDate: string | Date | null = null;
	export let maxDate: string | Date | null = null;	// Props para integración con svelte-forms-lib
	export let value: any = '';
	export let errors: Record<string, string> = {};
	export let touched: Record<string, boolean> = {};

	// Calcular error y mensaje de error para svelte-forms-lib
	$: fieldError = errors?.[name] || '';
	$: fieldTouched = touched?.[name] || false;
	// svelte-forms-lib devuelve errores como strings simples
	$: hasError = Boolean(fieldTouched && fieldError && fieldError.length > 0);
	$: errorMessage = hasError ? fieldError : '';
	// Determinar si el campo es requerido basado en si tiene errores de validación
	$: isRequired = !!(fieldError && fieldError.includes('requerido'));
	function handleInput(event: Event) {
		dispatch('input', event);
	}

	function handleChange(event: Event) {
		dispatch('change', event);
	}
</script>

{#if type === 'select'}
	<Select
		{name}
		{label}
		{options}
		error={hasError}
		{errorMessage}
		{helperText}
		{size}
		{disabled}
		required={isRequired}
		bind:value
		on:change={handleChange}
		on:blur
	/>
{:else if type === 'number'}
	<NumberInput
		{name}
		{label}
		{placeholder}
		error={hasError}
		{errorMessage}
		{helperText}
		{leftIcon}
		{rightIcon}
		{unit}
		{min}
		{max}
		{size}
		{disabled}
		required={isRequired}
		bind:value
		on:input={handleInput}
		on:change={handleChange}
		on:keydown
		on:focus
		on:blur
	/>
{:else if type === 'date'}
	<DatePicker
		{name}
		{label}
		{placeholder}
		error={hasError}
		{errorMessage}
		{helperText}
		{size}
		{disabled}
		{minDate}
		{maxDate}
		required={isRequired}
		bind:value
		on:input={handleInput}
		on:change={handleChange}
		on:focus
		on:blur
	/>
{:else}
	<Input
		{type}
		{name}
		{label}
		{placeholder}
		error={hasError}
		{errorMessage}
		{helperText}
		{leftIcon}
		{rightIcon}
		{unit}
		{size}
		{disabled}
		required={isRequired}
		{...$$restProps}
		bind:value
		on:input={handleInput}
		on:change={handleChange}
		on:keydown
		on:focus
		on:blur
	/>
{/if}
