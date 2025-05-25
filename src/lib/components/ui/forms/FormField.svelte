<!-- src/lib/components/forms/FormField.svelte -->
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
	export let errors: string[] = [];
	export let touched: boolean = false;

	$: error = touched && errors && errors.length > 0;
	$: errorMessage = error ? errors[0] : '';
</script>

{#if type === 'select'}
	<Select
		{name}
		{label}
		{options}
		{error}
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
		{error}
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
		{error}
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
		{error}
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
