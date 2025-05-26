<!-- src/lib/components/ui/NumberInput.svelte -->
<script lang="ts">
	import Input from './Input.svelte';

	export let allowDecimals = true;
	export let value = '';
	export let name = '';
	export let label = '';
	export let placeholder = '';
	export let error = false;
	export let errorMessage = '';
	export let helperText = '';
	export let leftIcon = '';
	export let rightIcon = '';
	export let unit = '';
	export let min: number | undefined = undefined;
	export let max: number | undefined = undefined;
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let disabled = false;
	export let required = false;

	function handleKeyDown(e: KeyboardEvent) {
		const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];

		if (
			allowedKeys.includes(e.key) ||
			(e.ctrlKey && ['c', 'v', 'a'].includes(e.key)) ||
			/\d/.test(e.key) ||
			(allowDecimals &&
				e.key === '.' &&
				e.target &&
				typeof (e.target as HTMLInputElement).value === 'string' &&
				!(e.target as HTMLInputElement).value.includes('.')) ||
			(e.key === '-' && e.target && (e.target as HTMLInputElement).selectionStart === 0)
		) {
			return;
		}

		e.preventDefault();
	}
</script>

<Input
	type="number"
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
	{required}
	bind:value
	step={allowDecimals ? 0.01 : 1}
	on:keydown={handleKeyDown}
	on:input
	on:change
	on:focus
	on:blur
/>
