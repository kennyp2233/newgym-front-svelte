<!-- src/lib/components/ui/forms/FormField.svelte -->
<script lang="ts">
	import Input from '../Input.svelte';
	import NumberInput from '../NumberInput.svelte';
	import Select from '../Select.svelte';
	import DatePicker from '../DatePicker.svelte';

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
	export let maxDate: string | Date | null = null;

	// Props para integración con Felte
	export let value: any = '';
	export let errors: any = {};
	export let touched: any = {};

	// Calcular error y mensaje de error correctamente para Felte
	$: fieldErrors = errors[name] || [];
	$: fieldTouched = touched[name] || false;
	$: hasError = fieldTouched && Array.isArray(fieldErrors) && fieldErrors.length > 0;
	$: errorMessage = hasError ? fieldErrors[0] : '';

	// Para debug - remover en producción
	$: console.log(`Field ${name}:`, {
		value,
		errors: fieldErrors,
		touched: fieldTouched,
		hasError,
		errorMessage
	});
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
		bind:value
		on:change
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
		bind:value
		on:input
		on:change
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
		bind:value
		on:input
		on:change
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
		bind:value
		on:input
		on:change
		on:keydown
		on:focus
		on:blur
	/>
{/if}
